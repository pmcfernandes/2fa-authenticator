import { Plus } from 'lucide-react'
import { useState } from 'react'
import { createAccountFromManual, validateSecret } from '../utils/otp'
import { useTranslation } from '../hooks/useTranslation'

export default function ManualEntry({ onAdd }) {
  const { t } = useTranslation()
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
    if (!form.issuer.trim()) return setError(t('manual.serviceRequired'))
    if (!validateSecret(form.secret)) return setError(t('manual.invalidSecret'))
    onAdd(createAccountFromManual(form))
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        <span>{t('manual.service')}</span>
        <input value={form.issuer} onChange={(event) => update('issuer', event.target.value)} placeholder={t('manual.servicePlaceholder')} />
      </label>
      <label>
        <span>{t('manual.account')}</span>
        <input value={form.label} onChange={(event) => update('label', event.target.value)} placeholder={t('manual.accountPlaceholder')} />
      </label>
      <label className="span-two">
        <span>{t('manual.secretKey')}</span>
        <input value={form.secret} onChange={(event) => update('secret', event.target.value)} placeholder={t('manual.secretPlaceholder')} />
      </label>
      <label>
        <span>{t('manual.digits')}</span>
        <select value={form.digits} onChange={(event) => update('digits', Number(event.target.value))}>
          <option value={6}>6</option>
          <option value={8}>8</option>
        </select>
      </label>
      <label>
        <span>{t('manual.period')}</span>
        <input type="number" min="15" max="120" value={form.period} onChange={(event) => update('period', Number(event.target.value))} />
      </label>
      <label className="span-two">
        <span>{t('manual.algorithm')}</span>
        <select value={form.algorithm} onChange={(event) => update('algorithm', event.target.value)}>
          <option>SHA1</option>
          <option>SHA256</option>
          <option>SHA512</option>
        </select>
      </label>
      {error && <p className="form-error span-two">{error}</p>}
      <button className="primary-button span-two" type="submit">
        <Plus size={18} />
        {t('manual.addAccount')}
      </button>
    </form>
  )
}
