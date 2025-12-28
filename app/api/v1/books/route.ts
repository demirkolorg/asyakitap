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

// GET /api/v1/books - Kullanıcının kitaplarını getir
export async function GET(request: Request) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status") // TO_READ, READING, COMPLETED, DNF
        const limit = parseInt(searchParams.get("limit") || "50")

        const books = await prisma.book.findMany({
            where: {
                userId: user.id,
                ...(status && { status: status as "TO_READ" | "READING" | "COMPLETED" | "DNF" }),
            },
            include: {
                author: { select: { id: true, name: true, imageUrl: true } },
                publisher: { select: { id: true, name: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        })

        // Stats
        const stats = await prisma.book.groupBy({
            by: ["status"],
            where: { userId: user.id },
            _count: { id: true },
        })

        const statsMap = {
            total: 0,
            toRead: 0,
            reading: 0,
            completed: 0,
            dnf: 0,
        }

        stats.forEach((s) => {
            statsMap.total += s._count.id
            if (s.status === "TO_READ") statsMap.toRead = s._count.id
            if (s.status === "READING") statsMap.reading = s._count.id
            if (s.status === "COMPLETED") statsMap.completed = s._count.id
            if (s.status === "DNF") statsMap.dnf = s._count.id
        })

        return apiSuccess({
            books: books.map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author?.name || "Bilinmeyen",
                authorId: book.authorId,
                coverUrl: book.coverUrl,
                pageCount: book.pageCount,
                currentPage: book.currentPage,
                status: book.status,
                progress: book.pageCount
                    ? Math.round((book.currentPage / book.pageCount) * 100)
                    : 0,
                publisher: book.publisher?.name,
                isbn: book.isbn,
                updatedAt: book.updatedAt,
            })),
            stats: statsMap,
        })
    } catch (error) {
        console.error("Get books error:", error)
        return apiError("Kitaplar yüklenemedi", "FETCH_ERROR", 500)
    }
}

// POST /api/v1/books - Yeni kitap ekle
export async function POST(request: Request) {
    try {
        const user = await getAuthUser(request)
        if (!user) {
            return apiError("Yetkilendirme gerekli", "UNAUTHORIZED", 401)
        }

        const body = await request.json()
        const { title, author, coverUrl, pageCount, isbn, publisher, description, source } = body

        if (!title || !author) {
            return apiError("Kitap adı ve yazar gerekli", "MISSING_FIELDS", 400)
        }

        // Kitap zaten var mı kontrol et
        const existingBook = await prisma.book.findFirst({
            where: {
                userId: user.id,
                title: { equals: title, mode: "insensitive" },
            },
        })

        if (existingBook) {
            return apiError(
                `"${title}" zaten ktphanenizde mevcut`,
                "ALREADY_EXISTS",
                409,
                { bookId: existingBook.id }
            )
        }

        // Yazar bul veya oluştur
        let authorRecord = await prisma.author.findFirst({
            where: { name: { equals: author, mode: "insensitive" } },
        })

        if (!authorRecord) {
            authorRecord = await prisma.author.create({
                data: { name: author },
            })
        }

        // Yayınevi bul veya oluştur
        let publisherRecord = null
        if (publisher) {
            publisherRecord = await prisma.publisher.findFirst({
                where: { name: { equals: publisher, mode: "insensitive" } },
            })
            if (!publisherRecord) {
                publisherRecord = await prisma.publisher.create({
                    data: { name: publisher },
                })
            }
        }

        // Kitap oluştur
        const newBook = await prisma.book.create({
            data: {
                userId: user.id,
                title,
                authorId: authorRecord.id,
                publisherId: publisherRecord?.id,
                coverUrl,
                pageCount: pageCount ? parseInt(pageCount) : null,
                isbn,
                description,
                status: "TO_READ",
            },
            include: {
                author: { select: { name: true } },
                publisher: { select: { name: true } },
            },
        })

        return apiSuccess(
            {
                book: {
                    id: newBook.id,
                    title: newBook.title,
                    author: newBook.author?.name,
                    coverUrl: newBook.coverUrl,
                    pageCount: newBook.pageCount,
                    status: newBook.status,
                    source: source || "extension",
                },
                message: `"${title}" ktphanenize eklendi`,
            },
            201
        )
    } catch (error) {
        console.error("Add book error:", error)
        return apiError("Kitap eklenemedi", "CREATE_ERROR", 500)
    }
}
