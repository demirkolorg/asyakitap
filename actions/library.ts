"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { BookStatus } from "@prisma/client"

export async function addBookToLibrary(bookData: {
    title: string
    authorId: string
    publisherId?: string
    coverUrl?: string
    pageCount?: number
    isbn?: string
    publishedDate?: string
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
                status: bookData.status || "TO_READ",
            },
            include: {
                author: true,
                publisher: true,
                shelf: true
            }
        })

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
                publisher: true,
                shelf: true
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
                quotes: { orderBy: { createdAt: 'desc' } },
                readingLogs: { orderBy: { createdAt: 'desc' } },
                userReadingListBooks: {
                    include: {
                        readingListBook: {
                            include: {
                                level: {
                                    include: {
                                        readingList: true
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
            include: {
                author: true,
                publisher: true,
                shelf: true
            }
        })
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
        revalidatePath("/library")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        return { success: false, error: "Delete failed" }
    }
}

export async function getBooksWithTortu() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { booksWithTortu: [], allBooks: [] }

    try {
        const allBooks = await prisma.book.findMany({
            where: { userId: user.id },
            include: { author: true },
            orderBy: { updatedAt: 'desc' }
        })

        const booksWithTortu = allBooks.filter(b => b.tortu && b.tortu.trim() !== '')

        return { booksWithTortu, allBooks }
    } catch (error) {
        console.error("Failed to fetch books with tortu:", error)
        return { booksWithTortu: [], allBooks: [] }
    }
}

export async function getBooksWithImza() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { booksWithImza: [], allBooks: [] }

    try {
        const allBooks = await prisma.book.findMany({
            where: { userId: user.id },
            include: { author: true },
            orderBy: { updatedAt: 'desc' }
        })

        const booksWithImza = allBooks.filter(b => b.imza && b.imza.trim() !== '')

        return { booksWithImza, allBooks }
    } catch (error) {
        console.error("Failed to fetch books with imza:", error)
        return { booksWithImza: [], allBooks: [] }
    }
}

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
