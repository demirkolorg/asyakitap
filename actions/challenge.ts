"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { ChallengeBookStatus, ChallengeBookRole, BookStatus } from "@prisma/client"
import { CACHE_TAGS } from "@/lib/cache"
import { scrapeKitapyurdu } from "./kitapyurdu"
import { getNowInTurkey, TIMEZONE } from "@/lib/utils"

// ==========================================
// Types
// ==========================================

export interface ChallengeBook {
    id: string
    bookId: string
    role: ChallengeBookRole
    reason: string | null
    sortOrder: number
    book: {
        id: string
        title: string
        coverUrl: string | null
        pageCount: number | null
        inLibrary: boolean
        status: BookStatus
        author: { id: string; name: string } | null
        publisher: { id: string; name: string } | null
    }
    userStatus?: ChallengeBookStatus
    completedAt?: Date | null
    takeaway?: string | null
}

export interface ChallengeMonth {
    id: string
    monthNumber: number
    monthName: string
    theme: string
    themeIcon: string | null
    books: ChallengeBook[]
    progress?: {
        total: number
        completed: number
        percentage: number
    }
    isMainCompleted?: boolean
}

export interface ChallengeDetail {
    id: string
    year: number
    name: string
    description: string | null
    strategy: string
    isActive: boolean
    months: ChallengeMonth[]
    totalProgress?: {
        totalBooks: number
        completedBooks: number
        percentage: number
        mainCompleted: number
        bonusCompleted: number
    }
}

export interface ChallengeSummary {
    id: string
    year: number
    name: string
    description: string | null
    isActive: boolean
    monthCount: number
    totalBooks: number
}

// Legacy type aliases for backward compatibility
export type ChallengeOverview = ChallengeDetail
export type ChallengeMonthWithBooks = ChallengeMonth

export interface ChallengeTimeline {
    challenges: ChallengeDetail[]
    currentPeriod: {
        year: number
        month: number
        isWarmupPeriod: boolean
    }
}

// ==========================================
// READ Operations
// ==========================================

// Get all challenges summary
export async function getChallengesSummary(): Promise<ChallengeSummary[]> {
    try {
        const challenges = await prisma.readingChallenge.findMany({
            orderBy: { year: "desc" },
            include: {
                months: {
                    include: {
                        _count: {
                            select: { books: true }
                        }
                    }
                }
            }
        })

        return challenges.map(challenge => {
            const totalBooks = challenge.months.reduce((sum, month) => sum + month._count.books, 0)

            return {
                id: challenge.id,
                year: challenge.year,
                name: challenge.name,
                description: challenge.description,
                isActive: challenge.isActive,
                monthCount: challenge.months.length,
                totalBooks
            }
        })
    } catch (error) {
        console.error("Failed to fetch challenges summary:", error)
        return []
    }
}

// Get challenge detail (for admin - without user progress)
// Alias for backward compatibility
export const getChallengeDetails = getChallengeWithProgress

export async function getChallengeDetail(year: number): Promise<ChallengeDetail | null> {
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
                            ],
                            include: {
                                book: {
                                    select: {
                                        id: true,
                                        title: true,
                                        coverUrl: true,
                                        pageCount: true,
                                        inLibrary: true,
                                        status: true,
                                        author: { select: { id: true, name: true } },
                                        publisher: { select: { id: true, name: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!challenge) return null

        const months: ChallengeMonth[] = challenge.months.map(month => ({
            id: month.id,
            monthNumber: month.monthNumber,
            monthName: month.monthName,
            theme: month.theme,
            themeIcon: month.themeIcon,
            books: month.books.map(cb => ({
                id: cb.id,
                bookId: cb.bookId,
                role: cb.role,
                reason: cb.reason,
                sortOrder: cb.sortOrder,
                book: {
                    id: cb.book.id,
                    title: cb.book.title,
                    coverUrl: cb.book.coverUrl,
                    pageCount: cb.book.pageCount,
                    inLibrary: cb.book.inLibrary,
                    status: cb.book.status,
                    author: cb.book.author,
                    publisher: cb.book.publisher
                }
            }))
        }))

        return {
            id: challenge.id,
            year: challenge.year,
            name: challenge.name,
            description: challenge.description,
            strategy: challenge.strategy,
            isActive: challenge.isActive,
            months
        }
    } catch (error) {
        console.error("Failed to fetch challenge detail:", error)
        return null
    }
}

// Get challenge with user progress (for user view)
export async function getChallengeWithProgress(year: number): Promise<ChallengeDetail | null> {
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
                                { role: "asc" },
                                { sortOrder: "asc" }
                            ],
                            include: {
                                book: {
                                    include: {
                                        author: { select: { id: true, name: true } },
                                        publisher: { select: { id: true, name: true } }
                                    }
                                }
                            }
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

        // İlerleme sadece MAIN kitaplara göre hesaplanır (bonus kitaplar sayılmaz)
        let totalMainBooks = 0
        let mainCompleted = 0
        let bonusCompleted = 0

        const months: ChallengeMonth[] = challenge.months.map(month => {
            let monthMainCompleted = 0
            let monthMainTotal = 0
            let isMainCompleted = false

            const books = month.books.map(cb => {
                const userBook = userBooksMap.get(cb.id)

                // Kitabın gerçek durumunu kullan
                const bookStatus = cb.book.status
                const isCompleted = bookStatus === "COMPLETED"

                if (cb.role === "MAIN") {
                    totalMainBooks++
                    monthMainTotal++
                    if (isCompleted) {
                        mainCompleted++
                        monthMainCompleted++
                        isMainCompleted = true
                    }
                } else if (isCompleted) {
                    bonusCompleted++
                }

                // userStatus'u book.status'tan türet
                let userStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED"
                if (bookStatus === "COMPLETED") userStatus = "COMPLETED"
                else if (bookStatus === "READING") userStatus = "IN_PROGRESS"

                return {
                    id: cb.id,
                    bookId: cb.bookId,
                    role: cb.role,
                    reason: cb.reason,
                    sortOrder: cb.sortOrder,
                    book: {
                        id: cb.book.id,
                        title: cb.book.title,
                        coverUrl: cb.book.coverUrl,
                        pageCount: cb.book.pageCount,
                        inLibrary: cb.book.inLibrary,
                        status: cb.book.status,
                        author: cb.book.author,
                        publisher: cb.book.publisher
                    },
                    userStatus,
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
                    total: monthMainTotal, // Sadece ana hedefler
                    completed: monthMainCompleted,
                    percentage: monthMainTotal > 0 ? Math.round((monthMainCompleted / monthMainTotal) * 100) : 0
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
            isActive: challenge.isActive,
            months,
            totalProgress: {
                totalBooks: totalMainBooks, // Sadece ana hedefler
                completedBooks: mainCompleted,
                percentage: totalMainBooks > 0 ? Math.round((mainCompleted / totalMainBooks) * 100) : 0,
                mainCompleted,
                bonusCompleted
            }
        }
    } catch (error) {
        console.error("Failed to fetch challenge with progress:", error)
        return null
    }
}

// Get active challenge for dashboard widget
export async function getActiveChallenge() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const now = getNowInTurkey()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // Find active challenge for current year
        const challenge = await prisma.readingChallenge.findFirst({
            where: {
                year: currentYear,
                isActive: true
            },
            include: {
                months: {
                    where: { monthNumber: currentMonth },
                    include: {
                        books: {
                            orderBy: [
                                { role: "asc" },
                                { sortOrder: "asc" }
                            ],
                            include: {
                                book: {
                                    include: {
                                        author: { select: { name: true } }
                                    }
                                }
                            }
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

        const mainBooks = currentMonthData.books.filter(b => b.role === "MAIN")
        const bonusBooks = currentMonthData.books.filter(b => b.role === "BONUS")

        // Tüm ana kitapların tamamlanıp tamamlanmadığını kontrol et
        const mainCompletedCount = mainBooks.filter(b => b.book.status === "COMPLETED").length
        const isAllMainCompleted = mainBooks.length > 0 && mainCompletedCount === mainBooks.length

        return {
            challengeId: challenge.id,
            year: challenge.year,
            name: challenge.name,
            hasJoined: !!userProgress,
            currentMonth: {
                monthNumber: currentMonthData.monthNumber,
                monthName: currentMonthData.monthName,
                theme: currentMonthData.theme,
                themeIcon: currentMonthData.themeIcon,
                mainBooks: mainBooks.map(book => ({
                    id: book.id,
                    title: book.book.title,
                    author: book.book.author?.name || "Bilinmeyen Yazar",
                    coverUrl: book.book.coverUrl,
                    pageCount: book.book.pageCount,
                    reason: book.reason,
                    bookStatus: book.book.status
                })),
                bonusBooks: bonusBooks.map(book => {
                    return {
                        id: book.id,
                        title: book.book.title,
                        author: book.book.author?.name || "Bilinmeyen Yazar",
                        coverUrl: book.book.coverUrl,
                        pageCount: book.book.pageCount,
                        reason: book.reason,
                        bookStatus: book.book.status,
                        isLocked: !isAllMainCompleted // Tüm ana kitaplar tamamlanmadıysa kilitli
                    }
                }),
                mainCompletedCount,
                mainTotalCount: mainBooks.length,
                isAllMainCompleted
            }
        }
    } catch (error) {
        console.error("Get active challenge error:", error)
        return null
    }
}

// ==========================================
// CREATE Operations
// ==========================================

// Create a new challenge
export async function createChallenge(data: {
    year: number
    name: string
    description?: string
    strategy?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if year exists
        const existing = await prisma.readingChallenge.findUnique({
            where: { year: data.year }
        })
        if (existing) {
            return { success: false, error: "Bu yıl için zaten bir hedef var" }
        }

        const challenge = await prisma.readingChallenge.create({
            data: {
                year: data.year,
                name: data.name,
                description: data.description || null,
                strategy: data.strategy || "1_MAIN_2_BONUS",
                isActive: true
            }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, challenge }
    } catch (error) {
        console.error("Failed to create challenge:", error)
        return { success: false, error: "Hedef oluşturulamadı" }
    }
}

// Create a month in challenge
export async function createChallengeMonth(data: {
    challengeId: string
    monthNumber: number
    monthName: string
    theme: string
    themeIcon?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if month exists
        const existing = await prisma.challengeMonth.findUnique({
            where: {
                challengeId_monthNumber: {
                    challengeId: data.challengeId,
                    monthNumber: data.monthNumber
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu ay zaten mevcut" }
        }

        const month = await prisma.challengeMonth.create({
            data: {
                challengeId: data.challengeId,
                monthNumber: data.monthNumber,
                monthName: data.monthName,
                theme: data.theme,
                themeIcon: data.themeIcon || null
            }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, month }
    } catch (error) {
        console.error("Failed to create challenge month:", error)
        return { success: false, error: "Ay oluşturulamadı" }
    }
}

// Add book to challenge month
export async function addBookToChallenge(data: {
    monthId: string
    bookId: string
    role: ChallengeBookRole
    reason?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if book already exists in this month
        const existing = await prisma.challengeBook.findUnique({
            where: {
                monthId_bookId: {
                    monthId: data.monthId,
                    bookId: data.bookId
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu ayda mevcut" }
        }

        const maxOrder = await prisma.challengeBook.aggregate({
            where: { monthId: data.monthId },
            _max: { sortOrder: true }
        })

        const challengeBook = await prisma.challengeBook.create({
            data: {
                monthId: data.monthId,
                bookId: data.bookId,
                role: data.role,
                reason: data.reason || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, challengeBook }
    } catch (error) {
        console.error("Failed to add book to challenge:", error)
        return { success: false, error: "Kitap eklenemedi" }
    }
}

// ==========================================
// UPDATE Operations
// ==========================================

// Update challenge
export async function updateChallenge(id: string, data: {
    name?: string
    description?: string
    strategy?: string
    isActive?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        const challenge = await prisma.readingChallenge.update({
            where: { id },
            data
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, challenge }
    } catch (error) {
        console.error("Failed to update challenge:", error)
        return { success: false, error: "Hedef güncellenemedi" }
    }
}

// Update challenge month
export async function updateChallengeMonth(id: string, data: {
    theme?: string
    themeIcon?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        const month = await prisma.challengeMonth.update({
            where: { id },
            data
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, month }
    } catch (error) {
        console.error("Failed to update challenge month:", error)
        return { success: false, error: "Ay güncellenemedi" }
    }
}

// Update challenge book
export async function updateChallengeBook(id: string, data: {
    role?: ChallengeBookRole
    reason?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        const book = await prisma.challengeBook.update({
            where: { id },
            data
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true, book }
    } catch (error) {
        console.error("Failed to update challenge book:", error)
        return { success: false, error: "Kitap güncellenemedi" }
    }
}

// Reorder books in month
export async function reorderChallengeBooks(monthId: string, bookIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.$transaction(
            bookIds.map((id, index) =>
                prisma.challengeBook.update({
                    where: { id },
                    data: { sortOrder: index }
                })
            )
        )

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder challenge books:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// ==========================================
// DELETE Operations
// ==========================================

// Delete challenge
export async function deleteChallenge(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.readingChallenge.delete({
            where: { id }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete challenge:", error)
        return { success: false, error: "Hedef silinemedi" }
    }
}

// Delete challenge month
export async function deleteChallengeMonth(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.challengeMonth.delete({
            where: { id }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete challenge month:", error)
        return { success: false, error: "Ay silinemedi" }
    }
}

// Remove book from challenge
export async function removeBookFromChallenge(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.challengeBook.delete({
            where: { id }
        })

        revalidatePath("/challenges")
        revalidatePath("/admin/challenges")
        return { success: true }
    } catch (error) {
        console.error("Failed to remove book from challenge:", error)
        return { success: false, error: "Kitap kaldırılamadı" }
    }
}

// ==========================================
// User Progress Operations
// ==========================================

// Join challenge
export async function joinChallenge(challengeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Check if already joined
        const existing = await prisma.userChallengeProgress.findUnique({
            where: {
                userId_challengeId: {
                    userId: user.id,
                    challengeId
                }
            }
        })

        if (existing) {
            return { success: true, message: "Zaten bu hedeffe katılmışsınız" }
        }

        // Get all challenge books
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
            return { success: false, error: "Hedef bulunamadı" }
        }

        const allChallengeBooks = challenge.months.flatMap(month =>
            month.books.map(book => ({
                id: book.id,
                role: book.role
            }))
        )

        // Create user progress
        const userProgress = await prisma.userChallengeProgress.create({
            data: {
                userId: user.id,
                challengeId,
                books: {
                    create: allChallengeBooks.map(book => ({
                        challengeBookId: book.id,
                        status: book.role === "MAIN" ? "NOT_STARTED" : "LOCKED"
                    }))
                }
            }
        })

        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return {
            success: true,
            progressId: userProgress.id
        }
    } catch (error) {
        console.error("Join challenge error:", error)
        return { success: false, error: "Hedefe katılırken hata oluştu" }
    }
}

// Mark book as completed
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

        // Mark as completed
        await prisma.userChallengeBook.update({
            where: { id: userBook.id },
            data: {
                status: "COMPLETED",
                completedAt: getNowInTurkey(),
                takeaway: takeaway || null
            }
        })

        // If this was MAIN book, unlock BONUS books
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

// Update book status
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
            updateData.startedAt = getNowInTurkey()
        }

        if (status === "COMPLETED") {
            updateData.completedAt = getNowInTurkey()
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

// Update takeaway
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

// Get challenge timeline (all years)
export async function getChallengeTimeline(): Promise<ChallengeTimeline | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const now = getNowInTurkey()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const challenges = await prisma.readingChallenge.findMany({
            where: { isActive: true },
            orderBy: { year: "desc" },
            include: {
                months: {
                    orderBy: { monthNumber: "asc" },
                    include: {
                        books: {
                            orderBy: [
                                { role: "asc" },
                                { sortOrder: "asc" }
                            ],
                            include: {
                                book: {
                                    select: {
                                        id: true,
                                        title: true,
                                        coverUrl: true,
                                        pageCount: true,
                                        inLibrary: true,
                                        status: true,
                                        author: { select: { id: true, name: true } },
                                        publisher: { select: { id: true, name: true } }
                                    }
                                }
                            }
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

        const challengeDetails: ChallengeDetail[] = challenges.map(challenge => {
            const userProgress = challenge.userProgress[0]
            const userBooksMap = new Map(
                userProgress?.books.map(b => [b.challengeBookId, b]) || []
            )

            // İlerleme sadece MAIN kitaplara göre hesaplanır (bonus kitaplar sayılmaz)
            let totalMainBooks = 0
            let mainCompleted = 0
            let bonusCompleted = 0

            const months: ChallengeMonth[] = challenge.months.map(month => {
                let monthMainCompleted = 0
                let monthMainTotal = 0
                let isMainCompleted = false

                const books = month.books.map(cb => {
                    const userBook = userBooksMap.get(cb.id)

                    // Kitabın gerçek durumunu kullan
                    const bookStatus = cb.book.status
                    const isCompleted = bookStatus === "COMPLETED"

                    if (cb.role === "MAIN") {
                        totalMainBooks++
                        monthMainTotal++
                        if (isCompleted) {
                            mainCompleted++
                            monthMainCompleted++
                            isMainCompleted = true
                        }
                    } else if (isCompleted) {
                        bonusCompleted++
                    }

                    // userStatus'u book.status'tan türet
                    let userStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED"
                    if (bookStatus === "COMPLETED") userStatus = "COMPLETED"
                    else if (bookStatus === "READING") userStatus = "IN_PROGRESS"

                    return {
                        id: cb.id,
                        bookId: cb.bookId,
                        role: cb.role,
                        reason: cb.reason,
                        sortOrder: cb.sortOrder,
                        book: {
                            id: cb.book.id,
                            title: cb.book.title,
                            coverUrl: cb.book.coverUrl,
                            pageCount: cb.book.pageCount,
                            inLibrary: cb.book.inLibrary,
                            status: cb.book.status,
                            author: cb.book.author,
                            publisher: cb.book.publisher
                        },
                        userStatus,
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
                        total: monthMainTotal, // Sadece ana hedefler
                        completed: monthMainCompleted,
                        percentage: monthMainTotal > 0 ? Math.round((monthMainCompleted / monthMainTotal) * 100) : 0
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
                isActive: challenge.isActive,
                months,
                totalProgress: {
                    totalBooks: totalMainBooks, // Sadece ana hedefler
                    completedBooks: mainCompleted,
                    percentage: totalMainBooks > 0 ? Math.round((mainCompleted / totalMainBooks) * 100) : 0,
                    mainCompleted,
                    bonusCompleted
                }
            }
        })

        return {
            challenges: challengeDetails,
            currentPeriod: {
                year: currentYear,
                month: currentMonth,
                isWarmupPeriod: false
            }
        }
    } catch (error) {
        console.error("Get challenge timeline error:", error)
        return null
    }
}

// Get all challenges (for admin)
export async function getAllChallenges() {
    try {
        return await prisma.readingChallenge.findMany({
            orderBy: { year: "desc" },
            include: {
                _count: {
                    select: {
                        months: true
                    }
                },
                months: {
                    include: {
                        _count: {
                            select: { books: true }
                        }
                    }
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch all challenges:", error)
        return []
    }
}

// ==========================================
// Kitapyurdu Integration
// ==========================================

// Add book from Kitapyurdu URL to a challenge month
export async function addBookFromKitapyurduToChallenge(data: {
    monthId: string
    kitapyurduUrl: string
    role: ChallengeBookRole
    reason?: string
    inLibrary?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Scrape book data from Kitapyurdu
        const scrapeResult = await scrapeKitapyurdu(data.kitapyurduUrl)
        if (!scrapeResult.success || !scrapeResult.data) {
            return { success: false, error: scrapeResult.error || "Kitap bilgileri alınamadı" }
        }

        const bookData = scrapeResult.data

        // Check if book already exists in DB (by title and author)
        let book = await prisma.book.findFirst({
            where: {
                title: { equals: bookData.title, mode: "insensitive" },
                author: { name: { equals: bookData.author, mode: "insensitive" } }
            }
        })

        if (!book) {
            // Create author if not exists
            let author = await prisma.author.findFirst({
                where: { name: { equals: bookData.author, mode: "insensitive" } }
            })
            if (!author) {
                author = await prisma.author.create({
                    data: {
                        name: bookData.author,
                        imageUrl: bookData.authorImageUrl
                    }
                })
            }

            // Create publisher if not exists
            let publisher = null
            if (bookData.publisher) {
                publisher = await prisma.publisher.findFirst({
                    where: { name: { equals: bookData.publisher, mode: "insensitive" } }
                })
                if (!publisher) {
                    publisher = await prisma.publisher.create({
                        data: {
                            name: bookData.publisher,
                            imageUrl: bookData.publisherImageUrl
                        }
                    })
                }
            }

            // Create the book
            book = await prisma.book.create({
                data: {
                    userId: user.id,
                    title: bookData.title,
                    authorId: author.id,
                    publisherId: publisher?.id,
                    coverUrl: bookData.coverUrl,
                    pageCount: bookData.pageCount,
                    isbn: bookData.isbn,
                    publishedDate: bookData.publishedDate,
                    description: bookData.description,
                    inLibrary: data.inLibrary ?? false,
                    status: "TO_READ"
                }
            })
        }

        // Check if book already exists in this month
        const existing = await prisma.challengeBook.findUnique({
            where: {
                monthId_bookId: {
                    monthId: data.monthId,
                    bookId: book.id
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu ayda mevcut" }
        }

        // Get max sort order
        const maxOrder = await prisma.challengeBook.aggregate({
            where: { monthId: data.monthId },
            _max: { sortOrder: true }
        })

        // Add book to challenge month
        const challengeBook = await prisma.challengeBook.create({
            data: {
                monthId: data.monthId,
                bookId: book.id,
                role: data.role,
                reason: data.reason || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/challenges")
        return { success: true, challengeBook, bookTitle: bookData.title }
    } catch (error) {
        console.error("Failed to add book from Kitapyurdu:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}

// Add book manually to a challenge month (creates Book record first)
export async function addBookManuallyToChallenge(data: {
    monthId: string
    title: string
    author: string
    role: ChallengeBookRole
    pageCount?: number
    coverUrl?: string
    publisher?: string
    reason?: string
    inLibrary?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if book already exists in DB
        let book = await prisma.book.findFirst({
            where: {
                title: { equals: data.title, mode: "insensitive" },
                author: { name: { equals: data.author, mode: "insensitive" } }
            }
        })

        if (!book) {
            // Create author if not exists
            let author = await prisma.author.findFirst({
                where: { name: { equals: data.author, mode: "insensitive" } }
            })
            if (!author) {
                author = await prisma.author.create({
                    data: { name: data.author }
                })
            }

            // Create publisher if provided
            let publisher = null
            if (data.publisher) {
                publisher = await prisma.publisher.findFirst({
                    where: { name: { equals: data.publisher, mode: "insensitive" } }
                })
                if (!publisher) {
                    publisher = await prisma.publisher.create({
                        data: { name: data.publisher }
                    })
                }
            }

            // Create the book
            book = await prisma.book.create({
                data: {
                    userId: user.id,
                    title: data.title,
                    authorId: author.id,
                    publisherId: publisher?.id,
                    coverUrl: data.coverUrl,
                    pageCount: data.pageCount,
                    inLibrary: data.inLibrary ?? false,
                    status: "TO_READ"
                }
            })
        }

        // Check if book already exists in this month
        const existing = await prisma.challengeBook.findUnique({
            where: {
                monthId_bookId: {
                    monthId: data.monthId,
                    bookId: book.id
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu ayda mevcut" }
        }

        // Get max sort order
        const maxOrder = await prisma.challengeBook.aggregate({
            where: { monthId: data.monthId },
            _max: { sortOrder: true }
        })

        // Add book to challenge month
        const challengeBook = await prisma.challengeBook.create({
            data: {
                monthId: data.monthId,
                bookId: book.id,
                role: data.role,
                reason: data.reason || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/challenges")
        return { success: true, challengeBook }
    } catch (error) {
        console.error("Failed to add book manually:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}
