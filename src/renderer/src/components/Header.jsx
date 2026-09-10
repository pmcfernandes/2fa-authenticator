import { Plus, Search, Settings, Shield, Sun, Moon } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export default function Header({ query, onQueryChange, onAdd, onSettings, theme, onThemeToggle }) {
  const { t } = useTranslation()

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon"><Shield size={22} /></span>
        <div>
          <h1>{t('common.appName')}</h1>
          <p>{t('header.tagline')}</p>
        </div>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('header.searchPlaceholder')}
        />
      </label>

      <div className="header-actions">
        <button className="icon-button" onClick={onThemeToggle} title={theme === 'dark' ? t('header.switchToLight') : t('header.switchToDark')}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="icon-button" onClick={onSettings} title={t('common.settings')}>
          <Settings size={20} />
        </button>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={19} />
          {t('common.add')}
        </button>
      </div>
    </header>
  )
}
