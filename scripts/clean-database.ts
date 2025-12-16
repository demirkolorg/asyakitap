import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

// Direct connection için prisma client oluştur
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function cleanDatabase() {
    console.log("\n🧹 Veritabanı temizleniyor...\n")
    console.log("⚠️  User tablosu HARİÇ tüm veriler silinecek!\n")

    try {
        // Silme sırası önemli - foreign key constraints nedeniyle

        // 1. UserChallengeBook (en alt seviye)
        console.log("   Siliniyor: UserChallengeBook...")
        const deletedUserChallengeBooks = await prisma.userChallengeBook.deleteMany()
        console.log(`   ✅ UserChallengeBook: ${deletedUserChallengeBooks.count} kayıt silindi`)

        // 2. UserChallengeProgress
        console.log("   Siliniyor: UserChallengeProgress...")
        const deletedUserChallengeProgress = await prisma.userChallengeProgress.deleteMany()
        console.log(`   ✅ UserChallengeProgress: ${deletedUserChallengeProgress.count} kayıt silindi`)

        // 3. ChallengeBook
        console.log("   Siliniyor: ChallengeBook...")
        const deletedChallengeBooks = await prisma.challengeBook.deleteMany()
        console.log(`   ✅ ChallengeBook: ${deletedChallengeBooks.count} kayıt silindi`)

        // 4. ChallengeMonth
        console.log("   Siliniyor: ChallengeMonth...")
        const deletedChallengeMonths = await prisma.challengeMonth.deleteMany()
        console.log(`   ✅ ChallengeMonth: ${deletedChallengeMonths.count} kayıt silindi`)

        // 5. ReadingChallenge
        console.log("   Siliniyor: ReadingChallenge...")
        const deletedChallenges = await prisma.readingChallenge.deleteMany()
        console.log(`   ✅ ReadingChallenge: ${deletedChallenges.count} kayıt silindi`)

        // 7. ReadingListBook
        console.log("   Siliniyor: ReadingListBook...")
        const deletedReadingListBooks = await prisma.readingListBook.deleteMany()
        console.log(`   ✅ ReadingListBook: ${deletedReadingListBooks.count} kayıt silindi`)

        // 8. ReadingListLevel
        console.log("   Siliniyor: ReadingListLevel...")
        const deletedReadingListLevels = await prisma.readingListLevel.deleteMany()
        console.log(`   ✅ ReadingListLevel: ${deletedReadingListLevels.count} kayıt silindi`)

        // 9. ReadingList
        console.log("   Siliniyor: ReadingList...")
        const deletedReadingLists = await prisma.readingList.deleteMany()
        console.log(`   ✅ ReadingList: ${deletedReadingLists.count} kayıt silindi`)

        // 10. AIComment
        console.log("   Siliniyor: AIComment...")
        const deletedAIComments = await prisma.aIComment.deleteMany()
        console.log(`   ✅ AIComment: ${deletedAIComments.count} kayıt silindi`)

        // 11. ReadingLog
        console.log("   Siliniyor: ReadingLog...")
        const deletedReadingLogs = await prisma.readingLog.deleteMany()
        console.log(`   ✅ ReadingLog: ${deletedReadingLogs.count} kayıt silindi`)

        // 12. Quote
        console.log("   Siliniyor: Quote...")
        const deletedQuotes = await prisma.quote.deleteMany()
        console.log(`   ✅ Quote: ${deletedQuotes.count} kayıt silindi`)

        // 13. Book
        console.log("   Siliniyor: Book...")
        const deletedBooks = await prisma.book.deleteMany()
        console.log(`   ✅ Book: ${deletedBooks.count} kayıt silindi`)

        // 14. Author
        console.log("   Siliniyor: Author...")
        const deletedAuthors = await prisma.author.deleteMany()
        console.log(`   ✅ Author: ${deletedAuthors.count} kayıt silindi`)

        // 15. Publisher
        console.log("   Siliniyor: Publisher...")
        const deletedPublishers = await prisma.publisher.deleteMany()
        console.log(`   ✅ Publisher: ${deletedPublishers.count} kayıt silindi`)

        // User tablosu korunuyor
        const remainingUsers = await prisma.user.count()
        console.log(`\n   ℹ️  User: ${remainingUsers} kullanıcı korundu`)

        console.log("\n" + "=".repeat(50))
        console.log("✅ Veritabanı temizlendi!")
        console.log("=".repeat(50) + "\n")

    } catch (error) {
        console.error("❌ Temizleme hatası:", error)
        throw error
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

cleanDatabase()
    .catch((e) => {
        console.error("❌ Script hatası:", e)
        process.exit(1)
    })
