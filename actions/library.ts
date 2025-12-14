"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { BookStatus } from "@prisma/client"
import { CACHE_TAGS } from "@/lib/cache"
import { matchBookScore } from "@/lib/string-utils"

// Helper to invalidate user-related caches
function invalidateUserCaches(userId: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId), 'max')
    revalidateTag(CACHE_TAGS.userStats(userId), 'max')
    revalidateTag(CACHE_TAGS.userQuotes(userId), 'max')
    revalidateTag(CACHE_TAGS.userAuthors(userId), 'max')
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
    readingListBookId?: string // Manuel seçilen okuma listesi kitabı
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

        // Manuel okuma listesi bağlantısı
        let linkedToList: string | undefined
        if (bookData.readingListBookId) {
            const rlBook = await prisma.readingListBook.findUnique({
                where: { id: bookData.readingListBookId },
                include: { level: { include: { readingList: true } } }
            })

            if (rlBook) {
                await prisma.userReadingListBook.create({
                    data: {
                        userId: user.id,
                        readingListBookId: bookData.readingListBookId,
                        bookId: newBook.id
                    }
                })
                linkedToList = rlBook.level.readingList.name
            }
        }

        // Otomatik Challenge kitabı eşleştirmesi
        // Kullanıcının katıldığı challenge'lardaki kitaplarla eşleştir
        const authorName = newBook.author?.name || ""
        if (authorName) {
            // Kullanıcının challenge progress'lerini al
            const userChallengeBooks = await prisma.userChallengeBook.findMany({
                where: {
                    userProgress: { userId: user.id },
                    linkedBookId: null // Henüz eşleşmemiş olanlar
                },
                include: {
                    challengeBook: true
                }
            })

            // Eşleşme ara
            for (const ucb of userChallengeBooks) {
                const score = matchBookScore(
                    bookData.title,
                    authorName,
                    ucb.challengeBook.title,
                    ucb.challengeBook.author
                )

                if (score >= 0.75) {
                    // Eşleşme bulundu - bağla
                    await prisma.userChallengeBook.update({
                        where: { id: ucb.id },
                        data: { linkedBookId: newBook.id }
                    })
                    break // İlk eşleşmeyi al
                }
            }
        }

        // Invalidate caches
        invalidateUserCaches(user.id)
        revalidatePath("/library")
        revalidatePath("/dashboard")
        revalidatePath("/challenges")

        return { success: true, book: newBook, linkedToList }
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
                    take: 50 // Limit quotes for performance
                },
                readingLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20 // Limit logs
                },
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
                publisher: { select: { id: true, name: true } }
            }
        })

        // Kitap durumu değiştiyse, bağlı challenge kitabını da güncelle
        if (data.status) {
            const challengeBook = await prisma.userChallengeBook.findFirst({
                where: {
                    linkedBookId: id,
                    userProgress: { userId: user.id }
                },
                include: {
                    challengeBook: true,
                    userProgress: {
                        include: {
                            books: {
                                include: { challengeBook: true }
                            }
                        }
                    }
                }
            })

            if (challengeBook) {
                // Kitap durumunu challenge durumuna çevir
                let challengeStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED"
                if (data.status === "READING") {
                    challengeStatus = "IN_PROGRESS"
                } else if (data.status === "COMPLETED") {
                    challengeStatus = "COMPLETED"
                }

                // Challenge kitabını güncelle
                await prisma.userChallengeBook.update({
                    where: { id: challengeBook.id },
                    data: {
                        status: challengeStatus,
                        startedAt: data.status === "READING" ? new Date() : challengeBook.startedAt,
                        completedAt: data.status === "COMPLETED" ? new Date() : null
                    }
                })

                // MAIN kitap tamamlandıysa, aynı aydaki BONUS kitapları aç
                if (data.status === "COMPLETED" && challengeBook.challengeBook.role === "MAIN") {
                    const monthId = challengeBook.challengeBook.monthId
                    const bonusBooks = challengeBook.userProgress.books.filter(
                        b => b.challengeBook.monthId === monthId &&
                             b.challengeBook.role === "BONUS" &&
                             b.status === "LOCKED"
                    )

                    for (const bonus of bonusBooks) {
                        await prisma.userChallengeBook.update({
                            where: { id: bonus.id },
                            data: { status: "NOT_STARTED" }
                        })
                    }
                }
            }
        }

        // Invalidate caches
        invalidateUserCaches(user.id)
        revalidateTag(CACHE_TAGS.book(id), 'max')
        revalidatePath(`/book/${id}`)
        revalidatePath("/library")
        revalidatePath("/dashboard")
        revalidatePath("/challenges")

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
        revalidateTag(CACHE_TAGS.book(id), 'max')
        revalidatePath("/library")
        revalidatePath("/dashboard")

        return { success: true }
    } catch (error) {
        console.error("Failed to delete book:", error)
        return { success: false, error: "Delete failed" }
    }
}

// Kitabın bağlı olduğu challenge kitabını getir
export async function getLinkedChallengeBook(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const userChallengeBook = await prisma.userChallengeBook.findFirst({
            where: {
                linkedBookId: bookId,
                userProgress: { userId: user.id }
            },
            select: {
                id: true,
                challengeBookId: true,
                takeaway: true
            }
        })

        return userChallengeBook
    } catch (error) {
        console.error("Failed to get linked challenge book:", error)
        return null
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

// Kitapları okuma listelerine göre grupla
export async function getBooksGroupedByReadingList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { groups: [] }

    try {
        // Tüm kitapları ve okuma listesi bağlantılarını getir
        const books = await prisma.book.findMany({
            where: { userId: user.id },
            include: {
                author: true,
                publisher: true,
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
                    },
                    orderBy: { createdAt: 'asc' } // İlk eklenen liste öncelikli
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Okuma listelerini seviyeleriyle birlikte getir (sıralı)
        const readingLists = await prisma.readingList.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                levels: {
                    orderBy: { levelNumber: 'asc' }
                }
            }
        })

        // Gruplandırma için map: listSlug -> levelNumber -> books
        const groupMap = new Map<string, Map<number, typeof books>>()
        const assignedBookIds = new Set<string>()

        // Her kitabı ilk bağlı olduğu listeye ve seviyeye ekle
        for (const book of books) {
            if (book.userReadingListBooks.length > 0) {
                // İlk bağlandığı liste
                const firstLink = book.userReadingListBooks[0]
                const listSlug = firstLink.readingListBook.level.readingList.slug
                const levelNumber = firstLink.readingListBook.level.levelNumber

                if (!groupMap.has(listSlug)) {
                    groupMap.set(listSlug, new Map())
                }
                const levelMap = groupMap.get(listSlug)!
                if (!levelMap.has(levelNumber)) {
                    levelMap.set(levelNumber, [])
                }
                levelMap.get(levelNumber)!.push(book)
                assignedBookIds.add(book.id)
            }
        }

        // Rafsız kitaplar (hiçbir listeye bağlı olmayan)
        const unassignedBooks = books.filter(b => !assignedBookIds.has(b.id))

        // Grupları oluştur (seviye bilgisiyle)
        const groups = readingLists
            .filter(list => groupMap.has(list.slug))
            .map(list => {
                const levelMap = groupMap.get(list.slug)!
                const levels = list.levels
                    .filter(level => levelMap.has(level.levelNumber))
                    .map(level => ({
                        levelNumber: level.levelNumber,
                        levelName: level.name,
                        books: levelMap.get(level.levelNumber) || []
                    }))

                return {
                    id: list.slug,
                    name: list.name,
                    levels,
                    // Tüm kitapları düz liste olarak da tut (geriye uyumluluk)
                    books: levels.flatMap(l => l.books)
                }
            })

        // Rafsız grubu ekle (varsa)
        if (unassignedBooks.length > 0) {
            groups.push({
                id: "rafsiz",
                name: "Rafsız",
                levels: [{
                    levelNumber: 0,
                    levelName: "Listelenmemiş Kitaplar",
                    books: unassignedBooks
                }],
                books: unassignedBooks
            })
        }

        return { groups }
    } catch (error) {
        console.error("Failed to fetch grouped books:", error)
        return { groups: [] }
    }
}
