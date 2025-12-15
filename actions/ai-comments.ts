"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { AICommentSource } from "@prisma/client"

export interface AICommentWithBook {
    id: string
    source: AICommentSource
    userContent: string
    aiComment: string
    createdAt: Date
    book: {
        id: string
        title: string
        coverUrl: string | null
        author: { name: string } | null
    }
}

export interface AICommentsStats {
    total: number
    tortuCount: number
    imzaCount: number
}

export interface AICommentsPageData {
    comments: AICommentWithBook[]
    stats: AICommentsStats
}

export async function getAICommentsPageData(
    filter?: "all" | "TORTU" | "IMZA"
): Promise<AICommentsPageData | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        // Filtre için where koşulu
        const sourceFilter = filter && filter !== "all"
            ? { source: filter as AICommentSource }
            : {}

        const [comments, stats] = await Promise.all([
            // AI yorumları - kullanıcının kitaplarına ait olanlar
            prisma.aIComment.findMany({
                where: {
                    book: { userId: user.id },
                    ...sourceFilter
                },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            coverUrl: true,
                            author: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            }),

            // İstatistikler
            Promise.all([
                prisma.aIComment.count({
                    where: { book: { userId: user.id } }
                }),
                prisma.aIComment.count({
                    where: { book: { userId: user.id }, source: "TORTU" }
                }),
                prisma.aIComment.count({
                    where: { book: { userId: user.id }, source: "IMZA" }
                })
            ]).then(([total, tortuCount, imzaCount]) => ({
                total,
                tortuCount,
                imzaCount
            }))
        ])

        return { comments, stats }
    } catch (error) {
        console.error("Failed to fetch AI comments:", error)
        return null
    }
}

// Mevcut verileri AIComment tablosuna taşıma (migration helper)
export async function migrateExistingAIComments() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: "Unauthorized" }

    try {
        // Mevcut AI yorumu olan kitapları bul
        const booksWithAiComments = await prisma.book.findMany({
            where: {
                userId: user.id,
                OR: [
                    { tortuAiComment: { not: null } },
                    { imzaAiComment: { not: null } }
                ]
            },
            select: {
                id: true,
                tortu: true,
                tortuAiComment: true,
                imza: true,
                imzaAiComment: true,
                updatedAt: true
            }
        })

        let migratedCount = 0

        for (const book of booksWithAiComments) {
            // Tortu AI yorumu varsa ve henüz migrate edilmemişse
            if (book.tortuAiComment && book.tortu) {
                const existing = await prisma.aIComment.findFirst({
                    where: {
                        bookId: book.id,
                        source: "TORTU"
                    }
                })

                if (!existing) {
                    await prisma.aIComment.create({
                        data: {
                            bookId: book.id,
                            source: "TORTU",
                            userContent: book.tortu,
                            aiComment: book.tortuAiComment
                        }
                    })
                    migratedCount++
                }
            }

            // İmza AI yorumu varsa ve henüz migrate edilmemişse
            if (book.imzaAiComment && book.imza) {
                const existing = await prisma.aIComment.findFirst({
                    where: {
                        bookId: book.id,
                        source: "IMZA"
                    }
                })

                if (!existing) {
                    await prisma.aIComment.create({
                        data: {
                            bookId: book.id,
                            source: "IMZA",
                            userContent: book.imza,
                            aiComment: book.imzaAiComment
                        }
                    })
                    migratedCount++
                }
            }
        }

        return {
            success: true,
            message: `${migratedCount} AI yorumu migrate edildi.`
        }
    } catch (error) {
        console.error("Migration failed:", error)
        return { success: false, message: "Migration başarısız oldu." }
    }
}
