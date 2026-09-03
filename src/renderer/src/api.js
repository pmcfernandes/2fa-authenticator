import { invoke } from '@tauri-apps/api/core'

export function installApi() {
  window.api = {
    getAccounts: () => invoke('get_accounts'),
    addAccount: (account) => invoke('add_account', { account }),
    deleteAccount: (id) => invoke('delete_account', { id }),
    updateAccount: (id, data) => invoke('update_account', { id, data }),
    reorderAccounts: (ids) => invoke('reorder_accounts', { ids }),
    saveAccounts: (accounts) => invoke('save_accounts', { accounts }),
    openFileDialog: () => invoke('open_file_dialog'),
    exportFile: () => invoke('export_file'),
    importFile: () => invoke('import_file'),
    writeFile: (filePath, content) => invoke('write_file', { filePath, content }),
    exportAccounts: (content) => invoke('export_accounts', { content }),
    importAccountsFile: () => invoke('import_accounts_file'),
    isSafeStorageAvailable: () => invoke('safe_storage_available'),
    getAppVersion: () => invoke('app_version'),
    copyText: (text) => invoke('copy_text', { text }),
    isAppPasswordConfigured: () => invoke('is_app_password_configured'),
    verifyAppPassword: (password) => invoke('verify_app_password', { password }),
    setAppPassword: (password) => invoke('set_app_password', { password })
  }
}
