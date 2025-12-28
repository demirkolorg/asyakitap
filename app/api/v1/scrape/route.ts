import { createClient } from "@supabase/supabase-js"
import { apiSuccess, apiError, apiOptions } from "@/lib/api/response"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getAuthUser(request: Request) {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null
    }
    const token = authHeader.replace("Bearer ", "")
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user
}

interface ScrapedBook {
    title: string | null
    author: string | null
    coverUrl: string | null
    pageCount: number | null
    isbn: string | null
    publisher: string | null
    description: string | null
    source: string
}

export async function OPTIONS() {
    return apiOptions()
}

// POST /api/v1/scrape - URL'den kitap bilgisi çek
export async function POST(request: Request) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const body = await request.json()
        const { url } = body

        if (!url) {
            return apiError("URL gerekli", "MISSING_URL", 400)
        }

        // Hangi site olduğunu belirle
        let scraper: ((url: string) => Promise<ScrapedBook>) | null = null
        let source = "unknown"

        if (url.includes("kitapyurdu.com")) {
            scraper = scrapeKitapyurdu
            source = "kitapyurdu"
        } else if (url.includes("idefix.com")) {
            scraper = scrapeIdefix
            source = "idefix"
        } else if (url.includes("amazon.com.tr")) {
            scraper = scrapeAmazonTR
            source = "amazon"
        } else if (url.includes("goodreads.com")) {
            scraper = scrapeGoodreads
            source = "goodreads"
        } else if (url.includes("dr.com.tr")) {
            scraper = scrapeDR
            source = "dr"
        } else if (url.includes("bkmkitap.com")) {
            scraper = scrapeBkmKitap
            source = "bkmkitap"
        }

        if (!scraper) {
            return apiError(
                "Bu site desteklenmiyor. Desteklenen siteler: Kitapyurdu, İdefix, Amazon.com.tr, Goodreads, D&R, BKM Kitap",
                "UNSUPPORTED_SITE",
                400
            )
        }

        const bookData = await scraper(url)

        if (!bookData.title) {
            return apiError("Kitap bilgisi bulunamadı", "SCRAPE_FAILED", 404)
        }

        return apiSuccess({
            ...bookData,
            source,
            url,
        })
    } catch (error) {
        console.error("Scrape error:", error)
        return apiError("Sayfa okunamadı", "SCRAPE_ERROR", 500)
    }
}

// Helper: HTML entity decode
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&uuml;/g, "ü")
        .replace(/&ouml;/g, "ö")
        .replace(/&ccedil;/g, "ç")
        .replace(/&Uuml;/g, "Ü")
        .replace(/&Ouml;/g, "Ö")
        .replace(/&Ccedil;/g, "Ç")
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, "—")
        .replace(/&ndash;/g, "–")
        .replace(/&hellip;/g, "...")
        .replace(/\s+/g, " ")
        .trim()
}

// Kitapyurdu scraper
async function scrapeKitapyurdu(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        },
    })
    const html = await response.text()

    const titleMatch =
        html.match(/<h1[^>]*class="pr_header__heading"[^>]*>([^<]+)/i) ||
        html.match(/<h1[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch =
        html.match(
            /<a[^>]*class="pr_producers__link"[^>]*href="[^"]*\/yazar\/[^"]*"[^>]*>\s*([^<]+)<\/a>/i
        ) || html.match(/href="[^"]*\/yazar\/[^"]*"[^>]*>\s*([^<]+)<\/a>/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch =
        html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
        html.match(/https:\/\/img\.kitapyurdu\.com\/v1\/getImage\/[^"'\s]+/i)
    let coverUrl = coverMatch ? (coverMatch[1] || coverMatch[0]).trim() : null
    if (coverUrl?.startsWith("//")) coverUrl = "https:" + coverUrl

    const pageMatch =
        html.match(/<td>Sayfa Sayısı:<\/td>\s*<td>(\d+)<\/td>/i) ||
        html.match(/"numberOfPages":\s*"(\d+)"/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch =
        html.match(/<td>ISBN:<\/td>\s*<td>(\d{10,13})<\/td>/i) ||
        html.match(/"isbn":\s*"(\d{10,13})"/i)
    const isbn = isbnMatch ? isbnMatch[1].trim() : null

    const publisherMatch = html.match(
        /<a[^>]*class="pr_producers__link"[^>]*href="[^"]*\/yayinevi\/[^"]*"[^>]*>([^<]+)<\/a>/i
    )
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    const descMatch =
        html.match(/"description":\s*"([^"]+)"/i) ||
        html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    const description = descMatch ? decodeHtmlEntities(descMatch[1]) : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description,
        source: "kitapyurdu",
    }
}

// İdefix scraper
async function scrapeIdefix(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
    })
    const html = await response.text()

    const titleMatch = html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch = html.match(/class="[^"]*author[^"]*"[^>]*>([^<]+)/i)
        || html.match(/<a[^>]*href="[^"]*yazar[^"]*"[^>]*>([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const coverUrl = coverMatch ? coverMatch[1] : null

    const pageMatch = html.match(/Sayfa Sayısı[^<]*<[^>]*>(\d+)/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch = html.match(/ISBN[^<]*<[^>]*>(\d{10,13})/i)
    const isbn = isbnMatch ? isbnMatch[1] : null

    const publisherMatch = html.match(/Yayınevi[^<]*<[^>]*>([^<]+)/i)
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description: null,
        source: "idefix",
    }
}

// Amazon.com.tr scraper
async function scrapeAmazonTR(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "Accept-Language": "tr-TR,tr;q=0.9",
        },
    })
    const html = await response.text()

    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch = html.match(/class="author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i)
        || html.match(/bylineInfo[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch = html.match(/<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/i)
        || html.match(/<img[^>]*data-a-dynamic-image="[^"]*"(https:\/\/[^"]+)"/i)
        || html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const coverUrl = coverMatch ? coverMatch[1] : null

    const pageMatch = html.match(/(\d+)\s*sayfa/i) || html.match(/(\d+)\s*pages/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch = html.match(/ISBN-13[^<]*<[^>]*>(\d{13})/i)
        || html.match(/ISBN-10[^<]*<[^>]*>(\d{10})/i)
    const isbn = isbnMatch ? isbnMatch[1] : null

    const publisherMatch = html.match(/Yayıncı[^<]*<[^>]*>([^<]+)/i)
        || html.match(/Publisher[^<]*<[^>]*>([^<]+)/i)
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description: null,
        source: "amazon",
    }
}

// Goodreads scraper
async function scrapeGoodreads(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
    })
    const html = await response.text()

    const titleMatch = html.match(/data-testid="bookTitle"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*class="[^"]*Text__title[^"]*"[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch = html.match(/class="ContributorLink__name[^"]*"[^>]*>([^<]+)/i)
        || html.match(/data-testid="name"[^>]*>([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch = html.match(/class="BookCover__image[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i)
        || html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const coverUrl = coverMatch ? coverMatch[1] : null

    const pageMatch = html.match(/data-testid="pagesFormat"[^>]*>(\d+)\s*pages/i)
        || html.match(/(\d+)\s*pages/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch = html.match(/ISBN[^<]*(\d{10,13})/i)
    const isbn = isbnMatch ? isbnMatch[1] : null

    const publisherMatch = html.match(/Published[^<]*by\s*<[^>]*>([^<]+)/i)
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    const descMatch = html.match(/data-testid="description"[^>]*>[\s\S]*?<span[^>]*>([^<]+)/i)
    const description = descMatch ? decodeHtmlEntities(descMatch[1]) : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description,
        source: "goodreads",
    }
}

// D&R scraper
async function scrapeDR(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
    })
    const html = await response.text()

    const titleMatch = html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch = html.match(/class="[^"]*author[^"]*"[^>]*>([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const coverUrl = coverMatch ? coverMatch[1] : null

    const pageMatch = html.match(/Sayfa Sayısı[^<]*<[^>]*>(\d+)/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch = html.match(/ISBN[^<]*<[^>]*>(\d{10,13})/i)
    const isbn = isbnMatch ? isbnMatch[1] : null

    const publisherMatch = html.match(/Yayınevi[^<]*<[^>]*>([^<]+)/i)
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description: null,
        source: "dr",
    }
}

// BKM Kitap scraper
async function scrapeBkmKitap(url: string): Promise<ScrapedBook> {
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
    })
    const html = await response.text()

    const titleMatch = html.match(/<h1[^>]*class="[^"]*product-name[^"]*"[^>]*>([^<]+)/i)
        || html.match(/<h1[^>]*>([^<]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    const authorMatch = html.match(/class="[^"]*author[^"]*"[^>]*>([^<]+)/i)
        || html.match(/Yazar[^<]*<[^>]*>([^<]+)/i)
    const author = authorMatch ? authorMatch[1].trim() : null

    const coverMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const coverUrl = coverMatch ? coverMatch[1] : null

    const pageMatch = html.match(/Sayfa Sayısı[^<]*<[^>]*>(\d+)/i)
    const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

    const isbnMatch = html.match(/ISBN[^<]*<[^>]*>(\d{10,13})/i)
    const isbn = isbnMatch ? isbnMatch[1] : null

    const publisherMatch = html.match(/Yayınevi[^<]*<[^>]*>([^<]+)/i)
    const publisher = publisherMatch ? publisherMatch[1].trim() : null

    return {
        title,
        author,
        coverUrl,
        pageCount,
        isbn,
        publisher,
        description: null,
        source: "bkmkitap",
    }
}
