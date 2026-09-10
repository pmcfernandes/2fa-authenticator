import { Download, Eye, Lock, Upload, X, Shield, HardDrive, Info, ExternalLink, Mail, User, Globe } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { decryptBackup, encryptBackup, mergeAccounts } from '../utils/backup'
import { useTranslation } from '../hooks/useTranslation'
import { languages } from '../i18n'

export default function SettingsModal({ open, accounts, onClose, onImport }) {
  const { t, language, setLanguage } = useTranslation()
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
    if (password.length < 8) return setMessage(t('settings.minChars'))
    const encrypted = await encryptBackup(accounts, password)
    const filePath = await window.api.exportAccounts(encrypted)
    setMessage(filePath ? t('settings.exported', { count: accounts.length }) : t('settings.exportCancelled'))
  }

  async function loadImportPreview() {
    if (!importPassword) return setMessage(t('settings.enterPassword'))
    const content = await window.api.importAccountsFile()
    if (!content) return setMessage(t('settings.importCancelled'))
    const imported = await decryptBackup(content, importPassword)
    if (!imported) return setMessage(t('settings.wrongPassword'))
    const result = mergeAccounts(accounts, imported)
    setPreview(result)
    setMessage(t('settings.previewSummary', { newCount: result.newAccounts.length, dupCount: result.duplicateCount }))
  }

  async function confirmImport() {
    if (!preview) return
    await onImport(preview.newAccounts)
    setMessage(t('settings.imported', { count: preview.newAccounts.length }))
    setPreview(null)
  }

  async function handleAppLockSave() {
    if (isAppLockConfigured) {
      const isValid = await window.api.verifyAppPassword(currentAppPassword)
      if (!isValid) return setMessage(t('settings.incorrectCurrent'))
    }
    
    await window.api.setAppPassword(newAppPassword)
    setIsAppLockConfigured(!!newAppPassword)
    setCurrentAppPassword('')
    setNewAppPassword('')
    setMessage(newAppPassword ? t('settings.lockEnabled') : t('settings.lockDisabled'))
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-panel settings-panel">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t('settings.eyebrow')}</span>
            <h2>{t('settings.title')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title={t('common.close')}>
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
              <Shield size={18} /> {t('settings.appLock')}
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('backup')
                setMessage('')
              }}
            >
              <HardDrive size={18} /> {t('settings.backupRestore')}
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('about')
                setMessage('')
              }}
            >
              <Info size={18} /> {t('settings.about')}
            </button>
          </aside>

          <main className="settings-content">
            {activeTab === 'security' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Lock size={18} />{t('settings.appLock')}</h3>
                  <p className="settings-desc">{t('settings.lockDescription')}</p>
                  {isAppLockConfigured && (
                    <label>
                      <span>{t('settings.currentPassword')}</span>
                      <input type="password" value={currentAppPassword} onChange={(e) => setCurrentAppPassword(e.target.value)} />
                    </label>
                  )}
                  <label>
                    <span>{isAppLockConfigured ? t('settings.newPassword') : t('settings.setPassword')}</span>
                    <input type="password" value={newAppPassword} onChange={(e) => setNewAppPassword(e.target.value)} />
                  </label>
                  <button className="primary-button" onClick={handleAppLockSave}>
                    {isAppLockConfigured ? (newAppPassword ? t('settings.updateLock') : t('settings.disableLock')) : t('settings.enableLock')}
                  </button>
                </section>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="settings-tab-pane">
                <section>
                  <h3><Download size={18} />{t('settings.exportAccounts')}</h3>
                  <label>
                    <span>{t('common.password')}</span>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </label>
                  <div className="strength">
                    <span style={{ width: `${strength}%` }} />
                  </div>
                  <button className="primary-button" onClick={exportAccounts}>
                    <Lock size={17} />
                    {t('settings.exportButton')}
                  </button>
                </section>

                <section>
                  <h3><Upload size={18} />{t('settings.importAccounts')}</h3>
                  <label>
                    <span>{t('common.password')}</span>
                    <input type="password" value={importPassword} onChange={(event) => setImportPassword(event.target.value)} />
                  </label>
                  <button className="secondary-button" onClick={loadImportPreview}>
                    <Eye size={17} />
                    {t('settings.previewImport')}
                  </button>
                  {preview && (
                    <button className="primary-button" onClick={confirmImport}>
                      {t('settings.importButton', { count: preview.newAccounts.length })}
                    </button>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="settings-tab-pane">
                <section className="about-section-card">
                  <div className="about-icon">
                    <Shield size={48} />
                  </div>
                  <h2>{t('common.appName')}</h2>
                  <p className="about-version">{t('common.version', { version })}</p>
                  <div className="about-info-list">
                    <div className="about-row">
                      <User size={18} />
                      <div>
                        <span className="about-label">{t('settings.author')}</span>
                        <strong>Pedro Fernandes</strong>
                      </div>
                    </div>
                    <div className="about-row">
                      <Mail size={18} />
                      <div>
                        <span className="about-label">{t('settings.email')}</span>
                        <a href="mailto:hello@impedro.com">hello@impedro.com</a>
                      </div>
                    </div>
                    <div className="about-row">
                      <ExternalLink size={18} />
                      <div>
                        <span className="about-label">{t('settings.website')}</span>
                        <a href="https://impedro.com" target="_blank" rel="noreferrer">impedro.com</a>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>

        <footer className="settings-footer">
          <label className="language-select">
            <Globe size={14} />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>{lang.flag} {lang.label}</option>
              ))}
            </select>
          </label>
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
