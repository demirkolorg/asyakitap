import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

/**
 * Bilim Kurgu Listesi Revizyonu
 *
 * Level 3 (Klasikler):
 * - Çıkar: Görünmez Adam (H.G. Wells)
 * - Ekle: Frankenstein (Mary Shelley)
 *
 * Level 6 (Post-Apokaliptik):
 * - Çıkar: Metro 2034, Metro 2035
 * - Ekle: Körlük (Jose Saramago), Ben Efsaneyim (Richard Matheson)
 *
 * Level 10 (Hard Sci-Fi):
 * - Çıkar: Dune devam kitapları (Mesihi, Çocukları, Tanrı İmparatoru, Sapkınları, Rahibeler)
 * - Ekle: 2001 Bir Uzay Destanı, Kızıl Mars, Tanrıların Tohumu, Yıldızlardan Dönüş
 */

async function removeBook(levelId: string, titlePattern: string) {
    const book = await prisma.readingListBook.findFirst({
        where: {
            levelId,
            title: { contains: titlePattern, mode: 'insensitive' }
        }
    })

    if (book) {
        // Önce kullanıcı bağlantılarını sil
        await prisma.userReadingListBook.deleteMany({
            where: { readingListBookId: book.id }
        })
        // Sonra kitabı sil
        await prisma.readingListBook.delete({
            where: { id: book.id }
        })
        console.log(`  ❌ Çıkarıldı: ${book.title} - ${book.author}`)
        return true
    } else {
        console.log(`  ⚠️ Bulunamadı: ${titlePattern}`)
        return false
    }
}

async function addBook(levelId: string, title: string, author: string, neden: string, pageCount?: number) {
    // Zaten var mı kontrol et
    const existing = await prisma.readingListBook.findFirst({
        where: {
            levelId,
            title: { contains: title, mode: 'insensitive' }
        }
    })

    if (existing) {
        console.log(`  ⚠️ Zaten mevcut: ${title}`)
        return
    }

    // Max sortOrder bul
    const maxSort = await prisma.readingListBook.aggregate({
        where: { levelId },
        _max: { sortOrder: true }
    })
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    await prisma.readingListBook.create({
        data: {
            levelId,
            title,
            author,
            neden,
            pageCount: pageCount ?? null,
            sortOrder
        }
    })
    console.log(`  ✅ Eklendi: ${title} - ${author}`)
}

async function main() {
    console.log("🚀 Bilim Kurgu Listesi Revizyonu Başlıyor...\n")

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
        console.log("❌ Bilim Kurgu listesi bulunamadı!")
        return
    }

    console.log(`✅ Liste bulundu: ${bilimKurgu.name}\n`)

    // ========================================
    // LEVEL 3: Klasikler Revizyonu
    // ========================================
    const level3 = bilimKurgu.levels.find(l => l.levelNumber === 3)
    if (level3) {
        console.log(`📚 LEVEL 3: ${level3.name}`)
        console.log(`   Mevcut kitap sayısı: ${level3.books.length}`)

        // Çıkar: Görünmez Adam
        await removeBook(level3.id, "Görünmez Adam")

        // Ekle: Frankenstein
        await addBook(
            level3.id,
            "Frankenstein",
            "Mary Shelley",
            "Bilim kurgu türünün başlangıcı kabul edilir. 1818'de yazılan bu eser, bilimin etik sınırlarını ve yaratıcının sorumluluğunu sorgular. Modern Prometheus.",
            280
        )

        console.log("")
    }

    // ========================================
    // LEVEL 6: Post-Apokaliptik Revizyonu
    // ========================================
    const level6 = bilimKurgu.levels.find(l => l.levelNumber === 6)
    if (level6) {
        console.log(`📚 LEVEL 6: ${level6.name}`)
        console.log(`   Mevcut kitap sayısı: ${level6.books.length}`)

        // Çıkar: Metro 2034 ve Metro 2035
        await removeBook(level6.id, "Metro 2034")
        await removeBook(level6.id, "Metro 2035")

        // Ekle: Körlük
        await addBook(
            level6.id,
            "Körlük",
            "Jose Saramago",
            "Tüm şehir aniden kör olursa medeniyet kaç saatte vahşete teslim olur? Nobel ödüllü yazardan, toplumsal çöküşün psikolojisini anlatan mideye yumruk gibi bir eser.",
            350
        )

        // Ekle: Ben Efsaneyim
        await addBook(
            level6.id,
            "Ben Efsaneyim",
            "Richard Matheson",
            "Will Smith filmini unutun. Vampirlerin ele geçirdiği dünyada kalan son insanın psikolojik çöküşü. Kısa, net ve vurucu bir başyapıt.",
            160
        )

        console.log("")
    }

    // ========================================
    // LEVEL 10: Hard Sci-Fi Revizyonu
    // ========================================
    const level10 = bilimKurgu.levels.find(l => l.levelNumber === 10)
    if (level10) {
        console.log(`📚 LEVEL 10: ${level10.name}`)
        console.log(`   Mevcut kitap sayısı: ${level10.books.length}`)

        // Çıkar: Dune devam kitapları (orijinal Dune kalacak)
        await removeBook(level10.id, "Dune Mesihi")
        await removeBook(level10.id, "Dune Çocukları")
        await removeBook(level10.id, "Tanrı İmparatoru")
        await removeBook(level10.id, "Dune Sapkınları")
        await removeBook(level10.id, "Rahibeler")

        // Ekle: 2001 Bir Uzay Destanı
        await addBook(
            level10.id,
            "2001: Bir Uzay Destanı",
            "Arthur C. Clarke",
            "Hard sci-fi'ın olmazsa olmazı. İnsanlığın şafağından yapay zeka HAL 9000'e uzanan evrimsel yolculuk. Kubrick filminin anlaşılmayan kısımlarını aydınlatır.",
            250
        )

        // Ekle: Kızıl Mars
        await addBook(
            level10.id,
            "Kızıl Mars",
            "Kim Stanley Robinson",
            "Mars'ın terraforming'i üzerine yazılmış en detaylı ve bilimsel eser. Mühendislik ve bilim dozu en yüksek kitaplardan biri. Sabır ister ama ödüllendirir.",
            600
        )

        // Ekle: Tanrıların Tohumu
        await addBook(
            level10.id,
            "Tanrıların Tohumu",
            "Isaac Asimov",
            "Asimov'un 'en iyi eserim' dediği kitap. Paralel evrenler arasında enerji ticareti ve bunun beklenmedik sonuçları. Saf bilim kurgu.",
            280
        )

        // Ekle: Yıldızlardan Dönüş
        await addBook(
            level10.id,
            "Yıldızlardan Dönüş",
            "Stanislaw Lem",
            "Uzay yolculuğundan dönen astronotların Dünya'ya yabancılaşması. Lem'in felsefi derinliği bu eserde zirve yapar. Düşündürücü ve hüzünlü.",
            200
        )

        console.log("")
    }

    // ========================================
    // SONUÇ RAPORU
    // ========================================
    console.log("=" .repeat(50))
    console.log("📊 REVİZYON TAMAMLANDI!")
    console.log("=" .repeat(50))

    // Güncel sayıları göster
    const updatedList = await prisma.readingList.findUnique({
        where: { slug: "bilim-kurgu" },
        include: {
            levels: {
                include: { books: true },
                orderBy: { levelNumber: "asc" }
            }
        }
    })

    if (updatedList) {
        let totalBooks = 0
        for (const level of updatedList.levels) {
            console.log(`Level ${level.levelNumber}: ${level.books.length} kitap`)
            totalBooks += level.books.length
        }
        console.log(`\n📚 Toplam: ${totalBooks} kitap`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
