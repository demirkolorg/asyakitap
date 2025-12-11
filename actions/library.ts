"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { BookStatus } from "@prisma/client"
import { CACHE_TAGS } from "@/lib/cache"

// Helper to invalidate user-related caches
function invalidateUserCaches(userId: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId))
    revalidateTag(CACHE_TAGS.userStats(userId))
    revalidateTag(CACHE_TAGS.userQuotes(userId))
    revalidateTag(CACHE_TAGS.userAuthors(userId))
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
                publisher: { select: { id: true, name: true } },
                shelf: { select: { id: true, name: true } }
            }
        })

        // Invalidate caches
        invalidateUserCaches(user.id)
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
        // Optimized query with select instead of include
        const books = await prisma.book.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                title: true,
                coverUrl: true,
                pageCount: true,
                currentPage: true,
                status: true,
                isbn: true,
                publishedDate: true,
                description: true,
                tortu: true,
                imza: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
                author: { select: { id: true, name: true, imageUrl: true } },
                publisher: { select: { id: true, name: true } },
                shelf: { select: { id: true, name: true, color: true } }
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
                shelf: true,
                quotes: {
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Limit quotes for performance
                },
                readingLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20 // Limit logs
                },
                userReadingListBooks: {
                    include: {
                        readingListBook: {
                            select: {
                                id: true,
                                title: true,
                                level: {
                                    select: {
                                        id: true,
                                        name: true,
                                        levelNumber: true,
                                        readingList: {
                                            select: { id: true, name: true, slug: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
    shelfId?: string | null
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
                publisher: { select: { id: true, name: true } },
                shelf: { select: { id: true, name: true } }
            }
        })

        // Invalidate caches
        invalidateUserCaches(user.id)
        revalidateTag(CACHE_TAGS.book(id))
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
        invalidateUserCaches(user.id)
        revalidateTag(CACHE_TAGS.book(id))
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
