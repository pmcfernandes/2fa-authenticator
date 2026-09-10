import { Camera, FileImage, Keyboard, X } from 'lucide-react'
import { useState } from 'react'
import ManualEntry from './ManualEntry'
import QRScanner from './QRScanner'
import QRUpload from './QRUpload'
import { useTranslation } from '../hooks/useTranslation'

export default function AddModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [active, setActive] = useState('scan')

  const tabs = [
    { id: 'scan', label: t('addModal.scanQR'), icon: Camera },
    { id: 'upload', label: t('addModal.uploadQR'), icon: FileImage },
    { id: 'manual', label: t('addModal.manual'), icon: Keyboard }
  ]

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <section className="modal-panel add-panel">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t('addModal.eyebrow')}</span>
            <h2>{t('addModal.title')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="tab-row">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={active === tab.id ? 'active' : ''}
                onClick={() => setActive(tab.id)}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {active === 'scan' && <QRScanner onAccount={onAdd} />}
        {active === 'upload' && <QRUpload onAccount={onAdd} />}
        {active === 'manual' && <ManualEntry onAdd={onAdd} />}
      </section>
    </div>
  )
}
