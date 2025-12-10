"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ScrapedBookData {
    title: string
    author: string
    authorImageUrl: string | null
    pageCount: number | null
    coverUrl: string | null
    publisher: string | null
    publisherImageUrl: string | null
    isbn: string | null
    publishedDate: string | null
    description: string | null
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

export async function scrapeKitapyurdu(url: string): Promise<ScrapeResult> {
    // URL doğrulama
    if (!url.includes("kitapyurdu.com")) {
        return { success: false, error: "Geçerli bir Kitapyurdu linki girin" }
    }

    // URL'yi temizle - .html sonrasındaki parametreleri kaldır
    let cleanUrl = url
    const htmlIndex = url.indexOf(".html")
    if (htmlIndex !== -1) {
        cleanUrl = url.substring(0, htmlIndex + 5)
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

        // Kitap adını çek - pr_header__heading class'lı h1
        const titleMatch = html.match(/<h1[^>]*class="pr_header__heading"[^>]*>([^<]+)/i)
            || html.match(/<h1[^>]*>([^<]+)/i)
        const title = titleMatch ? titleMatch[1].trim() : null

        if (!title) {
            return { success: false, error: "Kitap adı bulunamadı" }
        }

        // Yazar adını ve URL'sini çek
        const authorLinkMatch = html.match(/<a[^>]*class="pr_producers__link"[^>]*href="([^"]*\/yazar\/[^"]*)"[^>]*>\s*([^<]+)<\/a>/i)
            || html.match(/href="(https?:\/\/www\.kitapyurdu\.com\/yazar\/[^"]*)"[^>]*>\s*([^<]+)<\/a>/i)
        const author = authorLinkMatch ? authorLinkMatch[2].trim() : "Bilinmeyen Yazar"
        let authorPageUrl = authorLinkMatch ? authorLinkMatch[1] : null
        if (authorPageUrl && !authorPageUrl.startsWith("http")) {
            authorPageUrl = "https://www.kitapyurdu.com" + authorPageUrl
        }

        // Sayfa sayısını çek - tablo hücresinden
        const pageMatch = html.match(/<td>Sayfa Sayısı:<\/td>\s*<td>(\d+)<\/td>/i)
            || html.match(/"numberOfPages":\s*"(\d+)"/i)
        const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

        // Kapak görselini çek - og:image meta tag'inden
        const coverMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
            || html.match(/https:\/\/img\.kitapyurdu\.com\/v1\/getImage\/[^"'\s]+/i)
        let coverUrl = coverMatch ? (coverMatch[1] || coverMatch[0]).trim() : null

        // URL'yi düzelt
        if (coverUrl && coverUrl.startsWith("//")) {
            coverUrl = "https:" + coverUrl
        } else if (coverUrl && !coverUrl.startsWith("http")) {
            coverUrl = "https://www.kitapyurdu.com" + coverUrl
        }

        // Yayınevini ve URL'sini çek
        const publisherLinkMatch = html.match(/<a[^>]*class="pr_producers__link"[^>]*href="([^"]*\/yayinevi\/[^"]*)"[^>]*>([^<]+)<\/a>/i)
            || html.match(/href="(https?:\/\/www\.kitapyurdu\.com\/yayinevi\/[^"]*)"[^>]*>\s*([^<]+)<\/a>/i)
        const publisher = publisherLinkMatch ? publisherLinkMatch[2].trim() : null
        let publisherPageUrl = publisherLinkMatch ? publisherLinkMatch[1] : null
        if (publisherPageUrl && !publisherPageUrl.startsWith("http")) {
            publisherPageUrl = "https://www.kitapyurdu.com" + publisherPageUrl
        }

        // ISBN çek - tablo hücresinden veya JSON-LD'den
        const isbnMatch = html.match(/<td>ISBN:<\/td>\s*<td>(\d{10,13})<\/td>/i)
            || html.match(/"isbn":\s*"(\d{10,13})"/i)
        const isbn = isbnMatch ? isbnMatch[1].trim() : null

        // Yayın Tarihi çek - tablo hücresinden
        const publishedDateMatch = html.match(/<td>Yayın Tarihi:<\/td>\s*<td>(\d{2}\.\d{2}\.\d{4})<\/td>/i)
        const publishedDate = publishedDateMatch ? publishedDateMatch[1].trim() : null

        // Açıklama çek - JSON-LD veya meta description'dan
        const descriptionMatch = html.match(/"description":\s*"([^"]+)"/i)
            || html.match(/<meta[^>]*itemprop="description"[^>]*content="([^"]+)"/i)
            || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
        let description = descriptionMatch ? descriptionMatch[1].trim() : null
        // HTML entity'leri decode et
        if (description) {
            description = description
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
                .replace(/\s+/g, ' ')
                .trim()
        }

        // Yazar ve yayınevi görsellerini paralel olarak çek
        const [authorImageUrl, publisherImageUrl] = await Promise.all([
            authorPageUrl ? fetchAuthorImage(authorPageUrl) : Promise.resolve(null),
            publisherPageUrl ? fetchPublisherImage(publisherPageUrl) : Promise.resolve(null)
        ])

        return {
            success: true,
            data: {
                title,
                author,
                authorImageUrl,
                pageCount,
                coverUrl,
                publisher,
                publisherImageUrl,
                isbn,
                publishedDate,
                description
            }
        }
    } catch (error) {
        console.error("Kitapyurdu scraping error:", error)
        return { success: false, error: "Sayfa kazıma sırasında hata oluştu" }
    }
}

// Yazar sayfasından görsel çek
async function fetchAuthorImage(authorUrl: string): Promise<string | null> {
    try {
        const response = await fetch(authorUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        })
        if (!response.ok) return null

        const html = await response.text()

        // Yazar görseli - JSON-LD'den "image" alanı veya profil resmi
        const jsonLdMatch = html.match(/"image":\s*"(https?:\/\/[^"]+)"/i)
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
        const profileMatch = html.match(/<img[^>]*class="[^"]*(?:author|yazar|profile|profil)[^"]*"[^>]*src="([^"]+)"/i)

        // Site logosu olmayan ilk görseli döndür
        const imageMatch = jsonLdMatch || profileMatch || ogImageMatch

        if (imageMatch) {
            let imageUrl = imageMatch[1]
            // Site logosunu atla
            if (imageUrl.includes("fn:11250623") || imageUrl.includes("fn:11682842")) {
                return null
            }
            if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl
            return imageUrl
        }
        return null
    } catch {
        return null
    }
}

// Yayınevi sayfasından logo çek
async function fetchPublisherImage(publisherUrl: string): Promise<string | null> {
    try {
        const response = await fetch(publisherUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        })
        if (!response.ok) return null

        const html = await response.text()

        // Yayınevi logosu - JSON-LD'den "image" alanı veya profil resmi
        const jsonLdMatch = html.match(/"image":\s*"(https?:\/\/[^"]+)"/i)
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
        const logoMatch = html.match(/<img[^>]*class="[^"]*(?:publisher|yayinevi|logo)[^"]*"[^>]*src="([^"]+)"/i)

        // Site logosu olmayan ilk görseli döndür
        const imageMatch = jsonLdMatch || logoMatch || ogImageMatch

        if (imageMatch) {
            let imageUrl = imageMatch[1]
            // Site logosunu atla
            if (imageUrl.includes("fn:11250623") || imageUrl.includes("fn:11682842")) {
                return null
            }
            if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl
            return imageUrl
        }
        return null
    } catch {
        return null
    }
}

export async function addBookFromKitapyurdu(bookData: ScrapedBookData): Promise<AddBookResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Aynı kitap var mı kontrol et (aynı başlık ve yazar)
        const existingBook = await prisma.book.findFirst({
            where: {
                userId: user.id,
                title: {
                    equals: bookData.title,
                    mode: "insensitive"
                }
            },
            include: { author: true }
        })

        if (existingBook) {
            return {
                success: false,
                alreadyExists: true,
                bookId: existingBook.id,
                message: `"${bookData.title}" zaten kütüphanenizde mevcut`
            }
        }

        // Yazarı bul veya oluştur (görsel ile birlikte)
        let author = await prisma.author.findFirst({
            where: {
                name: {
                    equals: bookData.author,
                    mode: "insensitive"
                }
            }
        })

        if (!author) {
            author = await prisma.author.create({
                data: {
                    name: bookData.author,
                    imageUrl: bookData.authorImageUrl
                }
            })
        } else if (!author.imageUrl && bookData.authorImageUrl) {
            // Mevcut yazarın görseli yoksa güncelle
            author = await prisma.author.update({
                where: { id: author.id },
                data: { imageUrl: bookData.authorImageUrl }
            })
        }

        // Yayıneviyi bul veya oluştur (görsel ile birlikte)
        let publisher = null
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
                    data: {
                        name: bookData.publisher,
                        imageUrl: bookData.publisherImageUrl
                    }
                })
            } else if (!publisher.imageUrl && bookData.publisherImageUrl) {
                // Mevcut yayınevinin görseli yoksa güncelle
                publisher = await prisma.publisher.update({
                    where: { id: publisher.id },
                    data: { imageUrl: bookData.publisherImageUrl }
                })
            }
        }

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

        revalidatePath("/library")
        revalidatePath("/dashboard")

        return {
            success: true,
            bookId: newBook.id,
            message: `"${bookData.title}" kütüphanenize eklendi`
        }
    } catch (error) {
        console.error("Add book from Kitapyurdu error:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}
