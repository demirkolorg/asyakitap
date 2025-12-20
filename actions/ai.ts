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

// =====================================================
// KİŞİSELLEŞTİRİLMİŞ KİTAP ÖNERİLERİ
// =====================================================

export interface BookRecommendation {
    title: string
    author: string
    reason: string
    matchScore: number // 1-100
}

export interface SmartRecommendationsResult {
    success: boolean
    recommendations?: BookRecommendation[]
    summary?: string
    error?: string
}

/**
 * Kullanıcının okuma geçmişine ve tercihlerine göre akıllı kitap önerileri
 */
export async function getSmartRecommendations(): Promise<SmartRecommendationsResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Kullanıcının okuma verilerini çek
    const [completedBooks, ratings, quotes] = await Promise.all([
        prisma.book.findMany({
            where: { userId: user.id, status: "COMPLETED" },
            select: {
                title: true,
                author: { select: { name: true } },
                description: true,
                tortu: true,
                imza: true,
                rating: {
                    select: {
                        genelPuan: true,
                        konuFikir: true,
                        etki: true,
                        derinlik: true
                    }
                }
            },
            orderBy: { endDate: "desc" },
            take: 20
        }),
        prisma.bookRating.findMany({
            where: { book: { userId: user.id } },
            select: {
                genelPuan: true,
                book: { select: { title: true, author: { select: { name: true } } } }
            },
            orderBy: { genelPuan: "desc" },
            take: 10
        }),
        prisma.quote.findMany({
            where: { book: { userId: user.id } },
            select: { content: true },
            take: 10
        })
    ])

    if (completedBooks.length < 3) {
        return {
            success: false,
            error: "Öneri için en az 3 tamamlanmış kitap gerekli"
        }
    }

    // En beğenilen kitapları bul
    const topRated = ratings
        .filter(r => r.genelPuan >= 7)
        .slice(0, 5)
        .map(r => `${r.book.title} - ${r.book.author?.name || "Bilinmeyen"}`)

    // Kitap listesi
    const bookList = completedBooks.map(b => {
        const rating = b.rating?.genelPuan ? ` (Puan: ${b.rating.genelPuan}/10)` : ""
        return `- ${b.title} - ${b.author?.name || "Bilinmeyen"}${rating}`
    }).join("\n")

    // Tortu ve imzalardan tercih analizi
    const tortuSamples = completedBooks
        .filter(b => b.tortu)
        .slice(0, 3)
        .map(b => `"${b.title}": ${b.tortu?.slice(0, 200)}...`)
        .join("\n")

    const systemPrompt = `Sen kişiselleştirilmiş kitap önerileri veren uzman bir asistansın.

Görevin:
1. Kullanıcının okuduğu kitapları ve puanlarını analiz et
2. Okuma tercihlerini ve tarzını anla
3. 5 yeni kitap öner - her biri için neden uygun olduğunu açıkla
4. Her öneri için 1-100 arası uyum puanı ver

Yanıt formatı (JSON):
{
  "summary": "Kullanıcının okuma profili özeti (1-2 cümle)",
  "recommendations": [
    {
      "title": "Kitap Adı",
      "author": "Yazar Adı",
      "reason": "Bu kitabı önermemizin sebebi (2-3 cümle)",
      "matchScore": 85
    }
  ]
}

Sadece JSON döndür, başka bir şey yazma. Türkçe yaz.`

    const prompt = `Okuduğum Kitaplar:
${bookList}

En Beğendiğim Kitaplar:
${topRated.length > 0 ? topRated.join("\n") : "Henüz puanlama yok"}

Kitaplar Hakkındaki Düşüncelerim:
${tortuSamples || "Henüz not yok"}

Bu verilere göre bana 5 yeni kitap öner.`

    const result = await generateText(prompt, systemPrompt)

    if (!result.success || !result.text) {
        return { success: false, error: result.error || "AI yanıt vermedi" }
    }

    try {
        // JSON parse
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return { success: false, error: "Geçersiz AI yanıtı" }
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            success: true,
            summary: parsed.summary,
            recommendations: parsed.recommendations
        }
    } catch (e) {
        console.error("Failed to parse AI recommendations:", e)
        return { success: false, error: "AI yanıtı işlenemedi" }
    }
}

// =====================================================
// ALINTI DUYGU ANALİZİ
// =====================================================

export type QuoteSentiment = "inspiring" | "thoughtful" | "melancholic" | "humorous" | "profound" | "neutral"

export interface QuoteSentimentResult {
    quoteId: string
    sentiment: QuoteSentiment
    explanation: string
    emotion: string // Emoji
}

/**
 * Alıntıların duygusal analizini yap
 */
export async function analyzeQuoteSentiments(quotes: { id: string; content: string }[]): Promise<{
    success: boolean
    results?: QuoteSentimentResult[]
    error?: string
}> {
    if (quotes.length === 0) {
        return { success: false, error: "Analiz için alıntı gerekli" }
    }

    const systemPrompt = `Sen alıntıların duygusal tonunu analiz eden bir uzmansın.

Her alıntı için:
1. Duygu kategorisi belirle: inspiring (ilham verici), thoughtful (düşündürücü), melancholic (hüzünlü), humorous (mizahi), profound (derin), neutral (nötr)
2. Kısa açıklama yaz (1 cümle)
3. Uygun emoji seç

Yanıt formatı (JSON array):
[
  {
    "id": "alıntı_id",
    "sentiment": "inspiring",
    "explanation": "Bu alıntı umut ve motivasyon aşılıyor",
    "emotion": "✨"
  }
]

Sadece JSON döndür. Türkçe yaz.`

    const quotesText = quotes.map((q, i) => `[${q.id}]: "${q.content}"`).join("\n\n")

    const prompt = `Aşağıdaki alıntıları analiz et:\n\n${quotesText}`

    const result = await generateText(prompt, systemPrompt)

    if (!result.success || !result.text) {
        return { success: false, error: result.error || "AI yanıt vermedi" }
    }

    try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            return { success: false, error: "Geçersiz AI yanıtı" }
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            success: true,
            results: parsed
        }
    } catch (e) {
        console.error("Failed to parse sentiment analysis:", e)
        return { success: false, error: "AI yanıtı işlenemedi" }
    }
}

// =====================================================
// OKUMA DENEYİMİ RAPORU
// =====================================================

export interface ReadingExperienceReport {
    summary: string
    highlights: string[]
    authorInsight: string
    memorableQuote?: string
    overallImpression: string
    wouldRecommend: boolean
    recommendTo: string
}

/**
 * Kitap tamamlandığında kapsamlı okuma deneyimi raporu oluştur
 */
export async function generateReadingExperienceReport(bookId: string): Promise<{
    success: boolean
    report?: ReadingExperienceReport
    error?: string
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Kitap verilerini çek
    const book = await prisma.book.findFirst({
        where: { id: bookId, userId: user.id },
        select: {
            title: true,
            author: { select: { name: true } },
            pageCount: true,
            tortu: true,
            imza: true,
            description: true,
            quotes: {
                select: { content: true, page: true },
                take: 5
            },
            rating: true,
            startDate: true,
            endDate: true
        }
    })

    if (!book) {
        return { success: false, error: "Kitap bulunamadı" }
    }

    if (!book.tortu && !book.imza && book.quotes.length === 0 && !book.rating) {
        return { success: false, error: "Rapor için yeterli veri yok. Tortu, imza veya alıntı ekleyin." }
    }

    // Okuma süresi hesapla
    let readingDuration = ""
    if (book.startDate && book.endDate) {
        const days = Math.ceil((book.endDate.getTime() - book.startDate.getTime()) / (1000 * 60 * 60 * 24))
        readingDuration = `${days} günde okundu`
    }

    const systemPrompt = `Sen okuma deneyimlerini özetleyen bir edebiyat asistanısın.

Kullanıcının kitap hakkındaki tüm notlarını, alıntılarını ve puanlarını analiz ederek kapsamlı bir "Okuma Deneyimi Raporu" oluştur.

Yanıt formatı (JSON):
{
  "summary": "Kitabın genel özeti ve okuyucunun deneyimi (2-3 cümle)",
  "highlights": ["Öne çıkan nokta 1", "Öne çıkan nokta 2", "Öne çıkan nokta 3"],
  "authorInsight": "Yazarın üslubu hakkında gözlem (1-2 cümle)",
  "memorableQuote": "En etkileyici alıntı (varsa)",
  "overallImpression": "Genel izlenim ve kitabın bıraktığı etki (2-3 cümle)",
  "wouldRecommend": true/false,
  "recommendTo": "Bu kitabı kimlere önerirsin (1 cümle)"
}

Sadece JSON döndür. Türkçe yaz. Samimi ve kişisel bir dil kullan.`

    const quotesText = book.quotes.length > 0
        ? book.quotes.map(q => `"${q.content}" (s.${q.page || "?"})`).join("\n")
        : "Alıntı yok"

    const ratingText = book.rating
        ? `Genel Puan: ${book.rating.genelPuan}/10, Etki: ${book.rating.etki}/10, Derinlik: ${book.rating.derinlik}/10`
        : "Puanlama yok"

    const prompt = `Kitap: "${book.title}" - ${book.author?.name || "Bilinmeyen"}
Sayfa Sayısı: ${book.pageCount || "Bilinmiyor"}
${readingDuration}

Tortu (Düşüncelerim):
${book.tortu || "Henüz yazılmadı"}

İmza (Yazarın Üslubu):
${book.imza || "Henüz yazılmadı"}

Alıntılar:
${quotesText}

Puanlama:
${ratingText}

Bu verilere dayanarak okuma deneyimi raporu oluştur.`

    const result = await generateText(prompt, systemPrompt)

    if (!result.success || !result.text) {
        return { success: false, error: result.error || "AI yanıt vermedi" }
    }

    try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return { success: false, error: "Geçersiz AI yanıtı" }
        }

        const parsed = JSON.parse(jsonMatch[0]) as ReadingExperienceReport

        // Raporu AI yorumları olarak kaydet
        const reportText = `📖 Özet: ${parsed.summary}

✨ Öne Çıkanlar:
${parsed.highlights.map(h => `• ${h}`).join('\n')}

✍️ Yazar Hakkında: ${parsed.authorInsight}

${parsed.memorableQuote ? `💬 Akılda Kalan: "${parsed.memorableQuote}"` : ''}

🎯 Genel İzlenim: ${parsed.overallImpression}

${parsed.wouldRecommend ? '✅ Tavsiye Ederim' : '❌ Tavsiye Etmem'}: ${parsed.recommendTo}`

        await prisma.aIComment.create({
            data: {
                bookId: bookId,
                userId: user.id,
                source: 'EXPERIENCE_REPORT',
                userContent: `${book.title} - ${book.author?.name || 'Bilinmeyen Yazar'} (Okuma Deneyimi Raporu)`,
                aiComment: reportText
            }
        })

        return {
            success: true,
            report: parsed
        }
    } catch (e) {
        console.error("Failed to parse experience report:", e)
        return { success: false, error: "AI yanıtı işlenemedi" }
    }
}

// =====================================================
// OKUMA NOTLARI ANALİZİ
// =====================================================

export interface ReadingNotesAnalysis {
    summary: string           // Genel okuma deneyimi özeti
    emotionalJourney: string  // Duygusal yolculuk analizi
    keyInsights: string[]     // Önemli çıkarımlar
    readingPattern: string    // Okuma örüntüsü analizi
    recommendation: string    // Sonraki adım önerisi
}

export async function analyzeReadingNotes(
    bookId: string
): Promise<{ success: boolean; analysis?: ReadingNotesAnalysis; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Kitap ve notları getir
    const book = await prisma.book.findFirst({
        where: { id: bookId, userId: user.id },
        include: {
            author: true,
            readingNotes: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!book) {
        return { success: false, error: "Kitap bulunamadı" }
    }

    if (book.readingNotes.length < 3) {
        return { success: false, error: "En az 3 okuma notu gerekli" }
    }

    const notesText = book.readingNotes.map((note, i) => {
        const moodText = note.mood ? ` [Ruh hali: ${note.mood}]` : ''
        const pageText = note.page ? ` (Sayfa ${note.page})` : ''
        return `Not ${i + 1}${pageText}${moodText}: ${note.content}`
    }).join('\n\n')

    const systemPrompt = `Sen bir okuma koçusun. Kullanıcının kitap okurken aldığı notları analiz edeceksin. Türkçe yanıt ver.`

    const prompt = `Kitap: "${book.title}" - ${book.author?.name || 'Bilinmeyen Yazar'}
Sayfa sayısı: ${book.pageCount || 'Bilinmiyor'}
Toplam not sayısı: ${book.readingNotes.length}

Okuma Notları:
${notesText}

Bu okuma notlarını analiz et ve aşağıdaki JSON formatında yanıt ver:
{
  "summary": "Kitap boyunca alınan notların genel özeti ve okuyucunun kitapla ilişkisi (2-3 cümle)",
  "emotionalJourney": "Notlardaki duygusal değişim ve tepkiler (hangi kısımlarda ne hissedilmiş)",
  "keyInsights": ["Not 1'den çıkarım", "Not 2'den çıkarım", "Not 3'ten çıkarım"],
  "readingPattern": "Okuma örüntüsü analizi (hangi konulara odaklanılmış, ne tür şeyler dikkat çekmiş)",
  "recommendation": "Bu okuma deneyimine göre bir sonraki adım önerisi"
}

SADECE JSON döndür, başka bir şey yazma.`

    const result = await generateText(prompt, systemPrompt)

    if (!result.success || !result.text) {
        return { success: false, error: result.error || "AI yanıt üretemedi" }
    }

    try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return { success: false, error: "AI yanıtı JSON formatında değil" }
        }

        const parsed = JSON.parse(jsonMatch[0]) as ReadingNotesAnalysis

        // AI yorumunu kaydet
        const analysisText = `📖 Özet: ${parsed.summary}

💭 Duygusal Yolculuk: ${parsed.emotionalJourney}

✨ Önemli Çıkarımlar:
${parsed.keyInsights.map(i => `• ${i}`).join('\n')}

📊 Okuma Örüntüsü: ${parsed.readingPattern}

🎯 Öneri: ${parsed.recommendation}`

        await prisma.aIComment.create({
            data: {
                bookId: bookId,
                userId: user.id,
                source: 'READING_NOTE',
                userContent: `${book.title} - ${book.readingNotes.length} okuma notu analizi`,
                aiComment: analysisText
            }
        })

        return {
            success: true,
            analysis: parsed
        }
    } catch (e) {
        console.error("Failed to parse reading notes analysis:", e)
        return { success: false, error: "AI yanıtı işlenemedi" }
    }
}
