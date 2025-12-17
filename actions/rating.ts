"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

export interface BookRatingData {
    konuFikir: number
    akicilik: number
    derinlik: number
    etki: number
    dilUslup: number
    karakterAnlatim: number
    ozgunluk: number
    baskiTasarim: number
    tavsiyeEderim: number
    genelPuan: number
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
        data.tavsiyeEderim,
        data.genelPuan
    ]
    const sum = values.reduce((a, b) => a + b, 0)
    return Math.round((sum / values.length) * 10) / 10 // 1 ondalık basamak
}

// Puanlama ekle veya güncelle
export async function saveBookRating(bookId: string, data: BookRatingData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Oturum açmanız gerekiyor" }
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
            data.tavsiyeEderim,
            data.genelPuan
        ]

        for (const value of values) {
            if (value < 1 || value > 10) {
                return { success: false, error: "Tüm puanlar 1-10 arasında olmalıdır" }
            }
        }

        const ortalamaPuan = calculateAverage(data)

        const rating = await prisma.bookRating.upsert({
            where: { bookId },
            create: {
                bookId,
                konuFikir: data.konuFikir,
                akicilik: data.akicilik,
                derinlik: data.derinlik,
                etki: data.etki,
                dilUslup: data.dilUslup,
                karakterAnlatim: data.karakterAnlatim,
                ozgunluk: data.ozgunluk,
                baskiTasarim: data.baskiTasarim,
                tavsiyeEderim: data.tavsiyeEderim,
                genelPuan: data.genelPuan,
                ortalamaPuan
            },
            update: {
                konuFikir: data.konuFikir,
                akicilik: data.akicilik,
                derinlik: data.derinlik,
                etki: data.etki,
                dilUslup: data.dilUslup,
                karakterAnlatim: data.karakterAnlatim,
                ozgunluk: data.ozgunluk,
                baskiTasarim: data.baskiTasarim,
                tavsiyeEderim: data.tavsiyeEderim,
                genelPuan: data.genelPuan,
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
        return { success: false, error: "Puanlama kaydedilemedi: " + (error instanceof Error ? error.message : "Bilinmeyen hata") }
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
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Oturum açmanız gerekiyor" }
        }

        // Kitabın kullanıcıya ait olduğunu kontrol et
        const book = await prisma.book.findUnique({
            where: { id: bookId, userId: user.id },
            select: { id: true }
        })

        if (!book) {
            return { success: false, error: "Kitap bulunamadı" }
        }

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
        return { success: false, error: "Puanlama silinemedi: " + (error instanceof Error ? error.message : "Bilinmeyen hata") }
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
