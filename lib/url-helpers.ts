/**
 * URL dönüştürme yardımcıları
 */

/**
 * Google Drive paylaşım linkini direkt görsel linkine dönüştürür
 * @param url - Google Drive URL'i
 * @returns Dönüştürülmüş URL veya orijinal URL
 */
export function convertToDirectImageUrl(url: string): string {
  if (!url) return url

  // Google Drive link formatları:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID

  // file/d/ formatı
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`
  }

  // open?id= formatı
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`
  }

  // Dropbox link dönüşümü
  // https://www.dropbox.com/s/xxx/file.png?dl=0
  // -> https://www.dropbox.com/s/xxx/file.png?raw=1
  if (url.includes('dropbox.com')) {
    return url.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1')
  }

  // OneDrive link dönüşümü
  // https://onedrive.live.com/embed?... formatına dönüştürme gerekebilir
  // Şimdilik orijinal URL'i döndür

  return url
}

/**
 * URL'in geçerli bir görsel URL'i olup olmadığını kontrol eder
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false

  // Direkt görsel uzantıları
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  const lowerUrl = url.toLowerCase()

  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return true
  }

  // Google Drive uc?export=view formatı
  if (url.includes('drive.google.com/uc?export=view')) {
    return true
  }

  // Dropbox raw formatı
  if (url.includes('dropbox.com') && url.includes('raw=1')) {
    return true
  }

  return true // Diğer URL'leri de kabul et
}
