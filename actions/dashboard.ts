"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS, CACHE_DURATION } from "@/lib/cache"

// Type definitions
interface DashboardStats {
    totalBooks: number
    reading: number
    completed: number
    toRead: number
    dnf: number
    totalQuotes: number
    totalPages: number
    pagesRead: number
    uniqueAuthors: number
    totalTortu: number
    totalImza: number
}

interface BookWithAuthor {
    id: string
    title: string
    coverUrl: string | null
    author: { id: string; name: string } | null
}

interface CurrentlyReadingBook extends BookWithAuthor {
    currentPage: number
    pageCount: number | null
    updatedAt: Date
}

interface RecentlyCompletedBook extends BookWithAuthor {
    endDate: Date | null
}

interface BookWithTortu extends BookWithAuthor {
    tortu: string | null
    updatedAt: Date
}

interface BookWithImza extends BookWithAuthor {
    imza: string | null
    updatedAt: Date
}

interface FormattedQuote {
    id: string
    content: string
    page: number | null
    createdAt: Date
    bookTitle: string
    bookAuthor: string
}

export interface DashboardData {
    currentlyReading: CurrentlyReadingBook[]
    recentlyCompleted: RecentlyCompletedBook[]
    recentQuotes: FormattedQuote[]
    booksWithTortu: BookWithTortu[]
    booksWithImza: BookWithImza[]
    stats: DashboardStats
}

// Cached dashboard data fetcher
const getCachedDashboardData = (userId: string) =>
    unstable_cache(
        async (): Promise<DashboardData> => {
            // Tek bir Promise.all ile tüm sorguları paralel çalıştır
            const [
                stats,
                uniqueAuthorsCount,
                totalQuotes,
                totalTortu,
                totalImza,
                currentlyReading,
                recentlyCompleted,
                recentQuotes,
                booksWithTortu,
                booksWithImza
            ] = await Promise.all([
                // Stats - groupBy ile tek sorguda status sayıları
                prisma.book.groupBy({
                    by: ['status'],
                    where: { userId },
                    _count: { _all: true },
                    _sum: { pageCount: true }
                }),
                // Unique authors count
                prisma.author.count({
                    where: { books: { some: { userId } } }
                }),
                // Total quotes
                prisma.quote.count({
                    where: { book: { userId } }
                }),
                // Total tortu
                prisma.book.count({
                    where: { userId, tortu: { not: null }, NOT: { tortu: '' } }
                }),
                // Total imza
                prisma.book.count({
                    where: { userId, imza: { not: null }, NOT: { imza: '' } }
                }),
                // Currently reading books
                prisma.book.findMany({
                    where: { userId, status: 'READING' },
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
                // Recently completed
                prisma.book.findMany({
                    where: { userId, status: 'COMPLETED' },
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        endDate: true,
                        author: { select: { id: true, name: true } }
                    },
                    orderBy: { endDate: 'desc' },
                    take: 5
                }),
                // Recent quotes
                prisma.quote.findMany({
                    where: { book: { userId } },
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
                // Books with tortu
                prisma.book.findMany({
                    where: { userId, tortu: { not: null }, NOT: { tortu: '' } },
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
                // Books with imza
                prisma.book.findMany({
                    where: { userId, imza: { not: null }, NOT: { imza: '' } },
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
            type StatusCount = { count: number; pages: number }
            type StatsItem = { status: string; _count: { _all: number }; _sum: { pageCount: number | null } }
            const statusCounts = (stats as StatsItem[]).reduce<Record<string, StatusCount>>((acc, item) => {
                acc[item.status] = {
                    count: item._count._all,
                    pages: item._sum.pageCount || 0
                }
                return acc
            }, {})

            const totalBooks = Object.values(statusCounts).reduce((sum: number, s: StatusCount) => sum + s.count, 0)
            const completedPages = statusCounts['COMPLETED']?.pages || 0

            // Quote'ları formatla
            const formattedQuotes = recentQuotes.map((q: typeof recentQuotes[number]) => ({
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
        },
        [`dashboard-${userId}`],
        {
            tags: [
                CACHE_TAGS.userStats(userId),
                CACHE_TAGS.userBooks(userId),
                CACHE_TAGS.userQuotes(userId)
            ],
            revalidate: CACHE_DURATION.SHORT, // 1 minute cache
        }
    )()

export async function getDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        return await getCachedDashboardData(user.id)
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        throw error
    }
}
