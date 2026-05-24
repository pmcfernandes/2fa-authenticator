import { Plus } from 'lucide-react'
import { useState } from 'react'
import { createAccountFromManual, validateSecret } from '../utils/otp'

export default function ManualEntry({ onAdd }) {
  const [form, setForm] = useState({
    issuer: '',
    label: '',
    secret: '',
    digits: 6,
    period: 30,
    algorithm: 'SHA1'
  })
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!form.issuer.trim()) return setError('Service name is required.')
    if (!validateSecret(form.secret)) return setError('Secret must be valid Base32 text.')
    onAdd(createAccountFromManual(form))
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        <span>Service</span>
        <input value={form.issuer} onChange={(event) => update('issuer', event.target.value)} placeholder="GitHub" />
      </label>
      <label>
        <span>Account</span>
        <input value={form.label} onChange={(event) => update('label', event.target.value)} placeholder="user@email.com" />
      </label>
      <label className="span-two">
        <span>Secret key</span>
        <input value={form.secret} onChange={(event) => update('secret', event.target.value)} placeholder="JBSWY3DPEHPK3PXP" />
      </label>
      <label>
        <span>Digits</span>
        <select value={form.digits} onChange={(event) => update('digits', Number(event.target.value))}>
          <option value={6}>6</option>
          <option value={8}>8</option>
        </select>
      </label>
      <label>
        <span>Period</span>
        <input type="number" min="15" max="120" value={form.period} onChange={(event) => update('period', Number(event.target.value))} />
      </label>
      <label className="span-two">
        <span>Algorithm</span>
        <select value={form.algorithm} onChange={(event) => update('algorithm', event.target.value)}>
          <option>SHA1</option>
          <option>SHA256</option>
          <option>SHA512</option>
        </select>
      </label>
      {error && <p className="form-error span-two">{error}</p>}
      <button className="primary-button span-two" type="submit">
        <Plus size={18} />
        Add account
      </button>
    </form>
  )
}
