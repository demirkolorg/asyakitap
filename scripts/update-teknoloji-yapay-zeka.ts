import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Teknoloji ve Yapay Zeka listesini bul
    const teknoloji = await prisma.readingList.findUnique({
        where: { slug: "teknoloji-yapay-zeka" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!teknoloji) {
        console.log("❌ Teknoloji ve Yapay Zeka listesi bulunamadı")
        return
    }

    console.log("✅ Liste bulundu:", teknoloji.name)

    // ============================================
    // OPERASYON 1: Level 10 Pop Kültür Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 1: Level 10 Zihin Yakan Finaller")
    console.log("=".repeat(50))

    const level10 = teknoloji.levels.find(l => l.levelNumber === 10)
    if (level10) {
        // Pop kitapları çıkar
        const popToRemove = ["Başlangıç", "Origin", "Olasılıksız"]
        for (const searchTerm of popToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level10.id,
                    title: { contains: searchTerm }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // Zihin yakan başyapıtlar ekle
        const maxSort10 = await prisma.readingListBook.aggregate({
            where: { levelId: level10.id },
            _max: { sortOrder: true }
        })
        let sortOrder10 = (maxSort10._max.sortOrder ?? 0) + 1

        const zihinYakanlar = [
            {
                title: "Gödel, Escher, Bach: Bir Ebedi Gökçe Belik",
                author: "Douglas Hofstadter",
                neden: "Yapay zeka, bilinç, sanat ve matematik üzerine yazılmış, Pulitzer ödüllü 'Kutsal Kitap'. Okuması zordur ama ufku sonsuza kadar açar.",
                pageCount: null
            },
            {
                title: "Sonsuzluğun Başlangıcı",
                author: "David Deutsch",
                neden: "Bilgi, evrim ve çoklu evrenler üzerine yazılmış en iyimser ve en derin bilim kitabı. Açıklamanın gücü.",
                pageCount: null
            }
        ]

        for (const book of zihinYakanlar) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level10.id, author: { contains: book.author.split(" ")[0] } }
            })
            if (!existing) {
                await prisma.readingListBook.create({
                    data: {
                        levelId: level10.id,
                        title: book.title,
                        author: book.author,
                        neden: book.neden,
                        pageCount: book.pageCount,
                        sortOrder: sortOrder10++
                    }
                })
                console.log("  ✅ Eklendi:", book.title, "-", book.author)
            }
        }
    }

    // ============================================
    // OPERASYON 2: Level 1 Biyoteknoloji Eklemesi
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 2: Level 1 CRISPR/Biyoteknoloji")
    console.log("=".repeat(50))

    const level1 = teknoloji.levels.find(l => l.levelNumber === 1)
    if (level1) {
        // Yaratıcılar çıkar
        const yaraticilar = await prisma.readingListBook.findFirst({
            where: {
                levelId: level1.id,
                title: { contains: "Yaratıcılar" }
            }
        })
        if (yaraticilar) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: yaraticilar.id } })
            await prisma.readingListBook.delete({ where: { id: yaraticilar.id } })
            console.log("  ❌ Çıkarıldı:", yaraticilar.title)
        }

        // CRISPR kitabı ekle
        const maxSort1 = await prisma.readingListBook.aggregate({
            where: { levelId: level1.id },
            _max: { sortOrder: true }
        })

        const existingCrispr = await prisma.readingListBook.findFirst({
            where: { levelId: level1.id, title: { contains: "Kod" } }
        })
        if (!existingCrispr) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level1.id,
                    title: "Yaşamın Kodunu Çözmek (The Code Breaker)",
                    author: "Walter Isaacson",
                    neden: "CRISPR teknolojisini bulan Jennifer Doudna'nın biyografisi. Geleceğin bilgisayarda değil, genlerde yazılacağını anlatır.",
                    pageCount: null,
                    sortOrder: (maxSort1._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: Yaşamın Kodunu Çözmek - Walter Isaacson")
        }
    }

    // ============================================
    // OPERASYON 3: Level 3 Mitnick Tekrarı ve Açık Kaynak
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 3: Level 3 Açık Kaynak Felsefesi")
    console.log("=".repeat(50))

    const level3 = teknoloji.levels.find(l => l.levelNumber === 3)
    if (level3) {
        // Sızma Sanatı çıkar (Aldatma Sanatı kalacak)
        const sizmaBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level3.id,
                title: { contains: "Sızma" }
            }
        })
        if (sizmaBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: sizmaBook.id } })
            await prisma.readingListBook.delete({ where: { id: sizmaBook.id } })
            console.log("  ❌ Çıkarıldı:", sizmaBook.title)
        }

        // Linus Torvalds ekle
        const maxSort3 = await prisma.readingListBook.aggregate({
            where: { levelId: level3.id },
            _max: { sortOrder: true }
        })

        const existingTorvalds = await prisma.readingListBook.findFirst({
            where: { levelId: level3.id, author: { contains: "Torvalds" } }
        })
        if (!existingTorvalds) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level3.id,
                    title: "Yalnızca Eğlenmek İçin (Just for Fun)",
                    author: "Linus Torvalds",
                    neden: "Linux'un ve Git'in yaratıcısının hikayesi. 'Hacker'ın aslında dünyayı iyileştiren bir sanatçı olduğunu anlatır.",
                    pageCount: null,
                    sortOrder: (maxSort3._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: Yalnızca Eğlenmek İçin - Linus Torvalds")
        }
    }

    // ============================================
    // OPERASYON 4: Level 9 Bilim Kurgu Tekrarlarını Temizle
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 4: Level 9 Kurgudan Gerçeğe")
    console.log("=".repeat(50))

    const level9 = teknoloji.levels.find(l => l.levelNumber === 9)
    if (level9) {
        // Tekrar eden kurguları çıkar
        const kurguToRemove = ["Üç Cisim", "Cesur Yeni Dünya"]
        for (const searchTerm of kurguToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level9.id,
                    title: { contains: searchTerm }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // Gerçek uzay bilimi ekle
        const maxSort9 = await prisma.readingListBook.aggregate({
            where: { levelId: level9.id },
            _max: { sortOrder: true }
        })
        let sortOrder9 = (maxSort9._max.sortOrder ?? 0) + 1

        const uzayBilimi = [
            {
                title: "Mars'a Yolculuk (Packing for Mars)",
                author: "Mary Roach",
                neden: "Uzayda tuvalet nasıl yapılır? Yerçekimsiz ortamda seks mümkün mü? Uzay hayatının aşırı gerçekçi ve komik bilimsel analizi.",
                pageCount: null
            },
            {
                title: "Paralel Dünyalar",
                author: "Michio Kaku",
                neden: "Evrenin doğuşu, çoklu evrenler ve yüksek boyutlar. Uzay vizyonunun fiziksel temeli.",
                pageCount: null
            }
        ]

        for (const book of uzayBilimi) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level9.id, author: { contains: book.author.split(" ")[0] } }
            })
            if (!existing) {
                await prisma.readingListBook.create({
                    data: {
                        levelId: level9.id,
                        title: book.title,
                        author: book.author,
                        neden: book.neden,
                        pageCount: book.pageCount,
                        sortOrder: sortOrder9++
                    }
                })
                console.log("  ✅ Eklendi:", book.title, "-", book.author)
            }
        }
    }

    // Final özet
    console.log("\n" + "=".repeat(50))
    console.log("✅ TÜM OPERASYONLAR TAMAMLANDI!")
    console.log("=".repeat(50))

    // Güncel istatistikler
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "teknoloji-yapay-zeka" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (updatedList) {
        const totalBooks = updatedList.levels.reduce((sum, l) => sum + l.books.length, 0)
        console.log(`\n📊 Güncel İstatistikler:`)
        console.log(`   Toplam Kitap: ${totalBooks}`)
        updatedList.levels.forEach(l => {
            console.log(`   Level ${l.levelNumber}: ${l.books.length} kitap`)
        })

        console.log(`\n🔬 Teknoloji İncili Tamamlandı:`)
        console.log(`   - Douglas Hofstadter (GEB - Bilinç/AI)`)
        console.log(`   - David Deutsch (Çoklu Evrenler)`)
        console.log(`   - Walter Isaacson (CRISPR)`)
        console.log(`   - Linus Torvalds (Açık Kaynak)`)
        console.log(`   - Michio Kaku (Fizik)`)
    }
}

main().finally(() => prisma.$disconnect())
