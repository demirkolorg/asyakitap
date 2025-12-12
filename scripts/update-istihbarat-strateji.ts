import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // İstihbarat ve Strateji listesini bul
    const istihbarat = await prisma.readingList.findUnique({
        where: { slug: "istihbarat-strateji" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!istihbarat) {
        console.log("❌ İstihbarat ve Strateji listesi bulunamadı")
        return
    }

    console.log("✅ Liste bulundu:", istihbarat.name)

    // ============================================
    // OPERASYON 1: Level 2 Sherlock Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 1: Level 2 Sherlock Temizliği")
    console.log("=".repeat(50))

    const level2 = istihbarat.levels.find(l => l.levelNumber === 2)
    if (level2) {
        // Sherlock Holmes kitaplarını bul (Bütün Hikayeler 1 hariç)
        const sherlockBooks = await prisma.readingListBook.findMany({
            where: {
                levelId: level2.id,
                title: { contains: "Sherlock" }
            }
        })

        let keptOne = false
        for (const book of sherlockBooks) {
            // Sadece "Bütün Hikayeler 1"i tut
            if (book.title.includes("Bütün Hikayeler 1") && !keptOne) {
                keptOne = true
                console.log("  ✔️ Tutuldu:", book.title)
                continue
            }
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
            await prisma.readingListBook.delete({ where: { id: book.id } })
            console.log("  ❌ Çıkarıldı:", book.title)
        }

        // Analiz devlerini ekle
        const maxSort2 = await prisma.readingListBook.aggregate({
            where: { levelId: level2.id },
            _max: { sortOrder: true }
        })
        let sortOrder2 = (maxSort2._max.sortOrder ?? 0) + 1

        const analizBooks = [
            {
                title: "Sinyal ve Gürültü",
                author: "Nate Silver",
                neden: "İstihbaratın en büyük sorunu 'gürültü' (gereksiz bilgi) arasından 'sinyali' (gerçek tehdidi) bulmaktır. Tahmin sanatı üzerine başyapıt.",
                pageCount: null
            },
            {
                title: "Hızlı ve Yavaş Düşünme",
                author: "Daniel Kahneman",
                neden: "Bir analistin düşebileceği zihinsel tuzaklar ve karar alma mekanizmaları.",
                pageCount: null
            },
            {
                title: "Olağandışı Kitlesel Yanılgılar ve Kalabalıkların Çılgınlığı",
                author: "Charles Mackay",
                neden: "Toplumlar nasıl manipüle edilir ve histeriye kapılır? Klasik bir kaynak.",
                pageCount: null
            }
        ]

        for (const book of analizBooks) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level2.id, title: { contains: book.title.split(" ")[0] } }
            })
            if (!existing) {
                await prisma.readingListBook.create({
                    data: {
                        levelId: level2.id,
                        title: book.title,
                        author: book.author,
                        neden: book.neden,
                        pageCount: book.pageCount,
                        sortOrder: sortOrder2++
                    }
                })
                console.log("  ✅ Eklendi:", book.title, "-", book.author)
            }
        }
    }

    // ============================================
    // OPERASYON 2: Komplo ve Bağlam Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 2: Komplo/Yanlış Eşleşme Temizliği")
    console.log("=".repeat(50))

    // Level 6'dan HAARP çıkar
    const level6 = istihbarat.levels.find(l => l.levelNumber === 6)
    if (level6) {
        const haarpBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level6.id,
                OR: [
                    { title: { contains: "HAARP" } },
                    { title: { contains: "Haarp" } }
                ]
            }
        })
        if (haarpBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: haarpBook.id } })
            await prisma.readingListBook.delete({ where: { id: haarpBook.id } })
            console.log("  ❌ Çıkarıldı (Level 6):", haarpBook.title)
        }

        // Gideon'un Casusları ekle
        const maxSort6 = await prisma.readingListBook.aggregate({
            where: { levelId: level6.id },
            _max: { sortOrder: true }
        })

        const existingGideon = await prisma.readingListBook.findFirst({
            where: { levelId: level6.id, title: { contains: "Gideon" } }
        })
        if (!existingGideon) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level6.id,
                    title: "Gideon'un Casusları",
                    author: "Gordon Thomas",
                    neden: "MOSSAD'ın gizli tarihi. İstihbarat operasyonlarının nasıl yürütüldüğüne dair en detaylı kaynaklardan.",
                    pageCount: null,
                    sortOrder: (maxSort6._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi (Level 6): Gideon'un Casusları - Gordon Thomas")
        }
    }

    // Level 9'dan Mahrem çıkar
    const level9 = istihbarat.levels.find(l => l.levelNumber === 9)
    if (level9) {
        const mahremBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level9.id,
                title: { contains: "Mahrem" }
            }
        })
        if (mahremBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: mahremBook.id } })
            await prisma.readingListBook.delete({ where: { id: mahremBook.id } })
            console.log("  ❌ Çıkarıldı (Level 9):", mahremBook.title)
        }

        // Diplomasi ekle
        const maxSort9 = await prisma.readingListBook.aggregate({
            where: { levelId: level9.id },
            _max: { sortOrder: true }
        })

        const existingDiplomasi = await prisma.readingListBook.findFirst({
            where: { levelId: level9.id, author: { contains: "Kissinger" } }
        })
        if (!existingDiplomasi) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level9.id,
                    title: "Diplomasi",
                    author: "Henry Kissinger",
                    neden: "Devletlerarası güç dengesinin nasıl kurulduğunu 'masanın diğer tarafından' anlatan dev eser.",
                    pageCount: null,
                    sortOrder: (maxSort9._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi (Level 9): Diplomasi - Henry Kissinger")
        }
    }

    // ============================================
    // OPERASYON 3: Level 1 Dan Brown Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 3: Level 1 Kurgu Seviyesi")
    console.log("=".repeat(50))

    const level1 = istihbarat.levels.find(l => l.levelNumber === 1)
    if (level1) {
        // Dan Brown kitaplarını çıkar
        const danBrownToRemove = ["Cehennem", "Da Vinci"]
        for (const searchTerm of danBrownToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level1.id,
                    title: { contains: searchTerm }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // Gerçekçi kurgu ekle
        const maxSort1 = await prisma.readingListBook.aggregate({
            where: { levelId: level1.id },
            _max: { sortOrder: true }
        })
        let sortOrder1 = (maxSort1._max.sortOrder ?? 0) + 1

        const gercekciKurgu = [
            {
                title: "Sessiz Amerikalı",
                author: "Graham Greene",
                neden: "CIA'in Vietnam'daki ilk günleri ve istihbaratın sahadaki ahlaki ikilemleri.",
                pageCount: null
            },
            {
                title: "Kim",
                author: "Rudyard Kipling",
                neden: "İstihbarat literatüründeki 'Büyük Oyun' (The Great Game) kavramının romanı.",
                pageCount: null
            }
        ]

        for (const book of gercekciKurgu) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level1.id, title: { contains: book.title } }
            })
            if (!existing) {
                await prisma.readingListBook.create({
                    data: {
                        levelId: level1.id,
                        title: book.title,
                        author: book.author,
                        neden: book.neden,
                        pageCount: book.pageCount,
                        sortOrder: sortOrder1++
                    }
                })
                console.log("  ✅ Eklendi:", book.title, "-", book.author)
            }
        }
    }

    // ============================================
    // OPERASYON 4: Level 5 Clausewitz Eklemesi
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 4: Level 5 Strateji Teorisi")
    console.log("=".repeat(50))

    const level5 = istihbarat.levels.find(l => l.levelNumber === 5)
    if (level5) {
        const maxSort5 = await prisma.readingListBook.aggregate({
            where: { levelId: level5.id },
            _max: { sortOrder: true }
        })

        const existingClausewitz = await prisma.readingListBook.findFirst({
            where: { levelId: level5.id, author: { contains: "Clausewitz" } }
        })
        if (!existingClausewitz) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level5.id,
                    title: "Savaş Üzerine (Vom Kriege)",
                    author: "Carl von Clausewitz",
                    neden: "Sadece savaş değil; 'Savaş, siyasetin başka araçlarla devamıdır' teziyle devlet stratejisinin temel metni.",
                    pageCount: null,
                    sortOrder: (maxSort5._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: Savaş Üzerine - Carl von Clausewitz")
        } else {
            console.log("  ⚠️ Clausewitz zaten var")
        }
    }

    // Final özet
    console.log("\n" + "=".repeat(50))
    console.log("✅ TÜM OPERASYONLAR TAMAMLANDI!")
    console.log("=".repeat(50))

    // Güncel istatistikler
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "istihbarat-strateji" },
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

        console.log(`\n🎯 MİT Akademisi Müfredatı Tamamlandı:`)
        console.log(`   - Nate Silver (Tahmin Sanatı)`)
        console.log(`   - Daniel Kahneman (Karar Alma)`)
        console.log(`   - Carl von Clausewitz (Strateji)`)
        console.log(`   - Henry Kissinger (Diplomasi)`)
        console.log(`   - Graham Greene & Kipling (Gerçekçi Kurgu)`)
    }
}

main().finally(() => prisma.$disconnect())
