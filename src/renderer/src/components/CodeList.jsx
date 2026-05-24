import CodeCard from './CodeCard'

export default function CodeList({ accounts, onDelete }) {
  if (accounts.length === 0) {
    return <div className="loading-panel">No matching accounts.</div>
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
