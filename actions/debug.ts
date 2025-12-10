"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getDebugInfo() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
        return {
            authenticated: false,
            authError: authError?.message || "No user found",
            userId: null,
            email: null,
            counts: null
        }
    }

    try {
        const [bookCount, authorCount, publisherCount, quoteCount, allBooksCount, allAuthorsCount, allPublishersCount] = await Promise.all([
            // User's books
            prisma.book.count({ where: { userId: user.id } }),
            // User's authors (authors with user's books)
            prisma.author.count({ where: { books: { some: { userId: user.id } } } }),
            // User's publishers
            prisma.publisher.count({ where: { books: { some: { userId: user.id } } } }),
            // User's quotes
            prisma.quote.count({ where: { book: { userId: user.id } } }),
            // Total books in DB
            prisma.book.count(),
            // Total authors in DB
            prisma.author.count(),
            // Total publishers in DB
            prisma.publisher.count()
        ])

        return {
            authenticated: true,
            authError: null,
            userId: user.id,
            email: user.email,
            counts: {
                userBooks: bookCount,
                userAuthors: authorCount,
                userPublishers: publisherCount,
                userQuotes: quoteCount,
                totalBooks: allBooksCount,
                totalAuthors: allAuthorsCount,
                totalPublishers: allPublishersCount
            }
        }
    } catch (error) {
        return {
            authenticated: true,
            authError: null,
            userId: user.id,
            email: user.email,
            counts: null,
            dbError: String(error)
        }
    }
}
