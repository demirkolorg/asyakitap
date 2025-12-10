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

        // Kitap adını çek - basit h1 tag'i
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        const title = titleMatch ? titleMatch[1].trim() : null

        if (!title) {
            return { success: false, error: "Kitap adı bulunamadı" }
        }

        // Yazar adını çek - kitapyurdu.com/yazar/ linkinden
        const authorMatch = html.match(/kitapyurdu\.com\/yazar\/[^"]*"[^>]*>\s*([^<]+)<\/a>/i)
            || html.match(/<a[^>]*class="pr_producers__link"[^>]*>([^<]+)<\/a>/i)
            || html.match(/itemprop="author"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i)
        const author = authorMatch ? authorMatch[1].trim() : "Bilinmeyen Yazar"

        // Sayfa sayısını çek
        const pageMatch = html.match(/Sayfa\s*Sayısı[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/i)
            || html.match(/>(\d+)\s*Sayfa</i)
        const pageCount = pageMatch ? parseInt(pageMatch[1]) : null

        // Kapak görselini çek - img.kitapyurdu.com URL'si
        const coverMatch = html.match(/https:\/\/img\.kitapyurdu\.com\/v1\/getImage\/[^"'\s]+/i)
            || html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
        let coverUrl = coverMatch ? (coverMatch[1] || coverMatch[0]).trim() : null

        // URL'yi düzelt
        if (coverUrl && coverUrl.startsWith("//")) {
            coverUrl = "https:" + coverUrl
        } else if (coverUrl && !coverUrl.startsWith("http")) {
            coverUrl = "https://www.kitapyurdu.com" + coverUrl
        }

        // Yayınevini çek - kitapyurdu.com/yayinevi/ linkinden
        const publisherMatch = html.match(/kitapyurdu\.com\/yayinevi\/[^"]*"[^>]*>\s*([^<]+)<\/a>/i)
        const publisher = publisherMatch ? publisherMatch[1].trim() : null

        // ISBN çek
        const isbnMatch = html.match(/ISBN[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d{10,13})/i)
        const isbn = isbnMatch ? isbnMatch[1].trim() : null

        // Yayın Tarihi çek (format: 12.09.2019)
        const publishedDateMatch = html.match(/Yayın\s*Tarihi[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d{2}\.\d{2}\.\d{4})/i)
        const publishedDate = publishedDateMatch ? publishedDateMatch[1].trim() : null

        return {
            success: true,
            data: {
                title,
                author,
                pageCount,
                coverUrl,
                publisher,
                isbn,
                publishedDate
            }
        }
    } catch (error) {
        console.error("Kitapyurdu scraping error:", error)
        return { success: false, error: "Sayfa kazıma sırasında hata oluştu" }
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

        // Yazarı bul veya oluştur
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
                data: { name: bookData.author }
            })
        }

        // Yayıneviyi bul veya oluştur
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
                    data: { name: bookData.publisher }
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
