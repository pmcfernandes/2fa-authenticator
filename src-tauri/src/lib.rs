use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use rand::RngCore;
use scrypt::{scrypt, Params};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const KEYRING_SERVICE: &str = "2fa-authenticator";
const KEYRING_USER: &str = "accounts-key";

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoreData {
  accounts: Vec<Value>,
  app_password_salt: Option<String>,
  app_password_hash: Option<String>,
}

fn storage_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("accounts.json"))
}

fn key_file_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir.join("accounts.key"))
}

fn read_store(app: &AppHandle) -> Result<StoreData, String> {
  let path = storage_path(app)?;
  if !path.exists() {
    return Ok(StoreData::default());
  }

  let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
  serde_json::from_str(&content).map_err(|error| error.to_string())
}

fn write_store(app: &AppHandle, store: &StoreData) -> Result<(), String> {
  let content = serde_json::to_string_pretty(store).map_err(|error| error.to_string())?;
  fs::write(storage_path(app)?, content).map_err(|error| error.to_string())
}

fn decode_key(encoded: &str) -> Result<[u8; 32], String> {
  let bytes = STANDARD.decode(encoded).map_err(|error| error.to_string())?;
  bytes
    .try_into()
    .map_err(|_| "Stored encryption key has an invalid length".to_string())
}

fn encryption_key(app: &AppHandle) -> Result<[u8; 32], String> {
  if let Ok(entry) = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER) {
    if let Ok(encoded) = entry.get_password() {
      return decode_key(&encoded);
    }

    let mut key = [0_u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    if entry.set_password(&STANDARD.encode(key)).is_ok() {
      return Ok(key);
    }
  }

  let path = key_file_path(app)?;
  if path.exists() {
    return decode_key(&fs::read_to_string(path).map_err(|error| error.to_string())?);
  }

  let mut key = [0_u8; 32];
  rand::thread_rng().fill_bytes(&mut key);
  fs::write(path, STANDARD.encode(key)).map_err(|error| error.to_string())?;
  Ok(key)
}

fn encrypt_secret(app: &AppHandle, secret: &str) -> Result<String, String> {
  let key = encryption_key(app)?;
  let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
  let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
  let ciphertext = cipher
    .encrypt(&nonce, secret.as_bytes())
    .map_err(|error| error.to_string())?;

  Ok(format!("{}:{}", STANDARD.encode(nonce), STANDARD.encode(ciphertext)))
}

fn decrypt_secret(app: &AppHandle, value: &str) -> Result<String, String> {
  let (nonce, ciphertext) = value
    .split_once(':')
    .ok_or_else(|| "Encrypted secret is missing a nonce".to_string())?;
  let nonce_bytes = STANDARD.decode(nonce).map_err(|error| error.to_string())?;
  if nonce_bytes.len() != 12 {
    return Err("Encrypted secret has an invalid nonce length".to_string());
  }
  let ciphertext_bytes = STANDARD.decode(ciphertext).map_err(|error| error.to_string())?;
  let key = encryption_key(app)?;
  let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
  let plaintext = cipher
    .decrypt(Nonce::from_slice(&nonce_bytes), ciphertext_bytes.as_ref())
    .map_err(|error| error.to_string())?;

  String::from_utf8(plaintext).map_err(|error| error.to_string())
}

fn normalized_accounts(accounts: Vec<Value>) -> Vec<Value> {
  accounts
    .into_iter()
    .filter(|account| {
      account.get("id").and_then(Value::as_str).is_some()
        && account.get("secret").and_then(Value::as_str).is_some()
    })
    .collect()
}

fn protect_account(app: &AppHandle, account: Value) -> Result<Value, String> {
  let Some(mut object) = account.as_object().cloned() else {
    return Ok(account);
  };

  object.remove("secretProtected");
  let Some(secret) = object.get("secret").and_then(Value::as_str) else {
    return Ok(Value::Object(object));
  };
  if secret.is_empty() {
    return Ok(Value::Object(object));
  }

  let protected = encrypt_secret(app, secret)?;
  object.remove("secret");
  object.insert("secretProtected".to_string(), Value::String(protected));
  Ok(Value::Object(object))
}

fn unprotect_account(app: &AppHandle, account: Value) -> Value {
  let Some(mut object) = account.as_object().cloned() else {
    return account;
  };

  let Some(secret_protected) = object.get("secretProtected").and_then(Value::as_str) else {
    return Value::Object(object);
  };

  let secret = decrypt_secret(app, secret_protected).unwrap_or_default();
  object.remove("secretProtected");
  object.insert("secret".to_string(), Value::String(secret));
  Value::Object(object)
}

fn public_accounts(app: &AppHandle) -> Result<Vec<Value>, String> {
  let store = read_store(app)?;
  Ok(store
    .accounts
    .into_iter()
    .map(|account| unprotect_account(app, account))
    .filter(|account| account.get("secret").and_then(Value::as_str).is_some_and(|secret| !secret.is_empty()))
    .collect())
}

fn set_accounts(app: &AppHandle, accounts: Vec<Value>) -> Result<Vec<Value>, String> {
  let mut store = read_store(app)?;
  let protected_accounts = normalized_accounts(accounts)
    .into_iter()
    .map(|account| protect_account(app, account))
    .collect::<Result<Vec<_>, _>>()?;
  store.accounts = protected_accounts;
  write_store(app, &store)?;
  public_accounts(app)
}

fn password_hash(password: &str, salt: &str) -> Result<String, String> {
  let params = Params::new(14, 8, 1, 64).map_err(|error| error.to_string())?;
  let mut output = [0_u8; 64];
  scrypt(password.as_bytes(), salt.as_bytes(), &params, &mut output).map_err(|error| error.to_string())?;
  Ok(hex::encode(output))
}

#[tauri::command]
fn get_accounts(app: AppHandle) -> Result<Vec<Value>, String> {
  public_accounts(&app)
}

#[tauri::command]
fn save_accounts(app: AppHandle, accounts: Vec<Value>) -> Result<Vec<Value>, String> {
  set_accounts(&app, accounts)
}

#[tauri::command]
fn add_account(app: AppHandle, account: Value) -> Result<Vec<Value>, String> {
  let mut accounts = public_accounts(&app)?;
  accounts.push(account);
  set_accounts(&app, accounts)
}

#[tauri::command]
fn update_account(app: AppHandle, id: String, data: Map<String, Value>) -> Result<Vec<Value>, String> {
  let accounts = public_accounts(&app)?
    .into_iter()
    .map(|account| {
      let Some(mut object) = account.as_object().cloned() else {
        return account;
      };
      if object.get("id").and_then(Value::as_str) == Some(id.as_str()) {
        for (key, value) in data.iter() {
          object.insert(key.clone(), value.clone());
        }
        object.insert("id".to_string(), Value::String(id.clone()));
      }
      Value::Object(object)
    })
    .collect();
  set_accounts(&app, accounts)
}

#[tauri::command]
fn delete_account(app: AppHandle, id: String) -> Result<Vec<Value>, String> {
  let accounts = public_accounts(&app)?
    .into_iter()
    .filter(|account| account.get("id").and_then(Value::as_str) != Some(id.as_str()))
    .collect();
  set_accounts(&app, accounts)
}

#[tauri::command]
fn reorder_accounts(app: AppHandle, ids: Vec<String>) -> Result<Vec<Value>, String> {
  let mut accounts = public_accounts(&app)?;
  accounts.sort_by_key(|account| {
    let id = account.get("id").and_then(Value::as_str).unwrap_or_default();
    ids.iter().position(|current| current == id).unwrap_or(usize::MAX)
  });
  set_accounts(&app, accounts)
}

#[tauri::command]
fn open_file_dialog() -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("Choose QR image")
    .add_filter("Images", &["png", "jpg", "jpeg", "bmp", "gif"])
    .pick_file()
  else {
    return Ok(None);
  };

  let bytes = fs::read(&path).map_err(|error| error.to_string())?;
  let extension = path
    .extension()
    .and_then(|ext| ext.to_str())
    .unwrap_or("png")
    .to_lowercase();
  let mime = match extension.as_str() {
    "jpg" | "jpeg" => "image/jpeg",
    "bmp" => "image/bmp",
    "gif" => "image/gif",
    _ => "image/png",
  };

  Ok(Some(format!("data:{};base64,{}", mime, STANDARD.encode(bytes))))
}

#[tauri::command]
fn export_file() -> Option<String> {
  rfd::FileDialog::new()
    .set_title("Export encrypted backup")
    .set_file_name("accounts.2fa")
    .add_filter("2FA Backup", &["2fa"])
    .save_file()
    .map(|path| path.to_string_lossy().into_owned())
}

#[tauri::command]
fn import_file() -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("Import encrypted backup")
    .add_filter("2FA Backup", &["2fa", "json"])
    .pick_file()
  else {
    return Ok(None);
  };

  fs::read_to_string(path).map(Some).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_file(file_path: String, content: String) -> Result<bool, String> {
  fs::write(file_path, content).map_err(|error| error.to_string())?;
  Ok(true)
}

#[tauri::command]
fn export_accounts(content: String) -> Result<Option<String>, String> {
  let Some(path) = rfd::FileDialog::new()
    .set_title("Export encrypted backup")
    .set_file_name("accounts.2fa")
    .add_filter("2FA Backup", &["2fa"])
    .save_file()
  else {
    return Ok(None);
  };

  fs::write(&path, content).map_err(|error| error.to_string())?;
  Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
fn import_accounts_file() -> Result<Option<String>, String> {
  import_file()
}

#[tauri::command]
fn safe_storage_available(app: AppHandle) -> bool {
  encryption_key(&app).is_ok()
}

#[tauri::command]
fn app_version(app: AppHandle) -> String {
  app.package_info().version.to_string()
}

#[tauri::command]
fn copy_text(text: String) -> Result<bool, String> {
  let mut clipboard = arboard::Clipboard::new().map_err(|error| error.to_string())?;
  clipboard.set_text(text).map_err(|error| error.to_string())?;
  Ok(true)
}

#[tauri::command]
fn is_app_password_configured(app: AppHandle) -> Result<bool, String> {
  Ok(read_store(&app)?.app_password_hash.is_some())
}

#[tauri::command]
fn verify_app_password(app: AppHandle, password: String) -> Result<bool, String> {
  let store = read_store(&app)?;
  let Some(hash) = store.app_password_hash else {
    return Ok(true);
  };
  let Some(salt) = store.app_password_salt else {
    return Ok(true);
  };

  Ok(password_hash(&password, &salt)? == hash)
}

#[tauri::command]
fn set_app_password(app: AppHandle, password: String) -> Result<bool, String> {
  let mut store = read_store(&app)?;
  if password.is_empty() {
    store.app_password_hash = None;
    store.app_password_salt = None;
  } else {
    let mut salt_bytes = [0_u8; 16];
    rand::thread_rng().fill_bytes(&mut salt_bytes);
    let salt = hex::encode(salt_bytes);
    store.app_password_hash = Some(password_hash(&password, &salt)?);
    store.app_password_salt = Some(salt);
  }

  write_store(&app, &store)?;
  Ok(true)
}

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      get_accounts,
      save_accounts,
      add_account,
      update_account,
      delete_account,
      reorder_accounts,
      open_file_dialog,
      export_file,
      import_file,
      write_file,
      export_accounts,
      import_accounts_file,
      safe_storage_available,
      app_version,
      copy_text,
      is_app_password_configured,
      verify_app_password,
      set_app_password
    ])
    .run(tauri::generate_context!())
    .expect("error while running Tauri application");
}
