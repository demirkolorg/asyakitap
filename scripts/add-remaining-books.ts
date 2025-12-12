import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Rafsız kalan 20 kitabın liste ve seviye atamaları
const booksToAdd = [
    // ========================================
    // DÜŞÜNCE VE DAVA OKUMALARI
    // ========================================

    // Seviye 3: Dil Köprüsü ve Psikoloji
    {
        listSlug: "dusunce-dava",
        levelNumber: 3,
        books: [
            { title: "Dönüşüm", author: "Franz Kafka", neden: "Yabancılaşma ve modern insanın bunalımı. Kafka'nın başyapıtı." },
            { title: "Gulyabani", author: "Hüseyin Rahmi Gürpınar", neden: "Klasik Türk romanı ve toplum eleştirisi. Dil tadı." }
        ]
    },

    // Seviye 5: Yaşanmışlıklar ve Rehberlik
    {
        listSlug: "dusunce-dava",
        levelNumber: 5,
        books: [
            { title: "Alışkanlıkların Gücü", author: "Charles Duhigg", neden: "Alışkanlık döngüsü ve değişim. Kişisel gelişim klasiği." },
            { title: "Bilinçaltının Gücü", author: "Joseph Murphy", neden: "Zihin gücü ve potansiyel. Kişisel gelişim klasiği." },
            { title: "Hatıralar", author: "Ali Fuad Başgil", neden: "Gençlerle Başbaşa yazarının hayat hikayesi ve tecrübeleri." },
            { title: "Hafıza Koçu", author: "Gareth Moore", neden: "Hafıza teknikleri ve zihinsel egzersizler." }
        ]
    },

    // Seviye 8: Bilge Kral Aliya Modülü
    {
        listSlug: "dusunce-dava",
        levelNumber: 8,
        books: [
            { title: "İslam Deklarasyonu", author: "Aliya İzzetbegoviç", neden: "Müslüman toplumların manifestosu. Aliya'nın temel eseri." },
            { title: "İslami Yeniden Doğuşun Meseleleri", author: "Aliya İzzetbegoviç", neden: "İslam dünyasının sorunları ve çözüm önerileri." }
        ]
    },

    // ========================================
    // TARİH VE MEDENİYET OKUMALARI
    // ========================================

    // Seviye 4: Orta Doğu'ya Giriş
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 4,
        books: [
            { title: "Fedailerin Kalesi Alamut", author: "Vladimir Bartol", neden: "Hasan Sabbah ve fedaileri. Orta Doğu'da suikast geleneğinin tarihi kökleri." }
        ]
    },

    // ========================================
    // İSTİHBARAT VE STRATEJİ OKUMALARI
    // ========================================

    // Seviye 2: Suç ve Kriminal Analiz
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 2,
        books: [
            { title: "Sherlock Holmes - Bütün Hikayeler 1", author: "Arthur Conan Doyle", neden: "Holmes hikayelerinin birinci cildi. Tümdengelim mantığı." },
            { title: "Sherlock Holmes - Bütün Hikayeler 2", author: "Arthur Conan Doyle", neden: "Holmes hikayelerinin ikinci cildi." },
            { title: "Sherlock Holmes - Bütün Hikayeler 3", author: "Arthur Conan Doyle", neden: "Holmes hikayelerinin üçüncü cildi." },
            { title: "Sherlock Holmes - Bütün Hikayeler 4", author: "Arthur Conan Doyle", neden: "Holmes hikayelerinin dördüncü cildi." },
            { title: "Sherlock Holmes - Bütün Hikayeler 5", author: "Arthur Conan Doyle", neden: "Holmes hikayelerinin beşinci cildi." }
        ]
    },

    // Seviye 1: İtiraflar ve Gerçek Yüzler
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 1,
        books: [
            { title: "Cehennem", author: "Dan Brown", neden: "Gerilim ve komplo teorileri. Dante'nin İlahi Komedya'sı üzerine kurulu." }
        ]
    },

    // ========================================
    // TEKNOLOJİ VE YAPAY ZEKA OKUMALARI
    // ========================================

    // Seviye 5: Algoritmik Toplum ve Veri
    {
        listSlug: "teknoloji-yapay-zeka",
        levelNumber: 5,
        books: [
            { title: "Trend Takipçisi", author: "Michael W. Covel", neden: "Algoritmik trading ve trend takip stratejileri. Veri odaklı düşünme." }
        ]
    },

    // ========================================
    // DİN VE İSLAM OKUMALARI
    // ========================================

    // Seviye 10: Klasikler ve Başvuru Eserleri
    {
        listSlug: "ilahiyat-medeniyet",
        levelNumber: 10,
        books: [
            { title: "Lem'alar", author: "Bediüzzaman Said Nursi", neden: "Risale-i Nur külliyatından. İman hakikatleri üzerine derin tefekkür." }
        ]
    }
]

// Kitap isimlerini normalize et (karşılaştırma için)
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/\(.*?\)/g, "") // Parantez içlerini kaldır
        .replace(/[^a-zğüşıöç0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

async function main() {
    console.log("Rafsız kitapları listelere ekleme ve bağlama başlıyor...\n")

    // Kullanıcıyı al
    const user = await prisma.user.findFirst()
    if (!user) {
        console.log("Kullanıcı bulunamadı!")
        return
    }

    // Kullanıcının bağlı olmayan kitaplarını al
    const linkedBookIds = await prisma.userReadingListBook.findMany({
        where: { userId: user.id, bookId: { not: null } },
        select: { bookId: true }
    })
    const linkedIds = new Set(linkedBookIds.map(l => l.bookId))

    const unlinkedBooks = await prisma.book.findMany({
        where: {
            userId: user.id,
            id: { notIn: Array.from(linkedIds) as string[] }
        },
        include: { author: true }
    })

    console.log(`${unlinkedBooks.length} rafsız kitap bulundu.\n`)

    let totalAdded = 0
    let totalLinked = 0

    for (const entry of booksToAdd) {
        // Listeyi bul
        const list = await prisma.readingList.findUnique({
            where: { slug: entry.listSlug },
            include: {
                levels: {
                    where: { levelNumber: entry.levelNumber }
                }
            }
        })

        if (!list || list.levels.length === 0) {
            console.log(`❌ Liste veya seviye bulunamadı: ${entry.listSlug} - Seviye ${entry.levelNumber}`)
            continue
        }

        const level = list.levels[0]
        console.log(`\n📚 ${list.name} - ${level.name}`)

        // Mevcut kitapların maksimum sortOrder'ını bul
        const maxSortOrder = await prisma.readingListBook.aggregate({
            where: { levelId: level.id },
            _max: { sortOrder: true }
        })

        let currentSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

        for (const book of entry.books) {
            // Kitap zaten listede var mı kontrol et
            const normalizedNewTitle = normalizeTitle(book.title)
            const existingInList = await prisma.readingListBook.findFirst({
                where: { levelId: level.id }
            })

            // Tüm seviye kitaplarını al ve karşılaştır
            const levelBooks = await prisma.readingListBook.findMany({
                where: { levelId: level.id }
            })

            const alreadyExists = levelBooks.some(lb =>
                normalizeTitle(lb.title) === normalizedNewTitle ||
                normalizeTitle(lb.title).includes(normalizedNewTitle) ||
                normalizedNewTitle.includes(normalizeTitle(lb.title))
            )

            let readingListBook: { id: string } | null = null

            if (alreadyExists) {
                // Mevcut kitabı bul
                readingListBook = levelBooks.find(lb =>
                    normalizeTitle(lb.title) === normalizedNewTitle ||
                    normalizeTitle(lb.title).includes(normalizedNewTitle) ||
                    normalizedNewTitle.includes(normalizeTitle(lb.title))
                ) || null
                console.log(`  ⏭️  "${book.title}" listede zaten mevcut`)
            } else {
                // Kitabı ekle
                readingListBook = await prisma.readingListBook.create({
                    data: {
                        levelId: level.id,
                        title: book.title,
                        author: book.author,
                        neden: book.neden,
                        sortOrder: currentSortOrder++
                    }
                })
                console.log(`  ✅ "${book.title}" - ${book.author} eklendi`)
                totalAdded++
            }

            // Kütüphanedeki eşleşen kitabı bul ve bağla
            if (readingListBook) {
                const normalizedListTitle = normalizeTitle(book.title)

                const matchingUserBook = unlinkedBooks.find(ub => {
                    const normalizedUserTitle = normalizeTitle(ub.title)
                    return normalizedUserTitle === normalizedListTitle ||
                           normalizedUserTitle.includes(normalizedListTitle) ||
                           normalizedListTitle.includes(normalizedUserTitle)
                })

                if (matchingUserBook) {
                    // Bağlantı zaten var mı kontrol et
                    const existingLink = await prisma.userReadingListBook.findUnique({
                        where: {
                            userId_readingListBookId: {
                                userId: user.id,
                                readingListBookId: readingListBook.id
                            }
                        }
                    })

                    if (!existingLink) {
                        await prisma.userReadingListBook.create({
                            data: {
                                userId: user.id,
                                readingListBookId: readingListBook.id,
                                bookId: matchingUserBook.id
                            }
                        })
                        console.log(`  🔗 "${matchingUserBook.title}" bağlandı`)
                        totalLinked++

                        // Bağlanan kitabı listeden çıkar
                        const idx = unlinkedBooks.findIndex(b => b.id === matchingUserBook.id)
                        if (idx > -1) unlinkedBooks.splice(idx, 1)
                    }
                }
            }
        }
    }

    // Kalan özel durumlar için manuel eşleştirme
    console.log("\n\n📌 Özel durumlar için manuel eşleştirme...")

    // Alex de Souza - Liste dışı, spor/biyografi
    // Şimdilik atlıyoruz, kullanıcıya özel bir liste oluşturulabilir

    // Beyaz Diş - Düşünce ve Dava Seviye 1'de zaten var
    const beyazDisBook = unlinkedBooks.find(b => normalizeTitle(b.title).includes("beyaz dis"))
    if (beyazDisBook) {
        const rlBook = await prisma.readingListBook.findFirst({
            where: { title: "Beyaz Diş" }
        })
        if (rlBook) {
            const existingLink = await prisma.userReadingListBook.findUnique({
                where: {
                    userId_readingListBookId: {
                        userId: user.id,
                        readingListBookId: rlBook.id
                    }
                }
            })
            if (!existingLink) {
                await prisma.userReadingListBook.create({
                    data: {
                        userId: user.id,
                        readingListBookId: rlBook.id,
                        bookId: beyazDisBook.id
                    }
                })
                console.log(`  🔗 "Beyaz Diş (Karton Kapak)" bağlandı`)
                totalLinked++
            }
        }
    }

    console.log(`\n${"=".repeat(60)}`)
    console.log(`TOPLAM: ${totalAdded} yeni kitap eklendi, ${totalLinked} kitap bağlandı.`)
    console.log(`${"=".repeat(60)}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
