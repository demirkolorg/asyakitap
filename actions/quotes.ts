"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllQuotes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const quotes = await prisma.quote.findMany({
            where: {
                book: { userId: user.id }
            },
            include: {
                book: {
                    select: { id: true, title: true, coverUrl: true, author: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return quotes
    } catch (error) {
        console.error("Failed to fetch quotes:", error)
        return []
    }
}

export async function updateQuote(quoteId: string, content: string, page?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const quote = await prisma.quote.findFirst({
        where: {
            id: quoteId,
            book: { userId: user.id }
        }
    })

    if (!quote) throw new Error("Quote not found")

    try {
        const updated = await prisma.quote.update({
            where: { id: quoteId },
            data: { content, page }
        })
        revalidatePath('/quotes')
        revalidatePath(`/book/${quote.bookId}`)
        return { success: true, quote: updated }
    } catch (error) {
        return { success: false, error: "Failed to update" }
    }
}

export async function addQuote(bookId: string, content: string, page?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Verify ownership of the book
    const book = await prisma.book.findUnique({
        where: { id: bookId, userId: user.id }
    })

    if (!book) throw new Error("Book not found")

    try {
        const quote = await prisma.quote.create({
            data: {
                bookId,
                content,
                page,
            }
        })
        revalidatePath(`/book/${bookId}`)
        return { success: true, quote }
    } catch (error) {
        console.error("Failed to add quote:", error)
        return { success: false, error: "Failed to add quote" }
    }
}

export async function deleteQuote(quoteId: string, bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Verify ownership via book
    // Theoretically we should join or check, but simpler:
    // find quote where book.userId = user.id
    const quote = await prisma.quote.findFirst({
        where: {
            id: quoteId,
            book: { userId: user.id }
        }
    })

    if (!quote) throw new Error("Quote not found")

    try {
        await prisma.quote.delete({ where: { id: quoteId } })
        revalidatePath(`/book/${bookId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete" }
    }
}
