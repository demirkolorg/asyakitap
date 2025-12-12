import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.user.findFirst()
    if (!user) return

    // Modern Ortadoğu Tarihi - kullanıcı kitabı
    const userBook = await prisma.book.findFirst({
        where: { userId: user.id, title: { contains: "Modern Ortadoğu" } }
    })

    // Listeden kitap
    const rlBook = await prisma.readingListBook.findFirst({
        where: { title: { contains: "Modern Ortadoğu" } }
    })

    console.log("User book:", userBook?.title)
    console.log("RL book:", rlBook?.title)

    if (userBook && rlBook) {
        // Mevcut bağlantıyı kontrol et
        const existingLink = await prisma.userReadingListBook.findFirst({
            where: { userId: user.id, readingListBookId: rlBook.id }
        })

        if (existingLink) {
            console.log("Existing link found, bookId:", existingLink.bookId)
            if (!existingLink.bookId) {
                await prisma.userReadingListBook.update({
                    where: { id: existingLink.id },
                    data: { bookId: userBook.id }
                })
                console.log("✅ Link updated!")
            } else {
                console.log("Already linked")
            }
        } else {
            await prisma.userReadingListBook.create({
                data: {
                    userId: user.id,
                    readingListBookId: rlBook.id,
                    bookId: userBook.id
                }
            })
            console.log("✅ New link created!")
        }
    }
}

main().finally(() => prisma.$disconnect())
