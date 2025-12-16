import "dotenv/config"
import { prisma } from "../lib/prisma"
import * as fs from "fs"
import * as path from "path"

async function backupAllData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupDir = path.join(process.cwd(), "backups", timestamp)

    // Backup klasörünü oluştur
    fs.mkdirSync(backupDir, { recursive: true })

    console.log(`\n📦 Backup başlatılıyor: ${backupDir}\n`)

    // 1. Authors
    console.log("📚 Yazarlar yedekleniyor...")
    const authors = await prisma.author.findMany({
        include: {
            books: {
                select: { id: true, title: true }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "authors.json"),
        JSON.stringify(authors, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${authors.length} yazar yedeklendi`)

    // 2. Publishers
    console.log("🏢 Yayınevleri yedekleniyor...")
    const publishers = await prisma.publisher.findMany({
        include: {
            books: {
                select: { id: true, title: true }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "publishers.json"),
        JSON.stringify(publishers, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${publishers.length} yayınevi yedeklendi`)

    // 3. Books (with all relations)
    console.log("📖 Kitaplar yedekleniyor...")
    const books = await prisma.book.findMany({
        include: {
            author: true,
            publisher: true,
            quotes: true,
            readingLogs: true,
            aiComments: true
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "books.json"),
        JSON.stringify(books, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${books.length} kitap yedeklendi`)

    // 4. Quotes (ayrıca)
    console.log("💬 Alıntılar yedekleniyor...")
    const quotes = await prisma.quote.findMany({
        include: {
            book: {
                select: { id: true, title: true, author: { select: { name: true } } }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "quotes.json"),
        JSON.stringify(quotes, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${quotes.length} alıntı yedeklendi`)

    // 5. Reading Lists (with levels and books)
    console.log("📋 Okuma listeleri yedekleniyor...")
    const readingLists = await prisma.readingList.findMany({
        include: {
            levels: {
                include: {
                    books: {
                        include: {
                            book: {
                                include: {
                                    author: true,
                                    publisher: true
                                }
                            }
                        }
                    }
                },
                orderBy: { levelNumber: "asc" }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "reading-lists.json"),
        JSON.stringify(readingLists, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${readingLists.length} okuma listesi yedeklendi`)

    // 6. Reading Challenges (with months and books)
    console.log("🎯 Okuma hedefleri yedekleniyor...")
    const challenges = await prisma.readingChallenge.findMany({
        include: {
            months: {
                include: {
                    books: {
                        include: {
                            userProgress: true
                        }
                    }
                },
                orderBy: { monthNumber: "asc" }
            },
            userProgress: {
                include: {
                    books: true
                }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "challenges.json"),
        JSON.stringify(challenges, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${challenges.length} okuma hedefi yedeklendi`)

    // 7. Users (with all progress data)
    console.log("👤 Kullanıcılar yedekleniyor...")
    const users = await prisma.user.findMany({
        include: {
            books: {
                select: { id: true, title: true, status: true }
            },
            challengeProgress: {
                include: {
                    challenge: {
                        select: { year: true, name: true }
                    },
                    books: {
                        include: {
                            challengeBook: {
                                include: {
                                    book: {
                                        select: { title: true }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "users.json"),
        JSON.stringify(users, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${users.length} kullanıcı yedeklendi`)

    // 8. AI Comments
    console.log("🤖 AI yorumları yedekleniyor...")
    const aiComments = await prisma.aIComment.findMany({
        include: {
            book: {
                select: { id: true, title: true }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "ai-comments.json"),
        JSON.stringify(aiComments, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${aiComments.length} AI yorumu yedeklendi`)

    // 9. Reading Logs
    console.log("📝 Okuma logları yedekleniyor...")
    const readingLogs = await prisma.readingLog.findMany({
        include: {
            book: {
                select: { id: true, title: true }
            }
        }
    })
    fs.writeFileSync(
        path.join(backupDir, "reading-logs.json"),
        JSON.stringify(readingLogs, null, 2),
        "utf-8"
    )
    console.log(`   ✅ ${readingLogs.length} okuma logu yedeklendi`)

    // 10. Master backup - tüm verileri tek dosyada
    console.log("📦 Master backup oluşturuluyor...")
    const masterBackup = {
        metadata: {
            createdAt: new Date().toISOString(),
            version: "1.0",
            counts: {
                authors: authors.length,
                publishers: publishers.length,
                books: books.length,
                quotes: quotes.length,
                readingLists: readingLists.length,
                challenges: challenges.length,
                users: users.length,
                aiComments: aiComments.length,
                readingLogs: readingLogs.length
            }
        },
        data: {
            authors,
            publishers,
            books,
            quotes,
            readingLists,
            challenges,
            users,
            aiComments,
            readingLogs
        }
    }
    fs.writeFileSync(
        path.join(backupDir, "master-backup.json"),
        JSON.stringify(masterBackup, null, 2),
        "utf-8"
    )
    console.log(`   ✅ Master backup oluşturuldu`)

    // Özet
    console.log("\n" + "=".repeat(50))
    console.log("📊 BACKUP ÖZETI")
    console.log("=".repeat(50))
    console.log(`📁 Konum: ${backupDir}`)
    console.log(`📚 Yazarlar: ${authors.length}`)
    console.log(`🏢 Yayınevleri: ${publishers.length}`)
    console.log(`📖 Kitaplar: ${books.length}`)
    console.log(`💬 Alıntılar: ${quotes.length}`)
    console.log(`📋 Okuma Listeleri: ${readingLists.length}`)
    console.log(`🎯 Okuma Hedefleri: ${challenges.length}`)
    console.log(`👤 Kullanıcılar: ${users.length}`)
    console.log(`🤖 AI Yorumları: ${aiComments.length}`)
    console.log(`📝 Okuma Logları: ${readingLogs.length}`)
    console.log("=".repeat(50))
    console.log("\n✅ Backup tamamlandı!\n")

    return backupDir
}

backupAllData()
    .catch((e) => {
        console.error("❌ Backup hatası:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
