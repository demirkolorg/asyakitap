import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Kalan kitapları bağlama işlemi...\n")

    const user = await prisma.user.findFirst()
    if (!user) {
        console.log("Kullanıcı bulunamadı!")
        return
    }

    let linked = 0

    // 1. Beyaz Diş
    const beyazDis = await prisma.book.findFirst({
        where: { userId: user.id, title: { contains: "Beyaz Diş" } }
    })
    const beyazDisRL = await prisma.readingListBook.findFirst({
        where: { title: "Beyaz Diş" }
    })
    if (beyazDis && beyazDisRL) {
        const exists = await prisma.userReadingListBook.findUnique({
            where: { userId_readingListBookId: { userId: user.id, readingListBookId: beyazDisRL.id } }
        })
        if (!exists) {
            await prisma.userReadingListBook.create({
                data: { userId: user.id, readingListBookId: beyazDisRL.id, bookId: beyazDis.id }
            })
            console.log(`✅ "Beyaz Diş (Karton Kapak)" bağlandı`)
            linked++
        }
    }

    // 2. Modern Ortadoğu Tarihi (Ciltli versiyon)
    const modernOrtadogu = await prisma.book.findFirst({
        where: { userId: user.id, title: { contains: "Modern Ortadoğu Tarihi 1453" } }
    })
    const modernOrtadoguRL = await prisma.readingListBook.findFirst({
        where: { title: "Modern Ortadoğu Tarihi" }
    })
    if (modernOrtadogu && modernOrtadoguRL) {
        const exists = await prisma.userReadingListBook.findUnique({
            where: { userId_readingListBookId: { userId: user.id, readingListBookId: modernOrtadoguRL.id } }
        })
        if (!exists) {
            await prisma.userReadingListBook.create({
                data: { userId: user.id, readingListBookId: modernOrtadoguRL.id, bookId: modernOrtadogu.id }
            })
            console.log(`✅ "Modern Ortadoğu Tarihi 1453-2015 (Ciltli)" bağlandı`)
            linked++
        }
    }

    // 3-7. Sherlock Holmes Bütün Hikayeler serisi
    const sherlockBooks = [
        { userTitle: "Suç Uyanıyor / Bütün Hikayeler 1", rlTitle: "Sherlock Holmes - Bütün Hikayeler 1" },
        { userTitle: "Oyun Başladı / Bütün Hikayeler 2", rlTitle: "Sherlock Holmes - Bütün Hikayeler 2" },
        { userTitle: "Şüphenin İzinde / Bütün Hikayeler 3", rlTitle: "Sherlock Holmes - Bütün Hikayeler 3" },
        { userTitle: "Bir Suçun Portresi / Bütün Hikayeler 4", rlTitle: "Sherlock Holmes - Bütün Hikayeler 4" },
        { userTitle: "Gölge Koleksiyonu / Bütün Hikayeler 5", rlTitle: "Sherlock Holmes - Bütün Hikayeler 5" }
    ]

    for (const sh of sherlockBooks) {
        const userBook = await prisma.book.findFirst({
            where: { userId: user.id, title: { contains: sh.userTitle } }
        })
        const rlBook = await prisma.readingListBook.findFirst({
            where: { title: sh.rlTitle }
        })

        if (userBook && rlBook) {
            const exists = await prisma.userReadingListBook.findUnique({
                where: { userId_readingListBookId: { userId: user.id, readingListBookId: rlBook.id } }
            })
            if (!exists) {
                await prisma.userReadingListBook.create({
                    data: { userId: user.id, readingListBookId: rlBook.id, bookId: userBook.id }
                })
                console.log(`✅ "Sherlock Holmes - ${sh.userTitle}" bağlandı`)
                linked++
            }
        }
    }

    // 8. Alex de Souza - Özel liste oluştur veya genel kültür olarak ekle
    // Bu kitap spor/biyografi kategorisinde, mevcut listelere uymuyor
    // Kullanıcıya özel bir "Spor ve Biyografi" listesi oluşturulabilir
    console.log(`\n⚠️  "Alex de Souza" kitabı mevcut listelere uymuyor (Spor/Biyografi)`)
    console.log(`   Bu kitap için özel bir liste oluşturulabilir veya rafsız kalabilir.`)

    console.log(`\n${"=".repeat(50)}`)
    console.log(`TOPLAM: ${linked} kitap bağlandı.`)
    console.log(`${"=".repeat(50)}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
