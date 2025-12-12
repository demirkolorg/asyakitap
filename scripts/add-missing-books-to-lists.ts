import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Eklenecek kitaplar - liste slug'ı, seviye numarası ve kitap bilgileri
const booksToAdd = [
    // ========================================
    // DÜŞÜNCE VE DAVA OKUMALARI
    // ========================================

    // Seviye 6: Fikre Giriş ve Zihniyet Haritası
    {
        listSlug: "dusunce-dava",
        levelNumber: 6,
        books: [
            { title: "Müslümanca Düşünme Üzerine Denemeler", author: "Rasim Özdenören", neden: "İslami düşünce ve modern dünya üzerine denemeler." }
        ]
    },
    // Seviye 11: İleri Sistem Analizi
    {
        listSlug: "dusunce-dava",
        levelNumber: 11,
        books: [
            { title: "İmkansız Öyküler", author: "Rasim Özdenören", neden: "Soyut ve felsefi kurgu. Varoluşsal sorgulamalar." }
        ]
    },

    // ========================================
    // TARİH VE MEDENİYET OKUMALARI
    // ========================================

    // Seviye 1: Roman Kapısı
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 1,
        books: [
            { title: "Atalar Cengi", author: "Çağlayan Yılmaz", neden: "Türk tarihini roman tadında anlatan epik bir eser." },
            { title: "Drina Köprüsü", author: "İvo Andriç", neden: "Balkan tarihinin roman hali. Nobel ödüllü başyapıt." },
            { title: "İtbarak", author: "Çağlayan Yılmaz", neden: "Orta Asya Türk tarihini anlatan tarihi roman." },
            { title: "Yafes'in Kılıcı", author: "Çağlayan Yılmaz", neden: "Türk mitolojisi ve tarihinin romanlaştırılmış hali." }
        ]
    },
    // Seviye 2: Popüler Tarih ve Merak
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 2,
        books: [
            { title: "99 Soruda Lozan", author: "Mustafa Budak", neden: "Lozan Antlaşması hakkında merak edilen soruların cevapları." },
            { title: "Cumhuriyet Efsaneleri", author: "Mustafa Armağan", neden: "Cumhuriyet tarihi hakkında farklı bir bakış açısı." }
        ]
    },
    // Seviye 4: Orta Doğu'ya Giriş
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 4,
        books: [
            { title: "Kırmadan İncitmeden", author: "Taha Kılınç", neden: "Orta Doğu üzerine güncel analizler ve yazılar." },
            { title: "Kudüs Yazıları", author: "Taha Kılınç", neden: "Kudüs ve Filistin meselesi üzerine derinlemesine yazılar." },
            { title: "Modern Ortadoğu Tarihi", author: "James L. Gelvin", neden: "Orta Doğu'nun modern tarihine akademik bir bakış." },
            { title: "Ortadoğu'ya Dair Yirmi Tez", author: "Taha Kılınç", neden: "Orta Doğu hakkında özlü tezler ve analizler." }
        ]
    },
    // Seviye 6: Geç Dönem ve Hüzün
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 6,
        books: [
            { title: "19. Yüzyıl Siyasi Tarihi (1789-1914)", author: "Fahir Armaoğlu", neden: "19. yüzyıl dünya siyasi tarihinin akademik başvuru kaynağı." }
        ]
    },
    // Seviye 9: Türk Kültürü ve Teşkilat Tarihi
    {
        listSlug: "tarih-medeniyet",
        levelNumber: 9,
        books: [
            { title: "Milliyetçilik Nedir, Ne Değildir?", author: "Ahmet Köklügiller", neden: "Milliyetçilik kavramının analizi ve tartışması." },
            { title: "Türk Milli Kültürü", author: "İbrahim Kafesoğlu", neden: "Türk kültür tarihinin temel başvuru eseri." }
        ]
    },

    // ========================================
    // İSTİHBARAT VE STRATEJİ OKUMALARI
    // ========================================

    // Seviye 1: İtiraflar ve Gerçek Yüzler
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 1,
        books: [
            { title: "Beklenmeyen Misafir", author: "Agatha Christie", neden: "Klasik polisiye kurgusu ve gizem." },
            { title: "Cehennem", author: "Dan Brown", neden: "Gerilim ve komplo teorileri üzerine popüler kurgu." },
            { title: "Da Vinci Şifresi", author: "Dan Brown", neden: "Tarih, sanat ve gizem karışımı popüler roman." },
            { title: "İstanbul Hatırası", author: "Ahmet Ümit", neden: "Tarihi polisiye. İstanbul'un gizemli sokakları." },
            { title: "Karanlıkta Yürüyen Yabancı", author: "Eddi Anter", neden: "Gerilim ve gizem romanı." },
            { title: "On Küçük Zenci", author: "Agatha Christie", neden: "Polisiye edebiyatının başyapıtlarından." }
        ]
    },
    // Seviye 2: Suç ve Kriminal Analiz
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 2,
        books: [
            { title: "Sherlock Holmes - Kızıl Dosya", author: "Arthur Conan Doyle", neden: "Sherlock Holmes serisinin ilk romanı. Tümdengelim mantığı." },
            { title: "Sherlock Holmes - Dörtlerin İşareti", author: "Arthur Conan Doyle", neden: "Holmes'un klasik maceralarından." },
            { title: "Sherlock Holmes - Baskervillelerin Köpeği", author: "Arthur Conan Doyle", neden: "Serinin en ünlü romanı." },
            { title: "Sherlock Holmes - Korku Vadisi", author: "Arthur Conan Doyle", neden: "Karanlık bir gizemin peşinde." },
            { title: "Sherlock Holmes - Son Vaka", author: "Arthur Conan Doyle", neden: "Holmes'un en zorlu davalarından." }
        ]
    },
    // Seviye 6: Modern İstihbarat Teorisi
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 6,
        books: [
            { title: "Bir Gizli Servisin Tarihi-MİT", author: "Tuncay Özkan", neden: "Türk istihbaratının tarihsel gelişimi." },
            { title: "Haarp Silahı ve Nicola Tesla", author: "Kürşad Berkkan", neden: "Teknoloji, komplo teorileri ve modern harp." },
            { title: "Terör", author: "Emin Demirel", neden: "Terör ve güvenlik üzerine analiz." }
        ]
    },
    // Seviye 9: Derin Devlet ve Güç Mimarisi
    {
        listSlug: "istihbarat-strateji",
        levelNumber: 9,
        books: [
            { title: "Cemaat'in İflası", author: "Hanefi Avcı", neden: "Paralel yapılanma ve derin devlet analizi." }
        ]
    },

    // ========================================
    // DİN VE İSLAM OKUMALARI
    // ========================================

    // Seviye 1: Siyer ve Asr-ı Saadet
    {
        listSlug: "ilahiyat-medeniyet",
        levelNumber: 1,
        books: [
            { title: "Eyvallah - Seyyah", author: "Hikmet Anıl Öztekin", neden: "Manevi yolculuk ve arayış hikayesi. Popüler giriş." },
            { title: "Peygamber Efendimiz'in Muhtasar Hayatı", author: "Ahmed Cevdet Paşa", neden: "Hz. Muhammed'in hayatının özlü anlatımı." }
        ]
    },
    // Seviye 7: Tasavvuf ve İrfan
    {
        listSlug: "ilahiyat-medeniyet",
        levelNumber: 7,
        books: [
            { title: "Allah İçin Sevmek", author: "İmam Gazali", neden: "Sevgi ve muhabbet üzerine tasavvufi bir eser." }
        ]
    },
    // Seviye 10: Klasikler ve Başvuru Eserleri
    {
        listSlug: "ilahiyat-medeniyet",
        levelNumber: 10,
        books: [
            { title: "Lem'alar", author: "Bediüzzaman Said Nursi", neden: "Risale-i Nur külliyatından. İman ve İslam üzerine derin tefekkür." }
        ]
    }
]

async function main() {
    console.log("Eksik kitapları okuma listelerine ekleme başlıyor...\n")

    let totalAdded = 0

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

        if (!list) {
            console.log(`❌ Liste bulunamadı: ${entry.listSlug}`)
            continue
        }

        if (list.levels.length === 0) {
            console.log(`❌ Seviye bulunamadı: ${list.name} - Seviye ${entry.levelNumber}`)
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
            // Kitap zaten var mı kontrol et
            const existingBook = await prisma.readingListBook.findFirst({
                where: {
                    levelId: level.id,
                    title: book.title
                }
            })

            if (existingBook) {
                console.log(`  ⏭️  "${book.title}" zaten mevcut`)
                continue
            }

            // Kitabı ekle
            await prisma.readingListBook.create({
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
    }

    console.log(`\n${"=".repeat(60)}`)
    console.log(`TOPLAM: ${totalAdded} yeni kitap eklendi.`)
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
