const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getAccounts: () => ipcRenderer.invoke('accounts:get'),
  addAccount: (account) => ipcRenderer.invoke('accounts:add', account),
  deleteAccount: (id) => ipcRenderer.invoke('accounts:delete', id),
  updateAccount: (id, data) => ipcRenderer.invoke('accounts:update', id, data),
  reorderAccounts: (ids) => ipcRenderer.invoke('accounts:reorder', ids),
  saveAccounts: (accounts) => ipcRenderer.invoke('accounts:save', accounts),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  exportFile: () => ipcRenderer.invoke('dialog:exportFile'),
  importFile: () => ipcRenderer.invoke('dialog:importFile'),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  exportAccounts: (content) => ipcRenderer.invoke('export:accounts', content),
  importAccountsFile: () => ipcRenderer.invoke('import:accounts'),
  isSafeStorageAvailable: () => ipcRenderer.invoke('safeStorage:available'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  copyText: (text) => ipcRenderer.invoke('clipboard:writeText', text)
})
