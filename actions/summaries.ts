"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function getBooksWithSummaries() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const books = await prisma.book.findMany({
            where: {
                userId: user.id,
                tortu: { not: null }
            },
            include: { author: true },
            orderBy: { updatedAt: 'desc' }
        })
        // Filter out empty tortus
        return books.filter(b => b.tortu && b.tortu.trim() !== '')
    } catch (error) {
        console.error("Failed to fetch summaries:", error)
        return []
    }
}
