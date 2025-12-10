/**
 * Goodreads Bulk Import Script
 *
 * Usage:
 *   npx tsx scripts/bulk-import-goodreads.ts
 *
 * Configuration:
 *   - USER_ID: User ID to associate books with
 *   - BOOK_URLS: Array of Goodreads URLs to import
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config()

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
    console.error('❌ DATABASE_URL veya DIRECT_URL tanımlanmamış')
    process.exit(1)
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// =========================================
// CONFIGURATION - Change these values
// =========================================
const USER_ID = 'bd5bc606-757a-413b-b1e6-4562f2699572'

const BOOK_URLS: string[] = [
    // Goodreads URL'lerini buraya ekleyin
    // 'https://www.goodreads.com/book/show/...',
]
// =========================================

interface ScrapedBookData {
    title: string
    author: string
    pageCount: number | null
    coverUrl: string | null
    publisher: string | null
    isbn: string | null
    publishedDate: string | null
    description: string | null
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&uuml;/g, 'ü')
        .replace(/&ouml;/g, 'ö')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&Ccedil;/g, 'Ç')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&acirc;/g, 'â')
        .replace(/&icirc;/g, 'î')
        .replace(/&nbsp;/g, ' ')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '...')
        .replace(/&eacute;/g, 'é')
        .replace(/&agrave;/g, 'à')
        .replace(/&egrave;/g, 'è')
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

async function scrapeBook(url: string): Promise<ScrapedBookData | null> {
    try {
        // Clean URL
        let cleanUrl = url
        const questionIndex = url.indexOf("?")
        if (questionIndex !== -1) {
            cleanUrl = url.substring(0, questionIndex)
        }

        const response = await fetch(cleanUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        })

        if (!response.ok) {
            console.error(`  ⚠️ HTTP ${response.status} hatası`)
            return null
        }

        const html = await response.text()

        // JSON-LD verisini çek
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">(\{[^<]+\})<\/script>/i)
        let jsonLdData: Record<string, unknown> | null = null

        if (jsonLdMatch) {
            try {
                jsonLdData = JSON.parse(jsonLdMatch[1])
            } catch {
                // JSON parse hatası
            }
        }

        // Başlık
        let title: string | null = null
        if (jsonLdData && typeof jsonLdData.name === 'string') {
            title = decodeHtmlEntities(jsonLdData.name)
        }
        if (!title) {
            const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i)
                || html.match(/<h1[^>]*data-testid="bookTitle"[^>]*>([^<]+)<\/h1>/i)
            title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : null
        }

        if (!title) {
            console.error('  ❌ Kitap adı bulunamadı')
            return null
        }

        // Yazar
        let author = "Bilinmeyen Yazar"
        if (jsonLdData && Array.isArray(jsonLdData.author) && jsonLdData.author.length > 0) {
            const firstAuthor = jsonLdData.author[0]
            if (typeof firstAuthor === 'object' && firstAuthor !== null && 'name' in firstAuthor) {
                author = decodeHtmlEntities(String(firstAuthor.name))
            }
        } else if (jsonLdData && typeof jsonLdData.author === 'object' && jsonLdData.author !== null && 'name' in (jsonLdData.author as Record<string, unknown>)) {
            author = decodeHtmlEntities(String((jsonLdData.author as Record<string, unknown>).name))
        }
        if (author === "Bilinmeyen Yazar") {
            const authorMatch = html.match(/ContributorLink__name[^>]*>([^<]+)<\/span>/i)
            if (authorMatch) {
                author = decodeHtmlEntities(authorMatch[1])
            }
        }

        // Kapak görseli
        let coverUrl: string | null = null
        if (jsonLdData && typeof jsonLdData.image === 'string') {
            coverUrl = jsonLdData.image
        }
        if (!coverUrl) {
            const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)
            coverUrl = coverMatch ? coverMatch[1] : null
        }

        // Sayfa sayısı
        let pageCount: number | null = null
        const pageMatch = html.match(/(\d+)\s*pages/i)
            || html.match(/"numberOfPages":\s*"?(\d+)"?/i)
        if (pageMatch) {
            pageCount = parseInt(pageMatch[1])
        }

        // Yayınevi
        let publisher: string | null = null
        const publisherMatch = html.match(/Published[^<]*by\s*([^<]+)</i)
        if (publisherMatch) {
            publisher = decodeHtmlEntities(publisherMatch[1].trim())
        }

        // ISBN
        let isbn: string | null = null
        const isbnMatch = html.match(/ISBN[^0-9]*(\d{10,13})/i)
            || html.match(/"isbn":\s*"(\d{10,13})"/i)
        if (isbnMatch) {
            isbn = isbnMatch[1]
        }

        // Yayın tarihi
        let publishedDate: string | null = null
        const dateMatch = html.match(/First published\s+([^<]+)</i)
            || html.match(/Published\s+([^<]+)</i)
        if (dateMatch) {
            publishedDate = decodeHtmlEntities(dateMatch[1].trim())
        }

        // Açıklama
        let description: string | null = null
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
        if (descMatch) {
            description = decodeHtmlEntities(descMatch[1])
        }

        return {
            title,
            author,
            pageCount,
            coverUrl,
            publisher,
            isbn,
            publishedDate,
            description
        }
    } catch (error) {
        console.error(`  ❌ Scraping hatası:`, error)
        return null
    }
}

async function addBookToDatabase(bookData: ScrapedBookData): Promise<{ success: boolean; skipped?: boolean }> {
    try {
        // Kitap zaten var mı kontrol et
        const existingBook = await prisma.book.findFirst({
            where: {
                userId: USER_ID,
                title: {
                    equals: bookData.title,
                    mode: "insensitive"
                }
            }
        })

        if (existingBook) {
            return { success: true, skipped: true }
        }

        // Yazarı bul veya oluştur
        let author = await prisma.author.findFirst({
            where: {
                name: {
                    equals: bookData.author,
                    mode: "insensitive"
                }
            }
        })

        let isNewAuthor = false
        if (!author) {
            author = await prisma.author.create({
                data: { name: bookData.author }
            })
            isNewAuthor = true
        }

        // Yayıneviyi bul veya oluştur
        let publisher = null
        let isNewPublisher = false
        if (bookData.publisher) {
            publisher = await prisma.publisher.findFirst({
                where: {
                    name: {
                        equals: bookData.publisher,
                        mode: "insensitive"
                    }
                }
            })

            if (!publisher) {
                publisher = await prisma.publisher.create({
                    data: { name: bookData.publisher }
                })
                isNewPublisher = true
            }
        }

        // Kitabı oluştur
        await prisma.book.create({
            data: {
                userId: USER_ID,
                title: bookData.title,
                authorId: author.id,
                publisherId: publisher?.id,
                coverUrl: bookData.coverUrl,
                pageCount: bookData.pageCount,
                isbn: bookData.isbn,
                publishedDate: bookData.publishedDate,
                description: bookData.description,
                status: "TO_READ"
            }
        })

        // Emoji indicators for new entities
        const indicators = []
        if (isNewAuthor) indicators.push('👤 yeni yazar')
        if (isNewPublisher) indicators.push('🏢 yeni yayınevi')
        if (indicators.length > 0) {
            console.log(`     ${indicators.join(', ')}`)
        }

        return { success: true }
    } catch (error) {
        console.error(`  ❌ DB hatası:`, error)
        return { success: false }
    }
}

async function main() {
    if (BOOK_URLS.length === 0) {
        console.log('❌ BOOK_URLS boş. Script dosyasına URL ekleyin.')
        process.exit(1)
    }

    console.log(`📚 ${BOOK_URLS.length} kitap işlenecek...\n`)

    let added = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < BOOK_URLS.length; i++) {
        const url = BOOK_URLS[i]
        console.log(`[${i + 1}/${BOOK_URLS.length}] ${url.substring(0, 60)}...`)

        const bookData = await scrapeBook(url)

        if (!bookData) {
            failed++
            continue
        }

        console.log(`  📖 ${bookData.title} - ${bookData.author}`)

        const result = await addBookToDatabase(bookData)

        if (result.success) {
            if (result.skipped) {
                console.log('  ⏭️ Zaten mevcut')
                skipped++
            } else {
                console.log('  ✅ Eklendi')
                added++
            }
        } else {
            failed++
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n==================================================')
    console.log('📊 SONUÇ:')
    console.log(`   ✅ Eklenen: ${added}`)
    console.log(`   ⏭️  Atlanan (mevcut): ${skipped}`)
    console.log(`   ❌ Hata: ${failed}`)
    console.log('==================================================')

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error('Fatal error:', e)
    await prisma.$disconnect()
    process.exit(1)
})
