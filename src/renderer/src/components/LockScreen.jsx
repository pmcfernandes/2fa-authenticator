import { Lock, ArrowRight, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'

export default function LockScreen({ onUnlock }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    setError('')
    try {
      const isValid = await window.api.verifyAppPassword(password)
      if (isValid) {
        onUnlock()
      } else {
        setError(t('lock.incorrectPassword'))
        setPassword('')
      }
    } catch (err) {
      setError(t('lock.verificationError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell lock-screen">
      <div className="lock-container">
        <div className="lock-icon-wrapper">
          <Lock size={48} />
        </div>
        <h1>{t('lock.title')}</h1>
        <p>{t('lock.description')}</p>

        <form onSubmit={handleSubmit} className="lock-form">
          <input
            type="password"
            placeholder={t('lock.placeholder')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="primary-button" disabled={loading || !password}>
            {loading ? t('lock.verifying') : t('lock.unlock')} <ArrowRight size={18} />
          </button>
        </form>

        {error && (
          <div className="lock-error">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}
      </div>
    </main>
  )
}
