import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.user.findFirst()
    if (!user) return

    // Ciltli kitabı bul
    const ciltliBook = await prisma.book.findFirst({
        where: { userId: user.id, title: { contains: "1453-2015" } }
    })

    if (!ciltliBook) {
        console.log("Ciltli kitap bulunamadı")
        return
    }

    console.log("Ciltli kitap:", ciltliBook.title)

    // Orta Doğu seviyesini bul
    const level = await prisma.readingListLevel.findFirst({
        where: { name: { contains: "Orta Doğu" } },
        include: { readingList: true }
    })

    if (!level) {
        console.log("Seviye bulunamadı")
        return
    }

    console.log("Seviye:", level.readingList.name, "-", level.name)

    // Max sortOrder
    const maxSort = await prisma.readingListBook.aggregate({
        where: { levelId: level.id },
        _max: { sortOrder: true }
    })

    // Yeni ReadingListBook oluştur
    const newRLBook = await prisma.readingListBook.create({
        data: {
            levelId: level.id,
            title: "Modern Ortadoğu Tarihi (Genişletilmiş Baskı)",
            author: "James L. Gelvin",
            neden: "1453-2015 arası Orta Doğu tarihinin kapsamlı akademik analizi. Genişletilmiş ciltli baskı.",
            sortOrder: (maxSort._max.sortOrder ?? 0) + 1
        }
    })

    console.log("✅ ReadingListBook oluşturuldu:", newRLBook.title)

    // Bağlantı oluştur
    await prisma.userReadingListBook.create({
        data: {
            userId: user.id,
            readingListBookId: newRLBook.id,
            bookId: ciltliBook.id
        }
    })

    console.log("✅ Kitap bağlandı!")
}

main().finally(() => prisma.$disconnect())
