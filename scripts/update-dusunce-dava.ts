import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Düşünce ve Dava listesini bul
    const dusunceDava = await prisma.readingList.findUnique({
        where: { slug: "dusunce-dava" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!dusunceDava) {
        console.log("❌ Düşünce ve Dava listesi bulunamadı")
        return
    }

    console.log("✅ Liste bulundu:", dusunceDava.name)

    // ============================================
    // OPERASYON 1: Mustafa Kutlu Enflasyonunu Düşür
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 1: Mustafa Kutlu Enflasyonu")
    console.log("=".repeat(50))

    // Çıkarılacak Kutlu kitapları
    const kutluToRemove = ["Sır", "Selam Olsun", "Bu Böyledir", "Yoksulluk İçimizde", "Yoksulluk Kitabı", "Beyhude Ömrüm"]

    for (const title of kutluToRemove) {
        const book = await prisma.readingListBook.findFirst({
            where: {
                level: { readingListId: dusunceDava.id },
                title: { contains: title },
                author: { contains: "Kutlu" }
            }
        })
        if (book) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
            await prisma.readingListBook.delete({ where: { id: book.id } })
            console.log("  ❌ Çıkarıldı:", book.title)
        }
    }

    // Level 1'e yeni anlatı ustaları ekle
    const level1 = dusunceDava.levels.find(l => l.levelNumber === 1)
    if (level1) {
        const maxSort1 = await prisma.readingListBook.aggregate({
            where: { levelId: level1.id },
            _max: { sortOrder: true }
        })
        let sortOrder1 = (maxSort1._max.sortOrder ?? 0) + 1

        const newAnlatiBooks = [
            {
                title: "Mihmandar",
                author: "İskender Pala",
                neden: "Eyüp Sultan'ın hayatı üzerinden tarih ve inanç kurgusu.",
                pageCount: null
            },
            {
                title: "Od",
                author: "İskender Pala",
                neden: "Yunus Emre'yi ve tasavvuf ateşini anlamak.",
                pageCount: null
            },
            {
                title: "Ağrı Dağı Efsanesi",
                author: "Yaşar Kemal",
                neden: "Anadolu'nun destansı dili ve aşkın en saf hali.",
                pageCount: null
            }
        ]

        for (const book of newAnlatiBooks) {
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

    // ============================================
    // OPERASYON 2: Pop Kitapları Çıkar, Ağır Eserler Ekle
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 2: Şahsiyet İnşası")
    console.log("=".repeat(50))

    // Çıkarılacak pop kitaplar
    const popToRemove = ["Ferrari", "Hafıza Koçu", "Bangır Bangır"]

    for (const searchTerm of popToRemove) {
        const book = await prisma.readingListBook.findFirst({
            where: {
                level: { readingListId: dusunceDava.id },
                title: { contains: searchTerm }
            }
        })
        if (book) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
            await prisma.readingListBook.delete({ where: { id: book.id } })
            console.log("  ❌ Çıkarıldı:", book.title)
        }
    }

    // Ağır eserleri ekle - Level 5 veya uygun bir seviyeye
    const level5 = dusunceDava.levels.find(l => l.levelNumber === 5)
    if (level5) {
        const maxSort5 = await prisma.readingListBook.aggregate({
            where: { levelId: level5.id },
            _max: { sortOrder: true }
        })
        let sortOrder5 = (maxSort5._max.sortOrder ?? 0) + 1

        const newHeavyBooks = [
            {
                title: "İslam'ın Bugünkü Meseleleri",
                author: "Erol Güngör",
                neden: "Bu listenin en büyük eksiği Erol Güngör'dür. Sosyolojik ve milliyetçi en net analiz.",
                pageCount: null
            },
            {
                title: "Ahlak",
                author: "Nurettin Topçu",
                neden: "Ferrari satan bilgeyi boşverin. İsyan ahlakı ve irade eğitimi buradadır.",
                pageCount: null
            },
            {
                title: "Saatleri Ayarlama Enstitüsü",
                author: "Ahmet Hamdi Tanpınar",
                neden: "Doğu-Batı arasında kalmış toplumun en zeki ve ironik eleştirisi.",
                pageCount: null
            }
        ]

        for (const book of newHeavyBooks) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level5.id,
                    title: book.title,
                    author: book.author,
                    neden: book.neden,
                    pageCount: book.pageCount,
                    sortOrder: sortOrder5++
                }
            })
            console.log("  ✅ Eklendi:", book.title, "-", book.author)
        }
    }

    // ============================================
    // OPERASYON 3: Mimar ve Bilge Eklemesi (Zirve)
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 3: Mimar ve Bilge (Zirve)")
    console.log("=".repeat(50))

    // Level 11 veya 12'ye ekle
    const levelZirve = dusunceDava.levels.find(l => l.levelNumber === 11) || dusunceDava.levels.find(l => l.levelNumber === 12)
    if (levelZirve) {
        const maxSortZ = await prisma.readingListBook.aggregate({
            where: { levelId: levelZirve.id },
            _max: { sortOrder: true }
        })
        let sortOrderZ = (maxSortZ._max.sortOrder ?? 0) + 1

        const zirveBooks = [
            {
                title: "Kubbeyi Yere Koymamak",
                author: "Turgut Cansever",
                neden: "Bilge Mimar'dan şehir, İslam estetiği ve insanın dünyadaki yeri üzerine tefekkür.",
                pageCount: null
            },
            {
                title: "Huzur",
                author: "Ahmet Hamdi Tanpınar",
                neden: "Bir medeniyetin müziği, estetiği ve İstanbul'u. Entelektüel romanın zirvesi.",
                pageCount: null
            }
        ]

        for (const book of zirveBooks) {
            await prisma.readingListBook.create({
                data: {
                    levelId: levelZirve.id,
                    title: book.title,
                    author: book.author,
                    neden: book.neden,
                    pageCount: book.pageCount,
                    sortOrder: sortOrderZ++
                }
            })
            console.log("  ✅ Eklendi (Level " + levelZirve.levelNumber + "):", book.title, "-", book.author)
        }
    }

    // ============================================
    // OPERASYON 4: Level 1 Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 4: Level 1 Ferahlatma")
    console.log("=".repeat(50))

    const level1Clean = ["Beyaz Diş", "Toprak Ana", "Yollar Dönüşe Gider"]

    for (const title of level1Clean) {
        const book = await prisma.readingListBook.findFirst({
            where: {
                level: { readingListId: dusunceDava.id, levelNumber: 1 },
                title: { contains: title }
            }
        })
        if (book) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
            await prisma.readingListBook.delete({ where: { id: book.id } })
            console.log("  ❌ Çıkarıldı:", book.title)
        }
    }

    // Final özet
    console.log("\n" + "=".repeat(50))
    console.log("✅ TÜM OPERASYONLAR TAMAMLANDI!")
    console.log("=".repeat(50))

    // Güncel istatistikler
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "dusunce-dava" },
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
    }
}

main().finally(() => prisma.$disconnect())
