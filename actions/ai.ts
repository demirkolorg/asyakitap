"use server"

import { generateText, chat } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * AI ile metin üretme (tek prompt)
 */
export async function aiGenerate(prompt: string, systemPrompt?: string) {
    // Auth kontrolü (opsiyonel - gerekirse aç)
    // const supabase = await createClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) throw new Error("Unauthorized")

    const result = await generateText(prompt, systemPrompt)
    return result
}

/**
 * AI ile sohbet (çoklu mesaj)
 */
export async function aiChat(
    messages: { role: "user" | "model"; content: string }[],
    systemPrompt?: string
) {
    const result = await chat(messages, systemPrompt)
    return result
}

// =====================================================
// KITAP UYGULAMASI İÇİN HAZIR AI FONKSİYONLARI
// =====================================================

/**
 * Kitap özeti oluştur
 */
export async function generateBookSummary(bookTitle: string, authorName: string) {
    const systemPrompt = `Sen bir kitap uzmanısın. Türkçe yanıt ver. Kısa ve öz ol.`
    const prompt = `"${bookTitle}" (${authorName}) kitabının kısa bir özetini yaz. 2-3 paragraf olsun.`

    return await generateText(prompt, systemPrompt)
}

/**
 * Kitap önerisi al
 */
export async function getBookRecommendations(
    readBooks: string[],
    preferences?: string
) {
    const systemPrompt = `Sen bir kitap danışmanısın. Kullanıcının okuduğu kitaplara ve tercihlerine göre yeni kitaplar öner. Türkçe yanıt ver.`

    let prompt = `Okuduğum kitaplar:\n${readBooks.map(b => `- ${b}`).join("\n")}\n\n`
    if (preferences) {
        prompt += `Tercihlerim: ${preferences}\n\n`
    }
    prompt += `Bana 5 kitap öner. Her kitap için kısa bir açıklama ekle.`

    return await generateText(prompt, systemPrompt)
}

/**
 * Okuma notu analizi
 */
export async function analyzeReadingNote(note: string, bookTitle: string) {
    const systemPrompt = `Sen bir edebiyat eleştirmenisin. Kullanıcının kitap notlarını analiz et ve geri bildirim ver. Türkçe yanıt ver.`
    const prompt = `"${bookTitle}" kitabı için aldığım not:\n\n"${note}"\n\nBu not hakkında ne düşünüyorsun? Derinleştirmemi önerir misin?`

    return await generateText(prompt, systemPrompt)
}

/**
 * Kitap hakkında soru sor
 */
export async function askAboutBook(bookTitle: string, authorName: string, question: string) {
    const systemPrompt = `Sen "${bookTitle}" (${authorName}) kitabı hakkında uzman bir asistansın. Türkçe yanıt ver.`
    const prompt = question

    return await generateText(prompt, systemPrompt)
}

/**
 * Yazar biyografisi oluştur
 */
export async function generateAuthorBio(authorName: string) {
    const systemPrompt = `Sen bir edebiyat ve yazar uzmanısın. Yazarlar hakkında kısa, bilgilendirici biyografiler yazarsın. Türkçe yanıt ver.`
    const prompt = `"${authorName}" hakkında kısa bir biyografi yaz.

Biyografide şunlar yer alsın:
- Doğum ve (varsa) ölüm tarihi/yeri
- Hangi dönemde ve hangi türde yazdığı
- En önemli eserleri (2-3 tane)
- Edebi tarzı ve önemi

2-3 paragraf olsun. Sadece biyografiyi yaz, başka bir şey ekleme.`

    return await generateText(prompt, systemPrompt)
}

/**
 * Tortu (okuma notu/düşünce) yorumla ve kaydet
 */
export async function analyzeTortu(
    tortu: string,
    bookTitle: string,
    authorName: string,
    bookId?: string
) {
    const systemPrompt = `Sen empatik ve düşünceli bir edebiyat dostusun. Okuyucunun kitap hakkındaki düşüncelerini, notlarını ve hislerini yorumluyorsun.

Yaklaşımın:
- Samimi ve sıcak bir dil kullan
- Okuyucunun düşüncelerini takdir et
- Derinleştirici sorular veya bakış açıları sun
- Kitapla bağlantı kur
- 2-3 paragraf yaz, fazla uzatma

Türkçe yanıt ver.`

    const prompt = `Kitap: "${bookTitle}" - ${authorName}

Okuyucunun bu kitap hakkındaki düşünceleri (Tortu):
"""
${tortu}
"""

Bu düşünceleri yorumla. Okuyucunun kitaptan ne aldığını, hangi noktaların dikkatini çektiğini değerlendir.`

    const result = await generateText(prompt, systemPrompt)

    // AI yorumunu veritabanına kaydet
    if (bookId && result.success && result.text) {
        try {
            // Book'a kaydet (eski yöntem - geriye uyumluluk)
            await prisma.book.update({
                where: { id: bookId },
                data: { tortuAiComment: result.text }
            })

            // AIComment tablosuna kaydet (yeni yöntem - metadata ile)
            await prisma.aIComment.create({
                data: {
                    bookId,
                    source: "TORTU",
                    userContent: tortu,
                    aiComment: result.text
                }
            })

            revalidatePath(`/book/${bookId}`)
            revalidatePath("/ai-comments")
        } catch (error) {
            console.error("Failed to save tortu AI comment:", error)
        }
    }

    return result
}

/**
 * İmza (yazarın üslubu hakkında not) yorumla ve kaydet
 */
export async function analyzeImza(
    imza: string,
    bookTitle: string,
    authorName: string,
    bookId?: string
) {
    const systemPrompt = `Sen bir edebiyat eleştirmeni ve üslup uzmanısın. Okuyucunun yazarın üslubu, dili ve tarzı hakkındaki gözlemlerini değerlendiriyorsun.

Yaklaşımın:
- Okuyucunun üslup analizini takdir et
- Yazarın genel tarzıyla karşılaştır
- Edebiyat tekniği hakkında bilgi ekle
- Benzer üsluba sahip yazarlar önerebilirsin
- 2-3 paragraf yaz

Türkçe yanıt ver.`

    const prompt = `Kitap: "${bookTitle}" - ${authorName}

Okuyucunun yazarın üslubu hakkındaki gözlemleri (İmza):
"""
${imza}
"""

Bu üslup analizini yorumla. Okuyucunun tespit ettiği özellikleri değerlendir ve derinleştir.`

    const result = await generateText(prompt, systemPrompt)

    // AI yorumunu veritabanına kaydet
    if (bookId && result.success && result.text) {
        try {
            // Book'a kaydet (eski yöntem - geriye uyumluluk)
            await prisma.book.update({
                where: { id: bookId },
                data: { imzaAiComment: result.text }
            })

            // AIComment tablosuna kaydet (yeni yöntem - metadata ile)
            await prisma.aIComment.create({
                data: {
                    bookId,
                    source: "IMZA",
                    userContent: imza,
                    aiComment: result.text
                }
            })

            revalidatePath(`/book/${bookId}`)
            revalidatePath("/ai-comments")
        } catch (error) {
            console.error("Failed to save imza AI comment:", error)
        }
    }

    return result
}

/**
 * Genel okuma analizi - İstatistikler ve okuma alışkanlıkları hakkında AI yorumu
 */
export async function analyzeReadingHabits(stats: {
    totalBooks: number
    completedBooks: number
    readingBooks: number
    toReadBooks: number
    dnfBooks: number
    totalPagesRead: number
    averageDaysPerBook: number | null
    pagesPerDay: number | null
    booksThisMonth: number
    booksThisYear: number
    completionRate: number
    topAuthors: { name: string; bookCount: number }[]
    topPublishers: { name: string; bookCount: number }[]
    bestMonth: { month: string; count: number } | null
}) {
    // Auth kontrolü
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    const systemPrompt = `Sen samimi ve motive edici bir okuma koçusun. Kullanıcının okuma alışkanlıklarını analiz edip kişiselleştirilmiş yorumlar yapıyorsun.

Yaklaşımın:
- Samimi ve cesaretlendirici bir dil kullan
- Başarıları takdir et
- Gelişim alanlarını nazikçe belirt
- Somut ve uygulanabilir öneriler sun
- 3-4 paragraf yaz, çok uzatma
- Emoji kullanma

Türkçe yanıt ver.`

    const topAuthorsText = stats.topAuthors.length > 0
        ? stats.topAuthors.slice(0, 5).map(a => `${a.name} (${a.bookCount} kitap)`).join(", ")
        : "Henüz yazar verisi yok"

    const statsText = `Genel Durum:
- Toplam kitap: ${stats.totalBooks}
- Tamamlanan: ${stats.completedBooks}
- Şu an okunan: ${stats.readingBooks}
- Okunacak listesinde: ${stats.toReadBooks}
- Yarım bırakılan: ${stats.dnfBooks}
- Tamamlanma oranı: %${stats.completionRate}

Okuma Hızı:
- Toplam okunan sayfa: ${stats.totalPagesRead.toLocaleString()}
- Ortalama kitap süresi: ${stats.averageDaysPerBook ?? "Veri yok"} gün
- Günlük sayfa ortalaması: ${stats.pagesPerDay ?? "Veri yok"} sayfa

Dönemsel:
- Bu ay: ${stats.booksThisMonth} kitap
- Bu yıl: ${stats.booksThisYear} kitap
- En verimli ay: ${stats.bestMonth ? `${stats.bestMonth.month} (${stats.bestMonth.count} kitap)` : "Henüz veri yok"}

En Çok Okuduğum Yazarlar:
${topAuthorsText}`

    const prompt = `Okuma İstatistiklerim:

${statsText}

Bu verilere göre okuma alışkanlıklarımı analiz et. Neleri iyi yapıyorum, neleri geliştirebilirim? Motivasyon ve öneriler ver.`

    const result = await generateText(prompt, systemPrompt)

    // AI yorumunu veritabanına kaydet
    if (result.success && result.text) {
        try {
            await prisma.aIComment.create({
                data: {
                    userId: user.id,
                    source: "STATS",
                    userContent: statsText,
                    aiComment: result.text
                }
            })
            revalidatePath("/ai-comments")
        } catch (error) {
            console.error("Failed to save stats AI comment:", error)
        }
    }

    return result
}
