import { Download, Plus, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export default function EmptyState({ onAdd, onImport }) {
  const { t } = useTranslation()

  return (
    <section className="empty-state">
      <div className="empty-illustration">
        <ShieldCheck size={68} />
      </div>
      <h2>{t('empty.title')}</h2>
      <p>{t('empty.description')}</p>
      <div className="empty-actions">
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} />
          {t('empty.addFirst')}
        </button>
        <button className="ghost-button" onClick={onImport}>
          <Download size={18} />
          {t('empty.importBackup')}
        </button>
      </div>
    </section>
  )
}
