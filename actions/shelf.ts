"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getShelves() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        const shelves = await prisma.shelf.findMany({
            where: { userId: user.id },
            include: {
                books: {
                    include: {
                        author: true,
                        publisher: true,
                        shelf: true
                    },
                    orderBy: { title: 'asc' }
                },
                _count: {
                    select: { books: true }
                }
            },
            orderBy: { sortOrder: 'asc' }
        })
        return shelves
    } catch (error) {
        console.error("Failed to fetch shelves:", error)
        return []
    }
}

export async function getShelfById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const shelf = await prisma.shelf.findFirst({
            where: { id, userId: user.id },
            include: {
                books: {
                    include: {
                        author: true,
                        publisher: true
                    },
                    orderBy: { title: 'asc' }
                }
            }
        })
        return shelf
    } catch (error) {
        console.error("Failed to fetch shelf:", error)
        return null
    }
}

export async function createShelf(data: {
    name: string
    description?: string
    color?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Get max sortOrder
        const maxOrder = await prisma.shelf.findFirst({
            where: { userId: user.id },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true }
        })

        const shelf = await prisma.shelf.create({
            data: {
                userId: user.id,
                name: data.name,
                description: data.description,
                color: data.color,
                sortOrder: (maxOrder?.sortOrder ?? -1) + 1
            }
        })

        revalidatePath("/library")
        return { success: true, shelf }
    } catch (error) {
        console.error("Failed to create shelf:", error)
        return { success: false, error: "Raf oluşturulamadı" }
    }
}

export async function updateShelf(id: string, data: {
    name?: string
    description?: string | null
    color?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        const shelf = await prisma.shelf.update({
            where: { id },
            data
        })

        revalidatePath("/library")
        return { success: true, shelf }
    } catch (error) {
        console.error("Failed to update shelf:", error)
        return { success: false, error: "Raf güncellenemedi" }
    }
}

export async function deleteShelf(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Transaction ile atomik işlem: kitapları güncelle + rafı sil
        await prisma.$transaction([
            prisma.book.updateMany({
                where: { shelfId: id },
                data: { shelfId: null }
            }),
            prisma.shelf.delete({
                where: { id }
            })
        ])

        revalidatePath("/library")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete shelf:", error)
        return { success: false, error: "Raf silinemedi" }
    }
}

export async function addBookToShelf(bookId: string, shelfId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Paralel sorgu: Kitap ve raf doğrulama
        const [book, shelf] = await Promise.all([
            prisma.book.findFirst({
                where: { id: bookId, userId: user.id },
                select: { id: true }
            }),
            prisma.shelf.findFirst({
                where: { id: shelfId, userId: user.id },
                select: { id: true }
            })
        ])

        if (!book) {
            return { success: false, error: "Kitap bulunamadı" }
        }

        if (!shelf) {
            return { success: false, error: "Raf bulunamadı" }
        }

        // Update book's shelf
        await prisma.book.update({
            where: { id: bookId },
            data: { shelfId }
        })

        revalidatePath("/library")
        revalidatePath(`/book/${bookId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add book to shelf:", error)
        return { success: false, error: "Kitap rafa eklenemedi" }
    }
}

export async function removeBookFromShelf(bookId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Verify book belongs to user
        const book = await prisma.book.findFirst({
            where: { id: bookId, userId: user.id }
        })

        if (!book) {
            return { success: false, error: "Kitap bulunamadı" }
        }

        // Remove book from shelf
        await prisma.book.update({
            where: { id: bookId },
            data: { shelfId: null }
        })

        revalidatePath("/library")
        revalidatePath(`/book/${bookId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to remove book from shelf:", error)
        return { success: false, error: "Kitap raftan çıkarılamadı" }
    }
}

export async function reorderShelves(shelfIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // Update each shelf's sortOrder
        await Promise.all(
            shelfIds.map((id, index) =>
                prisma.shelf.update({
                    where: { id },
                    data: { sortOrder: index }
                })
            )
        )

        revalidatePath("/library")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder shelves:", error)
        return { success: false, error: "Raflar yeniden sıralanamadı" }
    }
}
