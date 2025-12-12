import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // İlahiyat ve Medeniyet listesini bul
    const ilahiyat = await prisma.readingList.findUnique({
        where: { slug: "ilahiyat-medeniyet" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!ilahiyat) {
        console.log("❌ İlahiyat ve Medeniyet listesi bulunamadı")
        return
    }

    console.log("✅ Liste bulundu:", ilahiyat.name)

    // ============================================
    // OPERASYON 1: Level 1 Popüler Kültür Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 1: Level 1 Edebi Derinlik")
    console.log("=".repeat(50))

    const level1 = ilahiyat.levels.find(l => l.levelNumber === 1)
    if (level1) {
        // Popüler kitapları çıkar
        const popToRemove = ["Eyvallah", "Aşkın Gözyaşları"]
        for (const searchTerm of popToRemove) {
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

        // Edebi şaheserler ekle
        const maxSort1 = await prisma.readingListBook.aggregate({
            where: { levelId: level1.id },
            _max: { sortOrder: true }
        })
        let sortOrder1 = (maxSort1._max.sortOrder ?? 0) + 1

        const newLevel1Books = [
            {
                title: "Yitik Cennet",
                author: "Sezai Karakoç",
                neden: "Peygamberler tarihini, Hz. Adem'den Hz. Muhammed'e kadar bir medeniyet şiiri gibi anlatan eşsiz bir eser.",
                pageCount: null
            },
            {
                title: "Nur Heykeli",
                author: "Mustafa Necati Sepetçioğlu",
                neden: "Mevlana'nın hayatını ve tasavvufi derinliğini anlatan, dili çok daha güçlü ve yerli bir tarihi roman.",
                pageCount: null
            }
        ]

        for (const book of newLevel1Books) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level1.id, title: { contains: book.title.split(" ")[0] } }
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
    // OPERASYON 2: Level 3 Hamidullah Takviyesi
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 2: Level 3 Hamidullah Takviyesi")
    console.log("=".repeat(50))

    const level3 = ilahiyat.levels.find(l => l.levelNumber === 3)
    if (level3) {
        // Philip Hitti çıkar
        const hittiBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level3.id,
                OR: [
                    { author: { contains: "Hitti" } },
                    { title: { contains: "Emeviler-Abbasiler" } }
                ]
            }
        })
        if (hittiBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: hittiBook.id } })
            await prisma.readingListBook.delete({ where: { id: hittiBook.id } })
            console.log("  ❌ Çıkarıldı:", hittiBook.title)
        }

        // Hamidullah ekle
        const maxSort3 = await prisma.readingListBook.aggregate({
            where: { levelId: level3.id },
            _max: { sortOrder: true }
        })

        const existingHamidullah = await prisma.readingListBook.findFirst({
            where: { levelId: level3.id, author: { contains: "Hamidullah" } }
        })
        if (!existingHamidullah) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level3.id,
                    title: "İslam Peygamberi (1. Cilt)",
                    author: "Muhammed Hamidullah",
                    neden: "Sadece bir siyer değil; Peygamber döneminin devleti, ordusu, diplomasisi ve eğitim hayatını belgelerle anlatan dev eser.",
                    pageCount: null,
                    sortOrder: (maxSort3._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: İslam Peygamberi - Muhammed Hamidullah")
        }
    }

    // ============================================
    // OPERASYON 3: Level 5 Polemikten Uzaklaşma
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 3: Level 5 Kur'an Usulü")
    console.log("=".repeat(50))

    const level5 = ilahiyat.levels.find(l => l.levelNumber === 5)
    if (level5) {
        // İslamoğlu kitabını çıkar
        const islamogluBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level5.id,
                OR: [
                    { title: { contains: "Kur'an Nedir" } },
                    { author: { contains: "İslamoğlu" } }
                ]
            }
        })
        if (islamogluBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: islamogluBook.id } })
            await prisma.readingListBook.delete({ where: { id: islamogluBook.id } })
            console.log("  ❌ Çıkarıldı:", islamogluBook.title)
        }

        // Abdullah Draz ekle
        const maxSort5 = await prisma.readingListBook.aggregate({
            where: { levelId: level5.id },
            _max: { sortOrder: true }
        })

        const existingDraz = await prisma.readingListBook.findFirst({
            where: { levelId: level5.id, author: { contains: "Draz" } }
        })
        if (!existingDraz) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level5.id,
                    title: "Kur'an'ın Anlaşılmasına Doğru",
                    author: "Dr. Abdullah Draz",
                    neden: "Ezher'in yetiştirdiği en büyük alimlerden Draz'ın, Kur'an'ın ahlaki ve sistemsel yapısını anlattığı, dünya çapında saygı gören eseri.",
                    pageCount: null,
                    sortOrder: (maxSort5._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: Kur'an'ın Anlaşılmasına Doğru - Abdullah Draz")
        }
    }

    // ============================================
    // OPERASYON 4: Level 9 Muhammed İkbal Eklemesi
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 4: Level 9 Felsefi Zirve")
    console.log("=".repeat(50))

    // Önce "Sünnet Olmadan Ümmet Olmaz" kitabını bul ve çıkar (hangi level'da olursa olsun)
    const sunnetBook = await prisma.readingListBook.findFirst({
        where: {
            level: { readingListId: ilahiyat.id },
            title: { contains: "Sünnet Olmadan" }
        }
    })
    if (sunnetBook) {
        await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: sunnetBook.id } })
        await prisma.readingListBook.delete({ where: { id: sunnetBook.id } })
        console.log("  ❌ Çıkarıldı:", sunnetBook.title)
    }

    const level9 = ilahiyat.levels.find(l => l.levelNumber === 9)
    if (level9) {
        // Muhammed İkbal ekle
        const maxSort9 = await prisma.readingListBook.aggregate({
            where: { levelId: level9.id },
            _max: { sortOrder: true }
        })

        const existingIkbal = await prisma.readingListBook.findFirst({
            where: { levelId: level9.id, author: { contains: "İkbal" } }
        })
        if (!existingIkbal) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level9.id,
                    title: "İslam'da Dini Düşüncenin Yeniden İnşası",
                    author: "Muhammed İkbal",
                    neden: "İslam'ın dinamizmini, Batı felsefesi ile hesaplaşarak yeniden ortaya koyan, modern zamanların en önemli felsefi metni.",
                    pageCount: null,
                    sortOrder: (maxSort9._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: İslam'da Dini Düşüncenin Yeniden İnşası - Muhammed İkbal")
        }
    }

    // Final özet
    console.log("\n" + "=".repeat(50))
    console.log("✅ TÜM OPERASYONLAR TAMAMLANDI!")
    console.log("=".repeat(50))

    // Güncel istatistikler
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "ilahiyat-medeniyet" },
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

        // Yeni eklenen dev isimleri listele
        console.log(`\n🌟 Yeni Sütunlar:`)
        console.log(`   - Muhammed Hamidullah (Siyer)`)
        console.log(`   - Abdullah Draz (Kur'an Usulü)`)
        console.log(`   - Muhammed İkbal (İslam Felsefesi)`)
        console.log(`   - Sezai Karakoç (Edebi Derinlik)`)
    }
}

main().finally(() => prisma.$disconnect())
