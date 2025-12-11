"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Sorguları grupla - maksimum 3-4 paralel sorgu

        // Grup 1: Temel istatistikler
        const [stats, counts] = await Promise.all([
            // Stats - groupBy ile tek sorguda status sayıları
            prisma.book.groupBy({
                by: ['status'],
                where: { userId: user.id },
                _count: { _all: true },
                _sum: { pageCount: true }
            }),
            // Counts - tek sorguda tüm sayılar
            prisma.$transaction([
                prisma.author.count({
                    where: { books: { some: { userId: user.id } } }
                }),
                prisma.quote.count({
                    where: { book: { userId: user.id } }
                }),
                prisma.book.count({
                    where: { userId: user.id, tortu: { not: null }, NOT: { tortu: '' } }
                }),
                prisma.book.count({
                    where: { userId: user.id, imza: { not: null }, NOT: { imza: '' } }
                })
            ])
        ])

        const [uniqueAuthorsCount, totalQuotes, totalTortu, totalImza] = counts

        // Grup 2: Kitap listeleri
        const [currentlyReading, recentlyCompleted] = await Promise.all([
            prisma.book.findMany({
                where: { userId: user.id, status: 'READING' },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true,
                    currentPage: true,
                    pageCount: true,
                    updatedAt: true,
                    author: { select: { id: true, name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            }),
            prisma.book.findMany({
                where: { userId: user.id, status: 'COMPLETED' },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true,
                    endDate: true,
                    author: { select: { id: true, name: true } }
                },
                orderBy: { endDate: 'desc' },
                take: 5
            })
        ])

        // Grup 3: İçerik listeleri
        const [recentQuotes, booksWithTortu, booksWithImza] = await Promise.all([
            prisma.quote.findMany({
                where: { book: { userId: user.id } },
                select: {
                    id: true,
                    content: true,
                    page: true,
                    createdAt: true,
                    book: {
                        select: { title: true, author: { select: { name: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.book.findMany({
                where: { userId: user.id, tortu: { not: null }, NOT: { tortu: '' } },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true,
                    updatedAt: true,
                    tortu: true,
                    author: { select: { id: true, name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 5
            }),
            prisma.book.findMany({
                where: { userId: user.id, imza: { not: null }, NOT: { imza: '' } },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true,
                    updatedAt: true,
                    imza: true,
                    author: { select: { id: true, name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 5
            })
        ])

        // Stats'ı işle
        const statusCounts = stats.reduce((acc, item) => {
            acc[item.status] = {
                count: item._count._all,
                pages: item._sum.pageCount || 0
            }
            return acc
        }, {} as Record<string, { count: number; pages: number }>)

        const totalBooks = Object.values(statusCounts).reduce((sum, s) => sum + s.count, 0)
        const completedPages = statusCounts['COMPLETED']?.pages || 0

        // Quote'ları formatla
        const formattedQuotes = recentQuotes.map(q => ({
            id: q.id,
            content: q.content,
            page: q.page,
            createdAt: q.createdAt,
            bookTitle: q.book.title,
            bookAuthor: q.book.author?.name || "Bilinmiyor"
        }))

        return {
            currentlyReading,
            recentlyCompleted,
            recentQuotes: formattedQuotes,
            booksWithTortu,
            booksWithImza,
            stats: {
                totalBooks,
                reading: statusCounts['READING']?.count || 0,
                completed: statusCounts['COMPLETED']?.count || 0,
                toRead: statusCounts['TO_READ']?.count || 0,
                dnf: statusCounts['DNF']?.count || 0,
                totalQuotes,
                totalPages: completedPages,
                pagesRead: completedPages,
                uniqueAuthors: uniqueAuthorsCount,
                totalTortu,
                totalImza,
            },
        }
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        throw error // Hatayı görmek için throw et
    }
}
