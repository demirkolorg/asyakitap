/**
 * Dinamik favicon oluşturucu
 * Tema primary rengine göre favicon'u Canvas API ile oluşturur
 */

export function generateFavicon(primaryColor: string): string {
  const canvas = document.createElement('canvas')
  const size = 96 // favicon boyutu
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  // Scale factor (512 -> 96)
  const scale = size / 512

  // Background Squircle
  ctx.fillStyle = primaryColor
  roundRect(ctx, 0, 0, size, size, 80 * scale)
  ctx.fill()

  // Shadow - semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  drawShadowPath(ctx, scale)
  ctx.fill()

  // Clip to squircle for shadow
  ctx.save()
  ctx.beginPath()
  roundRect(ctx, 0, 0, size, size, 80 * scale)
  ctx.clip()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  drawShadowPath(ctx, scale)
  ctx.fill()
  ctx.restore()

  // White "A" letter
  ctx.fillStyle = 'white'
  ctx.beginPath()
  drawLetterA(ctx, scale)
  ctx.fill('evenodd')

  return canvas.toDataURL('image/png')
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawShadowPath(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.moveTo(256 * scale, 65 * scale)
  ctx.lineTo(600 * scale, 409 * scale)
  ctx.lineTo(600 * scale, 600 * scale)
  ctx.lineTo(380 * scale, 600 * scale)
  ctx.lineTo(380 * scale, 440 * scale)
  ctx.lineTo(317 * scale, 440 * scale)
  ctx.lineTo(317 * scale, 600 * scale)
  ctx.lineTo(195 * scale, 600 * scale)
  ctx.lineTo(195 * scale, 440 * scale)
  ctx.lineTo(132 * scale, 440 * scale)
  ctx.lineTo(132 * scale, 600 * scale)
  ctx.lineTo(-100 * scale, 600 * scale)
  ctx.lineTo(-100 * scale, 197 * scale)
  ctx.lineTo(132 * scale, 197 * scale)
  ctx.lineTo(132 * scale, 440 * scale)
  ctx.lineTo(195 * scale, 440 * scale)
  ctx.lineTo(195 * scale, 340 * scale)
  ctx.lineTo(317 * scale, 340 * scale)
  ctx.lineTo(317 * scale, 440 * scale)
  ctx.lineTo(380 * scale, 440 * scale)
  ctx.lineTo(380 * scale, 197 * scale)
  // Curve approximation
  ctx.quadraticCurveTo(380 * scale, 130 * scale, 256 * scale, 65 * scale)
  ctx.closePath()
}

function drawLetterA(ctx: CanvasRenderingContext2D, scale: number) {
  // Outer shape
  ctx.moveTo(256 * scale, 65 * scale)
  ctx.quadraticCurveTo(187 * scale, 65 * scale, 132 * scale, 130 * scale)
  ctx.quadraticCurveTo(132 * scale, 165 * scale, 132 * scale, 197 * scale)
  ctx.lineTo(132 * scale, 440 * scale)
  ctx.lineTo(195 * scale, 440 * scale)
  ctx.lineTo(195 * scale, 340 * scale)
  ctx.lineTo(317 * scale, 340 * scale)
  ctx.lineTo(317 * scale, 440 * scale)
  ctx.lineTo(380 * scale, 440 * scale)
  ctx.lineTo(380 * scale, 197 * scale)
  ctx.quadraticCurveTo(380 * scale, 130 * scale, 325 * scale, 65 * scale)
  ctx.quadraticCurveTo(290 * scale, 65 * scale, 256 * scale, 65 * scale)
  ctx.closePath()

  // Inner hole (counter-clockwise for evenodd)
  ctx.moveTo(195 * scale, 280 * scale)
  ctx.lineTo(317 * scale, 280 * scale)
  ctx.lineTo(317 * scale, 197 * scale)
  ctx.quadraticCurveTo(317 * scale, 157 * scale, 256 * scale, 125 * scale)
  ctx.quadraticCurveTo(195 * scale, 125 * scale, 195 * scale, 157 * scale)
  ctx.lineTo(195 * scale, 197 * scale)
  ctx.lineTo(195 * scale, 280 * scale)
  ctx.closePath()
}

export function updateFavicon(primaryColor: string) {
  if (typeof document === 'undefined') return

  const faviconUrl = generateFavicon(primaryColor)
  if (!faviconUrl) return

  // Update existing favicon links or create new ones
  const sizes = ['96x96', '32x32', '16x16']

  // Update or create icon link
  let iconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (!iconLink) {
    iconLink = document.createElement('link')
    iconLink.rel = 'icon'
    document.head.appendChild(iconLink)
  }
  iconLink.href = faviconUrl

  // Update apple-touch-icon if exists
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
  if (appleIcon) {
    appleIcon.href = faviconUrl
  }
}
