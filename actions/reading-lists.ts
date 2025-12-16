"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS, CACHE_DURATION } from "@/lib/cache"
import { scrapeKitapyurdu } from "./kitapyurdu"

// ==========================================
// Types
// ==========================================

export interface ReadingListSummary {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    levelCount: number
    totalBooks: number
}

export interface ReadingListBook {
    id: string
    bookId: string
    neden: string | null
    sortOrder: number
    book: {
        id: string
        title: string
        coverUrl: string | null
        pageCount: number | null
        inLibrary: boolean
        author: { id: string; name: string } | null
        publisher: { id: string; name: string } | null
    }
}

export interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
}

export interface ReadingListDetail {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    sortOrder: number
    levels: ReadingListLevel[]
    totalBooks: number
}

// ==========================================
// READ Operations
// ==========================================

// Get all reading lists summary (for browse page)
export async function getReadingListsSummary(): Promise<ReadingListSummary[]> {
    try {
        const lists = await prisma.readingList.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                levels: {
                    include: {
                        _count: {
                            select: { books: true }
                        }
                    }
                }
            }
        })

        return lists.map(list => {
            const totalBooks = list.levels.reduce((sum, level) => sum + level._count.books, 0)

            return {
                id: list.id,
                slug: list.slug,
                name: list.name,
                description: list.description,
                coverUrl: list.coverUrl,
                levelCount: list.levels.length,
                totalBooks
            }
        })
    } catch (error) {
        console.error("Failed to fetch reading lists summary:", error)
        return []
    }
}

// Get single reading list with full details
export async function getReadingListDetail(slug: string): Promise<ReadingListDetail | null> {
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
                                book: {
                                    include: {
                                        author: { select: { id: true, name: true } },
                                        publisher: { select: { id: true, name: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!list) return null

        let totalBooks = 0
        const levels = list.levels.map(level => {
            totalBooks += level.books.length

            return {
                id: level.id,
                levelNumber: level.levelNumber,
                name: level.name,
                description: level.description,
                books: level.books.map(rb => ({
                    id: rb.id,
                    bookId: rb.bookId,
                    neden: rb.neden,
                    sortOrder: rb.sortOrder,
                    book: {
                        id: rb.book.id,
                        title: rb.book.title,
                        coverUrl: rb.book.coverUrl,
                        pageCount: rb.book.pageCount,
                        inLibrary: rb.book.inLibrary,
                        author: rb.book.author,
                        publisher: rb.book.publisher
                    }
                }))
            }
        })

        return {
            id: list.id,
            slug: list.slug,
            name: list.name,
            description: list.description,
            coverUrl: list.coverUrl,
            sortOrder: list.sortOrder,
            levels,
            totalBooks
        }
    } catch (error) {
        console.error("Failed to fetch reading list detail:", error)
        return null
    }
}

// Get reading list by ID (for admin)
export async function getReadingListById(id: string) {
    try {
        return await prisma.readingList.findUnique({
            where: { id },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" },
                            include: {
                                book: {
                                    include: {
                                        author: true,
                                        publisher: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch reading list by id:", error)
        return null
    }
}

// ==========================================
// CREATE Operations
// ==========================================

// Helper function to generate slug
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

// Create a new reading list
export async function createReadingList(data: {
    name: string
    slug?: string
    description?: string
    coverUrl?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Generate slug from name if not provided
        let slug = data.slug || generateSlug(data.name)

        // Check if slug exists, add suffix if needed
        let existing = await prisma.readingList.findUnique({
            where: { slug }
        })
        let suffix = 1
        while (existing) {
            slug = `${generateSlug(data.name)}-${suffix}`
            existing = await prisma.readingList.findUnique({
                where: { slug }
            })
            suffix++
        }

        const maxOrder = await prisma.readingList.aggregate({
            _max: { sortOrder: true }
        })

        const list = await prisma.readingList.create({
            data: {
                name: data.name,
                slug: slug,
                description: data.description || null,
                coverUrl: data.coverUrl || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            }
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true, list }
    } catch (error) {
        console.error("Failed to create reading list:", error)
        return { success: false, error: "Liste oluşturulamadı" }
    }
}

// Create a level in reading list
export async function createLevel(data: {
    readingListId: string
    name: string
    description?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
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
        revalidatePath("/admin/reading-lists")
        return { success: true, level }
    } catch (error) {
        console.error("Failed to create level:", error)
        return { success: false, error: "Seviye oluşturulamadı" }
    }
}

// Add book to level (requires existing Book record)
export async function addBookToLevel(data: {
    levelId: string
    bookId: string
    neden?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if book already exists in this level
        const existing = await prisma.readingListBook.findUnique({
            where: {
                levelId_bookId: {
                    levelId: data.levelId,
                    bookId: data.bookId
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu seviyede mevcut" }
        }

        const maxOrder = await prisma.readingListBook.aggregate({
            where: { levelId: data.levelId },
            _max: { sortOrder: true }
        })

        const readingListBook = await prisma.readingListBook.create({
            data: {
                levelId: data.levelId,
                bookId: data.bookId,
                neden: data.neden || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true, readingListBook }
    } catch (error) {
        console.error("Failed to add book to level:", error)
        return { success: false, error: "Kitap eklenemedi" }
    }
}

// ==========================================
// UPDATE Operations
// ==========================================

// Update reading list
export async function updateReadingList(id: string, data: {
    name?: string
    slug?: string
    description?: string
    coverUrl?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // If slug is being changed, check it doesn't conflict
        if (data.slug) {
            const existing = await prisma.readingList.findFirst({
                where: {
                    slug: data.slug,
                    NOT: { id }
                }
            })
            if (existing) {
                return { success: false, error: "Bu slug zaten kullanılıyor" }
            }
        }

        const list = await prisma.readingList.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true, list }
    } catch (error) {
        console.error("Failed to update reading list:", error)
        return { success: false, error: "Liste güncellenemedi" }
    }
}

// Update level
export async function updateLevel(id: string, data: {
    name?: string
    description?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        const level = await prisma.readingListLevel.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true, level }
    } catch (error) {
        console.error("Failed to update level:", error)
        return { success: false, error: "Seviye güncellenemedi" }
    }
}

// Update reading list book (neden field)
export async function updateReadingListBook(id: string, data: {
    neden?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        const book = await prisma.readingListBook.update({
            where: { id },
            data
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true, book }
    } catch (error) {
        console.error("Failed to update reading list book:", error)
        return { success: false, error: "Kitap güncellenemedi" }
    }
}

// Reorder levels
export async function reorderLevels(listId: string, levelIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

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
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder levels:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// Reorder books within a level
export async function reorderBooksInLevel(levelId: string, bookIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

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
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder books:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// Reorder reading lists
export async function reorderReadingLists(listIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.$transaction(
            listIds.map((id, index) =>
                prisma.readingList.update({
                    where: { id },
                    data: { sortOrder: index }
                })
            )
        )

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder reading lists:", error)
        return { success: false, error: "Sıralama güncellenemedi" }
    }
}

// ==========================================
// DELETE Operations
// ==========================================

// Delete reading list
export async function deleteReadingList(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.readingList.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete reading list:", error)
        return { success: false, error: "Liste silinemedi" }
    }
}

// Delete level
export async function deleteLevel(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.readingListLevel.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete level:", error)
        return { success: false, error: "Seviye silinemedi" }
    }
}

// Remove book from level
export async function removeBookFromLevel(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        await prisma.readingListBook.delete({
            where: { id }
        })

        revalidatePath("/reading-lists")
        revalidatePath("/admin/reading-lists")
        return { success: true }
    } catch (error) {
        console.error("Failed to remove book from level:", error)
        return { success: false, error: "Kitap kaldırılamadı" }
    }
}

// ==========================================
// Search & Utility
// ==========================================

// Search books that are already in reading lists
export async function searchReadingListBooks(query: string) {
    if (!query || query.length < 2) return []

    try {
        const books = await prisma.readingListBook.findMany({
            where: {
                book: {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { author: { name: { contains: query, mode: "insensitive" } } }
                    ]
                }
            },
            include: {
                book: {
                    include: {
                        author: true
                    }
                },
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

        return books.map(rb => ({
            id: rb.id,
            bookId: rb.bookId,
            title: rb.book.title,
            author: rb.book.author?.name || "Bilinmeyen Yazar",
            listName: rb.level.readingList.name,
            levelName: rb.level.name,
            levelNumber: rb.level.levelNumber,
            listSlug: rb.level.readingList.slug
        }))
    } catch (error) {
        console.error("Search reading list books failed:", error)
        return []
    }
}

// Get all reading lists (for admin and library views)
export async function getAllReadingLists(): Promise<ReadingListDetail[]> {
    try {
        const lists = await prisma.readingList.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" },
                            include: {
                                book: {
                                    include: {
                                        author: { select: { id: true, name: true } },
                                        publisher: { select: { id: true, name: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return lists.map(list => {
            let totalBooks = 0
            const levels = list.levels.map(level => {
                totalBooks += level.books.length

                return {
                    id: level.id,
                    levelNumber: level.levelNumber,
                    name: level.name,
                    description: level.description,
                    books: level.books.map(rb => ({
                        id: rb.id,
                        bookId: rb.bookId,
                        neden: rb.neden,
                        sortOrder: rb.sortOrder,
                        book: {
                            id: rb.book.id,
                            title: rb.book.title,
                            coverUrl: rb.book.coverUrl,
                            pageCount: rb.book.pageCount,
                            inLibrary: rb.book.inLibrary,
                            author: rb.book.author,
                            publisher: rb.book.publisher
                        }
                    }))
                }
            })

            return {
                id: list.id,
                slug: list.slug,
                name: list.name,
                description: list.description,
                coverUrl: list.coverUrl,
                sortOrder: list.sortOrder,
                levels,
                totalBooks
            }
        })
    } catch (error) {
        console.error("Failed to fetch all reading lists:", error)
        return []
    }
}

// ==========================================
// Kitapyurdu Integration
// ==========================================

// Add book from Kitapyurdu URL to a level
export async function addBookFromKitapyurduToLevel(data: {
    levelId: string
    kitapyurduUrl: string
    neden?: string
    inLibrary?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Scrape book data from Kitapyurdu
        const scrapeResult = await scrapeKitapyurdu(data.kitapyurduUrl)
        if (!scrapeResult.success || !scrapeResult.data) {
            return { success: false, error: scrapeResult.error || "Kitap bilgileri alınamadı" }
        }

        const bookData = scrapeResult.data

        // Check if book already exists in DB (by title and author)
        let book = await prisma.book.findFirst({
            where: {
                title: { equals: bookData.title, mode: "insensitive" },
                author: { name: { equals: bookData.author, mode: "insensitive" } }
            }
        })

        if (!book) {
            // Create author if not exists
            let author = await prisma.author.findFirst({
                where: { name: { equals: bookData.author, mode: "insensitive" } }
            })
            if (!author) {
                author = await prisma.author.create({
                    data: {
                        name: bookData.author,
                        imageUrl: bookData.authorImageUrl
                    }
                })
            }

            // Create publisher if not exists
            let publisher = null
            if (bookData.publisher) {
                publisher = await prisma.publisher.findFirst({
                    where: { name: { equals: bookData.publisher, mode: "insensitive" } }
                })
                if (!publisher) {
                    publisher = await prisma.publisher.create({
                        data: {
                            name: bookData.publisher,
                            imageUrl: bookData.publisherImageUrl
                        }
                    })
                }
            }

            // Create the book
            book = await prisma.book.create({
                data: {
                    userId: user.id,
                    title: bookData.title,
                    authorId: author.id,
                    publisherId: publisher?.id,
                    coverUrl: bookData.coverUrl,
                    pageCount: bookData.pageCount,
                    isbn: bookData.isbn,
                    publishedDate: bookData.publishedDate,
                    description: bookData.description,
                    inLibrary: data.inLibrary ?? false,
                    status: "TO_READ"
                }
            })
        }

        // Check if book already exists in this level
        const existing = await prisma.readingListBook.findUnique({
            where: {
                levelId_bookId: {
                    levelId: data.levelId,
                    bookId: book.id
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu seviyede mevcut" }
        }

        // Get max sort order
        const maxOrder = await prisma.readingListBook.aggregate({
            where: { levelId: data.levelId },
            _max: { sortOrder: true }
        })

        // Add book to level
        const readingListBook = await prisma.readingListBook.create({
            data: {
                levelId: data.levelId,
                bookId: book.id,
                neden: data.neden || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/reading-lists")
        return { success: true, readingListBook, bookTitle: bookData.title }
    } catch (error) {
        console.error("Failed to add book from Kitapyurdu:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}

// Add book manually to a level (creates Book record first)
export async function addBookManuallyToLevel(data: {
    levelId: string
    title: string
    author: string
    pageCount?: number
    coverUrl?: string
    publisher?: string
    neden?: string
    inLibrary?: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Oturum açmanız gerekiyor" }

    try {
        // Check if book already exists in DB
        let book = await prisma.book.findFirst({
            where: {
                title: { equals: data.title, mode: "insensitive" },
                author: { name: { equals: data.author, mode: "insensitive" } }
            }
        })

        if (!book) {
            // Create author if not exists
            let author = await prisma.author.findFirst({
                where: { name: { equals: data.author, mode: "insensitive" } }
            })
            if (!author) {
                author = await prisma.author.create({
                    data: { name: data.author }
                })
            }

            // Create publisher if provided
            let publisher = null
            if (data.publisher) {
                publisher = await prisma.publisher.findFirst({
                    where: { name: { equals: data.publisher, mode: "insensitive" } }
                })
                if (!publisher) {
                    publisher = await prisma.publisher.create({
                        data: { name: data.publisher }
                    })
                }
            }

            // Create the book
            book = await prisma.book.create({
                data: {
                    userId: user.id,
                    title: data.title,
                    authorId: author.id,
                    publisherId: publisher?.id,
                    coverUrl: data.coverUrl,
                    pageCount: data.pageCount,
                    inLibrary: data.inLibrary ?? false,
                    status: "TO_READ"
                }
            })
        }

        // Check if book already exists in this level
        const existing = await prisma.readingListBook.findUnique({
            where: {
                levelId_bookId: {
                    levelId: data.levelId,
                    bookId: book.id
                }
            }
        })
        if (existing) {
            return { success: false, error: "Bu kitap zaten bu seviyede mevcut" }
        }

        // Get max sort order
        const maxOrder = await prisma.readingListBook.aggregate({
            where: { levelId: data.levelId },
            _max: { sortOrder: true }
        })

        // Add book to level
        const readingListBook = await prisma.readingListBook.create({
            data: {
                levelId: data.levelId,
                bookId: book.id,
                neden: data.neden || null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
            },
            include: {
                book: {
                    include: {
                        author: true,
                        publisher: true
                    }
                }
            }
        })

        revalidatePath("/reading-lists")
        return { success: true, readingListBook }
    } catch (error) {
        console.error("Failed to add book manually:", error)
        return { success: false, error: "Kitap eklenirken hata oluştu" }
    }
}
