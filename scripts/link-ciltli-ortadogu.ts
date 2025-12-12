import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.user.findFirst()
    if (!user) return

    // Her iki Ortadoğu kitabını bul
    const userBooks = await prisma.book.findMany({
        where: { userId: user.id, title: { contains: "Ortadoğu" } }
    })

    console.log("User books:")
    userBooks.forEach(b => console.log(" -", b.id, b.title))

    // Ciltli versiyonu bul
    const ciltliBook = userBooks.find(b => b.title.includes("1453"))
    if (!ciltliBook) {
        console.log("Ciltli kitap bulunamadı")
        return
    }

    // Bu kitap bağlı mı?
    const existingLink = await prisma.userReadingListBook.findFirst({
        where: { userId: user.id, bookId: ciltliBook.id }
    })

    if (existingLink) {
        console.log("Ciltli kitap zaten bağlı")
        return
    }

    // Listeden kitap bul
    const rlBook = await prisma.readingListBook.findFirst({
        where: { title: "Modern Ortadoğu Tarihi" }
    })

    if (!rlBook) {
        console.log("RL kitap bulunamadı")
        return
    }

    // Aynı RL kitabına başka bir bağlantı var mı?
    const otherLink = await prisma.userReadingListBook.findFirst({
        where: { userId: user.id, readingListBookId: rlBook.id }
    })

    if (otherLink) {
        // Diğer link'in kitabını kontrol et
        if (otherLink.bookId !== ciltliBook.id) {
            console.log("Farklı bir kitap zaten bağlı:", otherLink.bookId)
            // İkinci bir bağlantı oluşturamayız, aynı RL kitabına sadece bir bağlantı olabilir
            // Ciltli versiyon rafsız kalacak
        }
    } else {
        await prisma.userReadingListBook.create({
            data: {
                userId: user.id,
                readingListBookId: rlBook.id,
                bookId: ciltliBook.id
            }
        })
        console.log("✅ Ciltli versiyon bağlandı")
    }
}

main().finally(() => prisma.$disconnect())
