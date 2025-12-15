"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { BookStatus, Prisma } from "@prisma/client"
import { CACHE_TAGS, invalidateLinkCaches } from "@/lib/cache"
import { matchBookScore, isAutoLinkable } from "@/lib/string-utils"

// Helper to invalidate user-related caches
function invalidateUserCaches(userId: string, bookId?: string) {
    revalidateTag(CACHE_TAGS.userBooks(userId), 'max')
    revalidateTag(CACHE_TAGS.userStats(userId), 'max')
    revalidateTag(CACHE_TAGS.userQuotes(userId), 'max')
    revalidateTag(CACHE_TAGS.userAuthors(userId), 'max')
    revalidateTag(CACHE_TAGS.userReadingListLinks(userId), 'max')
    revalidateTag(CACHE_TAGS.userChallengeLinks(userId), 'max')

    if (bookId) {
        revalidateTag(CACHE_TAGS.book(bookId), 'max')
        revalidateTag(CACHE_TAGS.bookReadingLists(bookId), 'max')
        revalidateTag(CACHE_TAGS.bookChallenge(bookId), 'max')
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
    readingListBookId?: string // Manuel seçilen okuma listesi kitabı
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        // Tüm işlemleri tek transaction içinde yap
        const result = await prisma.$transaction(async (tx) => {
            // 1. Kitabı oluştur
            const newBook = await tx.book.create({
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

            const authorName = newBook.author?.name || ""
            let linkedToList: string | undefined

            // 2. Manuel okuma listesi bağlantısı (varsa)
            if (bookData.readingListBookId) {
                const rlBook = await tx.readingListBook.findUnique({
                    where: { id: bookData.readingListBookId },
                    include: { level: { include: { readingList: true } } }
                })

                if (rlBook) {
                    await tx.userReadingListBook.upsert({
                        where: {
                            userId_readingListBookId: {
                                userId: user.id,
                                readingListBookId: bookData.readingListBookId
                            }
                        },
                        create: {
                            userId: user.id,
                            readingListBookId: bookData.readingListBookId,
                            bookId: newBook.id
                        },
                        update: {
                            bookId: newBook.id
                        }
                    })
                    linkedToList = rlBook.level.readingList.name
                }
            }

            // 3. Otomatik Challenge kitabı eşleştirmesi
            if (authorName) {
                const userChallengeBooks = await tx.userChallengeBook.findMany({
                    where: {
                        userProgress: { userId: user.id },
                        linkedBookId: null // Henüz eşleşmemiş olanlar
                    },
                    include: { challengeBook: true }
                })

                for (const ucb of userChallengeBooks) {
                    const score = matchBookScore(
                        bookData.title,
                        authorName,
                        ucb.challengeBook.title,
                        ucb.challengeBook.author
                    )

                    if (isAutoLinkable(score)) {
                        await tx.userChallengeBook.update({
                            where: { id: ucb.id },
                            data: { linkedBookId: newBook.id }
                        })
                        break // İlk eşleşmeyi al
                    }
                }
            }

            // 4. Otomatik Reading List eşleştirmesi (bağlı olmayan UserReadingListBook'lar için)
            if (authorName) {
                const unlinkedReadingListBooks = await tx.userReadingListBook.findMany({
                    where: {
                        userId: user.id,
                        bookId: null // Kütüphane kitabına bağlı olmayan
                    },
                    include: { readingListBook: true }
                })

                for (const urlb of unlinkedReadingListBooks) {
                    const score = matchBookScore(
                        bookData.title,
                        authorName,
                        urlb.readingListBook.title,
                        urlb.readingListBook.author
                    )

                    if (isAutoLinkable(score)) {
                        await tx.userReadingListBook.update({
                            where: { id: urlb.id },
                            data: { bookId: newBook.id }
                        })
                        break // İlk eşleşmeyi al
                    }
                }
            }

            return { newBook, linkedToList }
        }, {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        })

        // Cache invalidation
        invalidateUserCaches(user.id, result.newBook.id)
        revalidatePath("/library")
        revalidatePath("/dashboard")
        revalidatePath("/challenges")
        revalidatePath("/reading-lists")

        return { success: true, book: result.newBook, linkedToList: result.linkedToList }
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

/**
 * Kitabın bağımlılıklarını kontrol et
 * Silmeden önce kullanıcıya bilgi vermek için
 */
export async function getBookDependencies(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const [readingListLinks, challengeLinks] = await Promise.all([
            // Okuma listesi bağlantıları
            prisma.userReadingListBook.findMany({
                where: {
                    userId: user.id,
                    bookId
                },
                include: {
                    readingListBook: {
                        include: {
                            level: {
                                include: {
                                    readingList: {
                                        select: { name: true, slug: true }
                                    }
                                }
                            }
                        }
                    }
                }
            }),

            // Challenge bağlantıları
            prisma.userChallengeBook.findMany({
                where: {
                    linkedBookId: bookId,
                    userProgress: { userId: user.id }
                },
                include: {
                    challengeBook: {
                        include: {
                            month: {
                                include: {
                                    challenge: {
                                        select: { year: true, name: true }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ])

        return {
            hasLinks: readingListLinks.length > 0 || challengeLinks.length > 0,
            readingLists: readingListLinks.map(link => ({
                listName: link.readingListBook.level.readingList.name,
                listSlug: link.readingListBook.level.readingList.slug,
                bookTitle: link.readingListBook.title
            })),
            challenges: challengeLinks.map(link => ({
                challengeName: link.challengeBook.month.challenge.name,
                year: link.challengeBook.month.challenge.year,
                monthName: link.challengeBook.month.monthName,
                bookTitle: link.challengeBook.title
            }))
        }
    } catch (error) {
        console.error("Failed to get book dependencies:", error)
        return null
    }
}

export async function deleteBook(id: string, confirmDependencies = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        // Bağımlılık kontrolü (eğer onay verilmediyse)
        if (!confirmDependencies) {
            const deps = await getBookDependencies(id)
            if (deps?.hasLinks) {
                return {
                    success: false,
                    requiresConfirmation: true,
                    dependencies: deps,
                    error: "Bu kitap okuma listeleri veya challenge'lara bağlı"
                }
            }
        }

        await prisma.book.delete({
            where: { id, userId: user.id },
        })

        // Invalidate caches
        invalidateUserCaches(user.id, id)
        revalidatePath("/library")
        revalidatePath("/dashboard")
        revalidatePath("/reading-lists")
        revalidatePath("/challenges")

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

// Kitabın bağlı olduğu challenge bilgilerini detaylı getir (kitap detay sayfası için)
export async function getLinkedChallengeBookWithDetails(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const userChallengeBook = await prisma.userChallengeBook.findFirst({
            where: {
                linkedBookId: bookId,
                userProgress: { userId: user.id }
            },
            include: {
                challengeBook: {
                    include: {
                        month: {
                            include: {
                                challenge: true
                            }
                        }
                    }
                },
                userProgress: {
                    include: {
                        challenge: true,
                        books: {
                            include: {
                                challengeBook: true
                            }
                        }
                    }
                }
            }
        })

        if (!userChallengeBook) return null

        // Challenge istatistiklerini hesapla
        const allBooks = userChallengeBook.userProgress.books
        const completedBooks = allBooks.filter(b => b.status === 'COMPLETED')
        const mainBooks = allBooks.filter(b => b.challengeBook.role === 'MAIN')
        const bonusBooks = allBooks.filter(b => b.challengeBook.role === 'BONUS')
        const completedMainBooks = mainBooks.filter(b => b.status === 'COMPLETED')
        const completedBonusBooks = bonusBooks.filter(b => b.status === 'COMPLETED')

        return {
            id: userChallengeBook.id,
            status: userChallengeBook.status,
            takeaway: userChallengeBook.takeaway,
            startedAt: userChallengeBook.startedAt,
            completedAt: userChallengeBook.completedAt,
            challengeBook: {
                id: userChallengeBook.challengeBook.id,
                title: userChallengeBook.challengeBook.title,
                author: userChallengeBook.challengeBook.author,
                role: userChallengeBook.challengeBook.role,
                reason: userChallengeBook.challengeBook.reason,
            },
            month: {
                monthNumber: userChallengeBook.challengeBook.month.monthNumber,
                monthName: userChallengeBook.challengeBook.month.monthName,
                theme: userChallengeBook.challengeBook.month.theme,
                themeIcon: userChallengeBook.challengeBook.month.themeIcon,
            },
            challenge: {
                id: userChallengeBook.userProgress.challenge.id,
                year: userChallengeBook.userProgress.challenge.year,
                name: userChallengeBook.userProgress.challenge.name,
            },
            stats: {
                totalBooks: allBooks.length,
                completedBooks: completedBooks.length,
                mainBooks: mainBooks.length,
                bonusBooks: bonusBooks.length,
                completedMainBooks: completedMainBooks.length,
                completedBonusBooks: completedBonusBooks.length,
                percentage: allBooks.length > 0
                    ? Math.round((completedBooks.length / allBooks.length) * 100)
                    : 0
            }
        }
    } catch (error) {
        console.error("Failed to get linked challenge book with details:", error)
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

// Kitapları okuma hedeflerine göre grupla
export async function getBooksGroupedByChallenge() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { challenges: [], unlinkedBooks: [] }

    try {
        // Kullanıcının katıldığı challenge'ları al
        const userChallengeProgress = await prisma.userChallengeProgress.findMany({
            where: { userId: user.id },
            include: {
                challenge: {
                    include: {
                        months: {
                            orderBy: { monthNumber: 'asc' },
                            include: {
                                books: {
                                    orderBy: [
                                        { role: 'asc' },
                                        { sortOrder: 'asc' }
                                    ]
                                }
                            }
                        }
                    }
                },
                books: {
                    include: {
                        linkedBook: {
                            include: {
                                author: true,
                                publisher: true
                            }
                        },
                        challengeBook: {
                            include: {
                                month: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                challenge: { year: 'desc' }
            }
        })

        // Challenge'a bağlı kitap ID'leri
        const linkedBookIds = new Set<string>()

        const challenges = userChallengeProgress.map(progress => {
            // Her ay için kitapları grupla
            const months = progress.challenge.months.map(month => {
                const monthBooks = progress.books.filter(
                    b => b.challengeBook.monthId === month.id
                )

                const booksWithStatus = monthBooks.map(userBook => {
                    if (userBook.linkedBookId) {
                        linkedBookIds.add(userBook.linkedBookId)
                    }

                    return {
                        challengeBookId: userBook.challengeBookId,
                        title: userBook.challengeBook.title,
                        author: userBook.challengeBook.author,
                        role: userBook.challengeBook.role,
                        status: userBook.status,
                        linkedBook: userBook.linkedBook ? {
                            id: userBook.linkedBook.id,
                            title: userBook.linkedBook.title,
                            coverUrl: userBook.linkedBook.coverUrl,
                            status: userBook.linkedBook.status,
                            currentPage: userBook.linkedBook.currentPage,
                            pageCount: userBook.linkedBook.pageCount,
                            author: userBook.linkedBook.author,
                            publisher: userBook.linkedBook.publisher
                        } : null
                    }
                })

                const completedCount = booksWithStatus.filter(b => b.status === 'COMPLETED').length
                const linkedCount = booksWithStatus.filter(b => b.linkedBook !== null).length

                return {
                    monthNumber: month.monthNumber,
                    monthName: month.monthName,
                    theme: month.theme,
                    themeIcon: month.themeIcon,
                    books: booksWithStatus,
                    stats: {
                        total: booksWithStatus.length,
                        completed: completedCount,
                        linked: linkedCount,
                        percentage: booksWithStatus.length > 0
                            ? Math.round((completedCount / booksWithStatus.length) * 100)
                            : 0
                    }
                }
            })

            // Genel istatistikler
            const allBooks = progress.books
            const completedBooks = allBooks.filter(b => b.status === 'COMPLETED')
            const linkedBooks = allBooks.filter(b => b.linkedBookId !== null)

            return {
                id: progress.challenge.id,
                year: progress.challenge.year,
                name: progress.challenge.name,
                months,
                stats: {
                    totalBooks: allBooks.length,
                    completedBooks: completedBooks.length,
                    linkedBooks: linkedBooks.length,
                    percentage: allBooks.length > 0
                        ? Math.round((completedBooks.length / allBooks.length) * 100)
                        : 0
                }
            }
        })

        // Challenge'a bağlı olmayan kitapları al
        const unlinkedBooks = await prisma.book.findMany({
            where: {
                userId: user.id,
                id: { notIn: Array.from(linkedBookIds) }
            },
            include: {
                author: true,
                publisher: true
            },
            orderBy: { updatedAt: 'desc' }
        })

        return { challenges, unlinkedBooks }
    } catch (error) {
        console.error("Failed to fetch challenge grouped books:", error)
        return { challenges: [], unlinkedBooks: [] }
    }
}
