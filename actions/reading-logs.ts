"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ReadingAction } from "@prisma/client"

export async function addReadingLog(bookId: string, action: ReadingAction, note?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        const log = await prisma.readingLog.create({
            data: {
                bookId,
                action,
                note,
            },
        })

        revalidatePath(`/book/${bookId}`)
        return { success: true, log }
    } catch (error) {
        console.error("Failed to add reading log:", error)
        return { success: false, error: "Log eklenemedi" }
    }
}

export async function getReadingLogs(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const logs = await prisma.readingLog.findMany({
            where: { bookId },
            orderBy: { createdAt: 'desc' },
        })
        return logs
    } catch (error) {
        console.error("Failed to fetch reading logs:", error)
        return []
    }
}
