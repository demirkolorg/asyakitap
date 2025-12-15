"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS, CACHE_DURATION, invalidateLinkCaches } from "@/lib/cache"
import { matchBookScore, isAutoLinkable, isSuggestionWorthy, getMatchConfidence, type MatchConfidence } from "@/lib/string-utils"

// Cached reading lists (static data - long cache)
const getCachedReadingLists = unstable_cache(
    async () => {
        const lists = await prisma.readingList.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" }
                        }
                    }
                }
            }
        })

        return lists.map((list: typeof lists[number]) => ({
            ...list,
            totalBooks: list.levels.reduce((acc: number, level: typeof list.levels[number]) => acc + level.books.length, 0),
            levelCount: list.levels.length
        }))
    },
    ['reading-lists-all'],
    {
        tags: [CACHE_TAGS.readingLists],
        revalidate: CACHE_DURATION.STATIC, // 24 hours - rarely changes
    }
)

// Get all reading lists with counts
export async function getReadingLists() {
    try {
        return await getCachedReadingLists()
    } catch (error) {
        console.error("Failed to fetch reading lists:", error)
        return []
    }
}

// Cached single reading list
const getCachedReadingList = (slug: string) =>
    unstable_cache(
        async () => {
            return prisma.readingList.findUnique({
                where: { slug },
                include: {
                    levels: {
                        orderBy: { levelNumber: "asc" },
                        include: {
                            books: {
                                orderBy: { sortOrder: "asc" }
                            }
                        }
                    }
                }
            })
        },
        [`reading-list-${slug}`],
        {
            tags: [CACHE_TAGS.readingList(slug), CACHE_TAGS.readingLists],
            revalidate: CACHE_DURATION.STATIC,
        }
    )()

// Get single reading list with all details
export async function getReadingList(slug: string) {
    try {
        return await getCachedReadingList(slug)
    } catch (error) {
        console.error("Failed to fetch reading list:", error)
        return null
    }
}

// Get reading list with user's progress
export async function getReadingListWithProgress(slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
        const list = await prisma.readingList.findUnique({
            where: { slug },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" },
                            include: {
                                userLinks: user ? {
                                    where: { userId: user.id },
                                    include: {
                                        book: {
                                            select: {
                                                id: true,
                                                status: true,
                                                currentPage: true,
                                                pageCount: true,
                                                coverUrl: true
                                            }
                                        }
                                    }
                                } : false
                            }
                        }
                    }
                }
            }
        })

        if (!list) return null

        // Calculate progress
        let totalBooks = 0
        let addedBooks = 0
        let completedBooks = 0

        const levelsWithProgress = list.levels.map((level: typeof list.levels[number]) => {
            let levelAdded = 0
            let levelCompleted = 0

            const booksWithStatus = level.books.map((book: typeof level.books[number]) => {
                totalBooks++
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const userLink = (book as any).userLinks?.[0]
                const userBook = userLink?.book

                let status: "not_added" | "added" | "reading" | "completed" = "not_added"

                if (userBook) {
                    addedBooks++
                    levelAdded++

                    if (userBook.status === "COMPLETED") {
                        status = "completed"
                        completedBooks++
                        levelCompleted++
                    } else if (userBook.status === "READING") {
                        status = "reading"
                    } else {
                        status = "added"
                    }
                }

                return {
                    ...book,
                    userStatus: status,
                    userBook: userBook || null,
                    userLinkId: userLink?.id || null
                }
            })

            return {
                ...level,
                books: booksWithStatus,
                progress: {
                    added: levelAdded,
                    completed: levelCompleted,
                    total: level.books.length
                }
            }
        })

        return {
            ...list,
            levels: levelsWithProgress,
            progress: {
                total: totalBooks,
                added: addedBooks,
                completed: completedBooks
            }
        }
    } catch (error) {
        console.error("Failed to fetch reading list with progress:", error)
        return null
    }
}

// Link a book from user's library to reading list
export async function linkBookToReadingList(bookId: string, readingListBookId: string, listSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        // Verify book belongs to user
        const book = await prisma.book.findFirst({
            where: { id: bookId, userId: user.id },
            select: { id: true }
        })

        if (!book) {
            return { success: false, error: "Kitap bulunamadı" }
        }

        // Upsert - create or update
        await prisma.userReadingListBook.upsert({
            where: {
                userId_readingListBookId: {
                    userId: user.id,
                    readingListBookId
                }
            },
            create: {
                userId: user.id,
                readingListBookId,
                bookId
            },
            update: {
                bookId
            }
        })

        // Cache invalidation
        invalidateLinkCaches(user.id, bookId)
        revalidateTag(CACHE_TAGS.readingList(listSlug), 'max')
        revalidatePath(`/reading-lists/${listSlug}`)
        revalidatePath('/library')

        return { success: true }
    } catch (error) {
        console.error("Failed to link book:", error)
        return { success: false, error: "Kitap bağlanamadı" }
    }
}

// Unlink a book from reading list
export async function unlinkBookFromReadingList(readingListBookId: string, listSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        // Önce bağlı kitap ID'sini al (cache invalidation için)
        const existingLink = await prisma.userReadingListBook.findUnique({
            where: {
                userId_readingListBookId: {
                    userId: user.id,
                    readingListBookId
                }
            },
            select: { bookId: true }
        })

        await prisma.userReadingListBook.delete({
            where: {
                userId_readingListBookId: {
                    userId: user.id,
                    readingListBookId
                }
            }
        })

        // Cache invalidation
        invalidateLinkCaches(user.id, existingLink?.bookId || undefined)
        revalidateTag(CACHE_TAGS.readingList(listSlug), 'max')
        revalidatePath(`/reading-lists/${listSlug}`)
        revalidatePath('/library')

        return { success: true }
    } catch (error) {
        console.error("Failed to unlink book:", error)
        return { success: false, error: "Bağlantı kaldırılamadı" }
    }
}

// Return type for reading lists with progress
export interface ReadingListWithProgress {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    levelCount: number
    totalBooks: number
    progress: {
        added: number
        completed: number
        total: number
    }
}

// Get reading lists with user progress for browse page
export async function getReadingListsWithProgress(): Promise<ReadingListWithProgress[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
        const lists = await prisma.readingList.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                levels: {
                    include: {
                        books: {
                            include: {
                                userLinks: user ? {
                                    where: { userId: user.id },
                                    include: {
                                        book: {
                                            select: { status: true }
                                        }
                                    }
                                } : false
                            }
                        }
                    }
                }
            }
        })

        return lists.map((list: typeof lists[number]) => {
            let totalBooks = 0
            let addedBooks = 0
            let completedBooks = 0

            list.levels.forEach((level: typeof list.levels[number]) => {
                level.books.forEach((book: typeof level.books[number]) => {
                    totalBooks++
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const userLink = (book as any).userLinks?.[0]
                    if (userLink?.book) {
                        addedBooks++
                        if (userLink.book.status === "COMPLETED") {
                            completedBooks++
                        }
                    }
                })
            })

            return {
                id: list.id,
                slug: list.slug,
                name: list.name,
                description: list.description,
                coverUrl: list.coverUrl,
                levelCount: list.levels.length,
                totalBooks,
                progress: {
                    added: addedBooks,
                    completed: completedBooks,
                    total: totalBooks
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch reading lists with progress:", error)
        return []
    }
}

// =====================
// ADMIN ACTIONS
// =====================

// Create a new reading list
export async function createReadingList(data: {
    name: string
    slug: string
    description?: string
}) {
    try {
        const maxOrder = await prisma.readingList.aggregate({
            _max: { sortOrder: true }
        })

        const list = await prisma.readingList.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            }
        })

        revalidatePath("/reading-lists")
        return { success: true, list }
    } catch (error) {
        console.error("Failed to create reading list:", error)
        return { success: false, error: "Liste oluşturulamadı" }
    }
}

// Update a reading list
export async function updateReadingList(id: string, data: {
    name?: string
    slug?: string
    description?: string
}) {
    try {
        const list = await prisma.readingList.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        revalidateTag(CACHE_TAGS.readingLists, 'max')
        return { success: true, list }
    } catch (error) {
        console.error("Failed to update reading list:", error)
        return { success: false, error: "Liste güncellenemedi" }
    }
}

// Delete a reading list
export async function deleteReadingList(id: string) {
    try {
        await prisma.readingList.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete reading list:", error)
        return { success: false, error: "Liste silinemedi" }
    }
}

// Create a level
export async function createLevel(data: {
    readingListId: string
    name: string
    description?: string
}) {
    try {
        // Get max level number for this list
        const maxLevel = await prisma.readingListLevel.aggregate({
            where: { readingListId: data.readingListId },
            _max: { levelNumber: true }
        })

        const level = await prisma.readingListLevel.create({
            data: {
                readingListId: data.readingListId,
                name: data.name,
                description: data.description || null,
                levelNumber: (maxLevel._max.levelNumber ?? 0) + 1
            }
        })

        revalidatePath("/reading-lists")
        return { success: true, level }
    } catch (error) {
        console.error("Failed to create level:", error)
        return { success: false, error: "Seviye oluşturulamadı" }
    }
}

// Update a level
export async function updateLevel(id: string, data: {
    name?: string
    description?: string
}) {
    try {
        const level = await prisma.readingListLevel.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        return { success: true, level }
    } catch (error) {
        console.error("Failed to update level:", error)
        return { success: false, error: "Seviye güncellenemedi" }
    }
}

// Delete a level
export async function deleteLevel(id: string) {
    try {
        await prisma.readingListLevel.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete level:", error)
        return { success: false, error: "Seviye silinemedi" }
    }
}

// Create a book in reading list
export async function createReadingListBook(data: {
    levelId: string
    title: string
    author: string
    neden?: string
    pageCount?: number
}) {
    try {
        // Get max sort order for this level
        const maxOrder = await prisma.readingListBook.aggregate({
            where: { levelId: data.levelId },
            _max: { sortOrder: true }
        })

        const book = await prisma.readingListBook.create({
            data: {
                levelId: data.levelId,
                title: data.title,
                author: data.author,
                neden: data.neden || null,
                pageCount: data.pageCount || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            }
        })

        revalidatePath("/reading-lists")
        return { success: true, book }
    } catch (error) {
        console.error("Failed to create book:", error)
        return { success: false, error: "Kitap oluşturulamadı" }
    }
}

// Update a book in reading list
export async function updateReadingListBook(id: string, data: {
    title?: string
    author?: string
    neden?: string
    pageCount?: number
}) {
    try {
        const book = await prisma.readingListBook.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        return { success: true, book }
    } catch (error) {
        console.error("Failed to update book:", error)
        return { success: false, error: "Kitap güncellenemedi" }
    }
}

// Delete a book from reading list
export async function deleteReadingListBook(id: string) {
    try {
        await prisma.readingListBook.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        return { success: false, error: "Kitap silinemedi" }
    }
}

// Reorder levels
export async function reorderLevels(listId: string, levelIds: string[]) {
    try {
        await prisma.$transaction(
            levelIds.map((id, index) =>
                prisma.readingListLevel.update({
                    where: { id },
                    data: { levelNumber: index + 1 }
                })
            )
        )

        revalidatePath("/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder levels:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// Reorder books within a level
export async function reorderBooks(levelId: string, bookIds: string[]) {
    try {
        await prisma.$transaction(
            bookIds.map((id, index) =>
                prisma.readingListBook.update({
                    where: { id },
                    data: { sortOrder: index }
                })
            )
        )

        revalidatePath("/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder books:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// Get reading list for admin (with full details for editing)
export async function getReadingListForAdmin(id: string) {
    try {
        const list = await prisma.readingList.findUnique({
            where: { id },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" }
                        }
                    }
                }
            }
        })

        return list
    } catch (error) {
        console.error("Failed to fetch reading list for admin:", error)
        return null
    }
}

// ReadingListBook arama (kitap ekleme ekranı için)
export async function searchReadingListBooks(query: string) {
    if (!query || query.length < 2) return []

    try {
        const books = await prisma.readingListBook.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { author: { contains: query, mode: "insensitive" } }
                ]
            },
            include: {
                level: {
                    include: { readingList: true }
                }
            },
            orderBy: [
                { level: { readingList: { sortOrder: "asc" } } },
                { level: { levelNumber: "asc" } },
                { sortOrder: "asc" }
            ],
            take: 20
        })

        return books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            listName: book.level.readingList.name,
            levelName: book.level.name,
            listSlug: book.level.readingList.slug
        }))
    } catch (error) {
        console.error("Search reading list books failed:", error)
        return []
    }
}

// =====================
// AUTO-MATCH FONKSİYONLARI
// =====================

export type ReadingListMatchCandidate = {
    bookId: string
    bookTitle: string
    score: number
    confidence: MatchConfidence
}

export type ReadingListMatchSuggestion = {
    readingListBookId: string
    readingListBookTitle: string
    readingListBookAuthor: string
    listName: string
    listSlug: string
    candidates: ReadingListMatchCandidate[]
}

/**
 * Kullanıcının kütüphanesindeki kitapları belirli bir okuma listesiyle otomatik eşleştir
 */
export async function autoMatchUserBooksToReadingList(
    listSlug: string
): Promise<{
    success: boolean
    autoLinked: number
    suggestions: ReadingListMatchSuggestion[]
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, autoLinked: 0, suggestions: [] }
    }

    try {
        // Okuma listesini al
        const list = await prisma.readingList.findUnique({
            where: { slug: listSlug },
            include: {
                levels: {
                    include: {
                        books: {
                            include: {
                                userLinks: {
                                    where: { userId: user.id }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!list) {
            return { success: false, autoLinked: 0, suggestions: [] }
        }

        // Kullanıcının tüm kitaplarını al
        const userBooks = await prisma.book.findMany({
            where: { userId: user.id },
            include: { author: { select: { name: true } } }
        })

        let autoLinked = 0
        const suggestions: ReadingListMatchSuggestion[] = []

        for (const level of list.levels) {
            for (const rlBook of level.books) {
                // Zaten bağlantı varsa atla
                const existingLink = rlBook.userLinks.find(l => l.bookId !== null)
                if (existingLink) continue

                const candidates: ReadingListMatchCandidate[] = []
                let bestStrongMatch: { bookId: string; score: number } | null = null

                for (const userBook of userBooks) {
                    const authorName = userBook.author?.name || ""
                    const score = matchBookScore(
                        rlBook.title,
                        rlBook.author,
                        userBook.title,
                        authorName
                    )

                    if (isAutoLinkable(score)) {
                        if (!bestStrongMatch || score > bestStrongMatch.score) {
                            bestStrongMatch = { bookId: userBook.id, score }
                        }
                    } else if (isSuggestionWorthy(score)) {
                        candidates.push({
                            bookId: userBook.id,
                            bookTitle: userBook.title,
                            score,
                            confidence: getMatchConfidence(score)
                        })
                    }
                }

                if (bestStrongMatch) {
                    // Otomatik bağla
                    await prisma.userReadingListBook.upsert({
                        where: {
                            userId_readingListBookId: {
                                userId: user.id,
                                readingListBookId: rlBook.id
                            }
                        },
                        create: {
                            userId: user.id,
                            readingListBookId: rlBook.id,
                            bookId: bestStrongMatch.bookId
                        },
                        update: {
                            bookId: bestStrongMatch.bookId
                        }
                    })
                    autoLinked++
                } else if (candidates.length > 0) {
                    // Önerileri kaydet
                    const topCandidates = candidates
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)

                    suggestions.push({
                        readingListBookId: rlBook.id,
                        readingListBookTitle: rlBook.title,
                        readingListBookAuthor: rlBook.author,
                        listName: list.name,
                        listSlug: list.slug,
                        candidates: topCandidates
                    })
                }
            }
        }

        // Cache invalidation
        invalidateLinkCaches(user.id)
        revalidateTag(CACHE_TAGS.readingList(listSlug), 'max')
        revalidatePath(`/reading-lists/${listSlug}`)

        return { success: true, autoLinked, suggestions }
    } catch (error) {
        console.error("Auto-match reading list books error:", error)
        return { success: false, autoLinked: 0, suggestions: [] }
    }
}
