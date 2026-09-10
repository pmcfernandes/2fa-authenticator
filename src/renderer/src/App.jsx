import { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import AddModal from './components/AddModal'
import CodeList from './components/CodeList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import LockScreen from './components/LockScreen'
import { useAccounts } from './hooks/useAccounts'
import { useTranslation } from './hooks/useTranslation'

export default function App() {
  const accounts = useAccounts()
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [checkingLock, setCheckingLock] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    window.api.isAppPasswordConfigured().then((configured) => {
      setIsLocked(configured)
      setCheckingLock(false)
    })
  }, [])

  if (checkingLock) {
    return <main className="app-shell"><div className="loading-panel">{t('app.checkingVault')}</div></main>
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />
  }

  return (
    <main className="app-shell">
      <Header
        query={accounts.searchQuery}
        onQueryChange={accounts.setSearchQuery}
        onAdd={() => setAddOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <section className="content-shell">
        <div className="status-strip">
          <div>
            <span className="eyebrow">{t('app.vault')}</span>
            <strong>{t('app.accounts', { count: accounts.accounts.length })}</strong>
          </div>
          <div>
            <span className="eyebrow">{t('app.storage')}</span>
            <strong><ShieldCheck size={16} /> {t('app.osEncrypted')}</strong>
          </div>
        </div>

        {accounts.loading ? (
          <div className="loading-panel">{t('app.loadingVault')}</div>
        ) : accounts.accounts.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} onImport={() => setSettingsOpen(true)} />
        ) : (
          <CodeList accounts={accounts.filteredAccounts} onDelete={accounts.deleteAccount} />
        )}
      </section>

      <AddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (account) => {
          await accounts.addAccount(account)
          setAddOpen(false)
        }}
      />

      <SettingsModal
        open={settingsOpen}
        accounts={accounts.accounts}
        onClose={() => setSettingsOpen(false)}
        onImport={accounts.importAccounts}
      />
    </main>
  )
}
