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
    targetId: string
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
 * Kullanıcının tüm kopuk bağlantılarını tarayıp onar
 * 1. Reading List bağlantılarını kontrol et
 * 2. Challenge bağlantılarını kontrol et
 * 3. %75+ eşleşmeleri otomatik onar
 * 4. %45-75 arası eşleşmeleri öneri olarak döndür
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

        const stats: RepairStats = {
            readingListsScanned: 0,
            readingListsRepaired: 0,
            challengesScanned: 0,
            challengesRepaired: 0,
            suggestionsFound: 0
        }

        const suggestions: RepairSuggestion[] = []

        // 1. READING LISTS - Kopuk bağlantıları bul ve onar
        const brokenReadingListLinks = await prisma.userReadingListBook.findMany({
            where: {
                userId: user.id,
                bookId: null // Bağlantı kopuk
            },
            include: {
                readingListBook: {
                    include: {
                        level: {
                            include: {
                                readingList: { select: { name: true, slug: true } }
                            }
                        }
                    }
                }
            }
        })

        stats.readingListsScanned = brokenReadingListLinks.length

        for (const link of brokenReadingListLinks) {
            const candidates: RepairCandidate[] = []
            let repaired = false

            for (const userBook of userBooks) {
                const authorName = userBook.author?.name || ""
                const score = matchBookScore(
                    link.readingListBook.title,
                    link.readingListBook.author,
                    userBook.title,
                    authorName
                )

                if (isAutoLinkable(score)) {
                    // %75+ - Otomatik onar
                    await prisma.userReadingListBook.update({
                        where: { id: link.id },
                        data: { bookId: userBook.id }
                    })
                    stats.readingListsRepaired++
                    repaired = true
                    break
                } else if (isSuggestionWorthy(score)) {
                    candidates.push({
                        bookId: userBook.id,
                        bookTitle: userBook.title,
                        score,
                        confidence: getMatchConfidence(score)
                    })
                }
            }

            // Otomatik onarılmadıysa ve aday varsa, öneri olarak ekle
            if (!repaired && candidates.length > 0) {
                const topCandidates = candidates
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)

                suggestions.push({
                    type: 'reading-list',
                    targetId: link.id,
                    targetTitle: link.readingListBook.title,
                    targetAuthor: link.readingListBook.author,
                    listOrChallengeName: link.readingListBook.level.readingList.name,
                    candidates: topCandidates
                })
                stats.suggestionsFound++
            }
        }

        // 2. CHALLENGES - Kopuk bağlantıları bul ve onar
        const brokenChallengeLinks = await prisma.userChallengeBook.findMany({
            where: {
                userProgress: { userId: user.id },
                linkedBookId: null
            },
            include: {
                challengeBook: {
                    include: {
                        month: {
                            include: {
                                challenge: { select: { name: true, year: true } }
                            }
                        }
                    }
                }
            }
        })

        stats.challengesScanned = brokenChallengeLinks.length

        for (const link of brokenChallengeLinks) {
            const candidates: RepairCandidate[] = []
            let repaired = false

            for (const userBook of userBooks) {
                const authorName = userBook.author?.name || ""
                const score = matchBookScore(
                    link.challengeBook.title,
                    link.challengeBook.author,
                    userBook.title,
                    authorName
                )

                if (isAutoLinkable(score)) {
                    // %75+ - Otomatik onar
                    await prisma.userChallengeBook.update({
                        where: { id: link.id },
                        data: { linkedBookId: userBook.id }
                    })
                    stats.challengesRepaired++
                    repaired = true
                    break
                } else if (isSuggestionWorthy(score)) {
                    candidates.push({
                        bookId: userBook.id,
                        bookTitle: userBook.title,
                        score,
                        confidence: getMatchConfidence(score)
                    })
                }
            }

            if (!repaired && candidates.length > 0) {
                const topCandidates = candidates
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)

                suggestions.push({
                    type: 'challenge',
                    targetId: link.id,
                    targetTitle: link.challengeBook.title,
                    targetAuthor: link.challengeBook.author,
                    listOrChallengeName: `${link.challengeBook.month.challenge.name} (${link.challengeBook.month.challenge.year})`,
                    candidates: topCandidates
                })
                stats.suggestionsFound++
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
            await prisma.userReadingListBook.update({
                where: { id: targetId },
                data: { bookId }
            })
        } else {
            await prisma.userChallengeBook.update({
                where: { id: targetId },
                data: { linkedBookId: bookId }
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
 * Kopuk bağlantı sayısını getir (quick check)
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
        const [readingListCount, challengeCount] = await Promise.all([
            prisma.userReadingListBook.count({
                where: {
                    userId: user.id,
                    bookId: null
                }
            }),
            prisma.userChallengeBook.count({
                where: {
                    userProgress: { userId: user.id },
                    linkedBookId: null
                }
            })
        ])

        return {
            readingLists: readingListCount,
            challenges: challengeCount,
            total: readingListCount + challengeCount
        }
    } catch (error) {
        console.error("Get broken links count error:", error)
        return { readingLists: 0, challenges: 0, total: 0 }
    }
}
