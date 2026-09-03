/**
 * Encrypt accounts array with a password using AES-256-GCM
 * Uses Web Crypto API in the desktop renderer.
 */

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

/**
 * Derive an AES-256-GCM key from a password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt accounts to a JSON string for export
 * @param {Array} accounts - The accounts to encrypt
 * @param {string} password - User-provided password
 * @returns {Promise<string>} Encrypted data as JSON string
 */
export async function encryptBackup(accounts, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(accounts))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return JSON.stringify({
    version: 1,
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    ciphertext: arrayToBase64(new Uint8Array(ciphertext))
  })
}

/**
 * Decrypt a backup file
 * @param {string} encryptedJson - The encrypted JSON string from file
 * @param {string} password - User-provided password
 * @returns {Promise<Array|null>} Decrypted accounts array or null on failure
 */
export async function decryptBackup(encryptedJson, password) {
  try {
    const { salt, iv, ciphertext } = JSON.parse(encryptedJson)
    const saltBytes = base64ToArray(salt)
    const ivBytes = base64ToArray(iv)
    const ciphertextBytes = base64ToArray(ciphertext)

    const key = await deriveKey(password, saltBytes)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      ciphertextBytes
    )

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  } catch (e) {
    console.error('Decryption failed:', e)
    return null
  }
}

/**
 * Merge imported accounts with existing ones, skipping duplicates
 */
export function mergeAccounts(existing, imported) {
  const isDuplicate = (imp) =>
    existing.some(
      (ex) =>
        ex.issuer === imp.issuer &&
        ex.label === imp.label &&
        ex.secret === imp.secret
    )

  const newAccounts = imported.filter((imp) => !isDuplicate(imp))
  const duplicateCount = imported.length - newAccounts.length

  // Assign new IDs to imported accounts
  const withNewIds = newAccounts.map((acc) => ({
    ...acc,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  }))

  return { newAccounts: withNewIds, duplicateCount }
}

// Helpers
function arrayToBase64(array) {
  return btoa(String.fromCharCode(...array))
}

function base64ToArray(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
