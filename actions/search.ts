"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export interface SearchResult {
    id: string
    type: "book" | "author" | "reading-list" | "reading-list-book" | "quote"
    title: string
    subtitle?: string
    imageUrl?: string | null
    href: string
}

export interface GroupedSearchResults {
    books: SearchResult[]
    authors: SearchResult[]
    readingLists: SearchResult[]
    readingListBooks: SearchResult[]
    quotes: SearchResult[]
}

export async function globalSearch(query: string): Promise<GroupedSearchResults> {
    if (!query || query.trim().length < 2) {
        return { books: [], authors: [], readingLists: [], readingListBooks: [], quotes: [] }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { books: [], authors: [], readingLists: [], readingListBooks: [], quotes: [] }
    }

    const searchTerm = query.trim().toLowerCase()

    // Parallel search across all content types
    const [books, authors, readingLists, readingListBooks, quotes] = await Promise.all([
        // Search books
        prisma.book.findMany({
            where: {
                userId: user.id,
                OR: [
                    { title: { contains: searchTerm, mode: "insensitive" } },
                    { author: { name: { contains: searchTerm, mode: "insensitive" } } },
                ],
            },
            include: {
                author: true,
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search authors
        prisma.author.findMany({
            where: {
                name: { contains: searchTerm, mode: "insensitive" },
                books: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                _count: {
                    select: { books: true },
                },
            },
            take: 5,
            orderBy: { name: "asc" },
        }),

        // Search reading lists
        prisma.readingList.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            include: {
                _count: {
                    select: { levels: true },
                },
            },
            take: 5,
            orderBy: { sortOrder: "asc" },
        }),

        // Search reading list books
        prisma.readingListBook.findMany({
            where: {
                OR: [
                    { title: { contains: searchTerm, mode: "insensitive" } },
                    { author: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            include: {
                level: {
                    include: {
                        readingList: true,
                    },
                },
            },
            take: 8,
            orderBy: { title: "asc" },
        }),

        // Search quotes
        prisma.quote.findMany({
            where: {
                book: {
                    userId: user.id,
                },
                content: { contains: searchTerm, mode: "insensitive" },
            },
            include: {
                book: {
                    include: {
                        author: true,
                    },
                },
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
    ])

    return {
        books: books.map((book: typeof books[number]) => ({
            id: book.id,
            type: "book" as const,
            title: book.title,
            subtitle: book.author?.name,
            imageUrl: book.coverUrl,
            href: `/book/${book.id}`,
        })),
        authors: authors.map((author: typeof authors[number]) => ({
            id: author.id,
            type: "author" as const,
            title: author.name,
            subtitle: `${author._count.books} kitap`,
            imageUrl: author.imageUrl,
            href: `/author/${author.id}`,
        })),
        readingLists: readingLists.map((list: typeof readingLists[number]) => ({
            id: list.id,
            type: "reading-list" as const,
            title: list.name,
            subtitle: list.description?.slice(0, 50) || undefined,
            imageUrl: list.coverUrl,
            href: `/reading-lists/${list.slug}`,
        })),
        readingListBooks: readingListBooks.map((book: typeof readingListBooks[number]) => ({
            id: book.id,
            type: "reading-list-book" as const,
            title: book.title,
            subtitle: `${book.author} • ${book.level.readingList.name}`,
            imageUrl: book.coverUrl,
            href: `/reading-lists/${book.level.readingList.slug}`,
        })),
        quotes: quotes.map((quote: typeof quotes[number]) => ({
            id: quote.id,
            type: "quote" as const,
            title: quote.content.slice(0, 80) + (quote.content.length > 80 ? "..." : ""),
            subtitle: `${quote.book.title}${quote.page ? ` - s.${quote.page}` : ""}`,
            imageUrl: quote.book.coverUrl,
            href: `/book/${quote.bookId}`,
        })),
    }
}
