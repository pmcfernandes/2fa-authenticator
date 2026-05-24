import { Lock, ArrowRight, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

export default function LockScreen({ onUnlock }) {
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
        setError('Incorrect password')
        setPassword('')
      }
    } catch (err) {
      setError('An error occurred during verification')
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
        <h1>App Locked</h1>
        <p>Please enter your application password to access the vault.</p>

        <form onSubmit={handleSubmit} className="lock-form">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="primary-button" disabled={loading || !password}>
            {loading ? 'Verifying...' : 'Unlock'} <ArrowRight size={18} />
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
