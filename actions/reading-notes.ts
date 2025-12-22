"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

// Types
export interface ReadingNote {
    id: string
    bookId: string
    content: string
    page: number | null
    mood: string | null
    createdAt: Date
    updatedAt: Date
    book?: {
        id: string
        title: string
        coverUrl: string | null
        author: { name: string } | null
    }
}

// ==========================================
// Okuma Notu Ekle
// ==========================================
export async function addReadingNote(
    bookId: string,
    content: string,
    page?: number,
    mood?: string
): Promise<{ success: boolean; note?: ReadingNote; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Kitabın kullanıcıya ait olduğunu kontrol et
    const book = await prisma.book.findFirst({
        where: { id: bookId, userId: user.id }
    })

    if (!book) {
        return { success: false, error: "Kitap bulunamadı" }
    }

    try {
        const note = await prisma.readingNote.create({
            data: {
                bookId,
                content,
                page: page || null,
                mood: mood || null
            }
        })

        revalidateTag(CACHE_TAGS.book(bookId), 'max')
        revalidateTag(CACHE_TAGS.userBooks(user.id), 'max')

        return { success: true, note: note as ReadingNote }
    } catch (error) {
        console.error("Failed to add reading note:", error)
        return { success: false, error: "Not eklenirken hata oluştu" }
    }
}

// ==========================================
// Okuma Notu Güncelle
// ==========================================
export async function updateReadingNote(
    noteId: string,
    content: string,
    page?: number,
    mood?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Notun kullanıcıya ait olduğunu kontrol et
    const note = await prisma.readingNote.findFirst({
        where: { id: noteId },
        include: { book: { select: { userId: true } } }
    })

    if (!note || note.book.userId !== user.id) {
        return { success: false, error: "Not bulunamadı" }
    }

    try {
        await prisma.readingNote.update({
            where: { id: noteId },
            data: {
                content,
                page: page || null,
                mood: mood || null
            }
        })

        revalidateTag(CACHE_TAGS.book(note.bookId), 'max')
        revalidateTag(CACHE_TAGS.userBooks(user.id), 'max')

        return { success: true }
    } catch (error) {
        console.error("Failed to update reading note:", error)
        return { success: false, error: "Not güncellenirken hata oluştu" }
    }
}

// ==========================================
// Okuma Notu Sil
// ==========================================
export async function deleteReadingNote(
    noteId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Notun kullanıcıya ait olduğunu kontrol et
    const note = await prisma.readingNote.findFirst({
        where: { id: noteId },
        include: { book: { select: { userId: true, id: true } } }
    })

    if (!note || note.book.userId !== user.id) {
        return { success: false, error: "Not bulunamadı" }
    }

    try {
        await prisma.readingNote.delete({
            where: { id: noteId }
        })

        revalidateTag(CACHE_TAGS.book(note.book.id), 'max')
        revalidateTag(CACHE_TAGS.userBooks(user.id), 'max')

        return { success: true }
    } catch (error) {
        console.error("Failed to delete reading note:", error)
        return { success: false, error: "Not silinirken hata oluştu" }
    }
}

// ==========================================
// Kitabın Okuma Notlarını Getir
// ==========================================
export async function getBookReadingNotes(
    bookId: string
): Promise<{ success: boolean; notes?: ReadingNote[]; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const notes = await prisma.readingNote.findMany({
            where: {
                bookId,
                book: { userId: user.id }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, notes: notes as ReadingNote[] }
    } catch (error) {
        console.error("Failed to get reading notes:", error)
        return { success: false, error: "Notlar yüklenirken hata oluştu" }
    }
}

// ==========================================
// Tüm Okuma Notlarını Getir (Kullanıcının)
// ==========================================
export async function getAllReadingNotes(): Promise<{
    success: boolean
    notes?: (ReadingNote & {
        book: {
            id: string
            title: string
            coverUrl: string | null
            author: { name: string } | null
        }
    })[]
    error?: string
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const notes = await prisma.readingNote.findMany({
            where: {
                book: { userId: user.id }
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        author: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, notes: notes as any }
    } catch (error) {
        console.error("Failed to get all reading notes:", error)
        return { success: false, error: "Notlar yüklenirken hata oluştu" }
    }
}

// MOOD_OPTIONS moved to lib/constants.ts
