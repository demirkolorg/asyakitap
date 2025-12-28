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

// PATCH /api/v1/books/[id]/progress - İlerleme güncelle
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
        const { currentPage } = body

        if (currentPage === undefined || currentPage === null) {
            return apiError("Sayfa numarası gerekli", "MISSING_PAGE", 400)
        }

        const page = parseInt(currentPage)
        if (isNaN(page) || page < 0) {
            return apiError("Geçersiz sayfa numarası", "INVALID_PAGE", 400)
        }

        // Kitap kontrol
        const book = await prisma.book.findFirst({
            where: { id, userId: user.id },
            include: { author: { select: { name: true } } },
        })

        if (!book) {
            return apiError("Kitap bulunamadı", "NOT_FOUND", 404)
        }

        // Sayfa sayısını aşmasın
        const validPage = book.pageCount ? Math.min(page, book.pageCount) : page
        const previousPage = book.currentPage

        // Status güncelleme mantığı
        let newStatus = book.status
        let startDate = book.startDate
        let endDate = book.endDate

        // Eğer ilk kez ilerleme kaydediliyorsa ve status TO_READ ise
        if (book.status === "TO_READ" && validPage > 0) {
            newStatus = "READING"
            startDate = new Date()
        }

        // Eğer kitap tamamlandıysa
        if (book.pageCount && validPage >= book.pageCount) {
            newStatus = "COMPLETED"
            endDate = new Date()
        }

        // Kitabı güncelle
        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                currentPage: validPage,
                status: newStatus,
                startDate,
                endDate,
            },
        })

        // Reading log ekle (sadece sayfa değiştiyse)
        let readingLog = null
        if (previousPage !== validPage) {
            readingLog = await prisma.readingLog.create({
                data: {
                    bookId: id,
                    action: "PROGRESS_UPDATE",
                    note: `Sayfa ${previousPage} → ${validPage}`,
                },
            })
        }

        const progress = book.pageCount
            ? Math.round((validPage / book.pageCount) * 100)
            : 0

        return apiSuccess({
            book: {
                id: updatedBook.id,
                title: book.title,
                author: book.author?.name,
                currentPage: validPage,
                previousPage,
                pageCount: book.pageCount,
                status: newStatus,
                progress,
                startDate: updatedBook.startDate,
                endDate: updatedBook.endDate,
            },
            log: readingLog
                ? {
                    id: readingLog.id,
                    action: readingLog.action,
                    note: readingLog.note,
                    createdAt: readingLog.createdAt,
                }
                : null,
            message:
                newStatus === "COMPLETED"
                    ? `"${book.title}" tamamlandı! Tebrikler!`
                    : `İlerleme: ${progress}%`,
        })
    } catch (error) {
        console.error("Update progress error:", error)
        return apiError("İlerleme güncellenemedi", "UPDATE_ERROR", 500)
    }
}
