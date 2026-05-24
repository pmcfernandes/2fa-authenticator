import { Download, Eye, Lock, Upload, X, Shield, HardDrive } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { decryptBackup, encryptBackup, mergeAccounts } from '../utils/backup'

export default function SettingsModal({ open, accounts, onClose, onImport }) {
  const [password, setPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [version, setVersion] = useState('1.0.0')
  const [isAppLockConfigured, setIsAppLockConfigured] = useState(false)
  const [currentAppPassword, setCurrentAppPassword] = useState('')
  const [newAppPassword, setNewAppPassword] = useState('')
  const [activeTab, setActiveTab] = useState('security')
  const strength = useMemo(() => scorePassword(password), [password])

  useEffect(() => {
    if (open) {
      window.api.getAppVersion().then(setVersion).catch(() => {})
      window.api.isAppPasswordConfigured().then(setIsAppLockConfigured).catch(() => {})
    } else {
      setMessage('')
      setCurrentAppPassword('')
      setNewAppPassword('')
    }
  }, [open])

  if (!open) return null

  async function exportAccounts() {
    if (password.length < 8) return setMessage('Use at least 8 characters for export.')
    const encrypted = await encryptBackup(accounts, password)
    const filePath = await window.api.exportAccounts(encrypted)
    setMessage(filePath ? `Exported ${accounts.length} accounts.` : 'Export cancelled.')
  }

  async function loadImportPreview() {
    if (!importPassword) return setMessage('Enter the backup password first.')
    const content = await window.api.importAccountsFile()
    if (!content) return setMessage('Import cancelled.')
    const imported = await decryptBackup(content, importPassword)
    if (!imported) return setMessage('Wrong password or invalid backup file.')
    const result = mergeAccounts(accounts, imported)
    setPreview(result)
    setMessage(`${result.newAccounts.length} new, ${result.duplicateCount} duplicate.`)
  }

  async function confirmImport() {
    if (!preview) return
    await onImport(preview.newAccounts)
    setMessage(`Imported ${preview.newAccounts.length} accounts.`)
    setPreview(null)
  }

  async function handleAppLockSave() {
    if (isAppLockConfigured) {
      const isValid = await window.api.verifyAppPassword(currentAppPassword)
      if (!isValid) return setMessage('Incorrect current app password.')
    }
    
    await window.api.setAppPassword(newAppPassword)
    setIsAppLockConfigured(!!newAppPassword)
    setCurrentAppPassword('')
    setNewAppPassword('')
    setMessage(newAppPassword ? 'App lock enabled.' : 'App lock disabled.')
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-panel settings-panel">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Settings</span>
            <h2>Preferences</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          <aside className="settings-sidebar">
            <button 
              className={`sidebar-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('security')
                setMessage('')
              }}
            >
              <Shield size={18} /> App Lock
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('backup')
                setMessage('')
              }}
            >
              <HardDrive size={18} /> Backup & Restore
            </button>
          </aside>

          <main className="settings-content">
            {activeTab === 'security' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Lock size={18} />App Lock</h3>
                  <p className="settings-desc">Require a password to access your vault when the app starts.</p>
                  {isAppLockConfigured && (
                    <label>
                      <span>Current Password</span>
                      <input type="password" value={currentAppPassword} onChange={(e) => setCurrentAppPassword(e.target.value)} />
                    </label>
                  )}
                  <label>
                    <span>{isAppLockConfigured ? 'New Password (blank to disable)' : 'Set Password'}</span>
                    <input type="password" value={newAppPassword} onChange={(e) => setNewAppPassword(e.target.value)} />
                  </label>
                  <button className="primary-button" onClick={handleAppLockSave}>
                    {isAppLockConfigured ? (newAppPassword ? 'Update Lock' : 'Disable Lock') : 'Enable Lock'}
                  </button>
                </section>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Download size={18} />Export Accounts</h3>
                  <label>
                    <span>Password</span>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </label>
                  <div className="strength">
                    <span style={{ width: `${strength}%` }} />
                  </div>
                  <button className="primary-button" onClick={exportAccounts}>
                    <Lock size={17} />
                    Export .2fa
                  </button>
                </section>

                <section>
                  <h3><Upload size={18} />Import Accounts</h3>
                  <label>
                    <span>Password</span>
                    <input type="password" value={importPassword} onChange={(event) => setImportPassword(event.target.value)} />
                  </label>
                  <button className="secondary-button" onClick={loadImportPreview}>
                    <Eye size={17} />
                    Preview import
                  </button>
                  {preview && (
                    <button className="primary-button" onClick={confirmImport}>
                      Import {preview.newAccounts.length}
                    </button>
                  )}
                </section>
              </div>
            )}
          </main>
        </div>

        <footer className="settings-footer">
          <span>Version {version}</span>
          <span>{message}</span>
        </footer>
      </section>
    </div>
  )
}

function scorePassword(password) {
  let score = 0
  if (password.length >= 8) score += 35
  if (password.length >= 14) score += 25
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 10
  return Math.min(score, 100)
}
