import CodeCard from './CodeCard'
import { useTranslation } from '../hooks/useTranslation'

export default function CodeList({ accounts, onDelete }) {
  const { t } = useTranslation()

  if (accounts.length === 0) {
    return <div className="loading-panel">{t('codeList.noMatch')}</div>
  }

  return (
    <div className="code-list">
      <div className="card-grid">
        {accounts.map((account) => (
          <CodeCard key={account.id} account={account} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
