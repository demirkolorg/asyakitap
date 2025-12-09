"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Paralel sorgular - her biri sadece ihtiyacı olan veriyi çeker
        const [
            stats,
            currentlyReading,
            recentlyCompleted,
            recentQuotes,
            booksWithTortu,
            booksWithImza,
            uniqueAuthorsCount
        ] = await Promise.all([
            // Stats - groupBy ile tek sorguda status sayıları
            prisma.book.groupBy({
                by: ['status'],
                where: { userId: user.id },
                _count: { _all: true },
                _sum: { pageCount: true }
            }),

            // Currently reading - sadece okunan kitaplar
            prisma.book.findMany({
                where: { userId: user.id, status: 'READING' },
                include: { author: true },
                orderBy: { updatedAt: 'desc' },
                take: 10
            }),

            // Recently completed - sadece son 5 tamamlanan
            prisma.book.findMany({
                where: { userId: user.id, status: 'COMPLETED' },
                include: { author: true },
                orderBy: { endDate: 'desc' },
                take: 5
            }),

            // Recent quotes - sadece son 5 alıntı
            prisma.quote.findMany({
                where: { book: { userId: user.id } },
                include: {
                    book: {
                        select: { title: true, author: { select: { name: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),

            // Books with tortu - DB seviyesinde filtreleme
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    tortu: { not: null },
                    NOT: { tortu: '' }
                },
                include: { author: true },
                orderBy: { updatedAt: 'desc' },
                take: 5
            }),

            // Books with imza - DB seviyesinde filtreleme
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    imza: { not: null },
                    NOT: { imza: '' }
                },
                include: { author: true },
                orderBy: { updatedAt: 'desc' },
                take: 5
            }),

            // Unique authors count
            prisma.author.count({
                where: {
                    books: { some: { userId: user.id } }
                }
            })
        ])

        // Ek count sorguları (paralel)
        const [totalQuotes, totalTortu, totalImza] = await Promise.all([
            prisma.quote.count({
                where: { book: { userId: user.id } }
            }),
            prisma.book.count({
                where: {
                    userId: user.id,
                    tortu: { not: null },
                    NOT: { tortu: '' }
                }
            }),
            prisma.book.count({
                where: {
                    userId: user.id,
                    imza: { not: null },
                    NOT: { imza: '' }
                }
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
        const totalPages = Object.values(statusCounts).reduce((sum, s) => sum + s.pages, 0)
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
                totalPages,
                pagesRead: completedPages,
                uniqueAuthors: uniqueAuthorsCount,
                totalTortu,
                totalImza,
            },
        }
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        return null
    }
}
