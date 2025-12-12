import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Tarih ve Medeniyet listesini bul
    const tarihMedeniyet = await prisma.readingList.findUnique({
        where: { slug: "tarih-medeniyet" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!tarihMedeniyet) {
        console.log("❌ Tarih ve Medeniyet listesi bulunamadı")
        return
    }

    console.log("✅ Liste bulundu:", tarihMedeniyet.name)

    // ============================================
    // OPERASYON 1: Level 1 Roman Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 1: Level 1 Roman Temizliği")
    console.log("=".repeat(50))

    const level1 = tarihMedeniyet.levels.find(l => l.levelNumber === 1)
    if (level1) {
        // Çağlayan Yılmaz tekrarlarını çıkar (Yafes'in Kılıcı kalacak)
        const caglayanToRemove = ["Atalar Cengi", "İtbarak"]
        for (const title of caglayanToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level1.id,
                    title: { contains: title }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // Yeni klasikler ekle
        const maxSort1 = await prisma.readingListBook.aggregate({
            where: { levelId: level1.id },
            _max: { sortOrder: true }
        })
        let sortOrder1 = (maxSort1._max.sortOrder ?? 0) + 1

        const newLevel1Books = [
            {
                title: "Yaban",
                author: "Yakup Kadri Karaosmanoğlu",
                neden: "Milli Mücadele'de aydın ile köylü arasındaki uçurumu en acı şekilde anlatan başyapıt.",
                pageCount: null
            },
            {
                title: "Fedailerin Kalesi Alamut",
                author: "Vladimir Bartol",
                neden: "Hasan Sabbah'ı kurgu üzerinden okumak tarihi sevdirir. Güç, manipülasyon ve fanatizm üzerine.",
                pageCount: null
            }
        ]

        for (const book of newLevel1Books) {
            // Zaten var mı kontrol et
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
            } else {
                console.log("  ⚠️ Zaten var:", book.title)
            }
        }
    }

    // ============================================
    // OPERASYON 2: Level 2 Yazar Tekrarı Önleme
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 2: Level 2 Çeşitlendirme")
    console.log("=".repeat(50))

    const level2 = tarihMedeniyet.levels.find(l => l.levelNumber === 2)
    if (level2) {
        // Cansu Canan Özgen tekrarlarını çıkar (Türklerin Serüveni kalacak)
        const ozgenToRemove = ["İnsanlığın Medeniyet Destanı", "Türklerin Büyükleri"]
        for (const title of ozgenToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level2.id,
                    title: { contains: title }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // McNeill ekle
        const maxSort2 = await prisma.readingListBook.aggregate({
            where: { levelId: level2.id },
            _max: { sortOrder: true }
        })

        const existing = await prisma.readingListBook.findFirst({
            where: { levelId: level2.id, author: { contains: "McNeill" } }
        })
        if (!existing) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level2.id,
                    title: "Dünya Tarihi",
                    author: "William H. McNeill",
                    neden: "Sadece Türk tarihi değil, dünya medeniyetinin nasıl kurulduğunu tek ciltte anlatan efsane eser.",
                    pageCount: null,
                    sortOrder: (maxSort2._max.sortOrder ?? 0) + 1
                }
            })
            console.log("  ✅ Eklendi: Dünya Tarihi - William H. McNeill")
        }
    }

    // ============================================
    // OPERASYON 3: Level 4 Tekrar ve Duplicate Temizliği
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 3: Level 4 Temizlik")
    console.log("=".repeat(50))

    const level4 = tarihMedeniyet.levels.find(l => l.levelNumber === 4)
    if (level4) {
        // Taha Kılınç tekrarlarını çıkar (Kırmadan İncitmeden kalacak)
        const kilincToRemove = ["Ortadoğu'ya Dair Yirmi Tez", "Kudüs Yazıları"]
        for (const title of kilincToRemove) {
            const book = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level4.id,
                    title: { contains: title }
                }
            })
            if (book) {
                await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                await prisma.readingListBook.delete({ where: { id: book.id } })
                console.log("  ❌ Çıkarıldı:", book.title)
            }
        }

        // Modern Ortadoğu Tarihi duplicate kontrolü - sadece Genişletilmiş Baskı kalsın
        const modernOrtadogu = await prisma.readingListBook.findMany({
            where: {
                levelId: level4.id,
                title: { contains: "Modern Ortadoğu" }
            }
        })

        if (modernOrtadogu.length > 1) {
            // Genişletilmiş olmayanları sil
            for (const book of modernOrtadogu) {
                if (!book.title.includes("Genişletilmiş")) {
                    await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: book.id } })
                    await prisma.readingListBook.delete({ where: { id: book.id } })
                    console.log("  ❌ Duplicate çıkarıldı:", book.title)
                }
            }
        }
    }

    // ============================================
    // OPERASYON 4: Level 7 Gazetecilikten Akademiye
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 4: Level 7 Akademik Geçiş")
    console.log("=".repeat(50))

    const level7 = tarihMedeniyet.levels.find(l => l.levelNumber === 7)
    if (level7) {
        // Darbeye Geçit Yok çıkar
        const darbeBook = await prisma.readingListBook.findFirst({
            where: {
                levelId: level7.id,
                title: { contains: "Darbeye Geçit" }
            }
        })
        if (darbeBook) {
            await prisma.userReadingListBook.deleteMany({ where: { readingListBookId: darbeBook.id } })
            await prisma.readingListBook.delete({ where: { id: darbeBook.id } })
            console.log("  ❌ Çıkarıldı:", darbeBook.title)
        }

        // Akademik eser ekle
        const maxSort7 = await prisma.readingListBook.aggregate({
            where: { levelId: level7.id },
            _max: { sortOrder: true }
        })

        await prisma.readingListBook.create({
            data: {
                levelId: level7.id,
                title: "Türkiye'nin Demokrasi Tarihi (1950-1995)",
                author: "Tanel Demirel",
                neden: "Darbeleri, muhtıraları ve siyasi partileri akademik bir soğukkanlılıkla analiz eden referans eser.",
                pageCount: null,
                sortOrder: (maxSort7._max.sortOrder ?? 0) + 1
            }
        })
        console.log("  ✅ Eklendi: Türkiye'nin Demokrasi Tarihi - Tanel Demirel")
    }

    // ============================================
    // OPERASYON 5: Level 10 Global Medeniyet Vizyonu
    // ============================================
    console.log("\n" + "=".repeat(50))
    console.log("📚 OPERASYON 5: Level 10 Global Vizyon")
    console.log("=".repeat(50))

    const level10 = tarihMedeniyet.levels.find(l => l.levelNumber === 10)
    if (level10) {
        const maxSort10 = await prisma.readingListBook.aggregate({
            where: { levelId: level10.id },
            _max: { sortOrder: true }
        })
        let sortOrder10 = (maxSort10._max.sortOrder ?? 0) + 1

        const globalBooks = [
            {
                title: "Uygarlıkların Grameri",
                author: "Fernand Braudel",
                neden: "Tarihçilerin şahı Braudel'den; İslam, Batı, Çin ve diğer medeniyetlerin kodlarını çözen bir ders kitabı.",
                pageCount: null
            },
            {
                title: "Tüfek, Mikrop ve Çelik",
                author: "Jared Diamond",
                neden: "Neden bazı medeniyetler gelişti, bazıları sömürge oldu? Tarihe coğrafi ve biyolojik bir bakış.",
                pageCount: null
            }
        ]

        for (const book of globalBooks) {
            const existing = await prisma.readingListBook.findFirst({
                where: { levelId: level10.id, title: { contains: book.title.split(" ")[0] } }
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

    // Final özet
    console.log("\n" + "=".repeat(50))
    console.log("✅ TÜM OPERASYONLAR TAMAMLANDI!")
    console.log("=".repeat(50))

    // Güncel istatistikler
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "tarih-medeniyet" },
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
