import * as OTPAuth from 'otpauth'

/**
 * Parse an otpauth:// URI into an account object
 */
export function parseOtpAuthUri(uri) {
  try {
    const totp = OTPAuth.URI.parse(uri)
    return {
      id: crypto.randomUUID(),
      issuer: totp.issuer || 'Unknown',
      label: totp.label || '',
      secret: totp.secret.base32,
      algorithm: totp.algorithm || 'SHA1',
      digits: totp.digits || 6,
      period: totp.period || 30,
      createdAt: Date.now()
    }
  } catch (e) {
    console.error('Failed to parse OTP URI:', e)
    return null
  }
}

/**
 * Generate the current TOTP code for an account
 */
export function generateTOTP(account) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.label,
      algorithm: account.algorithm || 'SHA1',
      digits: account.digits || 6,
      period: account.period || 30,
      secret: account.secret
    })
    return totp.generate()
  } catch (e) {
    console.error('Failed to generate TOTP:', e)
    return '------'
  }
}

/**
 * Get the number of seconds remaining in the current TOTP period
 */
export function getSecondsRemaining(period = 30) {
  return period - (Math.floor(Date.now() / 1000) % period)
}

/**
 * Validate a Base32 secret key
 */
export function validateSecret(secret) {
  if (!secret || typeof secret !== 'string') return false
  // Base32 alphabet: A-Z, 2-7, optional padding with =
  const cleaned = secret.replace(/\s+/g, '').replace(/=+$/, '').toUpperCase()
  return /^[A-Z2-7]+$/.test(cleaned) && cleaned.length >= 16
}

/**
 * Create an account object from manual entry fields
 */
export function createAccountFromManual({ issuer, label, secret, algorithm, digits, period }) {
  const cleanSecret = secret.replace(/\s+/g, '').toUpperCase()
  return {
    id: crypto.randomUUID(),
    issuer: issuer || 'Unknown',
    label: label || '',
    secret: cleanSecret,
    algorithm: algorithm || 'SHA1',
    digits: digits || 6,
    period: period || 30,
    createdAt: Date.now()
  }
}
