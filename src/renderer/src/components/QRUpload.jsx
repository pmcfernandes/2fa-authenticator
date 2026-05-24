import { FileImage, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { parseOtpAuthUri } from '../utils/otp'
import { decodeQRFromDataUrl, decodeQRFromFile } from '../utils/qr'

export default function QRUpload({ onAccount }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('Drop an image or browse for a QR code.')

  async function handleDataUrl(dataUrl) {
    setPreview(dataUrl)
    setStatus('Reading QR code...')
    const data = await decodeQRFromDataUrl(dataUrl)
    const account = data ? parseOtpAuthUri(data) : null
    if (!account) return setStatus('No valid otpauth QR code found.')
    setStatus('Account found.')
    onAccount(account)
  }

  async function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('Reading QR code...')
    const data = await decodeQRFromFile(file)
    const account = data ? parseOtpAuthUri(data) : null
    if (!account) return setStatus('No valid otpauth QR code found.')
    setStatus('Account found.')
    onAccount(account)
  }

  async function openNativePicker() {
    const dataUrl = await window.api.openFileDialog()
    if (dataUrl) handleDataUrl(dataUrl)
  }

  return (
    <div
      className="upload-zone"
      onDrop={(event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files[0])
      }}
      onDragOver={(event) => event.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/bmp"
        hidden
        onChange={(event) => handleFile(event.target.files[0])}
      />
      {preview ? <img src={preview} alt="QR preview" /> : <FileImage size={58} />}
      <p>{status}</p>
      <div className="upload-actions">
        <button className="secondary-button" onClick={() => inputRef.current.click()}>
          <Upload size={17} />
          Browse
        </button>
        <button className="ghost-button" onClick={openNativePicker}>System picker</button>
      </div>
    </div>
  )
}
