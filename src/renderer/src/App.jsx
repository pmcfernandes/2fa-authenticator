import { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import AddModal from './components/AddModal'
import CodeList from './components/CodeList'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import LockScreen from './components/LockScreen'
import { useAccounts } from './hooks/useAccounts'

export default function App() {
  const accounts = useAccounts()
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [checkingLock, setCheckingLock] = useState(true)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    window.api.isAppPasswordConfigured().then((configured) => {
      setIsLocked(configured)
      setCheckingLock(false)
    })
  }, [])

  if (checkingLock) {
    return <main className="app-shell"><div className="loading-panel">Checking secure vault...</div></main>
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
      />

      <section className="content-shell">
        <div className="status-strip">
          <div>
            <span className="eyebrow">Vault</span>
            <strong>{accounts.accounts.length} account{accounts.accounts.length === 1 ? '' : 's'}</strong>
          </div>
          <div>
            <span className="eyebrow">Storage</span>
            <strong><ShieldCheck size={16} /> OS encrypted</strong>
          </div>
        </div>

        {accounts.loading ? (
          <div className="loading-panel">Loading secure vault...</div>
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
