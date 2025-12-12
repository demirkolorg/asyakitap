import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Bağlı kitap ID'lerini al
    const linkedBookIds = await prisma.userReadingListBook.findMany({
        where: { bookId: { not: null } },
        select: { bookId: true }
    })
    const linkedIds = linkedBookIds.map(l => l.bookId).filter(Boolean) as string[]

    // Bağlı olmayan kitapları al
    const unlinkedBooks = await prisma.book.findMany({
        where: {
            id: { notIn: linkedIds }
        },
        include: { author: true },
        orderBy: { title: "asc" }
    })

    console.log(`Rafsız Kitaplar (${unlinkedBooks.length} adet):`)
    console.log("")
    unlinkedBooks.forEach((book, i) => {
        console.log(`${i + 1}. "${book.title}" - ${book.author?.name || "Yazar yok"}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
