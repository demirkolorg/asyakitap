import "dotenv/config"
import { prisma } from "../lib/prisma"

async function clearData() {
    console.log("Veriler temizleniyor (User hariç)...")

    // Sıralama önemli - foreign key bağımlılıkları nedeniyle
    // Önce bağımlı tablolar silinmeli

    // 1. En alt seviye tablolar (başka tabloya bağımlı olanlar)
    console.log("- UserChallengeBook siliniyor...")
    await prisma.userChallengeBook.deleteMany()

    console.log("- UserChallengeProgress siliniyor...")
    await prisma.userChallengeProgress.deleteMany()

    console.log("- ChallengeBook siliniyor...")
    await prisma.challengeBook.deleteMany()

    console.log("- ChallengeMonth siliniyor...")
    await prisma.challengeMonth.deleteMany()

    console.log("- ReadingChallenge siliniyor...")
    await prisma.readingChallenge.deleteMany()

    console.log("- ReadingListBook siliniyor...")
    await prisma.readingListBook.deleteMany()

    console.log("- ReadingListLevel siliniyor...")
    await prisma.readingListLevel.deleteMany()

    console.log("- ReadingList siliniyor...")
    await prisma.readingList.deleteMany()

    console.log("- AIComment siliniyor...")
    await prisma.aIComment.deleteMany()

    console.log("- ReadingLog siliniyor...")
    await prisma.readingLog.deleteMany()

    console.log("- Quote siliniyor...")
    await prisma.quote.deleteMany()

    console.log("- Book siliniyor...")
    await prisma.book.deleteMany()

    console.log("- Author siliniyor...")
    await prisma.author.deleteMany()

    console.log("- Publisher siliniyor...")
    await prisma.publisher.deleteMany()

    console.log("\n✅ Tüm veriler temizlendi (User tablosu korundu)")
}

clearData()
    .catch((e) => {
        console.error("Hata:", e)
        process.exit(1)
    })
