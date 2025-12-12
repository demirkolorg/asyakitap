import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Bilim Kurgu listesini bul
    const bilimKurgu = await prisma.readingList.findUnique({
        where: { slug: "bilim-kurgu" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (!bilimKurgu) {
        console.log("❌ Bilim Kurgu listesi bulunamadı")
        return
    }

    console.log("✅ Bilim Kurgu listesi bulundu:", bilimKurgu.name)

    // Level 6 (Post-Apokaliptik)
    const level6 = bilimKurgu.levels.find(l => l.levelNumber === 6)
    if (level6) {
        console.log("\n📚 Level 6:", level6.name)

        // Metro 2034 ve Metro 2035 çıkar
        const metroBooks = await prisma.readingListBook.findMany({
            where: {
                levelId: level6.id,
                OR: [
                    { title: { contains: "Metro 2034" } },
                    { title: { contains: "Metro 2035" } }
                ]
            }
        })

        for (const book of metroBooks) {
            // Önce bağlantıları sil
            await prisma.userReadingListBook.deleteMany({
                where: { readingListBookId: book.id }
            })
            // Sonra kitabı sil
            await prisma.readingListBook.delete({
                where: { id: book.id }
            })
            console.log("  ❌ Çıkarıldı:", book.title)
        }

        // Yeni kitaplar ekle
        const maxSort6 = await prisma.readingListBook.aggregate({
            where: { levelId: level6.id },
            _max: { sortOrder: true }
        })
        let sortOrder6 = (maxSort6._max.sortOrder ?? 0) + 1

        const newLevel6Books = [
            {
                title: "Ben Efsaneyim",
                author: "Richard Matheson",
                neden: "Will Smith'in filmini unutun. Bu kitap, vampirlerin ele geçirdiği dünyada kalan son insanın psikolojik çöküşünü anlatır.",
                pageCount: null
            },
            {
                title: "Körlük",
                author: "Jose Saramago",
                neden: "Tüm şehir aniden kör olursa medeniyet kaç saatte vahşete teslim olur? Mideye yumruk gibi inen bir 'toplumsal çöküş' hikayesi.",
                pageCount: null
            }
        ]

        for (const book of newLevel6Books) {
            await prisma.readingListBook.create({
                data: {
                    levelId: level6.id,
                    title: book.title,
                    author: book.author,
                    neden: book.neden,
                    pageCount: book.pageCount,
                    sortOrder: sortOrder6++
                }
            })
            console.log("  ✅ Eklendi:", book.title)
        }
    }

    // Level 10 (Zirve)
    const level10 = bilimKurgu.levels.find(l => l.levelNumber === 10)
    if (level10) {
        console.log("\n📚 Level 10:", level10.name)

        // Dune devam kitaplarını çıkar (sadece devam kitapları, ilk Dune kalacak)
        const duneBooks = await prisma.readingListBook.findMany({
            where: {
                levelId: level10.id,
                OR: [
                    { title: { contains: "Dune Mesihi" } },
                    { title: { contains: "Dune Çocukları" } },
                    { title: { contains: "Dune Tanrı İmparatoru" } },
                    { title: { contains: "Tanrı İmparatoru" } },
                    { title: { contains: "Dune Sapkınları" } },
                    { title: { contains: "Dune Rahibeler" } },
                    { title: { contains: "Rahibeler Meclisi" } }
                ]
            }
        })

        for (const book of duneBooks) {
            // Önce bağlantıları sil
            await prisma.userReadingListBook.deleteMany({
                where: { readingListBookId: book.id }
            })
            // Sonra kitabı sil
            await prisma.readingListBook.delete({
                where: { id: book.id }
            })
            console.log("  ❌ Çıkarıldı:", book.title)
        }

        // Yeni başyapıtlar ekle
        const maxSort10 = await prisma.readingListBook.aggregate({
            where: { levelId: level10.id },
            _max: { sortOrder: true }
        })
        let sortOrder10 = (maxSort10._max.sortOrder ?? 0) + 1

        const newLevel10Books = [
            {
                title: "2001: Bir Uzay Destanı",
                author: "Arthur C. Clarke",
                neden: "İnsanlığın şafağından yapay zeka HAL 9000'e uzanan evrimsel bir yolculuk. Filmin anlaşılmayan kısımlarını aydınlatır.",
                pageCount: null
            },
            {
                title: "Ay Zalim Bir Sevgilidir",
                author: "Robert Heinlein",
                neden: "Ay kolonisi Dünya'ya karşı isyan eder. Liderleri ise şakacı bir süper bilgisayardır. Politika ve özgürlük üzerine bir ders.",
                pageCount: null
            },
            {
                title: "Yabancı Diyarlardaki Yabancı",
                author: "Robert Heinlein",
                neden: "Marslılar tarafından büyütülen bir insanın Dünya'ya dönüşü ve insan kültürünü (din, cinsellik, para) dışarıdan bir gözle sorgulaması.",
                pageCount: null
            },
            {
                title: "Beşinci Mevsim (Kırık Diyar)",
                author: "N.K. Jemisin",
                neden: "Modern bir klasik. Dünyanın sürekli felaketlerle sarsıldığı ve jeolojinin büyüyle birleştiği ödül canavarı bir eser.",
                pageCount: null
            },
            {
                title: "Vakıf ve İmparatorluk",
                author: "Isaac Asimov",
                neden: "Hari Seldon'un matematiksel planı, 'Katır' adında hesaba katılamayan bir mutant yüzünden bozulursa ne olur?",
                pageCount: null
            }
        ]

        for (const book of newLevel10Books) {
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
            console.log("  ✅ Eklendi:", book.title)
        }
    }

    // Level 2 (Mizah) - Mezbaha 5 güncelle
    const level2 = bilimKurgu.levels.find(l => l.levelNumber === 2)
    if (level2) {
        console.log("\n📚 Level 2:", level2.name)

        const mezbaha = await prisma.readingListBook.findFirst({
            where: {
                levelId: level2.id,
                title: { contains: "Mezbaha" }
            }
        })

        if (mezbaha) {
            await prisma.readingListBook.update({
                where: { id: mezbaha.id },
                data: {
                    neden: "Dresden bombardımanını yaşamış bir askerin zaman algısının kırılması. Savaşın dehşetine karşı delirmemek için sığınılan acı bir mizah."
                }
            })
            console.log("  ✏️ Güncellendi:", mezbaha.title)
        }
    }

    console.log("\n✅ Tüm operasyonlar tamamlandı!")
}

main().finally(() => prisma.$disconnect())
