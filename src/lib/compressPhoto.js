const COMPRESS_TIMEOUT_MS = 4000

export function compressPhotoData(dataUrl, max = 256, quality = 0.8) {
  if (!dataUrl) return Promise.resolve('')
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(value)
      }
    }
    const timer = setTimeout(() => finish(''), COMPRESS_TIMEOUT_MS)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, max / Math.max(img.width, img.height, 1))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          finish('')
          return
        }
        // JPEG 没有透明通道，先铺白底避免透明区域变黑
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        finish(canvas.toDataURL('image/jpeg', quality))
      } catch {
        finish('')
      }
    }
    img.onerror = () => finish('')
    img.src = dataUrl
  })
}
