import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Okuma listesi -> Varsayılan raf adı eşleştirmesi
const readingListShelfMapping: Record<string, string> = {
    "bilim-kurgu": "Bilim Kurgu Okumaları Rafı",
    "dusunce-dava": "Düşünce ve Dava Okumaları Rafı",
    "tarih-medeniyet": "Tarih ve Medeniyet Okumaları Rafı",
    "ilahiyat-medeniyet": "Din ve İslam Okumaları Rafı",
    "istihbarat-strateji": "İstihbarat ve Strateji Okumaları Rafı",
    "teknoloji-yapay-zeka": "Teknoloji ve Yapay Zeka Okumaları Rafı",
    "genel-kultur": "Genel Kültür Okumaları Rafı"
}

async function main() {
    console.log("Okuma listelerine varsayılan raf adları atanıyor...\n")

    const readingLists = await prisma.readingList.findMany()

    for (const list of readingLists) {
        const defaultShelfName = readingListShelfMapping[list.slug]

        if (defaultShelfName) {
            await prisma.readingList.update({
                where: { id: list.id },
                data: { defaultShelfName }
            })
            console.log(`✓ "${list.name}" -> "${defaultShelfName}"`)
        } else {
            console.log(`⚠ "${list.name}" için eşleşme bulunamadı (slug: ${list.slug})`)
        }
    }

    console.log("\nTamamlandı!")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
