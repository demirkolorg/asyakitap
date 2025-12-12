import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Rafsız kitaplar rafa yerleştiriliyor...")

    // Rafsız kitapları al
    const unshelfedBooks = await prisma.book.findMany({
        where: { shelfId: null },
        include: { author: true }
    })

    console.log(`Toplam ${unshelfedBooks.length} rafsız kitap bulundu.`)

    // Rafları al
    const shelves = await prisma.shelf.findMany()

    // Okuma listelerini ve kitaplarını al
    const readingLists = await prisma.readingList.findMany({
        include: {
            levels: {
                include: {
                    books: true
                }
            }
        }
    })

    // Raf-Okuma Listesi eşleşmesi (isim benzerliğine göre)
    const shelfToListMap: Record<string, string> = {
        "Bilim Kurgu Okumaları Rafı": "Bilim Kurgu Okumaları",
        "Düşünce ve Dava Okumaları Rafı": "Düşünce ve Dava Okumaları",
        "Tarih ve Medeniyet Okumaları Rafı": "Tarih ve Medeniyet Okumaları",
        "Din ve İslam Okumaları Rafı": "Din ve İslam Okumaları",
        "İstihbarat ve Strateji Okumaları Rafı": "İstihbarat ve Strateji Okumaları",
        "Teknoloji ve Yapay Zeka Okumaları Rafı": "Teknoloji ve Yapay Zeka Okumaları"
    }

    // Her okuma listesindeki kitap başlıklarını topla
    const listBooks: Record<string, string[]> = {}
    for (const list of readingLists) {
        const listName = list.name.replace(/[🚀💡🏛️📿🎯🤖]/g, "").trim()
        listBooks[listName] = []
        for (const level of list.levels) {
            for (const book of level.books) {
                listBooks[listName].push(book.title.toLowerCase())
            }
        }
    }

    // Normalize fonksiyonu
    const normalize = (str: string) => {
        return str
            .toLowerCase()
            .replace(/[()'".,!?-]/g, "")
            .replace(/\s+/g, " ")
            .trim()
    }

    // Her rafsız kitabı kontrol et
    const assignments: { bookId: string; bookTitle: string; shelfId: string; shelfName: string }[] = []

    for (const book of unshelfedBooks) {
        const bookTitleNorm = normalize(book.title)

        for (const [shelfName, listName] of Object.entries(shelfToListMap)) {
            const shelf = shelves.find(s => s.name === shelfName)
            if (!shelf || !listBooks[listName]) continue

            const found = listBooks[listName].some(listBookTitle => {
                const listTitleNorm = normalize(listBookTitle)

                // Tam eşleşme
                if (listTitleNorm === bookTitleNorm) return true

                // Birinin diğerini içermesi
                if (listTitleNorm.includes(bookTitleNorm) || bookTitleNorm.includes(listTitleNorm)) return true

                // İlk 3 kelimenin eşleşmesi
                const bookWords = bookTitleNorm.split(" ").slice(0, 3).join(" ")
                const listWords = listTitleNorm.split(" ").slice(0, 3).join(" ")
                if (bookWords.length > 5 && bookWords === listWords) return true

                return false
            })

            if (found) {
                assignments.push({
                    bookId: book.id,
                    bookTitle: book.title,
                    shelfId: shelf.id,
                    shelfName: shelf.name
                })
                break
            }
        }
    }

    console.log(`\n${assignments.length} kitap eşleşti:\n`)

    // Kitapları rafa yerleştir
    for (const assignment of assignments) {
        await prisma.book.update({
            where: { id: assignment.bookId },
            data: { shelfId: assignment.shelfId }
        })
        console.log(`✓ "${assignment.bookTitle}" -> ${assignment.shelfName}`)
    }

    // Kalan rafsız kitapları göster
    const remainingUnshelfed = await prisma.book.findMany({
        where: { shelfId: null },
        include: { author: true },
        orderBy: { title: "asc" }
    })

    if (remainingUnshelfed.length > 0) {
        console.log(`\nKalan ${remainingUnshelfed.length} rafsız kitap:`)
        for (const book of remainingUnshelfed) {
            console.log(`- ${book.title} (${book.author?.name || "Bilinmeyen"})`)
        }
    } else {
        console.log("\nTüm kitaplar rafa yerleştirildi!")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
