import { Plus, Search, Settings, Shield } from 'lucide-react'

export default function Header({ query, onQueryChange, onAdd, onSettings }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon"><Shield size={22} /></span>
        <div>
          <h1>2FA Authenticator</h1>
          <p>Time-based codes, sealed on this device</p>
        </div>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search service or account"
        />
      </label>

      <div className="header-actions">
        <button className="icon-button" onClick={onSettings} title="Settings">
          <Settings size={20} />
        </button>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={19} />
          Add
        </button>
      </div>
    </header>
  )
}
