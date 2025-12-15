"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS, CACHE_DURATION } from "@/lib/cache"

// Turkish month names
const TURKISH_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]

// Type definitions
export interface ReadingStats {
    totalBooks: number
    completedBooks: number
    readingBooks: number
    toReadBooks: number
    dnfBooks: number
    totalPagesRead: number
    averageBookLength: number
    averageDaysPerBook: number | null
    pagesPerDay: number | null
    totalReadingDays: number
    booksThisMonth: number
    booksThisYear: number
    pagesThisMonth: number
    pagesThisYear: number
    completionRate: number
    averageProgress: number
}

export interface MonthlyData {
    month: number
    monthName: string
    year: number
    booksCompleted: number
    pagesRead: number
}

export interface AuthorStats {
    id: string
    name: string
    imageUrl: string | null
    bookCount: number
    completedCount: number
    totalPages: number
}

export interface PublisherStats {
    id: string
    name: string
    bookCount: number
    completedCount: number
}

export interface QuoteStats {
    totalQuotes: number
    booksWithQuotes: number
    averageQuotesPerBook: number
    mostQuotedBook: { title: string; count: number } | null
}

export interface ChallengeStats {
    hasActiveChallenge: boolean
    year: number
    totalBooks: number
    completedBooks: number
    mainCompleted: number
    bonusCompleted: number
    percentage: number
}

export interface FullStatsData {
    readingStats: ReadingStats
    monthlyData: MonthlyData[]
    topAuthors: AuthorStats[]
    topPublishers: PublisherStats[]
    quoteStats: QuoteStats
    challengeStats: ChallengeStats | null
    bestMonth: { month: string; count: number } | null
}

// Helper to get monthly data
async function getMonthlyData(userId: string): Promise<MonthlyData[]> {
    const now = new Date()
    const months: MonthlyData[] = []

    // Last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

        const books = await prisma.book.findMany({
            where: {
                userId,
                status: 'COMPLETED',
                endDate: {
                    gte: date,
                    lt: nextMonth
                }
            },
            select: { pageCount: true }
        })

        months.push({
            month: date.getMonth() + 1,
            monthName: TURKISH_MONTHS[date.getMonth()],
            year: date.getFullYear(),
            booksCompleted: books.length,
            pagesRead: books.reduce((sum, b) => sum + (b.pageCount || 0), 0)
        })
    }

    return months
}

// Cached stats fetcher
const getCachedStats = (userId: string) =>
    unstable_cache(
        async (): Promise<FullStatsData> => {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const startOfYear = new Date(now.getFullYear(), 0, 1)

            // Parallel queries for efficiency
            const [
                statusCounts,
                completedBooks,
                booksThisMonth,
                booksThisYear,
                quoteData,
                authorStats,
                publisherStats,
                challengeData,
                readingBooksData
            ] = await Promise.all([
                // 1. Status counts with page sums
                prisma.book.groupBy({
                    by: ['status'],
                    where: { userId },
                    _count: { _all: true },
                    _sum: { pageCount: true }
                }),

                // 2. Completed books for time calculations
                prisma.book.findMany({
                    where: {
                        userId,
                        status: 'COMPLETED',
                        endDate: { not: null }
                    },
                    select: {
                        id: true,
                        pageCount: true,
                        startDate: true,
                        endDate: true
                    }
                }),

                // 3. Books completed this month
                prisma.book.count({
                    where: {
                        userId,
                        status: 'COMPLETED',
                        endDate: { gte: startOfMonth }
                    }
                }),

                // 4. Books completed this year
                prisma.book.count({
                    where: {
                        userId,
                        status: 'COMPLETED',
                        endDate: { gte: startOfYear }
                    }
                }),

                // 5. Quote statistics
                prisma.quote.groupBy({
                    by: ['bookId'],
                    where: { book: { userId } },
                    _count: { _all: true }
                }),

                // 6. Author stats
                prisma.author.findMany({
                    where: { books: { some: { userId } } },
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        books: {
                            where: { userId },
                            select: {
                                status: true,
                                pageCount: true
                            }
                        }
                    }
                }),

                // 7. Publisher stats
                prisma.publisher.findMany({
                    where: { books: { some: { userId } } },
                    select: {
                        id: true,
                        name: true,
                        books: {
                            where: { userId },
                            select: { status: true }
                        }
                    }
                }),

                // 8. Challenge progress
                prisma.userChallengeProgress.findFirst({
                    where: { userId },
                    orderBy: { joinedAt: 'desc' },
                    include: {
                        challenge: true,
                        books: {
                            include: { challengeBook: true }
                        }
                    }
                }),

                // 9. Reading books for average progress
                prisma.book.findMany({
                    where: { userId, status: 'READING' },
                    select: { currentPage: true, pageCount: true }
                })
            ])

            // Process status counts
            type StatusItem = { status: string; _count: { _all: number }; _sum: { pageCount: number | null } }
            const statusMap = (statusCounts as StatusItem[]).reduce((acc, item) => {
                acc[item.status] = {
                    count: item._count._all,
                    pages: item._sum.pageCount || 0
                }
                return acc
            }, {} as Record<string, { count: number; pages: number }>)

            const completedCount = statusMap['COMPLETED']?.count || 0
            const readingCount = statusMap['READING']?.count || 0
            const toReadCount = statusMap['TO_READ']?.count || 0
            const dnfCount = statusMap['DNF']?.count || 0
            const totalBooks = completedCount + readingCount + toReadCount + dnfCount
            const totalPagesRead = statusMap['COMPLETED']?.pages || 0

            // Calculate reading days and average days per book
            let totalReadingDays = 0
            let booksWithDates = 0

            for (const book of completedBooks) {
                if (book.startDate && book.endDate) {
                    const days = Math.ceil(
                        (book.endDate.getTime() - book.startDate.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    if (days > 0) {
                        totalReadingDays += days
                        booksWithDates++
                    }
                }
            }

            const averageDaysPerBook = booksWithDates > 0
                ? Math.round(totalReadingDays / booksWithDates)
                : null

            const pagesPerDay = totalReadingDays > 0
                ? Math.round(totalPagesRead / totalReadingDays)
                : null

            // Calculate pages this month/year
            const pagesThisMonth = completedBooks
                .filter(b => b.endDate && b.endDate >= startOfMonth)
                .reduce((sum, b) => sum + (b.pageCount || 0), 0)

            const pagesThisYear = completedBooks
                .filter(b => b.endDate && b.endDate >= startOfYear)
                .reduce((sum, b) => sum + (b.pageCount || 0), 0)

            // Monthly data (last 12 months)
            const monthlyData = await getMonthlyData(userId)

            // Best month calculation
            const bestMonth = monthlyData.length > 0
                ? monthlyData.reduce((best, m) =>
                    m.booksCompleted > best.booksCompleted ? m : best
                )
                : null

            // Process author stats
            const topAuthors: AuthorStats[] = authorStats
                .map(a => {
                    const completedBooks = a.books.filter(b => b.status === 'COMPLETED')
                    return {
                        id: a.id,
                        name: a.name,
                        imageUrl: a.imageUrl,
                        bookCount: a.books.length,
                        completedCount: completedBooks.length,
                        totalPages: completedBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0)
                    }
                })
                .sort((a, b) => {
                    // Önce tamamlanan kitap sayısına göre, eşitse toplam kitap sayısına göre
                    if (b.completedCount !== a.completedCount) {
                        return b.completedCount - a.completedCount
                    }
                    return b.bookCount - a.bookCount
                })
                .slice(0, 10)

            // Process publisher stats
            const topPublishers: PublisherStats[] = publisherStats
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    bookCount: p.books.length,
                    completedCount: p.books.filter(b => b.status === 'COMPLETED').length
                }))
                .sort((a, b) => {
                    // Önce tamamlanan kitap sayısına göre, eşitse toplam kitap sayısına göre
                    if (b.completedCount !== a.completedCount) {
                        return b.completedCount - a.completedCount
                    }
                    return b.bookCount - a.bookCount
                })
                .slice(0, 10)

            // Process quote stats
            const totalQuotes = quoteData.reduce((sum, q) => sum + q._count._all, 0)
            const booksWithQuotes = quoteData.length
            const mostQuotedBookId = quoteData.length > 0
                ? quoteData.reduce((max, q) => q._count._all > max._count._all ? q : max).bookId
                : null

            let mostQuotedBook = null
            if (mostQuotedBookId) {
                const book = await prisma.book.findUnique({
                    where: { id: mostQuotedBookId },
                    select: { title: true }
                })
                if (book) {
                    const count = quoteData.find(q => q.bookId === mostQuotedBookId)?._count._all || 0
                    mostQuotedBook = { title: book.title, count }
                }
            }

            // Process challenge stats
            let challengeStats: ChallengeStats | null = null
            if (challengeData) {
                const mainCompleted = challengeData.books.filter(
                    b => b.status === 'COMPLETED' && b.challengeBook.role === 'MAIN'
                ).length
                const bonusCompleted = challengeData.books.filter(
                    b => b.status === 'COMPLETED' && b.challengeBook.role === 'BONUS'
                ).length
                const totalChallengeBooks = challengeData.books.length

                challengeStats = {
                    hasActiveChallenge: true,
                    year: challengeData.challenge.year,
                    totalBooks: totalChallengeBooks,
                    completedBooks: mainCompleted + bonusCompleted,
                    mainCompleted,
                    bonusCompleted,
                    percentage: totalChallengeBooks > 0
                        ? Math.round(((mainCompleted + bonusCompleted) / totalChallengeBooks) * 100)
                        : 0
                }
            }

            // Reading books average progress
            const averageProgress = readingBooksData.length > 0
                ? Math.round(
                    readingBooksData.reduce((sum, b) => {
                        if (b.pageCount && b.pageCount > 0) {
                            return sum + (b.currentPage / b.pageCount) * 100
                        }
                        return sum
                    }, 0) / readingBooksData.length
                )
                : 0

            return {
                readingStats: {
                    totalBooks,
                    completedBooks: completedCount,
                    readingBooks: readingCount,
                    toReadBooks: toReadCount,
                    dnfBooks: dnfCount,
                    totalPagesRead,
                    averageBookLength: completedCount > 0
                        ? Math.round(totalPagesRead / completedCount)
                        : 0,
                    averageDaysPerBook,
                    pagesPerDay,
                    totalReadingDays,
                    booksThisMonth,
                    booksThisYear,
                    pagesThisMonth,
                    pagesThisYear,
                    completionRate: (completedCount + dnfCount) > 0
                        ? Math.round((completedCount / (completedCount + dnfCount)) * 100)
                        : 100,
                    averageProgress
                },
                monthlyData,
                topAuthors,
                topPublishers,
                quoteStats: {
                    totalQuotes,
                    booksWithQuotes,
                    averageQuotesPerBook: completedCount > 0
                        ? Math.round((totalQuotes / completedCount) * 10) / 10
                        : 0,
                    mostQuotedBook
                },
                challengeStats,
                bestMonth: bestMonth && bestMonth.booksCompleted > 0
                    ? { month: `${bestMonth.monthName} ${bestMonth.year}`, count: bestMonth.booksCompleted }
                    : null
            }
        },
        [`stats-${userId}`],
        {
            tags: [
                CACHE_TAGS.userStats(userId),
                CACHE_TAGS.userBooks(userId),
                CACHE_TAGS.userQuotes(userId)
            ],
            revalidate: CACHE_DURATION.MEDIUM
        }
    )()

export async function getFullStats(): Promise<FullStatsData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        return await getCachedStats(user.id)
    } catch (error) {
        console.error("Failed to fetch stats:", error)
        throw error
    }
}
