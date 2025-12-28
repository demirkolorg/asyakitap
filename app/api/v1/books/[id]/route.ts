import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError, apiOptions } from "@/lib/api/response"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getAuthUser(request: Request) {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null
    }
    const token = authHeader.replace("Bearer ", "")
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user
}

export async function OPTIONS() {
    return apiOptions()
}

// GET /api/v1/books/[id] - Kitap detayı
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const { id } = await params

        const book = await prisma.book.findFirst({
            where: {
                id,
                userId: user.id,
            },
            include: {
                author: { select: { id: true, name: true, imageUrl: true } },
                publisher: { select: { id: true, name: true } },
                readingLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        })

        if (!book) {
            return apiError("Kitap bulunamadı", "NOT_FOUND", 404)
        }

        return apiSuccess({
            id: book.id,
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            coverUrl: book.coverUrl,
            pageCount: book.pageCount,
            currentPage: book.currentPage,
            status: book.status,
            progress: book.pageCount
                ? Math.round((book.currentPage / book.pageCount) * 100)
                : 0,
            isbn: book.isbn,
            description: book.description,
            startDate: book.startDate,
            endDate: book.endDate,
            readingLogs: book.readingLogs,
            updatedAt: book.updatedAt,
        })
    } catch (error) {
        console.error("Get book error:", error)
        return apiError("Kitap yüklenemedi", "FETCH_ERROR", 500)
    }
}

// PATCH /api/v1/books/[id] - Kitap güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const { id } = await params
        const body = await request.json()

        // Kitap kullanıcıya ait mi kontrol et
        const existingBook = await prisma.book.findFirst({
            where: { id, userId: user.id },
        })

        if (!existingBook) {
            return apiError("Kitap bulunamadı", "NOT_FOUND", 404)
        }

        const { currentPage, status, startDate, endDate } = body

        const updateData: Record<string, unknown> = {}

        if (currentPage !== undefined) {
            updateData.currentPage = parseInt(currentPage)
        }

        if (status !== undefined) {
            updateData.status = status
            // Status değişikliğinde otomatik tarih ayarla
            if (status === "READING" && !existingBook.startDate) {
                updateData.startDate = new Date()
            }
            if (status === "COMPLETED" && !existingBook.endDate) {
                updateData.endDate = new Date()
            }
        }

        if (startDate !== undefined) {
            updateData.startDate = startDate ? new Date(startDate) : null
        }

        if (endDate !== undefined) {
            updateData.endDate = endDate ? new Date(endDate) : null
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: updateData,
            include: {
                author: { select: { name: true } },
            },
        })

        return apiSuccess({
            book: {
                id: updatedBook.id,
                title: updatedBook.title,
                author: updatedBook.author?.name,
                currentPage: updatedBook.currentPage,
                pageCount: updatedBook.pageCount,
                status: updatedBook.status,
                progress: updatedBook.pageCount
                    ? Math.round((updatedBook.currentPage / updatedBook.pageCount) * 100)
                    : 0,
            },
            message: "Kitap güncellendi",
        })
    } catch (error) {
        console.error("Update book error:", error)
        return apiError("Kitap güncellenemedi", "UPDATE_ERROR", 500)
    }
}

// DELETE /api/v1/books/[id] - Kitap sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const { id } = await params

        const existingBook = await prisma.book.findFirst({
            where: { id, userId: user.id },
        })

        if (!existingBook) {
            return apiError("Kitap bulunamadı", "NOT_FOUND", 404)
        }

        await prisma.book.delete({ where: { id } })

        return apiSuccess({ message: "Kitap silindi" })
    } catch (error) {
        console.error("Delete book error:", error)
        return apiError("Kitap silinemedi", "DELETE_ERROR", 500)
    }
}
