"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { CACHE_TAGS, invalidateAllBookRelatedCaches } from "@/lib/cache"
import { matchBookScore, isAutoLinkable, isSuggestionWorthy, getMatchConfidence, type MatchConfidence } from "@/lib/string-utils"

// ==========================================
// Types
// ==========================================

export type RepairCandidate = {
    bookId: string
    bookTitle: string
    score: number
    confidence: MatchConfidence
}

export type RepairSuggestion = {
    type: 'reading-list' | 'challenge'
    targetId: string // ReadingListBook.id veya ChallengeBook.id
    targetTitle: string
    targetAuthor: string
    listOrChallengeName: string
    candidates: RepairCandidate[]
}

export type RepairStats = {
    readingListsScanned: number
    readingListsRepaired: number
    challengesScanned: number
    challengesRepaired: number
    suggestionsFound: number
}

export type RepairResult = {
    success: boolean
    stats: RepairStats
    suggestions: RepairSuggestion[]
}

// ==========================================
// Bağlantıları Onar
// ==========================================

/**
 * Kullanıcının tüm eksik bağlantılarını tarayıp onar
 *
 * DOĞRU MANTIK:
 * 1. Okuma listesindeki TÜM kitapları al (ReadingListBook)
 * 2. Her biri için kullanıcının UserReadingListBook kaydı var mı kontrol et
 * 3. Kayıt yoksa veya bookId null ise → kullanıcının kütüphanesiyle eşleştirmeyi dene
 * 4. %75+ eşleşmeleri otomatik bağla, %45-75 arası öneri olarak göster
 */
export async function repairAllLinks(): Promise<RepairResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            success: false,
            stats: {
                readingListsScanned: 0,
                readingListsRepaired: 0,
                challengesScanned: 0,
                challengesRepaired: 0,
                suggestionsFound: 0
            },
            suggestions: []
        }
    }

    try {
        // Kullanıcının tüm kitaplarını al
        const userBooks = await prisma.book.findMany({
            where: { userId: user.id },
            include: {
                author: { select: { name: true } }
            }
        })

        if (userBooks.length === 0) {
            return {
                success: true,
                stats: {
                    readingListsScanned: 0,
                    readingListsRepaired: 0,
                    challengesScanned: 0,
                    challengesRepaired: 0,
                    suggestionsFound: 0
                },
                suggestions: []
            }
        }

        const stats: RepairStats = {
            readingListsScanned: 0,
            readingListsRepaired: 0,
            challengesScanned: 0,
            challengesRepaired: 0,
            suggestionsFound: 0
        }

        const suggestions: RepairSuggestion[] = []

        // =====================================================
        // 1. READING LISTS - Tüm okuma listesi kitaplarını tara
        // =====================================================

        // Tüm okuma listesi kitaplarını al
        const allReadingListBooks = await prisma.readingListBook.findMany({
            include: {
                level: {
                    include: {
                        readingList: { select: { name: true, slug: true } }
                    }
                },
                userLinks: {
                    where: { userId: user.id }
                }
            }
        })

        for (const rlBook of allReadingListBooks) {
            // Bu kitap için kullanıcının bağlantısı var mı?
            const existingLink = rlBook.userLinks[0]

            // Bağlantı var ve bookId dolu ise atla
            if (existingLink?.bookId) {
                continue
            }

            stats.readingListsScanned++

            // Kullanıcının kütüphanesinde eşleşme ara
            const candidates: RepairCandidate[] = []
            let bestMatch: { bookId: string, score: number } | null = null

            for (const userBook of userBooks) {
                const authorName = userBook.author?.name || ""
                const score = matchBookScore(
                    rlBook.title,
                    rlBook.author,
                    userBook.title,
                    authorName
                )

                if (isAutoLinkable(score)) {
                    if (!bestMatch || score > bestMatch.score) {
                        bestMatch = { bookId: userBook.id, score }
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

            // Otomatik bağlama (%75+)
            if (bestMatch) {
                if (existingLink) {
                    // Mevcut kaydı güncelle
                    await prisma.userReadingListBook.update({
                        where: { id: existingLink.id },
                        data: { bookId: bestMatch.bookId }
                    })
                } else {
                    // Yeni kayıt oluştur
                    await prisma.userReadingListBook.create({
                        data: {
                            userId: user.id,
                            readingListBookId: rlBook.id,
                            bookId: bestMatch.bookId
                        }
                    })
                }
                stats.readingListsRepaired++
            } else if (candidates.length > 0) {
                // Öneri olarak ekle
                const topCandidates = candidates
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)

                suggestions.push({
                    type: 'reading-list',
                    targetId: rlBook.id, // ReadingListBook.id
                    targetTitle: rlBook.title,
                    targetAuthor: rlBook.author,
                    listOrChallengeName: rlBook.level.readingList.name,
                    candidates: topCandidates
                })
                stats.suggestionsFound++
            }
        }

        // =====================================================
        // 2. CHALLENGES - Kullanıcının katıldığı challenge'ları tara
        // =====================================================

        // Kullanıcının challenge progress'lerini al
        const userChallengeProgress = await prisma.userChallengeProgress.findMany({
            where: { userId: user.id },
            include: {
                challenge: {
                    include: {
                        months: {
                            include: {
                                books: {
                                    include: {
                                        userProgress: {
                                            where: { userProgress: { userId: user.id } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                books: true
            }
        })

        for (const progress of userChallengeProgress) {
            for (const month of progress.challenge.months) {
                for (const challengeBook of month.books) {
                    // Bu kitap için kullanıcının kaydı var mı?
                    const existingLink = challengeBook.userProgress[0]

                    // Bağlantı var ve linkedBookId dolu ise atla
                    if (existingLink?.linkedBookId) {
                        continue
                    }

                    stats.challengesScanned++

                    // Kullanıcının kütüphanesinde eşleşme ara
                    const candidates: RepairCandidate[] = []
                    let bestMatch: { bookId: string, score: number } | null = null

                    for (const userBook of userBooks) {
                        const authorName = userBook.author?.name || ""
                        const score = matchBookScore(
                            challengeBook.title,
                            challengeBook.author,
                            userBook.title,
                            authorName
                        )

                        if (isAutoLinkable(score)) {
                            if (!bestMatch || score > bestMatch.score) {
                                bestMatch = { bookId: userBook.id, score }
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

                    // Otomatik bağlama (%75+)
                    if (bestMatch) {
                        if (existingLink) {
                            // Mevcut kaydı güncelle
                            await prisma.userChallengeBook.update({
                                where: { id: existingLink.id },
                                data: { linkedBookId: bestMatch.bookId }
                            })
                        } else {
                            // Yeni kayıt oluştur
                            await prisma.userChallengeBook.create({
                                data: {
                                    userProgressId: progress.id,
                                    challengeBookId: challengeBook.id,
                                    linkedBookId: bestMatch.bookId,
                                    status: 'NOT_STARTED'
                                }
                            })
                        }
                        stats.challengesRepaired++
                    } else if (candidates.length > 0) {
                        // Öneri olarak ekle
                        const topCandidates = candidates
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 3)

                        suggestions.push({
                            type: 'challenge',
                            targetId: challengeBook.id, // ChallengeBook.id
                            targetTitle: challengeBook.title,
                            targetAuthor: challengeBook.author,
                            listOrChallengeName: `${progress.challenge.name} (${progress.challenge.year})`,
                            candidates: topCandidates
                        })
                        stats.suggestionsFound++
                    }
                }
            }
        }

        // Cache'i temizle
        invalidateAllBookRelatedCaches(user.id)
        revalidatePath("/library")
        revalidatePath("/reading-lists")
        revalidatePath("/challenges")
        revalidatePath("/dashboard")

        return {
            success: true,
            stats,
            suggestions
        }
    } catch (error) {
        console.error("Repair links error:", error)
        return {
            success: false,
            stats: {
                readingListsScanned: 0,
                readingListsRepaired: 0,
                challengesScanned: 0,
                challengesRepaired: 0,
                suggestionsFound: 0
            },
            suggestions: []
        }
    }
}

/**
 * Önerilen eşleştirmeyi manuel olarak onayla
 * targetId: ReadingListBook.id veya ChallengeBook.id
 */
export async function confirmSuggestedLink(
    type: 'reading-list' | 'challenge',
    targetId: string,
    bookId: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Oturum açmanız gerekiyor" }
    }

    try {
        // Kitabın kullanıcıya ait olduğunu doğrula
        const book = await prisma.book.findFirst({
            where: { id: bookId, userId: user.id }
        })

        if (!book) {
            return { success: false, error: "Kitap bulunamadı" }
        }

        if (type === 'reading-list') {
            // targetId = ReadingListBook.id
            // Upsert: varsa güncelle, yoksa oluştur
            await prisma.userReadingListBook.upsert({
                where: {
                    userId_readingListBookId: {
                        userId: user.id,
                        readingListBookId: targetId
                    }
                },
                update: { bookId },
                create: {
                    userId: user.id,
                    readingListBookId: targetId,
                    bookId
                }
            })
        } else {
            // targetId = ChallengeBook.id
            // Önce kullanıcının progress'ini bul
            const challengeBook = await prisma.challengeBook.findUnique({
                where: { id: targetId },
                include: {
                    month: {
                        include: {
                            challenge: true
                        }
                    }
                }
            })

            if (!challengeBook) {
                return { success: false, error: "Challenge kitabı bulunamadı" }
            }

            // Kullanıcının progress'ini bul veya oluştur
            const userProgress = await prisma.userChallengeProgress.upsert({
                where: {
                    userId_challengeId: {
                        userId: user.id,
                        challengeId: challengeBook.month.challengeId
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    challengeId: challengeBook.month.challengeId
                }
            })

            // Kitap bağlantısını upsert et
            await prisma.userChallengeBook.upsert({
                where: {
                    userProgressId_challengeBookId: {
                        userProgressId: userProgress.id,
                        challengeBookId: targetId
                    }
                },
                update: { linkedBookId: bookId },
                create: {
                    userProgressId: userProgress.id,
                    challengeBookId: targetId,
                    linkedBookId: bookId,
                    status: 'NOT_STARTED'
                }
            })
        }

        invalidateAllBookRelatedCaches(user.id)
        revalidatePath("/library")
        revalidatePath("/reading-lists")
        revalidatePath("/challenges")

        return { success: true }
    } catch (error) {
        console.error("Confirm suggested link error:", error)
        return { success: false, error: "Bağlantı oluşturulamadı" }
    }
}

/**
 * Potansiyel bağlantı sayısını getir (quick check)
 * Kullanıcının kütüphanesindeki kitaplarla eşleşebilecek okuma listesi/challenge kitapları
 */
export async function getBrokenLinksCount(): Promise<{
    readingLists: number
    challenges: number
    total: number
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { readingLists: 0, challenges: 0, total: 0 }
    }

    try {
        // Kullanıcının kitaplarını al
        const userBooks = await prisma.book.findMany({
            where: { userId: user.id },
            select: { id: true }
        })

        if (userBooks.length === 0) {
            return { readingLists: 0, challenges: 0, total: 0 }
        }

        // Bağlı olmayan okuma listesi kitaplarını say
        const unboundReadingListBooks = await prisma.readingListBook.count({
            where: {
                userLinks: {
                    none: {
                        userId: user.id,
                        bookId: { not: null }
                    }
                }
            }
        })

        // Kullanıcının katıldığı challenge'lardaki bağlı olmayan kitapları say
        const userChallenges = await prisma.userChallengeProgress.findMany({
            where: { userId: user.id },
            select: { challengeId: true }
        })

        let unboundChallengeBooks = 0
        if (userChallenges.length > 0) {
            unboundChallengeBooks = await prisma.challengeBook.count({
                where: {
                    month: {
                        challengeId: { in: userChallenges.map(c => c.challengeId) }
                    },
                    userProgress: {
                        none: {
                            userProgress: { userId: user.id },
                            linkedBookId: { not: null }
                        }
                    }
                }
            })
        }

        return {
            readingLists: unboundReadingListBooks,
            challenges: unboundChallengeBooks,
            total: unboundReadingListBooks + unboundChallengeBooks
        }
    } catch (error) {
        console.error("Get broken links count error:", error)
        return { readingLists: 0, challenges: 0, total: 0 }
    }
}
