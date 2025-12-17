"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { BookStatus } from "@prisma/client"
import { CACHE_TAGS } from "@/lib/cache"

// Helper to invalidate user-related caches
function invalidateUserCaches(userId: string, bookId?: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId), 'max')
    revalidateTag(CACHE_TAGS.userStats(userId), 'max')
    revalidateTag(CACHE_TAGS.userQuotes(userId), 'max')
    revalidateTag(CACHE_TAGS.userAuthors(userId), 'max')

    if (bookId) {
        revalidateTag(CACHE_TAGS.book(bookId), 'max')
    }
}

export async function addBookToLibrary(bookData: {
    title: string
    authorId: string
    publisherId?: string
    coverUrl?: string
    pageCount?: number
    isbn?: string
    publishedDate?: string
    description?: string
    status?: BookStatus
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        const newBook = await prisma.book.create({
            data: {
                userId: user.id,
                title: bookData.title,
                authorId: bookData.authorId,
                publisherId: bookData.publisherId,
                coverUrl: bookData.coverUrl,
                pageCount: bookData.pageCount,
                isbn: bookData.isbn,
                publishedDate: bookData.publishedDate,
                description: bookData.description,
                status: bookData.status || "TO_READ",
            },
            select: {
                id: true,
                title: true,
                coverUrl: true,
                status: true,
                author: { select: { id: true, name: true } },
                publisher: { select: { id: true, name: true } }
            }
        })

        // Cache invalidation
        invalidateUserCaches(user.id, newBook.id)
        revalidatePath("/library")
        revalidatePath("/dashboard")

        return { success: true, book: newBook }
    } catch (error) {
        console.error("Failed to add book:", error)
        return { success: false, error: "Failed to add book" }
    }
}

export async function getBooks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: { userId: user.id },
            include: {
                author: true,
                publisher: true
            },
            orderBy: { updatedAt: 'desc' }
        })
        return books
    } catch (error) {
        console.error("Failed to fetch books:", error)
        return []
    }
}

export async function getBook(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const book = await prisma.book.findUnique({
            where: { id, userId: user.id },
            include: {
                author: true,
                publisher: true,
                quotes: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                readingLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                readingListBooks: {
                    select: {
                        id: true,
                        neden: true,
                        level: {
                            select: {
                                id: true,
                                levelNumber: true,
                                name: true,
                                description: true,
                                readingList: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        description: true,
                                        coverUrl: true
                                    }
                                }
                            }
                        }
                    }
                },
                challengeBooks: {
                    select: {
                        id: true,
                        role: true,
                        reason: true,
                        month: {
                            select: {
                                id: true,
                                monthNumber: true,
                                monthName: true,
                                theme: true,
                                themeIcon: true,
                                challenge: {
                                    select: {
                                        id: true,
                                        name: true,
                                        year: true,
                                        description: true
                                    }
                                }
                            }
                        }
                    }
                },
                rating: true
            }
        })
        return book
    } catch (error) {
        console.error("Failed to fetch book:", error)
        return null
    }
}

export async function updateBook(id: string, data: {
    title?: string
    authorId?: string
    publisherId?: string | null
    status?: BookStatus
    currentPage?: number
    pageCount?: number | null
    isbn?: string | null
    publishedDate?: string | null
    description?: string | null
    tortu?: string
    imza?: string
    startDate?: Date | null
    endDate?: Date | null
    coverUrl?: string | null
    inLibrary?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        const updatedBook = await prisma.book.update({
            where: { id, userId: user.id },
            data,
            select: {
                id: true,
                title: true,
                coverUrl: true,
                status: true,
                currentPage: true,
                pageCount: true,
                author: { select: { id: true, name: true } },
                publisher: { select: { id: true, name: true } }
            }
        })

        // Invalidate caches
        invalidateUserCaches(user.id)
        revalidateTag(CACHE_TAGS.book(id), 'max')
        revalidatePath(`/book/${id}`)
        revalidatePath("/library")
        revalidatePath("/dashboard")

        return { success: true, book: updatedBook }
    } catch (error) {
        console.error("Failed to update book:", error)
        return { success: false, error: "Update failed" }
    }
}

export async function deleteBook(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        await prisma.book.delete({
            where: { id, userId: user.id },
        })

        // Invalidate caches
        invalidateUserCaches(user.id, id)
        revalidatePath("/library")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        return { success: false, error: "Delete failed" }
    }
}

// Header için şu an okunan kitaplar
export async function getCurrentlyReadingBooks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: {
                userId: user.id,
                status: "READING"
            },
            include: { author: true },
            orderBy: { updatedAt: 'desc' }
        })

        return books
    } catch (error) {
        console.error("Failed to fetch currently reading books:", error)
        return []
    }
}

// Imzalar sayfası için optimize edilmiş veri
export async function getImzalarPageData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { booksWithImza: [], totalBookCount: 0, booksWithoutImza: [] }

    try {
        const [booksWithImza, totalBookCount, booksWithoutImza] = await Promise.all([
            // İmzası olan kitaplar
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    imza: { not: null },
                    NOT: { imza: "" }
                },
                include: { author: true },
                orderBy: { updatedAt: 'desc' }
            }),
            // Toplam kitap sayısı
            prisma.book.count({
                where: { userId: user.id }
            }),
            // İmza bekleyen kitaplar (max 10)
            prisma.book.findMany({
                where: {
                    userId: user.id,
                    OR: [
                        { imza: null },
                        { imza: "" }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    coverUrl: true
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            })
        ])

        return { booksWithImza, totalBookCount, booksWithoutImza }
    } catch (error) {
        console.error("Failed to fetch imzalar page data:", error)
        return { booksWithImza: [], totalBookCount: 0, booksWithoutImza: [] }
    }
}

