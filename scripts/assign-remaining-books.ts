import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Kalan kitapları kategorize et
const manualAssignments: Record<string, string[]> = {
    // Tarih ve Medeniyet
    "Tarih ve Medeniyet Okumaları Rafı": [
        "19. Yüzyıl Siyasi Tarihi, 1789-1914 (Ciltli)",
        "99 Soruda Lozan",
        "Cumhuriyet Efsaneleri",
        "Drina Köprüsü",
        "Türk Milli Kültürü",
        "Kudüs Yazıları",
        "Milliyetçilik Nedir, Ne Değildir?"
    ],
    // Din ve İslam
    "Din ve İslam Okumaları Rafı": [
        "Allah İçin Sevmek",
        "Lem'alar (Çanta Boy İki Renk)",
        "Müslümanca Düşünme Üzerine Denemeler",
        "Peygamber Efendimiz'in Muhtasar Hayatı",
        "Eyvallah - Seyyah"
    ],
    // İstihbarat ve Strateji
    "İstihbarat ve Strateji Okumaları Rafı": [
        "Bir Gizli Servisin Tarihi-MİT 2-F-63",
        "Cemaat'in İflası",
        "Terör",
        "Beklenmeyen Misafir",
        "On Kişiydiler (On Küçük Zenci)",
        "Sherlock Holmes - Bir Suçun Portresi / Bütün Hikayeler 4",
        "Sherlock Holmes - Gölge Koleksiyonu / Bütün Hikayeler 5",
        "Sherlock Holmes - Oyun Başladı / Bütün Hikayeler 2",
        "Sherlock Holmes – Suç Uyanıyor / Bütün Hikayeler 1",
        "Sherlock Holmes – Şüphenin İzinde / Bütün Hikayeler 3",
        "Da Vinci Şifresi",
        "Cehennem (Karton Kapak)",
        "İstanbul Hatırası"
    ],
    // Düşünce ve Dava
    "Düşünce ve Dava Okumaları Rafı": [
        "İmkansız Öyküler",
        "Kırmadan İncitmeden"
    ],
    // Genel Kültür
    "Genel Kültür Okumaları Rafı": [
        "Atalar Cengi",
        "İtbarak",
        "Yafes'in Kılıcı"
    ],
    // Teknoloji
    "Teknoloji ve Yapay Zeka Okumaları Rafı": [
        "Haarp Silahı ve Nicola Tesla"
    ]
}

async function main() {
    console.log("Kalan kitaplar rafa yerleştiriliyor...")

    const shelves = await prisma.shelf.findMany()
    let totalAssigned = 0

    for (const [shelfName, bookTitles] of Object.entries(manualAssignments)) {
        const shelf = shelves.find(s => s.name === shelfName)
        if (!shelf) {
            console.log(`Raf bulunamadı: ${shelfName}`)
            continue
        }

        for (const title of bookTitles) {
            const book = await prisma.book.findFirst({
                where: {
                    title: { contains: title.split(" ").slice(0, 3).join(" ") },
                    shelfId: null
                }
            })

            if (book) {
                await prisma.book.update({
                    where: { id: book.id },
                    data: { shelfId: shelf.id }
                })
                console.log(`✓ "${book.title}" -> ${shelfName}`)
                totalAssigned++
            }
        }
    }

    console.log(`\nToplam ${totalAssigned} kitap yerleştirildi.`)

    // Son durumu kontrol et
    const remaining = await prisma.book.findMany({
        where: { shelfId: null },
        include: { author: true },
        orderBy: { title: "asc" }
    })

    if (remaining.length > 0) {
        console.log(`\nKalan ${remaining.length} rafsız kitap:`)
        for (const book of remaining) {
            console.log(`- ${book.title} (${book.author?.name || "Bilinmeyen"})`)
        }
    } else {
        console.log("\nTüm kitaplar rafa yerleştirildi!")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
