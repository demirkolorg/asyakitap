import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Türkçe karakterleri normalize et
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9\s]/g, "") // Özel karakterleri kaldır
        .replace(/\s+/g, " ") // Birden fazla boşluğu tek boşluğa indir
        .trim()
}

// İki string arasındaki benzerlik oranını hesapla (Levenshtein mesafesi tabanlı)
function similarity(str1: string, str2: string): number {
    const s1 = normalizeText(str1)
    const s2 = normalizeText(str2)

    if (s1 === s2) return 1

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    if (longer.length === 0) return 1

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = []
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j
            } else if (j > 0) {
                let newValue = costs[j - 1]
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                }
                costs[j - 1] = lastValue
                lastValue = newValue
            }
        }
        if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
}

// Kelime tabanlı benzerlik (kitap ismi için daha iyi)
function wordSimilarity(str1: string, str2: string): number {
    const words1 = normalizeText(str1).split(" ").filter(w => w.length > 1)
    const words2 = normalizeText(str2).split(" ").filter(w => w.length > 1)

    if (words1.length === 0 || words2.length === 0) return 0

    let matchCount = 0
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1 === word2 || similarity(word1, word2) > 0.8) {
                matchCount++
                break
            }
        }
    }

    return matchCount / Math.max(words1.length, words2.length)
}

// Kombine benzerlik skoru
function combinedSimilarity(title1: string, title2: string, author1: string | null, author2: string): number {
    const titleSim = Math.max(similarity(title1, title2), wordSimilarity(title1, title2))

    // Yazar benzerliği (varsa)
    let authorSim = 0.5 // Varsayılan değer (yazar yoksa)
    if (author1) {
        authorSim = similarity(author1, author2)
    }

    // Başlık %70, Yazar %30 ağırlık
    return titleSim * 0.7 + authorSim * 0.3
}

async function main() {
    console.log("Kitapları bağlama işlemi başlıyor...\n")

    // Tüm kullanıcıları al
    const users = await prisma.user.findMany({
        select: { id: true, email: true }
    })

    console.log(`${users.length} kullanıcı bulundu.\n`)

    // Tüm okuma listesi kitaplarını al
    const readingListBooks = await prisma.readingListBook.findMany({
        include: {
            level: {
                include: {
                    readingList: true
                }
            }
        }
    })

    console.log(`${readingListBooks.length} okuma listesi kitabı bulundu.\n`)

    let totalLinked = 0
    let totalSkipped = 0

    for (const user of users) {
        console.log(`\n${"=".repeat(60)}`)
        console.log(`Kullanıcı: ${user.email}`)
        console.log(`${"=".repeat(60)}`)

        // Kullanıcının kitaplarını al (yazar bilgisiyle)
        const userBooks = await prisma.book.findMany({
            where: { userId: user.id },
            include: {
                author: true
            }
        })

        console.log(`${userBooks.length} kitap bulundu.\n`)

        // Kullanıcının mevcut bağlantılarını al
        const existingLinks = await prisma.userReadingListBook.findMany({
            where: { userId: user.id },
            select: { readingListBookId: true, bookId: true }
        })

        const linkedReadingListBookIds = new Set(existingLinks.map(l => l.readingListBookId))
        const linkedBookIds = new Set(existingLinks.filter(l => l.bookId).map(l => l.bookId))

        let userLinked = 0

        for (const userBook of userBooks) {
            // Bu kitap zaten bir listeye bağlıysa atla
            if (linkedBookIds.has(userBook.id)) {
                continue
            }

            // En iyi eşleşmeyi bul
            let bestMatch: { book: typeof readingListBooks[0], score: number } | null = null

            for (const rlBook of readingListBooks) {
                // Bu okuma listesi kitabı zaten bağlıysa atla
                if (linkedReadingListBookIds.has(rlBook.id)) {
                    continue
                }

                const score = combinedSimilarity(
                    userBook.title,
                    rlBook.title,
                    userBook.author?.name || null,
                    rlBook.author
                )

                if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
                    bestMatch = { book: rlBook, score }
                }
            }

            if (bestMatch) {
                // Bağlantı oluştur
                await prisma.userReadingListBook.create({
                    data: {
                        userId: user.id,
                        readingListBookId: bestMatch.book.id,
                        bookId: userBook.id
                    }
                })

                console.log(`✓ "${userBook.title}" → "${bestMatch.book.title}" (${bestMatch.book.level.readingList.name} - ${bestMatch.book.level.name})`)
                console.log(`  Skor: ${(bestMatch.score * 100).toFixed(1)}%`)

                linkedReadingListBookIds.add(bestMatch.book.id)
                linkedBookIds.add(userBook.id)
                userLinked++
                totalLinked++
            }
        }

        if (userLinked === 0) {
            console.log("Yeni eşleşme bulunamadı.")
        } else {
            console.log(`\n${userLinked} kitap bağlandı.`)
        }
    }

    console.log(`\n${"=".repeat(60)}`)
    console.log(`TOPLAM: ${totalLinked} kitap bağlandı.`)
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
