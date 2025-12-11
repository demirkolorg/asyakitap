"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAuthors(search?: string) {
    try {
        const authors = await prisma.author.findMany({
            where: search ? {
                name: {
                    contains: search,
                    mode: 'insensitive'
                }
            } : undefined,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                _count: {
                    select: { books: true }
                }
            }
        })
        return authors
    } catch (error) {
        console.error("Failed to fetch authors:", error)
        return []
    }
}

export async function createAuthor(data: {
    name: string
    imageUrl?: string
    bio?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        const author = await prisma.author.create({
            data: {
                name: data.name,
                imageUrl: data.imageUrl,
                bio: data.bio
            }
        })
        revalidatePath("/authors")
        return { success: true, author }
    } catch (error) {
        console.error("Failed to create author:", error)
        return { success: false, error: "Yazar oluşturulamadı" }
    }
}

export async function getAuthorById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const author = await prisma.author.findUnique({
            where: { id },
            include: {
                books: {
                    where: { userId: user.id },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true,
                        status: true,
                        imza: true,
                        pageCount: true,
                        currentPage: true,
                        createdAt: true
                    }
                }
            }
        })
        return author
    } catch (error) {
        console.error("Failed to fetch author:", error)
        return null
    }
}

export async function updateAuthor(id: string, data: {
    name?: string
    imageUrl?: string | null
    bio?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        const author = await prisma.author.update({
            where: { id },
            data
        })
        revalidatePath(`/author/${id}`)
        revalidatePath("/authors")
        return { success: true, author }
    } catch (error) {
        console.error("Failed to update author:", error)
        return { success: false, error: "Yazar güncellenemedi" }
    }
}

export async function getAuthorsWithBooks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        // Kullanıcının kitaplarındaki yazarları getir
        const authors = await prisma.author.findMany({
            where: {
                books: {
                    some: { userId: user.id }
                }
            },
            include: {
                _count: {
                    select: {
                        books: {
                            where: { userId: user.id }
                        }
                    }
                },
                books: {
                    where: { userId: user.id },
                    select: { imza: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        // İmza sayısını hesapla
        return authors.map((author: typeof authors[number]) => ({
            id: author.id,
            name: author.name,
            imageUrl: author.imageUrl,
            bio: author.bio,
            _count: author._count,
            booksWithImza: author.books.filter((b: typeof author.books[number]) => b.imza && b.imza.trim() !== '').length
        }))
    } catch (error) {
        console.error("Failed to fetch authors with books:", error)
        return []
    }
}

export async function getOrCreateAuthor(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        // Önce mevcut yazarı ara
        let author = await prisma.author.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        })

        // Yoksa oluştur
        if (!author) {
            author = await prisma.author.create({
                data: { name }
            })
        }

        return { success: true, author }
    } catch (error) {
        console.error("Failed to get or create author:", error)
        return { success: false, error: "Yazar işlemi başarısız" }
    }
}
