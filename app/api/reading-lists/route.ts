import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Cache'siz, her seferinde DB'den çeken API
// GET /api/reading-lists

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
    try {
        const lists = await prisma.readingList.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                levels: {
                    orderBy: { levelNumber: "asc" },
                    include: {
                        books: {
                            orderBy: { sortOrder: "asc" },
                            select: {
                                id: true,
                                title: true,
                                author: true,
                                neden: true,
                                pageCount: true
                            }
                        }
                    }
                }
            }
        })

        const result = lists.map(list => ({
            list: {
                name: list.name,
                slug: list.slug,
                description: list.description
            },
            levels: list.levels.map(level => ({
                levelNumber: level.levelNumber,
                name: level.name,
                description: level.description,
                books: level.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    neden: book.neden,
                    pageCount: book.pageCount
                }))
            }))
        }))

        return NextResponse.json(result, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache"
            }
        })
    } catch (error) {
        console.error("Failed to fetch reading lists:", error)
        return NextResponse.json(
            { error: "Failed to fetch reading lists" },
            { status: 500 }
        )
    }
}
