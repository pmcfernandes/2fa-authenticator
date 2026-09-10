import { CheckCircle2, Camera } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { parseOtpAuthUri } from '../utils/otp'
import { useTranslation } from '../hooks/useTranslation'

export default function QRScanner({ onAccount }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [scanned, setScanned] = useState(false)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    setStatus(t('qrScanner.pointCamera'))
  }, [t])

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((items) => {
        const cameras = items.filter((device) => device.kind === 'videoinput')
        setDevices(cameras)
        if (cameras[0]) setDeviceId(cameras[0].deviceId)
      })
      .catch(() => setDevices([]))
  }, [])

  function handleScan(result) {
    const value = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue || result
    if (!value || scanned) return
    const account = parseOtpAuthUri(value)
    if (!account) {
      setStatus(t('qrScanner.notOtpauth'))
      return
    }
    setScanned(true)
    setStatus(t('qrScanner.accountAdded'))
    onAccount(account)
  }

  return (
    <div className="scanner-shell">
      <div className="scanner-frame">
        {scanned ? (
          <div className="scan-success"><CheckCircle2 size={62} />{t('qrScanner.success')}</div>
        ) : (
          <Scanner
            onScan={handleScan}
            onError={() => setStatus(t('qrScanner.cameraUnavailable'))}
            constraints={deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }}
            formats={['qr_code']}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
          />
        )}
        <span className="scan-corner scan-corner-a" />
        <span className="scan-corner scan-corner-b" />
      </div>
      {devices.length > 1 && (
        <label className="camera-select">
          <span>{t('qrScanner.camera')}</span>
          <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || t('qrScanner.cameraFallback', { index: index + 1 })}
              </option>
            ))}
          </select>
        </label>
      )}
      <p><Camera size={16} />{status}</p>
    </div>
  )
}
