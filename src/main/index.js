const { app, BrowserWindow, ipcMain, dialog, session, nativeTheme, safeStorage, Menu, clipboard } = require('electron')
const { join } = require('path')
const fs = require('fs')
const crypto = require('crypto')

let store
let mainWindow

nativeTheme.themeSource = 'dark'

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
}

function logStartupError(error) {
  const message = error && error.stack ? error.stack : String(error)
  console.error(message)
  try {
    fs.appendFileSync(join(app.getPath('userData'), 'startup.log'), `${new Date().toISOString()}\n${message}\n\n`)
  } catch {
    fs.appendFileSync(join(__dirname, 'startup.log'), `${new Date().toISOString()}\n${message}\n\n`)
  }
}

process.on('uncaughtException', logStartupError)
process.on('unhandledRejection', logStartupError)

app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
})

function normalizeAccounts(accounts) {
  if (!Array.isArray(accounts)) return []
  return accounts.filter((account) => account && account.id && account.secret)
}

function protectSecret(secret) {
  if (!secret || !safeStorage.isEncryptionAvailable()) return { secret }
  return {
    secretProtected: safeStorage.encryptString(secret).toString('base64')
  }
}

function unprotectAccount(account) {
  if (!account) return account
  if (!account.secretProtected) return account

  try {
    const secret = safeStorage.decryptString(Buffer.from(account.secretProtected, 'base64'))
    const { secretProtected, ...rest } = account
    return { ...rest, secret }
  } catch {
    return { ...account, secret: '' }
  }
}

function protectAccount(account) {
  const { secretProtected, ...rest } = account
  if (!rest.secret) return rest
  const protectedSecret = protectSecret(rest.secret)
  if (protectedSecret.secretProtected) {
    const { secret, ...withoutSecret } = rest
    return { ...withoutSecret, ...protectedSecret }
  }
  return rest
}

function getAccounts() {
  return store.get('accounts', []).map(unprotectAccount).filter((account) => account.secret)
}

function setAccounts(accounts) {
  const next = normalizeAccounts(accounts).map(protectAccount)
  store.set('accounts', next)
  return getAccounts()
}

function createWindow() {
  const iconPath = app.isPackaged
    ? join(__dirname, '../renderer/app-icon.png')
    : join(__dirname, '../../src/renderer/public/app-icon.png')

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 390,
    minHeight: 620,
    backgroundColor: '#0a0e1a',
    title: '2FA Authenticator',
    icon: iconPath,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store')
  store = new Store({
    name: 'accounts',
    encryptionKey: '2fa-authenticator-key'
  })

  Menu.setApplicationMenu(null)

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media')
  })

  ipcMain.handle('accounts:get', () => getAccounts())

  ipcMain.handle('accounts:save', (_event, accounts) => {
    return setAccounts(accounts)
  })

  ipcMain.handle('accounts:add', (_event, account) => {
    return setAccounts([...getAccounts(), account])
  })

  ipcMain.handle('accounts:update', (_event, id, data) => {
    const next = getAccounts().map((account) =>
      account.id === id ? { ...account, ...data, id } : account
    )
    return setAccounts(next)
  })

  ipcMain.handle('accounts:delete', (_event, id) => {
    return setAccounts(getAccounts().filter((account) => account.id !== id))
  })

  ipcMain.handle('accounts:reorder', (_event, ids) => {
    const accounts = getAccounts()
    const order = new Map(ids.map((id, index) => [id, index]))
    const next = [...accounts].sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999))
    return setAccounts(next)
  })

  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Choose QR image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] }]
    })

    if (canceled || filePaths.length === 0) return null

    const filePath = filePaths[0]
    const fileBuffer = fs.readFileSync(filePath)
    const ext = filePath.split('.').pop().toLowerCase()
    const mimeTypes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      bmp: 'image/bmp',
      gif: 'image/gif'
    }

    return `data:${mimeTypes[ext] || 'image/png'};base64,${fileBuffer.toString('base64')}`
  })

  ipcMain.handle('dialog:exportFile', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export encrypted backup',
      defaultPath: 'accounts.2fa',
      filters: [{ name: '2FA Backup', extensions: ['2fa'] }]
    })

    return canceled ? null : filePath
  })

  ipcMain.handle('dialog:importFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import encrypted backup',
      properties: ['openFile'],
      filters: [{ name: '2FA Backup', extensions: ['2fa', 'json'] }]
    })

    if (canceled || filePaths.length === 0) return null
    return fs.readFileSync(filePaths[0], 'utf-8')
  })

  ipcMain.handle('file:write', (_event, filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('export:accounts', async (_event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export encrypted backup',
      defaultPath: 'accounts.2fa',
      filters: [{ name: '2FA Backup', extensions: ['2fa'] }]
    })

    if (canceled || !filePath) return null
    fs.writeFileSync(filePath, content, 'utf-8')
    return filePath
  })

  ipcMain.handle('import:accounts', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import encrypted backup',
      properties: ['openFile'],
      filters: [{ name: '2FA Backup', extensions: ['2fa', 'json'] }]
    })

    if (canceled || filePaths.length === 0) return null
    return fs.readFileSync(filePaths[0], 'utf-8')
  })

  ipcMain.handle('safeStorage:available', () => safeStorage.isEncryptionAvailable())
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('clipboard:writeText', (_event, text) => {
    clipboard.writeText(String(text || ''))
    return true
  })

  ipcMain.handle('auth:isConfigured', () => {
    return !!store.get('appPasswordHash')
  })

  ipcMain.handle('auth:verify', (_event, password) => {
    const hash = store.get('appPasswordHash')
    const salt = store.get('appPasswordSalt')
    if (!hash || !salt) return true
    
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
    return hash === derivedKey
  })

  ipcMain.handle('auth:setPassword', (_event, password) => {
    if (!password) {
      store.delete('appPasswordHash')
      store.delete('appPasswordSalt')
      return true
    }
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    store.set('appPasswordSalt', salt)
    store.set('appPasswordHash', hash)
    return true
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch(logStartupError)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
