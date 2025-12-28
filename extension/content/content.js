// AsyaKitap Chrome Extension - Content Script
// This script runs on book sites and extracts book information

// Determine which site we're on
const hostname = window.location.hostname

// Scrapers for different sites
const scrapers = {
  'www.kitapyurdu.com': scrapeKitapyurdu,
  'kitapyurdu.com': scrapeKitapyurdu,
  'www.idefix.com': scrapeIdefix,
  'idefix.com': scrapeIdefix,
  'www.amazon.com.tr': scrapeAmazonTR,
  'amazon.com.tr': scrapeAmazonTR,
  'www.goodreads.com': scrapeGoodreads,
  'goodreads.com': scrapeGoodreads,
  'www.dr.com.tr': scrapeDR,
  'dr.com.tr': scrapeDR,
  'www.bkmkitap.com': scrapeBkmKitap,
  'bkmkitap.com': scrapeBkmKitap,
}

// Get the appropriate scraper
const scraper = scrapers[hostname]

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_BOOK_DATA') {
    if (scraper) {
      const bookData = scraper()
      sendResponse({ book: bookData })
    } else {
      sendResponse({ book: null })
    }
  }
  return true
})

// Kitapyurdu scraper
function scrapeKitapyurdu() {
  try {
    // Title
    const titleEl = document.querySelector('h1.pr_header__heading')
    const title = titleEl?.textContent?.trim() || null

    // Author
    const authorEl = document.querySelector('a.pr_producers__link[href*="/yazar/"]')
    const author = authorEl?.textContent?.trim() || null

    // Cover
    const coverEl = document.querySelector('meta[property="og:image"]')
      || document.querySelector('.pr_images__main img')
    let coverUrl = coverEl?.content || coverEl?.src || null
    if (coverUrl?.startsWith('//')) coverUrl = 'https:' + coverUrl

    // Page count - from table
    const rows = document.querySelectorAll('table tr')
    let pageCount = null
    rows.forEach(row => {
      if (row.textContent.includes('Sayfa Sayısı')) {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 2) {
          pageCount = parseInt(cells[1].textContent.trim())
        }
      }
    })

    // ISBN
    let isbn = null
    rows.forEach(row => {
      if (row.textContent.includes('ISBN')) {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 2) {
          isbn = cells[1].textContent.trim()
        }
      }
    })

    // Publisher
    const publisherEl = document.querySelector('a.pr_producers__link[href*="/yayinevi/"]')
    const publisher = publisherEl?.textContent?.trim() || null

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn,
      publisher,
      source: 'kitapyurdu'
    }
  } catch (e) {
    console.error('Kitapyurdu scrape error:', e)
    return null
  }
}

// Idefix scraper
function scrapeIdefix() {
  try {
    const titleEl = document.querySelector('h1.product-title, h1')
    const title = titleEl?.textContent?.trim() || null

    const authorEl = document.querySelector('.author a, [class*="author"]')
    const author = authorEl?.textContent?.trim() || null

    const coverEl = document.querySelector('meta[property="og:image"]')
    const coverUrl = coverEl?.content || null

    // Try to get page count from specs
    let pageCount = null
    const specRows = document.querySelectorAll('.spec-row, .product-spec tr, [class*="spec"] li')
    specRows.forEach(row => {
      if (row.textContent.toLowerCase().includes('sayfa')) {
        const match = row.textContent.match(/(\d+)/)
        if (match) pageCount = parseInt(match[1])
      }
    })

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn: null,
      publisher: null,
      source: 'idefix'
    }
  } catch (e) {
    console.error('Idefix scrape error:', e)
    return null
  }
}

// Amazon.com.tr scraper
function scrapeAmazonTR() {
  try {
    const titleEl = document.querySelector('#productTitle, #ebooksProductTitle')
    const title = titleEl?.textContent?.trim() || null

    const authorEl = document.querySelector('.author a, .contributorNameID, #bylineInfo a')
    const author = authorEl?.textContent?.trim() || null

    const coverEl = document.querySelector('#imgBlkFront, #ebooksImgBlkFront, #landingImage')
    let coverUrl = coverEl?.src || null
    // Get higher res version
    if (coverEl?.dataset?.aDynamicImage) {
      try {
        const images = JSON.parse(coverEl.dataset.aDynamicImage)
        coverUrl = Object.keys(images)[0]
      } catch {}
    }

    // Page count
    let pageCount = null
    const detailBullets = document.querySelectorAll('#detailBullets_feature_div li, #productDetailsTable tr')
    detailBullets.forEach(item => {
      if (item.textContent.includes('sayfa') || item.textContent.includes('pages')) {
        const match = item.textContent.match(/(\d+)\s*(sayfa|pages)/i)
        if (match) pageCount = parseInt(match[1])
      }
    })

    // ISBN
    let isbn = null
    detailBullets.forEach(item => {
      if (item.textContent.includes('ISBN')) {
        const match = item.textContent.match(/(\d{10,13})/)
        if (match) isbn = match[1]
      }
    })

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn,
      publisher: null,
      source: 'amazon'
    }
  } catch (e) {
    console.error('Amazon scrape error:', e)
    return null
  }
}

// Goodreads scraper
function scrapeGoodreads() {
  try {
    const titleEl = document.querySelector('[data-testid="bookTitle"], h1.Text__title1')
    const title = titleEl?.textContent?.trim() || null

    const authorEl = document.querySelector('.ContributorLink__name, [data-testid="name"]')
    const author = authorEl?.textContent?.trim() || null

    const coverEl = document.querySelector('.BookCover__image img, meta[property="og:image"]')
    const coverUrl = coverEl?.src || coverEl?.content || null

    // Page count
    let pageCount = null
    const pagesEl = document.querySelector('[data-testid="pagesFormat"]')
    if (pagesEl) {
      const match = pagesEl.textContent.match(/(\d+)\s*pages/i)
      if (match) pageCount = parseInt(match[1])
    }

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn: null,
      publisher: null,
      source: 'goodreads'
    }
  } catch (e) {
    console.error('Goodreads scrape error:', e)
    return null
  }
}

// D&R scraper
function scrapeDR() {
  try {
    const titleEl = document.querySelector('h1.product-title, h1[class*="product"]')
    const title = titleEl?.textContent?.trim() || null

    const authorEl = document.querySelector('.author a, [class*="author"]')
    const author = authorEl?.textContent?.trim() || null

    const coverEl = document.querySelector('meta[property="og:image"]')
    const coverUrl = coverEl?.content || null

    let pageCount = null
    const specItems = document.querySelectorAll('.product-spec li, .spec-row')
    specItems.forEach(item => {
      if (item.textContent.toLowerCase().includes('sayfa')) {
        const match = item.textContent.match(/(\d+)/)
        if (match) pageCount = parseInt(match[1])
      }
    })

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn: null,
      publisher: null,
      source: 'dr'
    }
  } catch (e) {
    console.error('D&R scrape error:', e)
    return null
  }
}

// BKM Kitap scraper
function scrapeBkmKitap() {
  try {
    const titleEl = document.querySelector('h1.product-name, h1[class*="product"]')
    const title = titleEl?.textContent?.trim() || null

    const authorEl = document.querySelector('.author a, [class*="author"]')
    const author = authorEl?.textContent?.trim() || null

    const coverEl = document.querySelector('meta[property="og:image"]')
    const coverUrl = coverEl?.content || null

    let pageCount = null
    const specItems = document.querySelectorAll('.product-spec li, .spec-item')
    specItems.forEach(item => {
      if (item.textContent.toLowerCase().includes('sayfa')) {
        const match = item.textContent.match(/(\d+)/)
        if (match) pageCount = parseInt(match[1])
      }
    })

    return {
      title,
      author,
      coverUrl,
      pageCount,
      isbn: null,
      publisher: null,
      source: 'bkmkitap'
    }
  } catch (e) {
    console.error('BKM Kitap scrape error:', e)
    return null
  }
}

// Log that content script is loaded
console.log('AsyaKitap content script loaded on:', hostname)
