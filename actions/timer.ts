"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ActivityType } from "@prisma/client"

// ==========================================
// Timer Session CRUD İşlemleri
// ==========================================

export async function saveTimerSession(data: {
    activityType: ActivityType
    startTime: Date
    endTime: Date
    durationSeconds: number
    bookId?: string
    title?: string
    pageStart?: number
    pageEnd?: number
    pagesRead?: number
    notes?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Yetkisiz erişim" }
    }

    try {
        const session = await prisma.timerSession.create({
            data: {
                userId: user.id,
                activityType: data.activityType,
                startTime: data.startTime,
                endTime: data.endTime,
                durationSeconds: data.durationSeconds,
                bookId: data.bookId,
                title: data.title,
                pageStart: data.pageStart,
                pageEnd: data.pageEnd,
                pagesRead: data.pagesRead,
                notes: data.notes,
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                    }
                }
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/timer")

        return { success: true, session }
    } catch (error) {
        console.error("Timer oturumu kaydedilemedi:", error)
        return { success: false, error: "Timer oturumu kaydedilemedi" }
    }
}

export async function getTimerSessions(options?: {
    limit?: number
    bookId?: string
    activityType?: ActivityType
    startDate?: Date
    endDate?: Date
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                ...(options?.bookId && { bookId: options.bookId }),
                ...(options?.activityType && { activityType: options.activityType }),
                ...(options?.startDate || options?.endDate ? {
                    startTime: {
                        ...(options?.startDate && { gte: options.startDate }),
                        ...(options?.endDate && { lte: options.endDate }),
                    }
                } : {}),
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        author: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { startTime: 'desc' },
            ...(options?.limit && { take: options.limit }),
        })

        return sessions
    } catch (error) {
        console.error("Timer oturumları getirilemedi:", error)
        return []
    }
}

export async function getTimerSession(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const session = await prisma.timerSession.findFirst({
            where: {
                id,
                userId: user.id,
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        author: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        return session
    } catch (error) {
        console.error("Timer oturumu getirilemedi:", error)
        return null
    }
}

export async function updateTimerSession(id: string, data: {
    title?: string
    notes?: string
    pageStart?: number
    pageEnd?: number
    pagesRead?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Yetkisiz erişim" }
    }

    try {
        // Önce oturumun kullanıcıya ait olduğunu kontrol et
        const existing = await prisma.timerSession.findFirst({
            where: { id, userId: user.id }
        })

        if (!existing) {
            return { success: false, error: "Oturum bulunamadı" }
        }

        const session = await prisma.timerSession.update({
            where: { id },
            data: {
                title: data.title,
                notes: data.notes,
                pageStart: data.pageStart,
                pageEnd: data.pageEnd,
                pagesRead: data.pagesRead,
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/timer")

        return { success: true, session }
    } catch (error) {
        console.error("Timer oturumu güncellenemedi:", error)
        return { success: false, error: "Timer oturumu güncellenemedi" }
    }
}

export async function deleteTimerSession(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Yetkisiz erişim" }
    }

    try {
        // Önce oturumun kullanıcıya ait olduğunu kontrol et
        const existing = await prisma.timerSession.findFirst({
            where: { id, userId: user.id }
        })

        if (!existing) {
            return { success: false, error: "Oturum bulunamadı" }
        }

        await prisma.timerSession.delete({
            where: { id }
        })

        revalidatePath("/dashboard")
        revalidatePath("/timer")

        return { success: true }
    } catch (error) {
        console.error("Timer oturumu silinemedi:", error)
        return { success: false, error: "Timer oturumu silinemedi" }
    }
}

// ==========================================
// Kitap bazlı timer işlemleri
// ==========================================

export async function getBookTimerSessions(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const sessions = await prisma.timerSession.findMany({
            where: {
                userId: user.id,
                bookId: bookId,
            },
            orderBy: { startTime: 'desc' },
        })

        return sessions
    } catch (error) {
        console.error("Kitap timer oturumları getirilemedi:", error)
        return []
    }
}

export async function getBookTotalTime(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    try {
        const result = await prisma.timerSession.aggregate({
            where: {
                userId: user.id,
                bookId: bookId,
            },
            _sum: {
                durationSeconds: true,
            }
        })

        return result._sum.durationSeconds || 0
    } catch (error) {
        console.error("Kitap toplam süresi getirilemedi:", error)
        return 0
    }
}

// ==========================================
// Okunan kitapları getir (timer için)
// ==========================================

export async function getReadingBooksForTimer() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: {
                userId: user.id,
                status: 'READING',
            },
            select: {
                id: true,
                title: true,
                coverUrl: true,
                currentPage: true,
                pageCount: true,
                author: {
                    select: { name: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        })

        return books
    } catch (error) {
        console.error("Okunan kitaplar getirilemedi:", error)
        return []
    }
}
