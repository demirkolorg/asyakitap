# API Reference - AsyaKitap

Bu dokümantasyon, AsyaKitap uygulamasının Server Actions ve API Routes referansını içerir.

## Server Actions

Server Actions, Next.js App Router ile sunucu tarafında çalışan fonksiyonlardır. Tüm actions `"use server"` direktifi ile işaretlenmiştir.

---

## Library Actions (`actions/library.ts`)

Kitap CRUD işlemleri.

### `addBookToLibrary(bookData)`
Yeni kitap ekler.

```typescript
interface BookData {
  title: string
  authorName?: string
  publisherName?: string
  coverUrl?: string
  pageCount?: number
  isbn?: string
  publishedDate?: string
  description?: string
  inLibrary?: boolean
}
```

### `getBooks()`
Kullanıcının tüm kitaplarını getirir. Yazar ve yayınevi ilişkilerini içerir.

### `getBook(id: string)`
Tek bir kitabı tüm ilişkileriyle getirir (alıntılar, notlar, puanlama, temalar, vb.).

### `updateBook(id, data)`
Kitap bilgilerini günceller.

### `deleteBook(id: string)`
Kitabı ve tüm ilişkili verileri siler.

### `getCurrentlyReadingBooks()`
Şu anda okunan kitapları getirir.

### `getImzalarPageData()`
İmzalar sayfası için kitap verilerini getirir.

---

## AI Actions (`actions/ai.ts`)

Gemini AI entegrasyonu.

### `aiGenerate(prompt, systemPrompt?)`
Genel AI metin üretimi.

### `analyzeTortu(bookId, userTortu, authorName, bookTitle, rating?)`
Kullanıcının "aklında kalanlar" metnini analiz eder.

**Dönen Değer:**
```typescript
{
  success: boolean
  aiComment?: string
  error?: string
}
```

### `analyzeImza(bookId, userImza, authorName, bookTitle)`
Yazarın üslup analizini yapar.

### `analyzeBookThemes(bookId)`
Kitabın temalarını AI ile çıkarır.

**Dönen Değer:**
```typescript
{
  success: boolean
  themes?: Array<{
    name: string
    description: string
    confidence: number
  }>
}
```

### `generateBookDiscussionQuestions(bookId)`
Kitap için tartışma soruları üretir.

**Dönen Değer:**
```typescript
{
  success: boolean
  questions?: Array<{
    question: string
    type: 'REFLECTION' | 'ANALYSIS' | 'CONNECTION' | 'OPINION'
    difficulty: 'EASY' | 'MEDIUM' | 'DEEP'
  }>
}
```

### `generateReadingExperienceReport(bookId)`
Okuma deneyimi raporu oluşturur.

### `analyzeReadingHabits(stats)`
Okuma alışkanlıklarını analiz eder.

### `getSmartRecommendations()`
AI destekli kitap önerileri getirir.

### `addBookTheme(bookId, themeName, description?)`
Manuel tema ekler.

### `removeBookTheme(themeId)`
Tema siler.

### `getAllThemes()`
Tüm benzersiz temaları listeler.

---

## Stats Actions (`actions/stats.ts`)

İstatistik hesaplamaları.

### `getFullStats()`
Tüm istatistikleri getirir.

**Dönen Değer:**
```typescript
interface FullStatsData {
  overview: {
    totalBooks: number
    completedBooks: number
    readingBooks: number
    toReadBooks: number
    dnfBooks: number
    totalPages: number
    averageRating: number
    averagePages: number
    uniqueAuthors: number
    uniquePublishers: number
  }
  monthlyStats: Array<{
    month: string
    completed: number
    pages: number
  }>
  topAuthors: Array<{...}>
  topPublishers: Array<{...}>
  ratingDistribution: Array<{...}>
  yearlyStats: Array<{...}>
  themeStats: Array<{...}>
}
```

### `getStreakData()`
Okuma serisi (streak) verilerini getirir.

**Dönen Değer:**
```typescript
interface StreakData {
  currentStreak: number
  longestStreak: number
  totalReadingDays: number
  dailyData: Array<{
    date: string
    pagesRead: number
    booksCompleted: number
  }>
}
```

---

## Rating Actions (`actions/rating.ts`)

Kitap puanlama işlemleri.

### `saveBookRating(bookId, data)`
Kitap puanlaması kaydeder/günceller.

```typescript
interface BookRatingData {
  konuFikir: number      // 1-10
  akicilik: number       // 1-10
  derinlik: number       // 1-10
  etki: number           // 1-10
  dilUslup: number       // 1-10
  karakterAnlatim: number // 1-10
  ozgunluk: number       // 1-10
  baskiTasarim: number   // 1-10
  tavsiyeEderim: number  // 1-10
  genelPuan: number      // 1-10
}
```

### `getBookRating(bookId)`
Kitap puanlamasını getirir.

### `deleteBookRating(bookId)`
Puanlamayı siler.

### `getUserRatings()`
Kullanıcının tüm puanlamalarını getirir.

---

## Quotes Actions (`actions/quotes.ts`)

Alıntı yönetimi.

### `getAllQuotes()`
Tüm alıntıları kitap bilgileriyle getirir.

### `addQuote(bookId, content, page?)`
Yeni alıntı ekler.

### `updateQuote(quoteId, content, page?)`
Alıntıyı günceller.

### `deleteQuote(quoteId, bookId)`
Alıntıyı siler.

### `getQuotesPageData()`
Alıntılar sayfası için veri getirir.

---

## Reading Notes Actions (`actions/reading-notes.ts`)

Okuma notları yönetimi.

### `addReadingNote(bookId, content, page?, mood?)`
Yeni not ekler.

### `updateReadingNote(noteId, content, page?, mood?)`
Notu günceller.

### `deleteReadingNote(noteId)`
Notu siler.

### `getBookReadingNotes(bookId)`
Kitabın notlarını getirir.

### `getAllReadingNotes()`
Tüm notları getirir.

---

## Authors Actions (`actions/authors.ts`)

Yazar yönetimi.

### `getAuthors(search?)`
Yazarları listeler (opsiyonel arama).

### `createAuthor(data)`
Yeni yazar oluşturur.

### `getAuthorById(id)`
Yazarı kitaplarıyla birlikte getirir.

### `updateAuthor(id, data)`
Yazar bilgilerini günceller.

### `getAuthorsWithBooks()`
Tüm yazarları kitap sayılarıyla getirir.

### `getOrCreateAuthor(name)`
Varsa getirir, yoksa oluşturur.

---

## Publishers Actions (`actions/publisher.ts`)

Yayınevi yönetimi.

### `getPublishers(search?)`
Yayınevlerini listeler.

### `createPublisher(data)`
Yeni yayınevi oluşturur.

### `getPublisherById(id)`
Yayınevini kitaplarıyla getirir.

### `updatePublisher(id, data)`
Yayınevi bilgilerini günceller.

### `getPublishersWithBooks()`
Tüm yayınevlerini kitap sayılarıyla getirir.

### `getOrCreatePublisher(name)`
Varsa getirir, yoksa oluşturur.

---

## Challenge Actions (`actions/challenge.ts`)

Yıllık okuma hedefi yönetimi.

### `getChallengesSummary()`
Tüm challenge'ların özetini getirir.

### `getChallengeDetail(year)`
Yıla göre challenge detayını getirir.

### `getChallengeWithProgress(year)`
Kullanıcı ilerlemesiyle birlikte challenge getirir.

### `getActiveChallenge()`
Aktif challenge'ı getirir.

### `createChallenge(data)`
Yeni challenge oluşturur.

### `createChallengeMonth(data)`
Challenge'a ay ekler.

### `addBookToChallenge(data)`
Aya kitap ekler.

### `joinChallenge(challengeId)`
Kullanıcıyı challenge'a kaydeder.

### `markChallengeBookAsRead(userProgressId, challengeBookId)`
Kitabı tamamlandı olarak işaretler ve bonus kitapların kilidini açar.

### `updateChallengeBookStatus(userProgressId, challengeBookId, status)`
Kitap durumunu günceller.

### `updateTakeaway(challengeBookId, takeaway)`
"Aklında kalan" metnini günceller.

### `getChallengeTimeline()`
Challenge zaman çizelgesini getirir.

---

## Reading Lists Actions (`actions/reading-lists.ts`)

Tematik okuma listeleri yönetimi.

### `getReadingListsSummary()`
Liste özetlerini getirir.

### `getReadingListDetail(slug)`
Liste detayını slug ile getirir.

### `createReadingList(data)`
Yeni liste oluşturur.

### `createLevel(data)`
Listeye seviye ekler.

### `addBookToLevel(data)`
Seviyeye kitap ekler.

### `updateReadingList(id, data)`
Liste bilgilerini günceller.

### `reorderLevels(listId, levelIds)`
Seviyeleri yeniden sıralar.

### `reorderBooksInLevel(levelId, bookIds)`
Seviyedeki kitapları yeniden sıralar.

### `deleteReadingList(id)`
Listeyi siler.

### `deleteLevel(id)`
Seviyeyi siler.

### `removeBookFromLevel(id)`
Kitabı seviyeden çıkarır.

---

## Search Actions (`actions/search.ts`)

Global arama.

### `globalSearch(query)`
Kitap, yazar, yayınevi ve alıntılarda arama yapar.

**Dönen Değer:**
```typescript
interface GroupedSearchResults {
  books: Array<{...}>
  authors: Array<{...}>
  publishers: Array<{...}>
  quotes: Array<{...}>
}
```

---

## KitapYurdu Actions (`actions/kitapyurdu.ts`)

KitapYurdu web scraping.

### `scrapeKitapyurdu(url)`
URL'den kitap bilgilerini çeker.

### `addBookFromKitapyurdu(bookData, listId?, levelId?)`
KitapYurdu'dan kitap ekler.

---

## Dashboard Actions (`actions/dashboard.ts`)

Ana sayfa verileri.

### `getDashboardData()`
Dashboard için tüm verileri getirir.

---

## API Routes

### `GET /api/reading-lists`
Tüm okuma listelerini JSON olarak döner.

### `POST /api/revalidate`
Cache invalidation için revalidatePath çağırır.

**Body:**
```json
{
  "path": "/dashboard",
  "secret": "REVALIDATE_SECRET"
}
```

---

## Hata Yönetimi

Tüm server actions aşağıdaki formatta hata döner:

```typescript
{
  success: false
  error: string
}
```

Başarılı işlemlerde:

```typescript
{
  success: true
  // ... diğer veriler
}
```

## Kimlik Doğrulama

Tüm actions, Supabase Auth ile kimlik doğrulaması yapar:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return { success: false, error: "Unauthorized" }
}
```
