"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { ActivityType } from "@prisma/client"

// ==========================================
// Tarih yardımcı fonksiyonları
// ==========================================

function getStartOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

function getEndOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Pazartesi başlangıç
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getStartOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1)
}

// ==========================================
// Temel istatistik fonksiyonları
// ==========================================

export async function getDailyStats(date?: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const targetDate = date || new Date()
    const startOfDay = getStartOfDay(targetDate)
    const endOfDay = getEndOfDay(targetDate)

    try {
        const [aggregate, sessions] = await Promise.all([
            prisma.timerSession.aggregate({
                where: {
                    userId: user.id,
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay,
                    }
                },
                _sum: { durationSeconds: true },
                _count: true,
            }),
            prisma.timerSession.findMany({
                where: {
                    userId: user.id,
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay,
                    }
                },
                include: {
                    book: {
                        select: { id: true, title: true, coverUrl: true }
                    }
                },
                orderBy: { startTime: 'desc' },
            })
        ])

        return {
            totalSeconds: aggregate._sum.durationSeconds || 0,
            sessionCount: aggregate._count,
            sessions,
            date: targetDate,
        }
    } catch (error) {
        console.error("Günlük istatistikler getirilemedi:", error)
        return null
    }
}

export async function getWeeklyStats(date?: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const targetDate = date || new Date()
    const startOfWeek = getStartOfWeek(targetDate)
    const endOfDay = getEndOfDay(targetDate)

    try {
        // Haftalık toplam
        const aggregate = await prisma.timerSession.aggregate({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfWeek,
                    lte: endOfDay,
                }
            },
            _sum: { durationSeconds: true },
            _count: true,
        })

        // Günlük dağılım
        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfWeek,
                    lte: endOfDay,
                }
            },
            select: {
                startTime: true,
                durationSeconds: true,
            },
            orderBy: { startTime: 'asc' },
        })

        // Günlere göre grupla
        const dailyData: { [key: string]: number } = {}
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

        sessions.forEach(session => {
            const dayKey = dayNames[new Date(session.startTime).getDay()]
            dailyData[dayKey] = (dailyData[dayKey] || 0) + session.durationSeconds
        })

        return {
            totalSeconds: aggregate._sum.durationSeconds || 0,
            sessionCount: aggregate._count,
            dailyData,
            startOfWeek,
        }
    } catch (error) {
        console.error("Haftalık istatistikler getirilemedi:", error)
        return null
    }
}

export async function getMonthlyStats(date?: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const targetDate = date || new Date()
    const startOfMonth = getStartOfMonth(targetDate)
    const endOfDay = getEndOfDay(targetDate)

    try {
        const aggregate = await prisma.timerSession.aggregate({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfMonth,
                    lte: endOfDay,
                }
            },
            _sum: { durationSeconds: true },
            _count: true,
        })

        // Günlük dağılım (heatmap için)
        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfMonth,
                    lte: endOfDay,
                }
            },
            select: {
                startTime: true,
                durationSeconds: true,
            },
            orderBy: { startTime: 'asc' },
        })

        // Günlere göre grupla
        const dailyData: { [key: string]: number } = {}
        sessions.forEach(session => {
            const dateKey = new Date(session.startTime).toISOString().split('T')[0]
            dailyData[dateKey] = (dailyData[dateKey] || 0) + session.durationSeconds
        })

        return {
            totalSeconds: aggregate._sum.durationSeconds || 0,
            sessionCount: aggregate._count,
            dailyData,
            month: targetDate.getMonth() + 1,
            year: targetDate.getFullYear(),
        }
    } catch (error) {
        console.error("Aylık istatistikler getirilemedi:", error)
        return null
    }
}

export async function getYearlyStats(year?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const targetYear = year || new Date().getFullYear()
    const startOfYear = new Date(targetYear, 0, 1)
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999)

    try {
        const aggregate = await prisma.timerSession.aggregate({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfYear,
                    lte: endOfYear,
                }
            },
            _sum: { durationSeconds: true },
            _count: true,
        })

        // Aylık dağılım
        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                startTime: {
                    gte: startOfYear,
                    lte: endOfYear,
                }
            },
            select: {
                startTime: true,
                durationSeconds: true,
            },
            orderBy: { startTime: 'asc' },
        })

        // Aylara göre grupla
        const monthlyData: { [key: number]: number } = {}
        sessions.forEach(session => {
            const month = new Date(session.startTime).getMonth() + 1
            monthlyData[month] = (monthlyData[month] || 0) + session.durationSeconds
        })

        return {
            totalSeconds: aggregate._sum.durationSeconds || 0,
            sessionCount: aggregate._count,
            monthlyData,
            year: targetYear,
        }
    } catch (error) {
        console.error("Yıllık istatistikler getirilemedi:", error)
        return null
    }
}

// ==========================================
// Aktivite bazlı istatistikler
// ==========================================

export async function getActivityBreakdown(startDate?: Date, endDate?: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const result = await prisma.timerSession.groupBy({
            by: ['activityType'],
            where: {
                userId: user.id,
                ...(startDate || endDate ? {
                    startTime: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate }),
                    }
                } : {}),
            },
            _sum: { durationSeconds: true },
            _count: true,
        })

        const breakdown = result.map(item => ({
            activityType: item.activityType,
            totalSeconds: item._sum.durationSeconds || 0,
            sessionCount: item._count,
        }))

        const totalSeconds = breakdown.reduce((sum, item) => sum + item.totalSeconds, 0)

        return {
            breakdown,
            totalSeconds,
        }
    } catch (error) {
        console.error("Aktivite dağılımı getirilemedi:", error)
        return null
    }
}

// ==========================================
// Kitap bazlı istatistikler
// ==========================================

export async function getBookTimeStats(limit?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const result = await prisma.timerSession.groupBy({
            by: ['bookId'],
            where: {
                userId: user.id,
                bookId: { not: null },
            },
            _sum: { durationSeconds: true },
            _count: true,
            orderBy: {
                _sum: { durationSeconds: 'desc' }
            },
            ...(limit && { take: limit }),
        })

        // Kitap bilgilerini getir
        const bookIds = result.map(r => r.bookId).filter((id): id is string => id !== null)
        const books = await prisma.book.findMany({
            where: { id: { in: bookIds } },
            select: {
                id: true,
                title: true,
                coverUrl: true,
                author: { select: { name: true } }
            }
        })

        const bookMap = new Map(books.map(b => [b.id, b]))

        return result.map(item => ({
            book: item.bookId ? bookMap.get(item.bookId) : null,
            totalSeconds: item._sum.durationSeconds || 0,
            sessionCount: item._count,
        }))
    } catch (error) {
        console.error("Kitap süre istatistikleri getirilemedi:", error)
        return []
    }
}

// ==========================================
// Genel istatistikler
// ==========================================

export async function getTotalStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const aggregate = await prisma.timerSession.aggregate({
            where: { userId: user.id },
            _sum: { durationSeconds: true },
            _count: true,
            _avg: { durationSeconds: true },
            _max: { durationSeconds: true },
        })

        return {
            totalSeconds: aggregate._sum.durationSeconds || 0,
            sessionCount: aggregate._count,
            averageSessionSeconds: Math.round(aggregate._avg.durationSeconds || 0),
            longestSessionSeconds: aggregate._max.durationSeconds || 0,
        }
    } catch (error) {
        console.error("Toplam istatistikler getirilemedi:", error)
        return null
    }
}

// ==========================================
// Streak (seri) hesaplama
// ==========================================

export async function getStreakData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Son 365 günün oturumlarını getir
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 365)

        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                startTime: { gte: startDate },
            },
            select: { startTime: true },
            orderBy: { startTime: 'desc' },
        })

        // Benzersiz günleri bul
        const activeDays = new Set(
            sessions.map(s => new Date(s.startTime).toISOString().split('T')[0])
        )

        // Mevcut seri hesapla
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Bugünden geriye doğru kontrol et
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today)
            checkDate.setDate(checkDate.getDate() - i)
            const dateStr = checkDate.toISOString().split('T')[0]

            if (activeDays.has(dateStr)) {
                tempStreak++
                if (i === 0 || currentStreak > 0) {
                    currentStreak = tempStreak
                }
            } else {
                if (i === 0) {
                    // Bugün yoksa, dünden başla
                    currentStreak = 0
                } else if (currentStreak > 0 && i > 1) {
                    // Seri kırıldı
                    break
                }
                longestStreak = Math.max(longestStreak, tempStreak)
                tempStreak = 0
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak)

        return {
            currentStreak,
            longestStreak,
            totalActiveDays: activeDays.size,
            activeDays: Array.from(activeDays),
        }
    } catch (error) {
        console.error("Seri verisi getirilemedi:", error)
        return null
    }
}

// ==========================================
// Dashboard özet istatistikleri
// ==========================================

export async function getDashboardTimerStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const today = new Date()
    const startOfToday = getStartOfDay(today)
    const startOfWeek = getStartOfWeek(today)
    const startOfMonth = getStartOfMonth(today)

    try {
        const [todayStats, weekStats, monthStats, streak] = await Promise.all([
            prisma.timerSession.aggregate({
                where: {
                    userId: user.id,
                    startTime: { gte: startOfToday },
                },
                _sum: { durationSeconds: true },
                _count: true,
            }),
            prisma.timerSession.aggregate({
                where: {
                    userId: user.id,
                    startTime: { gte: startOfWeek },
                },
                _sum: { durationSeconds: true },
                _count: true,
            }),
            prisma.timerSession.aggregate({
                where: {
                    userId: user.id,
                    startTime: { gte: startOfMonth },
                },
                _sum: { durationSeconds: true },
                _count: true,
            }),
            getStreakData(),
        ])

        return {
            today: {
                totalSeconds: todayStats._sum.durationSeconds || 0,
                sessionCount: todayStats._count,
            },
            week: {
                totalSeconds: weekStats._sum.durationSeconds || 0,
                sessionCount: weekStats._count,
            },
            month: {
                totalSeconds: monthStats._sum.durationSeconds || 0,
                sessionCount: monthStats._count,
            },
            streak: streak ? {
                current: streak.currentStreak,
                longest: streak.longestStreak,
            } : null,
        }
    } catch (error) {
        console.error("Dashboard timer istatistikleri getirilemedi:", error)
        return null
    }
}
