import { Download, Plus, ShieldCheck } from 'lucide-react'

export default function EmptyState({ onAdd, onImport }) {
  return (
    <section className="empty-state">
      <div className="empty-illustration">
        <ShieldCheck size={68} />
      </div>
      <h2>No codes yet</h2>
      <p>Add a QR code, upload an image, or enter a Base32 secret to start building your local vault.</p>
      <div className="empty-actions">
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} />
          Add first account
        </button>
        <button className="ghost-button" onClick={onImport}>
          <Download size={18} />
          Import backup
        </button>
      </div>
    </section>
  )
}
