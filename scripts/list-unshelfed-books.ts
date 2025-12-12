import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"
import * as fs from "fs"
import * as path from "path"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Rafsız kitaplar listeleniyor...")

    const books = await prisma.book.findMany({
        where: { shelfId: null },
        include: {
            author: true,
        },
        orderBy: { title: "asc" }
    })

    console.log(`Toplam ${books.length} rafsız kitap bulundu.`)

    const lines = books.map((book, index) =>
        `${index + 1}. ${book.title} - ${book.author?.name || "Bilinmeyen Yazar"}`
    )

    const content = `# Rafsız Kitaplar\n\nToplam: ${books.length} kitap\n\n${lines.join("\n")}`

    const outputPath = path.join(process.cwd(), "doc", "rafsiz-kitaplar.txt")
    fs.writeFileSync(outputPath, content, "utf-8")

    console.log(`Dosya oluşturuldu: ${outputPath}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
