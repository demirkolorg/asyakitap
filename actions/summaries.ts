"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getBooksWithSummaries() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: {
                userId: user.id,
                tortu: { not: null },
                NOT: { tortu: "" }
            },
            include: { author: true },
            orderBy: { updatedAt: 'desc' }
        })
        return books
    } catch (error) {
        console.error("Failed to fetch summaries:", error)
        return []
    }
}

// Summaries sayfası için gerekli tüm veriler - optimize edilmiş
export async function getSummariesPageData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { booksWithTortu: [], totalBookCount: 0, booksWithoutTortu: [] }

    try {
        const [booksWithTortu, totalBookCount, booksWithoutTortu] = await Promise.all([
            // Tortusu olan kitaplar
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    tortu: { not: null },
                    NOT: { tortu: "" }
                },
                include: { author: true },
                orderBy: { updatedAt: 'desc' }
            }),
            // Toplam kitap sayısı
            prisma.book.count({
                where: { userId: user.id }
            }),
            // Tortu bekleyen kitaplar (sadece gösterim için gerekli alanlar, max 10)
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    OR: [
                        { tortu: null },
                        { tortu: "" }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            })
        ])

        return { booksWithTortu, totalBookCount, booksWithoutTortu }
    } catch (error) {
        console.error("Failed to fetch summaries page data:", error)
        return { booksWithTortu: [], totalBookCount: 0, booksWithoutTortu: [] }
    }
}
