"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Get all books with quotes and author
        const books = await prisma.book.findMany({
            where: { userId: user.id },
            include: { quotes: true, author: true },
            orderBy: { updatedAt: 'desc' }
        })

        // Get unique authors from user's books
        const authorIds = new Set(books.map(b => b.authorId).filter(Boolean))
        const uniqueAuthors = authorIds.size

        // Currently reading
        const currentlyReading = books.filter(b => b.status === 'READING')

        // Recently completed
        const recentlyCompleted = books
            .filter(b => b.status === 'COMPLETED')
            .slice(0, 5)

        // Recent quotes (from all books)
        const allQuotes = books.flatMap(b =>
            b.quotes.map(q => ({ ...q, bookTitle: b.title, bookAuthor: b.author?.name || "Bilinmiyor" }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const recentQuotes = allQuotes.slice(0, 5)

        // Books with tortu (summaries)
        const booksWithTortu = books
            .filter(b => b.tortu && b.tortu.trim() !== '')
            .slice(0, 5)

        // Books with imza
        const booksWithImza = books
            .filter(b => b.imza && b.imza.trim() !== '')
            .slice(0, 5)

        // Stats
        const stats = {
            totalBooks: books.length,
            reading: books.filter(b => b.status === 'READING').length,
            completed: books.filter(b => b.status === 'COMPLETED').length,
            toRead: books.filter(b => b.status === 'TO_READ').length,
            dnf: books.filter(b => b.status === 'DNF').length,
            totalQuotes: allQuotes.length,
            totalPages: books.reduce((sum, b) => sum + (b.pageCount || 0), 0),
            pagesRead: books
                .filter(b => b.status === 'COMPLETED')
                .reduce((sum, b) => sum + (b.pageCount || 0), 0),
            uniqueAuthors,
            totalTortu: books.filter(b => b.tortu && b.tortu.trim() !== '').length,
            totalImza: books.filter(b => b.imza && b.imza.trim() !== '').length,
        }

        return {
            currentlyReading,
            recentlyCompleted,
            recentQuotes,
            booksWithTortu,
            booksWithImza,
            stats,
        }
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        return null
    }
}
