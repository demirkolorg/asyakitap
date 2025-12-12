"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ScrapedBookData {
    title: string
    author: string
    pageCount: number | null
    coverUrl: string | null
    publisher: string | null
    isbn: string | null
    publishedDate: string | null
    description: string | null
    language: string | null
    rating: number | null
}

interface ScrapeResult {
    success: boolean
    data?: ScrapedBookData
    error?: string
}

interface AddBookResult {
    success: boolean
    bookId?: string
    message?: string
    error?: string
    alreadyExists?: boolean
}

function decodeHtmlEntities(text: string): string {
    if (!text) return ""

    let result = text
        // Önce &amp; decode et (diğer entity'lerin içinde olabilir)
        .replace(/&amp;/g, '&')
        // Apostrophe variations - EN ÖNEMLİ
        .replace(/&apos;/gi, "'")
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/gi, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        // Quotes
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        // Türkçe named entities
        .replace(/&uuml;/gi, 'ü')
        .replace(/&Uuml;/gi, 'Ü')
        .replace(/&ouml;/gi, 'ö')
        .replace(/&Ouml;/gi, 'Ö')
        .replace(/&ccedil;/gi, 'ç')
        .replace(/&Ccedil;/gi, 'Ç')
        // Diğer entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '...')
        .replace(/&eacute;/g, 'é')
        .replace(/&agrave;/g, 'à')
        .replace(/&egrave;/g, 'è')
        .replace(/&acirc;/g, 'â')
        .replace(/&icirc;/g, 'î')

    // Numeric entities (&#xxx;)
    result = result.replace(/&#(\d+);/g, (_, num) => {
        const code = parseInt(num)
        return String.fromCharCode(code)
    })

    // Hex entities (&#xXX;)
    result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16)
        return String.fromCharCode(code)
    })

    return result.replace(/\s+/g, ' ').trim()
}

export async function scrapeGoodreads(url: string): Promise<ScrapeResult> {
    // URL doğrulama
    if (!url.includes("goodreads.com")) {
        return { success: false, error: "Geçerli bir Goodreads linki girin" }
    }

    // URL'yi temizle - query parametrelerini kaldır
    let cleanUrl = url
    const questionIndex = url.indexOf("?")
    if (questionIndex !== -1) {
        cleanUrl = url.substring(0, questionIndex)
    }

    try {
        const response = await fetch(cleanUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        })

        if (!response.ok) {
            return { success: false, error: "Sayfa yüklenemedi" }
        }

        const html = await response.text()

        // JSON-LD verisini çek - en güvenilir kaynak
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">(\{[^<]+\})<\/script>/i)
        let jsonLdData: Record<string, unknown> | null = null

        if (jsonLdMatch) {
            try {
                jsonLdData = JSON.parse(jsonLdMatch[1])
            } catch {
                // JSON parse hatası, devam et
            }
        }

        // Başlık - JSON-LD veya og:title'dan
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
            return { success: false, error: "Kitap adı bulunamadı" }
        }

        // Yazar - JSON-LD'den
        let author = "Bilinmeyen Yazar"
        if (jsonLdData && Array.isArray(jsonLdData.author) && jsonLdData.author.length > 0) {
            const firstAuthor = jsonLdData.author[0]
            if (typeof firstAuthor === 'object' && firstAuthor !== null && 'name' in firstAuthor) {
                author = decodeHtmlEntities(String(firstAuthor.name))
            }
        } else if (jsonLdData && typeof jsonLdData.author === 'object' && jsonLdData.author !== null && 'name' in (jsonLdData.author as Record<string, unknown>)) {
            author = decodeHtmlEntities(String((jsonLdData.author as Record<string, unknown>).name))
        }
        // Fallback: HTML'den yazar
        if (author === "Bilinmeyen Yazar") {
            const authorMatch = html.match(/ContributorLink__name[^>]*>([^<]+)<\/span>/i)
            if (authorMatch) {
                author = decodeHtmlEntities(authorMatch[1])
            }
        }

        // Kapak görseli - JSON-LD veya og:image
        let coverUrl: string | null = null
        if (jsonLdData && typeof jsonLdData.image === 'string') {
            coverUrl = jsonLdData.image
        }
        if (!coverUrl) {
            const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)
            coverUrl = coverMatch ? coverMatch[1] : null
        }

        // Sayfa sayısı - HTML'den ara
        let pageCount: number | null = null
        const pageMatch = html.match(/(\d+)\s*pages/i)
            || html.match(/Sayfa sayısı:\s*(\d+)/i)
            || html.match(/"numberOfPages":\s*"?(\d+)"?/i)
        if (pageMatch) {
            pageCount = parseInt(pageMatch[1])
        }

        // Yayınevi - HTML'den
        let publisher: string | null = null
        const publisherMatch = html.match(/Published[^<]*by\s*([^<]+)</i)
            || html.match(/Publisher:\s*([^<]+)</i)
        if (publisherMatch) {
            publisher = decodeHtmlEntities(publisherMatch[1].trim())
        }

        // ISBN - HTML'den
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

        // Açıklama - Temiz kaynaklardan al
        let description: string | null = null

        // JSON-LD description genelde temiz
        if (jsonLdData && typeof jsonLdData.description === 'string') {
            const desc = jsonLdData.description
            // JSON verisi içermiyorsa kullan
            if (!desc.includes('"_typename"') && !desc.includes('"webUrl"') && !desc.includes('{"')) {
                description = decodeHtmlEntities(desc)
            }
        }

        // Fallback: meta description (dikkatli kontrol)
        if (!description) {
            const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
            if (descMatch) {
                const rawDesc = descMatch[1]
                // JSON veya garip veri içermiyorsa kullan
                if (!rawDesc.includes('"_typename"') &&
                    !rawDesc.includes('"webUrl"') &&
                    !rawDesc.includes('{"') &&
                    !rawDesc.includes('null,') &&
                    !rawDesc.includes('"rating"') &&
                    rawDesc.length < 2000) {
                    description = decodeHtmlEntities(rawDesc)
                }
            }
        }

        // Hala yoksa og:description dene
        if (!description) {
            const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i)
            if (ogDescMatch) {
                const rawDesc = ogDescMatch[1]
                if (!rawDesc.includes('"_typename"') &&
                    !rawDesc.includes('{"') &&
                    rawDesc.length < 2000) {
                    description = decodeHtmlEntities(rawDesc)
                }
            }
        }

        // Dil - JSON-LD'den
        let language: string | null = null
        if (jsonLdData && typeof jsonLdData.inLanguage === 'string') {
            language = jsonLdData.inLanguage
        }

        // Rating - JSON-LD'den
        let rating: number | null = null
        if (jsonLdData && typeof jsonLdData.aggregateRating === 'object' && jsonLdData.aggregateRating !== null) {
            const aggRating = jsonLdData.aggregateRating as Record<string, unknown>
            if (typeof aggRating.ratingValue === 'number') {
                rating = aggRating.ratingValue
            } else if (typeof aggRating.ratingValue === 'string') {
                rating = parseFloat(aggRating.ratingValue)
            }
        }

        return {
            success: true,
            data: {
                title,
                author,
                pageCount,
                coverUrl,
                publisher,
                isbn,
                publishedDate,
                description,
                language,
                rating
            }
        }
    } catch (error) {
        console.error("Goodreads scraping error:", error)
        return { success: false, error: "Sayfa kazıma sırasında hata oluştu" }
    }
}

export async function addBookFromGoodreads(
    bookData: ScrapedBookData,
    readingListBookId?: string
): Promise<AddBookResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Paralel sorgu: Kitap var mı + Yazar var mı + Yayınevi var mı
        const [existingBook, existingAuthor, existingPublisher] = await Promise.all([
            prisma.book.findFirst({
                where: {
                    userId: user.id,
                    title: { equals: bookData.title, mode: "insensitive" }
                },
                select: { id: true }
            }),
            prisma.author.findFirst({
                where: { name: { equals: bookData.author, mode: "insensitive" } }
            }),
            bookData.publisher
                ? prisma.publisher.findFirst({
                    where: { name: { equals: bookData.publisher, mode: "insensitive" } }
                })
                : Promise.resolve(null)
        ])

        if (existingBook) {
            return {
                success: true,
                alreadyExists: true,
                bookId: existingBook.id,
                message: `"${bookData.title}" zaten kütüphanenizde mevcut`
            }
        }

        // Yazar ve yayınevi yoksa paralel oluştur
        const [author, publisher] = await Promise.all([
            existingAuthor ?? prisma.author.create({ data: { name: bookData.author } }),
            bookData.publisher && !existingPublisher
                ? prisma.publisher.create({ data: { name: bookData.publisher } })
                : Promise.resolve(existingPublisher)
        ])

        // Kitabı oluştur
        const newBook = await prisma.book.create({
            data: {
                userId: user.id,
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

        // Okuma listesine bağla (varsa)
        let linkedToList: string | undefined
        if (readingListBookId) {
            const rlBook = await prisma.readingListBook.findUnique({
                where: { id: readingListBookId },
                include: { level: { include: { readingList: true } } }
            })

            if (rlBook) {
                await prisma.userReadingListBook.create({
                    data: {
                        userId: user.id,
                        readingListBookId: readingListBookId,
                        bookId: newBook.id
                    }
                })
                linkedToList = rlBook.level.readingList.name
            }
        }

        revalidatePath("/library")
        revalidatePath("/dashboard")

        return {
            success: true,
            bookId: newBook.id,
            message: linkedToList
                ? `"${bookData.title}" "${linkedToList}" listesine eklendi`
                : `"${bookData.title}" kütüphanenize eklendi`
        }
    } catch (error) {
        console.error("Add book from Goodreads error:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}
