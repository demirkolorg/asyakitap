"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPublishers(search?: string) {
    try {
        const publishers = await prisma.publisher.findMany({
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
                website: true,
                _count: {
                    select: { books: true }
                }
            }
        })
        return publishers
    } catch (error) {
        console.error("Failed to fetch publishers:", error)
        return []
    }
}

export async function getPublishersWithBooks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        // Get publishers that have books belonging to the user
        const publishers = await prisma.publisher.findMany({
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
                }
            },
            orderBy: { name: 'asc' }
        })

        return publishers
    } catch (error) {
        console.error("Failed to fetch publishers with books:", error)
        return []
    }
}

export async function getPublisherById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
        const publisher = await prisma.publisher.findUnique({
            where: { id },
            include: {
                books: {
                    where: { userId: user.id },
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        author: true
                    }
                }
            }
        })
        return publisher
    } catch (error) {
        console.error("Failed to fetch publisher:", error)
        return null
    }
}

export async function createPublisher(data: {
    name: string
    imageUrl?: string
    website?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        const publisher = await prisma.publisher.create({
            data: {
                name: data.name,
                imageUrl: data.imageUrl,
                website: data.website
            }
        })
        revalidatePath("/publishers")
        return { success: true, publisher }
    } catch (error) {
        console.error("Failed to create publisher:", error)
        return { success: false, error: "Yayınevi oluşturulamadı" }
    }
}

export async function updatePublisher(id: string, data: {
    name?: string
    imageUrl?: string | null
    website?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        const publisher = await prisma.publisher.update({
            where: { id },
            data
        })
        revalidatePath(`/publisher/${id}`)
        revalidatePath("/publishers")
        return { success: true, publisher }
    } catch (error) {
        console.error("Failed to update publisher:", error)
        return { success: false, error: "Yayınevi güncellenemedi" }
    }
}

export async function getOrCreatePublisher(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Giriş yapmalısınız" }
    }

    try {
        // First try to find existing publisher
        let publisher = await prisma.publisher.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        })

        // If not found, create new
        if (!publisher) {
            publisher = await prisma.publisher.create({
                data: { name }
            })
        }

        return { success: true, publisher }
    } catch (error) {
        console.error("Failed to get or create publisher:", error)
        return { success: false, error: "Yayınevi işlemi başarısız" }
    }
}
