import { Camera, FileImage, Keyboard, X } from 'lucide-react'
import { useState } from 'react'
import ManualEntry from './ManualEntry'
import QRScanner from './QRScanner'
import QRUpload from './QRUpload'

const tabs = [
  { id: 'scan', label: 'Scan QR', icon: Camera },
  { id: 'upload', label: 'Upload QR', icon: FileImage },
  { id: 'manual', label: 'Manual', icon: Keyboard }
]

export default function AddModal({ open, onClose, onAdd }) {
  const [active, setActive] = useState('scan')

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <section className="modal-panel add-panel">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Add account</span>
            <h2>New authenticator code</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">
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
