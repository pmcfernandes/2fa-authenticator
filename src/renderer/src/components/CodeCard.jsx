import { Check, Copy, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTOTP } from '../hooks/useTOTP'

const colors = ['#2563eb', '#0ea5e9', '#38bdf8', '#14b8a6', '#22c55e', '#facc15']

export default function CodeCard({ account, onDelete }) {
  const { code, secondsRemaining, period } = useTOTP(account)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const accent = useMemo(() => {
    const sum = (account.issuer || 'A').split('').reduce((total, char) => total + char.charCodeAt(0), 0)
    return colors[sum % colors.length]
  }, [account.issuer])
  const progress = ((period - secondsRemaining) / period) * 100
  const displayCode = code.replace(/(\d{3})(?=\d)/g, '$1 ')

  async function copyCode() {
    try {
      if (window.api?.copyText) {
        await window.api.copyText(code)
      } else {
        await navigator.clipboard.writeText(code)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1100)
    } catch (error) {
      console.error('Failed to copy code:', error)
      setCopied(false)
    }
  }

  return (
    <article className="code-card" style={{ '--service-accent': accent }}>
      <button
        className={`delete-button ${confirmDelete ? 'confirming' : ''}`}
        onClick={() => {
          if (!confirmDelete) {
            setConfirmDelete(true)
            window.setTimeout(() => setConfirmDelete(false), 3500)
            return
          }
          onDelete(account.id)
        }}
        title={confirmDelete ? 'Click again to delete' : 'Delete account'}
      >
        {confirmDelete ? 'Delete?' : <Trash2 size={16} />}
      </button>
      <div className="card-meta">
        <span className="avatar">{(account.issuer || '?').charAt(0).toUpperCase()}</span>
        <div>
          <h3>{account.issuer || 'Unknown'}</h3>
          <p>{account.label || 'Default account'}</p>
        </div>
      </div>

      <button className="code-button" onClick={copyCode} title="Copy code">
        <span>{displayCode}</span>
        <span className="copy-icon" aria-hidden="true">
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </span>
      </button>

      <div className="timer-row">
        <div className="ring" style={{ '--progress': `${progress}%` }}>
          <span>{secondsRemaining}</span>
        </div>
        <span className="timer-copy">Refreshes every {period}s</span>
      </div>
    </article>
  )
}
