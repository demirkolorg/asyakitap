"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ChallengeBookStatus, ChallengeBookRole } from "@prisma/client"
import { matchBookScore } from "@/lib/string-utils"

// ==========================================
// Types
// ==========================================

export type ChallengeMonthWithBooks = {
    id: string
    monthNumber: number
    monthName: string
    theme: string
    themeIcon: string | null
    books: {
        id: string
        title: string
        author: string
        role: ChallengeBookRole
        pageCount: number | null
        coverUrl: string | null
        reason: string | null
        userStatus: ChallengeBookStatus
        completedAt: Date | null
        takeaway: string | null
        // Hibrit kapak için - kütüphanedeki kitaptan
        linkedBookCoverUrl: string | null
        linkedBookId: string | null // Manuel eşleştirme için
    }[]
    progress: {
        total: number
        completed: number
        percentage: number
    }
    isMainCompleted: boolean
}

export type ChallengeOverview = {
    id: string
    year: number
    name: string
    description: string | null
    strategy: string
    months: ChallengeMonthWithBooks[]
    totalProgress: {
        totalBooks: number
        completedBooks: number
        percentage: number
        mainCompleted: number
        bonusCompleted: number
    }
}

// ==========================================
// Otomatik Kitap Eşleştirme
// Kullanıcının kütüphanesindeki kitapları challenge kitaplarıyla eşleştir
// ==========================================

async function autoMatchBooksForUser(
    userId: string,
    challengeBooks: { id: string; title: string; author: string }[]
): Promise<Map<string, string>> {
    // Kullanıcının tüm kitaplarını al
    const userBooks = await prisma.book.findMany({
        where: { userId },
        include: {
            author: {
                select: { name: true }
            }
        }
    })

    const matches = new Map<string, string>() // challengeBookId -> bookId

    for (const challengeBook of challengeBooks) {
        let bestMatch: { bookId: string; score: number } | null = null

        for (const userBook of userBooks) {
            const authorName = userBook.author?.name || ""
            const score = matchBookScore(
                challengeBook.title,
                challengeBook.author,
                userBook.title,
                authorName
            )

            // %75+ eşleşme yeterli
            if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { bookId: userBook.id, score }
            }
        }

        if (bestMatch) {
            matches.set(challengeBook.id, bestMatch.bookId)
        }
    }

    return matches
}

// ==========================================
// Challenge'a Katıl
// ==========================================

export async function joinChallenge(challengeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Zaten katılmış mı?
        const existing = await prisma.userChallengeProgress.findUnique({
            where: {
                userId_challengeId: {
                    userId: user.id,
                    challengeId
                }
            }
        })

        if (existing) {
            return { success: true, message: "Zaten bu challenge'a katılmışsınız" }
        }

        // Challenge'ın tüm kitaplarını al
        const challenge = await prisma.readingChallenge.findUnique({
            where: { id: challengeId },
            include: {
                months: {
                    include: {
                        books: true
                    }
                }
            }
        })

        if (!challenge) {
            return { success: false, error: "Challenge bulunamadı" }
        }

        // Tüm challenge kitaplarını düz liste olarak al
        const allChallengeBooks = challenge.months.flatMap(month =>
            month.books.map(book => ({
                id: book.id,
                title: book.title,
                author: book.author,
                role: book.role
            }))
        )

        // Otomatik eşleştirme yap
        const bookMatches = await autoMatchBooksForUser(user.id, allChallengeBooks)

        // UserChallengeProgress oluştur
        const userProgress = await prisma.userChallengeProgress.create({
            data: {
                userId: user.id,
                challengeId,
                books: {
                    create: allChallengeBooks.map(book => ({
                        challengeBookId: book.id,
                        // MAIN kitaplar NOT_STARTED, BONUS kitaplar LOCKED
                        status: book.role === "MAIN" ? "NOT_STARTED" : "LOCKED",
                        // Eşleşen kütüphane kitabını bağla
                        linkedBookId: bookMatches.get(book.id) || null
                    }))
                }
            }
        })

        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return { success: true, progressId: userProgress.id }
    } catch (error) {
        console.error("Join challenge error:", error)
        return { success: false, error: "Challenge'a katılırken hata oluştu" }
    }
}

// ==========================================
// Kitabı Okundu İşaretle
// ==========================================

export async function markChallengeBookAsRead(
    challengeBookId: string,
    takeaway?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Kullanıcının bu kitap için kaydını bul
        const userBook = await prisma.userChallengeBook.findFirst({
            where: {
                challengeBookId,
                userProgress: {
                    userId: user.id
                }
            },
            include: {
                challengeBook: {
                    include: {
                        month: {
                            include: {
                                books: true
                            }
                        }
                    }
                },
                userProgress: true
            }
        })

        if (!userBook) {
            return { success: false, error: "Kitap kaydı bulunamadı" }
        }

        if (userBook.status === "LOCKED") {
            return { success: false, error: "Bu kitap henüz kilitli" }
        }

        // Kitabı COMPLETED yap
        await prisma.userChallengeBook.update({
            where: { id: userBook.id },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                takeaway: takeaway || null
            }
        })

        // Eğer bu MAIN kitapsa, aynı aydaki BONUS kitapların kilidini aç
        if (userBook.challengeBook.role === "MAIN") {
            const bonusBooks = userBook.challengeBook.month.books.filter(
                b => b.role === "BONUS"
            )

            for (const bonusBook of bonusBooks) {
                await prisma.userChallengeBook.updateMany({
                    where: {
                        userProgressId: userBook.userProgressId,
                        challengeBookId: bonusBook.id,
                        status: "LOCKED"
                    },
                    data: {
                        status: "NOT_STARTED"
                    }
                })
            }
        }

        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return {
            success: true,
            wasMain: userBook.challengeBook.role === "MAIN",
            message: userBook.challengeBook.role === "MAIN"
                ? "Tebrikler! Bonus kitapların kilidi açıldı!"
                : "Kitap tamamlandı!"
        }
    } catch (error) {
        console.error("Mark book as read error:", error)
        return { success: false, error: "Kitap işaretlenirken hata oluştu" }
    }
}

// ==========================================
// Kitap Durumunu Güncelle
// ==========================================

export async function updateChallengeBookStatus(
    challengeBookId: string,
    status: ChallengeBookStatus
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        const userBook = await prisma.userChallengeBook.findFirst({
            where: {
                challengeBookId,
                userProgress: {
                    userId: user.id
                }
            }
        })

        if (!userBook) {
            return { success: false, error: "Kitap kaydı bulunamadı" }
        }

        if (userBook.status === "LOCKED" && status !== "NOT_STARTED") {
            return { success: false, error: "Kilitli kitap sadece açılabilir" }
        }

        const updateData: {
            status: ChallengeBookStatus
            startedAt?: Date
            completedAt?: Date | null
        } = { status }

        if (status === "IN_PROGRESS" && !userBook.startedAt) {
            updateData.startedAt = new Date()
        }

        if (status === "COMPLETED") {
            updateData.completedAt = new Date()
        } else {
            updateData.completedAt = null
        }

        await prisma.userChallengeBook.update({
            where: { id: userBook.id },
            data: updateData
        })

        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Update book status error:", error)
        return { success: false, error: "Durum güncellenirken hata oluştu" }
    }
}

// ==========================================
// Challenge Detaylarını Getir
// ==========================================

export async function getChallengeDetails(year: number): Promise<ChallengeOverview | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const challenge = await prisma.readingChallenge.findUnique({
            where: { year },
            include: {
                months: {
                    orderBy: { monthNumber: "asc" },
                    include: {
                        books: {
                            orderBy: [
                                { role: "asc" }, // MAIN önce
                                { sortOrder: "asc" }
                            ]
                        }
                    }
                },
                userProgress: {
                    where: { userId: user.id },
                    include: {
                        books: {
                            include: {
                                linkedBook: {
                                    select: { id: true, coverUrl: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!challenge) return null

        const userProgress = challenge.userProgress[0]
        const userBooksMap = new Map(
            userProgress?.books.map(b => [b.challengeBookId, b]) || []
        )

        let totalCompleted = 0
        let mainCompleted = 0
        let bonusCompleted = 0
        let totalBooks = 0

        const months: ChallengeMonthWithBooks[] = challenge.months.map(month => {
            let monthCompleted = 0
            let isMainCompleted = false

            const books = month.books.map(book => {
                totalBooks++
                const userBook = userBooksMap.get(book.id)
                const status = userBook?.status || "NOT_STARTED"

                if (status === "COMPLETED") {
                    totalCompleted++
                    monthCompleted++
                    if (book.role === "MAIN") {
                        mainCompleted++
                        isMainCompleted = true
                    } else {
                        bonusCompleted++
                    }
                }

                return {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    role: book.role,
                    pageCount: book.pageCount,
                    coverUrl: book.coverUrl,
                    reason: book.reason,
                    userStatus: status,
                    completedAt: userBook?.completedAt || null,
                    takeaway: userBook?.takeaway || null,
                    linkedBookCoverUrl: userBook?.linkedBook?.coverUrl || null,
                    linkedBookId: userBook?.linkedBookId || null
                }
            })

            return {
                id: month.id,
                monthNumber: month.monthNumber,
                monthName: month.monthName,
                theme: month.theme,
                themeIcon: month.themeIcon,
                books,
                progress: {
                    total: books.length,
                    completed: monthCompleted,
                    percentage: Math.round((monthCompleted / books.length) * 100)
                },
                isMainCompleted
            }
        })

        return {
            id: challenge.id,
            year: challenge.year,
            name: challenge.name,
            description: challenge.description,
            strategy: challenge.strategy,
            months,
            totalProgress: {
                totalBooks,
                completedBooks: totalCompleted,
                percentage: Math.round((totalCompleted / totalBooks) * 100),
                mainCompleted,
                bonusCompleted
            }
        }
    } catch (error) {
        console.error("Get challenge details error:", error)
        return null
    }
}

// ==========================================
// Aktif Challenge'ı Getir (Dashboard için)
// Akıllı yıl geçişi: Aralık 15-31 arası 2025 Level 0, sonra 2026
// ==========================================

export async function getActiveChallenge() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const now = new Date()
        const currentDay = now.getDate()
        const currentMonth = now.getMonth() + 1 // 1-12
        const currentYear = now.getFullYear()

        // Hangi yıl ve ay için challenge gösterilecek?
        let targetYear: number
        let targetMonth: number
        let isWarmupPeriod = false // Isınma turu mu?

        // 2025 Aralık 15-31 arası: Level 0 (2025 challenge, month 12)
        if (currentYear === 2025 && currentMonth === 12 && currentDay >= 15) {
            targetYear = 2025
            targetMonth = 12
            isWarmupPeriod = true
        }
        // 2026 ve sonrası: Normal takvim
        else if (currentYear >= 2026) {
            targetYear = 2026
            targetMonth = currentMonth
        }
        // 2025'in geri kalanı: Henüz başlamadı, Level 0'ı göster (preview)
        else {
            targetYear = 2025
            targetMonth = 12
            isWarmupPeriod = true
        }

        const challenge = await prisma.readingChallenge.findFirst({
            where: {
                year: targetYear,
                isActive: true
            },
            include: {
                months: {
                    where: { monthNumber: targetMonth },
                    include: {
                        books: {
                            orderBy: [
                                { role: "asc" },
                                { sortOrder: "asc" }
                            ]
                        }
                    }
                },
                userProgress: {
                    where: { userId: user.id },
                    include: {
                        books: {
                            include: {
                                linkedBook: {
                                    select: { id: true, coverUrl: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!challenge || challenge.months.length === 0) return null

        const currentMonthData = challenge.months[0]
        const userProgress = challenge.userProgress[0]
        const userBooksMap = new Map(
            userProgress?.books.map(b => [b.challengeBookId, b]) || []
        )

        const mainBook = currentMonthData.books.find(b => b.role === "MAIN")
        const bonusBooks = currentMonthData.books.filter(b => b.role === "BONUS")

        const mainUserBook = mainBook ? userBooksMap.get(mainBook.id) : null
        const mainStatus = mainUserBook?.status || "NOT_STARTED"
        const isMainCompleted = mainStatus === "COMPLETED"

        return {
            challengeId: challenge.id,
            year: challenge.year,
            name: challenge.name,
            hasJoined: !!userProgress,
            isWarmupPeriod, // Isınma turu etiketi için
            currentMonth: {
                monthNumber: currentMonthData.monthNumber,
                monthName: currentMonthData.monthName,
                theme: currentMonthData.theme,
                themeIcon: currentMonthData.themeIcon,
                mainBook: mainBook ? {
                    id: mainBook.id,
                    title: mainBook.title,
                    author: mainBook.author,
                    coverUrl: mainUserBook?.linkedBook?.coverUrl || mainBook.coverUrl,
                    pageCount: mainBook.pageCount,
                    reason: mainBook.reason,
                    status: mainStatus
                } : null,
                bonusBooks: bonusBooks.map(book => {
                    const userBook = userBooksMap.get(book.id)
                    return {
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        coverUrl: userBook?.linkedBook?.coverUrl || book.coverUrl,
                        pageCount: book.pageCount,
                        reason: book.reason,
                        status: userBook?.status || "LOCKED"
                    }
                }),
                isMainCompleted
            }
        }
    } catch (error) {
        console.error("Get active challenge error:", error)
        return null
    }
}

// ==========================================
// Tüm Timeline'ı Getir (2025 Level 0 + 2026 Tam Yıl)
// ==========================================

export type ChallengeTimeline = {
    challenges: ChallengeOverview[]
    currentPeriod: {
        year: number
        month: number
        isWarmupPeriod: boolean
    }
}

export async function getChallengeTimeline(): Promise<ChallengeTimeline | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const now = new Date()
        const currentDay = now.getDate()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // 2025 ve 2026 challenge'larını al
        const challenges = await prisma.readingChallenge.findMany({
            where: {
                year: { in: [2025, 2026] },
                isActive: true
            },
            orderBy: { year: "asc" },
            include: {
                months: {
                    orderBy: { monthNumber: "asc" },
                    include: {
                        books: {
                            orderBy: [
                                { role: "asc" },
                                { sortOrder: "asc" }
                            ]
                        }
                    }
                },
                userProgress: {
                    where: { userId: user.id },
                    include: {
                        books: {
                            include: {
                                linkedBook: {
                                    select: { id: true, coverUrl: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (challenges.length === 0) return null

        // Her challenge için overview oluştur
        const challengeOverviews: ChallengeOverview[] = challenges.map(challenge => {
            const userProgress = challenge.userProgress[0]
            const userBooksMap = new Map(
                userProgress?.books.map(b => [b.challengeBookId, b]) || []
            )

            let totalCompleted = 0
            let mainCompleted = 0
            let bonusCompleted = 0
            let totalBooks = 0

            const months: ChallengeMonthWithBooks[] = challenge.months.map(month => {
                let monthCompleted = 0
                let isMainCompleted = false

                const books = month.books.map(book => {
                    totalBooks++
                    const userBook = userBooksMap.get(book.id)
                    const status = userBook?.status || "NOT_STARTED"

                    if (status === "COMPLETED") {
                        totalCompleted++
                        monthCompleted++
                        if (book.role === "MAIN") {
                            mainCompleted++
                            isMainCompleted = true
                        } else {
                            bonusCompleted++
                        }
                    }

                    return {
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        role: book.role,
                        pageCount: book.pageCount,
                        coverUrl: book.coverUrl,
                        reason: book.reason,
                        userStatus: status,
                        completedAt: userBook?.completedAt || null,
                        takeaway: userBook?.takeaway || null,
                        linkedBookCoverUrl: userBook?.linkedBook?.coverUrl || null,
                        linkedBookId: userBook?.linkedBookId || null
                    }
                })

                return {
                    id: month.id,
                    monthNumber: month.monthNumber,
                    monthName: month.monthName,
                    theme: month.theme,
                    themeIcon: month.themeIcon,
                    books,
                    progress: {
                        total: books.length,
                        completed: monthCompleted,
                        percentage: books.length > 0 ? Math.round((monthCompleted / books.length) * 100) : 0
                    },
                    isMainCompleted
                }
            })

            return {
                id: challenge.id,
                year: challenge.year,
                name: challenge.name,
                description: challenge.description,
                strategy: challenge.strategy,
                months,
                totalProgress: {
                    totalBooks,
                    completedBooks: totalCompleted,
                    percentage: totalBooks > 0 ? Math.round((totalCompleted / totalBooks) * 100) : 0,
                    mainCompleted,
                    bonusCompleted
                }
            }
        })

        // Şu anki dönem
        let isWarmupPeriod = false
        let targetYear = currentYear
        let targetMonth = currentMonth

        if (currentYear === 2025 && currentMonth === 12 && currentDay >= 15) {
            isWarmupPeriod = true
            targetYear = 2025
            targetMonth = 12
        } else if (currentYear >= 2026) {
            targetYear = 2026
            targetMonth = currentMonth
        } else {
            isWarmupPeriod = true
            targetYear = 2025
            targetMonth = 12
        }

        return {
            challenges: challengeOverviews,
            currentPeriod: {
                year: targetYear,
                month: targetMonth,
                isWarmupPeriod
            }
        }
    } catch (error) {
        console.error("Get challenge timeline error:", error)
        return null
    }
}

// ==========================================
// Manuel Kitap Eşleştirme
// Challenge kitabını kütüphanedeki bir kitapla bağla
// ==========================================

export async function linkChallengeBookToLibrary(
    challengeBookId: string,
    libraryBookId: string | null // null = bağlantıyı kaldır
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Kullanıcının bu challenge kitabı kaydını bul
        const userBook = await prisma.userChallengeBook.findFirst({
            where: {
                challengeBookId,
                userProgress: { userId: user.id }
            }
        })

        if (!userBook) {
            return { success: false, error: "Challenge kitabı bulunamadı" }
        }

        // Eğer bir kitap bağlanacaksa, kullanıcının kitabı olduğunu kontrol et
        if (libraryBookId) {
            const libraryBook = await prisma.book.findFirst({
                where: {
                    id: libraryBookId,
                    userId: user.id
                }
            })

            if (!libraryBook) {
                return { success: false, error: "Kütüphane kitabı bulunamadı" }
            }
        }

        // Güncelle
        await prisma.userChallengeBook.update({
            where: { id: userBook.id },
            data: { linkedBookId: libraryBookId }
        })

        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Link challenge book error:", error)
        return { success: false, error: "Bağlantı oluşturulamadı" }
    }
}

// ==========================================
// Kullanıcının Kütüphane Kitaplarını Getir (Eşleştirme için)
// ==========================================

export async function getUserBooksForLinking() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                title: true,
                coverUrl: true,
                author: {
                    select: { name: true }
                }
            },
            orderBy: { title: 'asc' }
        })

        return books.map(b => ({
            id: b.id,
            title: b.title,
            author: b.author?.name || "",
            coverUrl: b.coverUrl
        }))
    } catch (error) {
        console.error("Get user books error:", error)
        return []
    }
}

// ==========================================
// Takeaway Güncelle
// ==========================================

export async function updateTakeaway(challengeBookId: string, takeaway: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        const userBook = await prisma.userChallengeBook.findFirst({
            where: {
                challengeBookId,
                userProgress: {
                    userId: user.id
                }
            }
        })

        if (!userBook) {
            return { success: false, error: "Kitap kaydı bulunamadı" }
        }

        await prisma.userChallengeBook.update({
            where: { id: userBook.id },
            data: { takeaway }
        })

        revalidatePath("/challenges")

        return { success: true }
    } catch (error) {
        console.error("Update takeaway error:", error)
        return { success: false, error: "Güncelleme başarısız" }
    }
}
