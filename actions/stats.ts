"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS, CACHE_DURATION } from "@/lib/cache"
import { getNowInTurkey } from "@/lib/utils"

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

export interface ThemeStats {
    totalThemes: number
    uniqueThemes: number
    booksWithThemes: number
    topThemes: { name: string; count: number; percentage: number }[]
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
    themeStats: ThemeStats
    challengeStats: ChallengeStats | null
    bestMonth: { month: string; count: number } | null
}

// Helper to get monthly data - tüm ayları döndürür (en eskiden en yeniye)
async function getMonthlyData(userId: string): Promise<MonthlyData[]> {
    const now = getNowInTurkey()

    // En eski tamamlanan kitabı bul
    const oldestBook = await prisma.book.findFirst({
        where: {
            userId,
            status: 'COMPLETED',
            endDate: { not: null }
        },
        orderBy: { endDate: 'asc' },
        select: { endDate: true }
    })

    // Eğer hiç tamamlanan kitap yoksa son 12 ayı döndür
    const startDate = oldestBook?.endDate
        ? new Date(oldestBook.endDate.getFullYear(), oldestBook.endDate.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1) // Gelecek ayın başı

    const months: MonthlyData[] = []
    const currentDate = new Date(startDate)

    while (currentDate < endDate) {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

        const books = await prisma.book.findMany({
            where: {
                userId,
                status: 'COMPLETED',
                endDate: {
                    gte: currentDate,
                    lt: nextMonth
                }
            },
            select: { pageCount: true }
        })

        months.push({
            month: currentDate.getMonth() + 1,
            monthName: TURKISH_MONTHS[currentDate.getMonth()],
            year: currentDate.getFullYear(),
            booksCompleted: books.length,
            pagesRead: books.reduce((sum, b) => sum + (b.pageCount || 0), 0)
        })

        currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return months
}

// Cached stats fetcher
const getCachedStats = (userId: string) =>
    unstable_cache(
        async (): Promise<FullStatsData> => {
            const now = getNowInTurkey()
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
                readingBooksData,
                themeData
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
                            include: {
                                challengeBook: {
                                    include: {
                                        book: {
                                            select: { status: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),

                // 9. Reading books for average progress
                prisma.book.findMany({
                    where: { userId, status: 'READING' },
                    select: { currentPage: true, pageCount: true }
                }),

                // 10. Theme statistics
                prisma.bookTheme.findMany({
                    where: { book: { userId } },
                    select: {
                        name: true,
                        bookId: true
                    }
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

            // Process challenge stats - kitabın gerçek durumunu (book.status) kullan
            let challengeStats: ChallengeStats | null = null
            if (challengeData) {
                // Sadece MAIN kitaplar ilerleme için sayılır
                const mainBooks = challengeData.books.filter(
                    b => b.challengeBook.role === 'MAIN'
                )
                const mainCompleted = mainBooks.filter(
                    b => b.challengeBook.book?.status === 'COMPLETED'
                ).length

                // Bonus kitaplar ayrı sayılır
                const bonusBooks = challengeData.books.filter(
                    b => b.challengeBook.role === 'BONUS'
                )
                const bonusCompleted = bonusBooks.filter(
                    b => b.challengeBook.book?.status === 'COMPLETED'
                ).length

                const totalMainBooks = mainBooks.length

                challengeStats = {
                    hasActiveChallenge: true,
                    year: challengeData.challenge.year,
                    totalBooks: totalMainBooks, // Sadece ana hedefler
                    completedBooks: mainCompleted,
                    mainCompleted,
                    bonusCompleted,
                    percentage: totalMainBooks > 0
                        ? Math.round((mainCompleted / totalMainBooks) * 100)
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

            // Process theme statistics
            const themeCountMap = new Map<string, number>()
            const booksWithThemesSet = new Set<string>()

            themeData.forEach(theme => {
                themeCountMap.set(theme.name, (themeCountMap.get(theme.name) || 0) + 1)
                booksWithThemesSet.add(theme.bookId)
            })

            const topThemes = Array.from(themeCountMap.entries())
                .map(([name, count]) => ({
                    name,
                    count,
                    percentage: booksWithThemesSet.size > 0
                        ? Math.round((count / booksWithThemesSet.size) * 100)
                        : 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            const themeStats: ThemeStats = {
                totalThemes: themeData.length,
                uniqueThemes: themeCountMap.size,
                booksWithThemes: booksWithThemesSet.size,
                topThemes
            }

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
                themeStats,
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

// ==========================================
// Streak & Heatmap Data
// ==========================================

export interface HeatmapDay {
    date: string // YYYY-MM-DD
    count: number // Sayfa sayısı veya aktivite sayısı
    level: 0 | 1 | 2 | 3 | 4 // 0: yok, 1-4: yoğunluk
}

export interface StreakData {
    currentStreak: number
    longestStreak: number
    totalActiveDays: number
    heatmapData: HeatmapDay[]
    lastActivityDate: string | null
}

// Tarihi YYYY-MM-DD formatında döndür (Türkiye timezone)
function formatDateToYMD(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export async function getStreakData(): Promise<StreakData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const userId = user.id

    // Son 365 gün için veri çek (Türkiye saati)
    const today = getNowInTurkey()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // Okunmuş/okunan kitapları al (startDate ve endDate ile)
    const books = await prisma.book.findMany({
        where: {
            userId,
            OR: [
                { status: 'COMPLETED' },
                { status: 'READING' },
                { status: 'DNF' }
            ],
            startDate: { not: null }
        },
        select: {
            startDate: true,
            endDate: true,
            status: true,
            pageCount: true
        }
    })

    // Gün bazında aktivite haritası oluştur
    const activityMap = new Map<string, number>()

    // Her kitabın okuma günlerini hesapla
    books.forEach(book => {
        if (!book.startDate) return

        const startDate = new Date(book.startDate)
        // Bitiş tarihi yoksa (hala okunuyor veya bırakıldı) bugünü kullan
        const endDate = book.endDate ? new Date(book.endDate) : today

        // Sadece son 1 yıl içindeki günleri say
        const effectiveStart = startDate < oneYearAgo ? oneYearAgo : startDate
        const effectiveEnd = endDate > today ? today : endDate

        // Her gün için aktivite ekle
        const currentDate = new Date(effectiveStart)
        while (currentDate <= effectiveEnd) {
            const dateStr = formatDateToYMD(currentDate)
            activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
            currentDate.setDate(currentDate.getDate() + 1)
        }
    })

    // Heatmap verisi oluştur (son 365 gün)
    const heatmapData: HeatmapDay[] = []

    for (let i = 364; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = formatDateToYMD(date)
        const count = activityMap.get(dateStr) || 0

        // Level hesapla (0-4)
        let level: 0 | 1 | 2 | 3 | 4 = 0
        if (count > 0) level = 1
        if (count >= 2) level = 2
        if (count >= 4) level = 3
        if (count >= 6) level = 4

        heatmapData.push({ date: dateStr, count, level })
    }

    // Streak hesapla
    const activeDates = Array.from(activityMap.keys()).sort().reverse()
    const totalActiveDays = activeDates.length

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Bugünden geriye doğru streak hesapla
    const todayStr = formatDateToYMD(today)
    let checkDate = new Date(today)

    // Current streak
    while (true) {
        const checkStr = formatDateToYMD(checkDate)
        if (activityMap.has(checkStr)) {
            currentStreak++
            checkDate.setDate(checkDate.getDate() - 1)
        } else {
            // Bugün aktivite yoksa, dün kontrol et
            if (checkStr === todayStr) {
                checkDate.setDate(checkDate.getDate() - 1)
                continue
            }
            break
        }
    }

    // Longest streak
    const sortedDates = Array.from(activityMap.keys()).sort()
    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            tempStreak = 1
        } else {
            const prevDate = new Date(sortedDates[i - 1])
            const currDate = new Date(sortedDates[i])
            const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
                tempStreak++
            } else {
                tempStreak = 1
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak)
    }

    const lastActivityDate = activeDates.length > 0 ? activeDates[0] : null

    return {
        currentStreak,
        longestStreak,
        totalActiveDays,
        heatmapData,
        lastActivityDate
    }
}

// ==========================================
// Yıllık Karşılaştırma
// ==========================================

export interface YearlyComparison {
    currentYear: number
    previousYear: number
    current: {
        books: number
        pages: number
        avgRating: number
        avgDaysPerBook: number | null
    }
    previous: {
        books: number
        pages: number
        avgRating: number
        avgDaysPerBook: number | null
    }
    changes: {
        books: number // yüzde değişim
        pages: number
        avgRating: number
        avgDaysPerBook: number | null
    }
}

export async function getYearlyComparison(): Promise<YearlyComparison | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = getNowInTurkey()
    const currentYear = now.getFullYear()
    const previousYear = currentYear - 1

    const currentYearStart = new Date(currentYear, 0, 1)
    const currentYearEnd = new Date(currentYear, 11, 31, 23, 59, 59)
    const previousYearStart = new Date(previousYear, 0, 1)
    const previousYearEnd = new Date(previousYear, 11, 31, 23, 59, 59)

    // Her iki yıl için kitapları çek
    const [currentBooks, previousBooks] = await Promise.all([
        prisma.book.findMany({
            where: {
                userId: user.id,
                status: 'COMPLETED',
                endDate: { gte: currentYearStart, lte: currentYearEnd }
            },
            include: { rating: true }
        }),
        prisma.book.findMany({
            where: {
                userId: user.id,
                status: 'COMPLETED',
                endDate: { gte: previousYearStart, lte: previousYearEnd }
            },
            include: { rating: true }
        })
    ])

    const calcStats = (books: typeof currentBooks) => {
        const count = books.length
        const pages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0)
        const ratings = books.filter(b => b.rating).map(b => b.rating!.ortalamaPuan)
        const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0

        // Ortalama gün hesapla
        const daysPerBook = books
            .filter(b => b.startDate && b.endDate)
            .map(b => {
                const start = new Date(b.startDate!)
                const end = new Date(b.endDate!)
                return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            })
        const avgDays = daysPerBook.length > 0 ? Math.round(daysPerBook.reduce((a, b) => a + b, 0) / daysPerBook.length) : null

        return { books: count, pages, avgRating, avgDaysPerBook: avgDays }
    }

    const current = calcStats(currentBooks)
    const previous = calcStats(previousBooks)

    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return Math.round(((curr - prev) / prev) * 100)
    }

    return {
        currentYear,
        previousYear,
        current,
        previous,
        changes: {
            books: calcChange(current.books, previous.books),
            pages: calcChange(current.pages, previous.pages),
            avgRating: Math.round((current.avgRating - previous.avgRating) * 10) / 10,
            avgDaysPerBook: current.avgDaysPerBook && previous.avgDaysPerBook
                ? current.avgDaysPerBook - previous.avgDaysPerBook
                : null
        }
    }
}

// ==========================================
// Puan Dağılımı
// ==========================================

export interface RatingDistribution {
    distribution: { rating: number; count: number }[]
    averageRating: number
    totalRated: number
    mostCommonRating: number
}

export async function getRatingDistribution(): Promise<RatingDistribution | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const ratings = await prisma.bookRating.findMany({
        where: { book: { userId: user.id } },
        select: { genelPuan: true, ortalamaPuan: true }
    })

    // 1-10 arası dağılım
    const distribution: { rating: number; count: number }[] = []
    for (let i = 1; i <= 10; i++) {
        distribution.push({
            rating: i,
            count: ratings.filter(r => Math.round(r.genelPuan) === i).length
        })
    }

    const totalRated = ratings.length
    const averageRating = totalRated > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.ortalamaPuan, 0) / totalRated) * 10) / 10
        : 0

    const mostCommonRating = distribution.reduce((max, curr) =>
        curr.count > max.count ? curr : max, distribution[0])?.rating || 0

    return { distribution, averageRating, totalRated, mostCommonRating }
}

// ==========================================
// Okuma Hızı Trendi
// ==========================================

export interface SpeedTrend {
    months: {
        month: string
        year: number
        pagesPerDay: number | null
        booksCompleted: number
    }[]
    trend: 'increasing' | 'decreasing' | 'stable'
    averageSpeed: number
}

export async function getSpeedTrend(): Promise<SpeedTrend | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = getNowInTurkey()
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const books = await prisma.book.findMany({
        where: {
            userId: user.id,
            status: 'COMPLETED',
            startDate: { not: null },
            endDate: { gte: sixMonthsAgo }
        },
        select: { startDate: true, endDate: true, pageCount: true }
    })

    // Aylık gruplama
    const monthlyData = new Map<string, { pages: number; days: number; books: number }>()

    books.forEach(book => {
        if (!book.startDate || !book.endDate || !book.pageCount) return
        const endDate = new Date(book.endDate)
        const monthKey = `${endDate.getFullYear()}-${endDate.getMonth()}`
        const days = Math.max(1, Math.ceil((endDate.getTime() - new Date(book.startDate).getTime()) / (1000 * 60 * 60 * 24)))

        const existing = monthlyData.get(monthKey) || { pages: 0, days: 0, books: 0 }
        monthlyData.set(monthKey, {
            pages: existing.pages + book.pageCount,
            days: existing.days + days,
            books: existing.books + 1
        })
    })

    const months: SpeedTrend['months'] = []
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        const data = monthlyData.get(monthKey)

        months.push({
            month: TURKISH_MONTHS[date.getMonth()],
            year: date.getFullYear(),
            pagesPerDay: data && data.days > 0 ? Math.round(data.pages / data.days) : null,
            booksCompleted: data?.books || 0
        })
    }

    // Trend hesapla
    const speeds = months.map(m => m.pagesPerDay).filter((s): s is number => s !== null)
    let trend: SpeedTrend['trend'] = 'stable'
    if (speeds.length >= 3) {
        const firstHalf = speeds.slice(0, Math.floor(speeds.length / 2))
        const secondHalf = speeds.slice(Math.floor(speeds.length / 2))
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        if (secondAvg > firstAvg * 1.1) trend = 'increasing'
        else if (secondAvg < firstAvg * 0.9) trend = 'decreasing'
    }

    const averageSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0

    return { months, trend, averageSpeed }
}

// ==========================================
// Sayfa Sayısı Dağılımı
// ==========================================

export interface PageDistribution {
    ranges: { range: string; min: number; max: number; count: number }[]
    averagePages: number
    shortestBook: { title: string; pages: number } | null
    longestBook: { title: string; pages: number } | null
}

export async function getPageDistribution(): Promise<PageDistribution | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const books = await prisma.book.findMany({
        where: { userId: user.id, pageCount: { gt: 0 } },
        select: { title: true, pageCount: true }
    })

    const ranges = [
        { range: '0-100', min: 0, max: 100, count: 0 },
        { range: '101-200', min: 101, max: 200, count: 0 },
        { range: '201-300', min: 201, max: 300, count: 0 },
        { range: '301-400', min: 301, max: 400, count: 0 },
        { range: '401-500', min: 401, max: 500, count: 0 },
        { range: '500+', min: 501, max: Infinity, count: 0 }
    ]

    books.forEach(book => {
        const pages = book.pageCount || 0
        const range = ranges.find(r => pages >= r.min && pages <= r.max)
        if (range) range.count++
    })

    const totalPages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0)
    const averagePages = books.length > 0 ? Math.round(totalPages / books.length) : 0

    const sortedByPages = [...books].sort((a, b) => (a.pageCount || 0) - (b.pageCount || 0))
    const shortestBook = sortedByPages[0] ? { title: sortedByPages[0].title, pages: sortedByPages[0].pageCount || 0 } : null
    const longestBook = sortedByPages[sortedByPages.length - 1]
        ? { title: sortedByPages[sortedByPages.length - 1].title, pages: sortedByPages[sortedByPages.length - 1].pageCount || 0 }
        : null

    return { ranges, averagePages, shortestBook, longestBook }
}

// ==========================================
// En Hızlı/Yavaş Okunan Kitaplar
// ==========================================

export interface ReadingSpeed {
    fastest: { title: string; author: string | null; days: number; pagesPerDay: number }[]
    slowest: { title: string; author: string | null; days: number; pagesPerDay: number }[]
}

export async function getReadingSpeed(): Promise<ReadingSpeed | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const books = await prisma.book.findMany({
        where: {
            userId: user.id,
            status: 'COMPLETED',
            startDate: { not: null },
            endDate: { not: null },
            pageCount: { gt: 0 }
        },
        include: { author: { select: { name: true } } }
    })

    const booksWithSpeed = books.map(book => {
        const days = Math.max(1, Math.ceil(
            (new Date(book.endDate!).getTime() - new Date(book.startDate!).getTime()) / (1000 * 60 * 60 * 24)
        ))
        return {
            title: book.title,
            author: book.author?.name || null,
            days,
            pagesPerDay: Math.round((book.pageCount || 0) / days)
        }
    }).sort((a, b) => b.pagesPerDay - a.pagesPerDay)

    return {
        fastest: booksWithSpeed.slice(0, 5),
        slowest: booksWithSpeed.slice(-5).reverse()
    }
}

// ==========================================
// Achievements / Rozetler
// ==========================================

export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    earned: boolean
    progress: number // 0-100
    earnedDate?: string
}

export async function getAchievements(): Promise<Achievement[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const userId = user.id

    // Verileri çek
    const [books, authors, streakData, quotes, ratings] = await Promise.all([
        prisma.book.findMany({ where: { userId } }),
        prisma.book.findMany({
            where: { userId, status: 'COMPLETED' },
            select: { authorId: true }
        }),
        getStreakData(),
        prisma.quote.count({ where: { book: { userId } } }),
        prisma.bookRating.count({ where: { book: { userId } } })
    ])

    const completedBooks = books.filter(b => b.status === 'COMPLETED').length
    const totalBooks = books.length
    const uniqueAuthors = new Set(authors.map(a => a.authorId).filter(Boolean)).size
    const currentStreak = streakData?.currentStreak || 0
    const longestStreak = streakData?.longestStreak || 0
    const booksInLibrary = books.filter(b => b.inLibrary).length

    const achievements: Achievement[] = [
        {
            id: 'first_book',
            name: 'İlk Adım',
            description: 'İlk kitabını tamamla',
            icon: '📖',
            earned: completedBooks >= 1,
            progress: Math.min(completedBooks / 1 * 100, 100)
        },
        {
            id: 'bookworm_10',
            name: 'Kitap Kurdu',
            description: '10 kitap tamamla',
            icon: '🐛',
            earned: completedBooks >= 10,
            progress: Math.min(completedBooks / 10 * 100, 100)
        },
        {
            id: 'bookworm_50',
            name: 'Kütüphaneci',
            description: '50 kitap tamamla',
            icon: '📚',
            earned: completedBooks >= 50,
            progress: Math.min(completedBooks / 50 * 100, 100)
        },
        {
            id: 'bookworm_100',
            name: 'Edebiyat Ustası',
            description: '100 kitap tamamla',
            icon: '🏆',
            earned: completedBooks >= 100,
            progress: Math.min(completedBooks / 100 * 100, 100)
        },
        {
            id: 'streak_7',
            name: 'Haftalık Seri',
            description: '7 gün üst üste oku',
            icon: '🔥',
            earned: longestStreak >= 7,
            progress: Math.min(longestStreak / 7 * 100, 100)
        },
        {
            id: 'streak_30',
            name: 'Aylık Seri',
            description: '30 gün üst üste oku',
            icon: '💪',
            earned: longestStreak >= 30,
            progress: Math.min(longestStreak / 30 * 100, 100)
        },
        {
            id: 'diversity_10',
            name: 'Çeşitlilik',
            description: '10 farklı yazardan kitap oku',
            icon: '🌈',
            earned: uniqueAuthors >= 10,
            progress: Math.min(uniqueAuthors / 10 * 100, 100)
        },
        {
            id: 'quote_master',
            name: 'Alıntı Ustası',
            description: '50 alıntı kaydet',
            icon: '✨',
            earned: quotes >= 50,
            progress: Math.min(quotes / 50 * 100, 100)
        },
        {
            id: 'critic',
            name: 'Eleştirmen',
            description: '20 kitabı puanla',
            icon: '⭐',
            earned: ratings >= 20,
            progress: Math.min(ratings / 20 * 100, 100)
        },
        {
            id: 'collector',
            name: 'Koleksiyoncu',
            description: 'Kütüphanende 25 kitap olsun',
            icon: '🏠',
            earned: booksInLibrary >= 25,
            progress: Math.min(booksInLibrary / 25 * 100, 100)
        },
        {
            id: 'hoarder',
            name: 'Kitap Biriktirici',
            description: '100 kitap ekle',
            icon: '📦',
            earned: totalBooks >= 100,
            progress: Math.min(totalBooks / 100 * 100, 100)
        },
        {
            id: 'active_reader',
            name: 'Aktif Okuyucu',
            description: 'Şu an bir kitap okuyor ol',
            icon: '👀',
            earned: books.some(b => b.status === 'READING'),
            progress: books.some(b => b.status === 'READING') ? 100 : 0
        }
    ]

    return achievements.sort((a, b) => {
        // Kazanılanlar önce, sonra progress'e göre
        if (a.earned && !b.earned) return -1
        if (!a.earned && b.earned) return 1
        return b.progress - a.progress
    })
}

// ==========================================
// Kütüphane Değeri
// ==========================================

export interface LibraryValue {
    totalBooksInLibrary: number
    totalBooks: number
    estimatedValue: number // TL cinsinden
    averageBookPrice: number
    oldestBook: { title: string; addedDate: string } | null
    newestBook: { title: string; addedDate: string } | null
}

export async function getLibraryValue(): Promise<LibraryValue | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const books = await prisma.book.findMany({
        where: { userId: user.id },
        select: { title: true, inLibrary: true, pageCount: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    })

    const booksInLibrary = books.filter(b => b.inLibrary)
    const totalBooksInLibrary = booksInLibrary.length
    const totalBooks = books.length

    // Tahmini değer hesapla (ortalama kitap fiyatı ~80 TL varsayımı)
    const averageBookPrice = 80
    const estimatedValue = totalBooksInLibrary * averageBookPrice

    const oldestBook = books[0] ? {
        title: books[0].title,
        addedDate: books[0].createdAt.toLocaleDateString('tr-TR')
    } : null

    const newestBook = books[books.length - 1] ? {
        title: books[books.length - 1].title,
        addedDate: books[books.length - 1].createdAt.toLocaleDateString('tr-TR')
    } : null

    return {
        totalBooksInLibrary,
        totalBooks,
        estimatedValue,
        averageBookPrice,
        oldestBook,
        newestBook
    }
}

// ==========================================
// Word Cloud Verisi
// ==========================================

export interface WordCloudData {
    words: { text: string; value: number }[]
    totalWords: number
    uniqueWords: number
}

export async function getWordCloudData(): Promise<WordCloudData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Tüm metin içeriklerini çek: alıntılar, notlar, tortu, imza
    const [quotes, notes, books] = await Promise.all([
        prisma.quote.findMany({
            where: { book: { userId: user.id } },
            select: { content: true }
        }),
        prisma.readingNote.findMany({
            where: { book: { userId: user.id } },
            select: { content: true }
        }),
        prisma.book.findMany({
            where: { userId: user.id },
            select: { tortu: true, imza: true }
        })
    ])

    // Tüm metinleri birleştir
    const allText = [
        ...quotes.map(q => q.content),
        ...notes.map(n => n.content),
        ...books.map(b => b.tortu).filter(Boolean),
        ...books.map(b => b.imza).filter(Boolean)
    ].join(' ')

    // Türkçe stop words
    const stopWords = new Set([
        've', 'veya', 'ile', 'için', 'bu', 'bir', 'de', 'da', 'ki', 'ne', 'o', 'ben', 'sen',
        'biz', 'siz', 'onlar', 'ama', 'fakat', 'ancak', 'çünkü', 'eğer', 'gibi', 'kadar',
        'daha', 'en', 'çok', 'az', 'her', 'hiç', 'olan', 'olarak', 'var', 'yok', 'mı', 'mi',
        'mu', 'mü', 'diye', 'şey', 'şeyi', 'tüm', 'bütün', 'hem', 'ya', 'sadece', 'bile',
        'artık', 'hep', 'nasıl', 'neden', 'nerede', 'kim', 'hangi', 'zaten', 'belki'
    ])

    // Kelimeleri say
    const wordCount = new Map<string, number>()
    const words = allText.toLowerCase()
        .replace(/[.,!?;:'"()\[\]{}—–-]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word))

    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // En sık kullanılan 50 kelime
    const sortedWords = Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([text, value]) => ({ text, value }))

    return {
        words: sortedWords,
        totalWords: words.length,
        uniqueWords: wordCount.size
    }
}

// ==========================================
// Tüm Gelişmiş İstatistikler
// ==========================================

export interface ExtendedStatsData {
    yearlyComparison: YearlyComparison | null
    ratingDistribution: RatingDistribution | null
    speedTrend: SpeedTrend | null
    pageDistribution: PageDistribution | null
    readingSpeed: ReadingSpeed | null
    achievements: Achievement[]
    libraryValue: LibraryValue | null
    wordCloud: WordCloudData | null
    streakData: StreakData | null
}

export async function getExtendedStats(): Promise<ExtendedStatsData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [
        yearlyComparison,
        ratingDistribution,
        speedTrend,
        pageDistribution,
        readingSpeed,
        achievements,
        libraryValue,
        wordCloud,
        streakData
    ] = await Promise.all([
        getYearlyComparison(),
        getRatingDistribution(),
        getSpeedTrend(),
        getPageDistribution(),
        getReadingSpeed(),
        getAchievements(),
        getLibraryValue(),
        getWordCloudData(),
        getStreakData()
    ])

    return {
        yearlyComparison,
        ratingDistribution,
        speedTrend,
        pageDistribution,
        readingSpeed,
        achievements,
        libraryValue,
        wordCloud,
        streakData
    }
}
