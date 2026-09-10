import { FileImage, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { parseOtpAuthUri } from '../utils/otp'
import { decodeQRFromDataUrl } from '../utils/qr'
import { useTranslation } from '../hooks/useTranslation'

export default function QRUpload({ onAccount }) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setStatus(t('qrUpload.dropOrClick'))
  }, [t])

  async function handleDataUrl(dataUrl) {
    setPreview(dataUrl)
    setStatus(t('qrUpload.reading'))
    const data = await decodeQRFromDataUrl(dataUrl)
    const account = data ? parseOtpAuthUri(data) : null
    if (!account) return setStatus(t('qrUpload.noValid'))
    setStatus(t('qrUpload.accountFound'))
    onAccount(account)
  }

  async function openPicker() {
    const dataUrl = await window.api.openFileDialog()
    if (dataUrl) handleDataUrl(dataUrl)
  }

  return (
    <div
      className="upload-zone"
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = () => handleDataUrl(reader.result)
          reader.readAsDataURL(file)
        }
      }}
      onDragOver={(event) => event.preventDefault()}
    >
      {preview ? <img src={preview} alt={t('qrUpload.previewAlt')} /> : <FileImage size={58} />}
      <p>{status}</p>
      <div className="upload-actions">
        <button className="secondary-button" onClick={openPicker}>
          <Upload size={17} />
          {t('qrUpload.browse')}
        </button>
      </div>
    </div>
  )
}
