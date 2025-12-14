"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ChallengeBookStatus, ChallengeBookRole } from "@prisma/client"

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

        // UserChallengeProgress oluştur
        const userProgress = await prisma.userChallengeProgress.create({
            data: {
                userId: user.id,
                challengeId,
                books: {
                    create: challenge.months.flatMap(month =>
                        month.books.map(book => ({
                            challengeBookId: book.id,
                            // MAIN kitaplar NOT_STARTED, BONUS kitaplar LOCKED
                            status: book.role === "MAIN" ? "NOT_STARTED" : "LOCKED"
                        }))
                    )
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
                        books: true
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
                    takeaway: userBook?.takeaway || null
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
                        books: true
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

        const mainStatus = mainBook ? userBooksMap.get(mainBook.id)?.status || "NOT_STARTED" : null
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
                    coverUrl: mainBook.coverUrl,
                    pageCount: mainBook.pageCount,
                    reason: mainBook.reason,
                    status: mainStatus
                } : null,
                bonusBooks: bonusBooks.map(book => ({
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                    pageCount: book.pageCount,
                    reason: book.reason,
                    status: userBooksMap.get(book.id)?.status || "LOCKED"
                })),
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
                        books: true
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
                        takeaway: userBook?.takeaway || null
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
