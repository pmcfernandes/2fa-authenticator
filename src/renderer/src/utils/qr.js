import jsQR from 'jsqr'

/**
 * Decode a QR code from an image file
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<string|null>} The decoded QR data or null
 */
export function decodeQRFromDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      resolve(code ? code.data : null)
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/**
 * Decode a QR code from a File object (drag-and-drop or file input)
 * @param {File} file - The image file
 * @returns {Promise<string|null>} The decoded QR data or null
 */
export function decodeQRFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = await decodeQRFromDataUrl(e.target.result)
      resolve(result)
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
