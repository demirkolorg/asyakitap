"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

// Puanlama kategorileri
export const RATING_CATEGORIES = [
    {
        key: "konuFikir",
        label: "Konu/Fikir",
        description: "Ana tema, mesaj veya fikrin özgünlüğü ve derinliği",
        group: "İçerik & Hikaye"
    },
    {
        key: "akicilik",
        label: "Akıcılık",
        description: "Okuma hızı, sayfa çevirme isteği, sıkılma durumu",
        group: "İçerik & Hikaye"
    },
    {
        key: "derinlik",
        label: "Derinlik",
        description: "Konunun işlenme seviyesi, detay zenginliği",
        group: "İçerik & Hikaye"
    },
    {
        key: "etki",
        label: "Etki",
        description: "Kitabın bıraktığı iz, düşündürme gücü",
        group: "İçerik & Hikaye"
    },
    {
        key: "dilUslup",
        label: "Dil & Üslup",
        description: "Yazarın anlatım gücü, kelime seçimi, cümle yapısı",
        group: "Yazarlık & Üslup"
    },
    {
        key: "karakterAnlatim",
        label: "Karakter/Anlatım",
        description: "Karakter derinliği (kurgu) veya anlatım tutarlılığı (kurgu dışı)",
        group: "Yazarlık & Üslup"
    },
    {
        key: "ozgunluk",
        label: "Özgünlük",
        description: "Yazarın kendine has sesi, farklılığı",
        group: "Yazarlık & Üslup"
    },
    {
        key: "baskiTasarim",
        label: "Baskı/Tasarım",
        description: "Kapak, kağıt kalitesi, punto, sayfa düzeni",
        group: "Teknik & Üretim"
    },
    {
        key: "genelPuan",
        label: "Genel Puan",
        description: "Tüm değerlendirmelerin özeti, kitabın genel değeri",
        group: "Genel"
    }
] as const

export type RatingCategoryKey = typeof RATING_CATEGORIES[number]["key"]

export interface BookRatingData {
    konuFikir: number
    akicilik: number
    derinlik: number
    etki: number
    dilUslup: number
    karakterAnlatim: number
    ozgunluk: number
    baskiTasarim: number
    genelPuan: number
    tapivsiyeEderim: boolean
}

export interface BookRatingWithMeta extends BookRatingData {
    id: string
    bookId: string
    ortalamaPuan: number
    createdAt: Date
    updatedAt: Date
}

// Ortalama puanı hesapla
function calculateAverage(data: BookRatingData): number {
    const values = [
        data.konuFikir,
        data.akicilik,
        data.derinlik,
        data.etki,
        data.dilUslup,
        data.karakterAnlatim,
        data.ozgunluk,
        data.baskiTasarim,
        data.genelPuan
    ]
    const sum = values.reduce((a, b) => a + b, 0)
    return Math.round((sum / values.length) * 10) / 10 // 1 ondalık basamak
}

// Puanlama ekle veya güncelle
export async function saveBookRating(bookId: string, data: BookRatingData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Kitabın kullanıcıya ait olduğunu ve COMPLETED olduğunu kontrol et
    const book = await prisma.book.findUnique({
        where: { id: bookId, userId: user.id },
        select: { id: true, status: true }
    })

    if (!book) {
        return { success: false, error: "Kitap bulunamadı" }
    }

    if (book.status !== "COMPLETED") {
        return { success: false, error: "Sadece okuduğunuz kitapları puanlayabilirsiniz" }
    }

    // Tüm puanların 1-10 arasında olduğunu kontrol et
    const values = [
        data.konuFikir,
        data.akicilik,
        data.derinlik,
        data.etki,
        data.dilUslup,
        data.karakterAnlatim,
        data.ozgunluk,
        data.baskiTasarim,
        data.genelPuan
    ]

    for (const value of values) {
        if (value < 1 || value > 10) {
            return { success: false, error: "Tüm puanlar 1-10 arasında olmalıdır" }
        }
    }

    try {
        const ortalamaPuan = calculateAverage(data)

        const rating = await prisma.bookRating.upsert({
            where: { bookId },
            create: {
                bookId,
                ...data,
                ortalamaPuan
            },
            update: {
                ...data,
                ortalamaPuan
            }
        })

        // Cache invalidation
        revalidateTag(CACHE_TAGS.book(bookId), 'max')
        revalidateTag(CACHE_TAGS.userBooks(user.id), 'max')
        revalidatePath(`/book/${bookId}`)

        return { success: true, rating }
    } catch (error) {
        console.error("Failed to save rating:", error)
        return { success: false, error: "Puanlama kaydedilemedi" }
    }
}

// Kitap puanlamasını getir
export async function getBookRating(bookId: string): Promise<BookRatingWithMeta | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const rating = await prisma.bookRating.findUnique({
            where: { bookId }
        })

        return rating
    } catch (error) {
        console.error("Failed to fetch rating:", error)
        return null
    }
}

// Puanlamayı sil
export async function deleteBookRating(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Kitabın kullanıcıya ait olduğunu kontrol et
    const book = await prisma.book.findUnique({
        where: { id: bookId, userId: user.id },
        select: { id: true }
    })

    if (!book) {
        return { success: false, error: "Kitap bulunamadı" }
    }

    try {
        await prisma.bookRating.delete({
            where: { bookId }
        })

        // Cache invalidation
        revalidateTag(CACHE_TAGS.book(bookId), 'max')
        revalidateTag(CACHE_TAGS.userBooks(user.id), 'max')
        revalidatePath(`/book/${bookId}`)

        return { success: true }
    } catch (error) {
        console.error("Failed to delete rating:", error)
        return { success: false, error: "Puanlama silinemedi" }
    }
}

// Kullanıcının tüm puanlamalarını getir (stats için)
export async function getUserRatings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const ratings = await prisma.bookRating.findMany({
            where: {
                book: { userId: user.id }
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        author: { select: { name: true } }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        })

        return ratings
    } catch (error) {
        console.error("Failed to fetch user ratings:", error)
        return []
    }
}
