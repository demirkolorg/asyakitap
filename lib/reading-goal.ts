/**
 * Okuma Hedefi Takip Sistemi - Hesaplama Fonksiyonları
 */

export type ReadingGoalStatus = 'ahead' | 'on-track' | 'behind' | 'overdue' | 'no-goal'

export interface ReadingGoalInfo {
    // Temel bilgiler
    totalPages: number
    currentPage: number
    remainingPages: number
    progressPercent: number

    // Zaman bilgileri
    goalDays: number
    elapsedDays: number
    remainingDays: number
    goalEndDate: Date

    // Günlük hedefler
    originalDailyTarget: number  // Başlangıçtaki günlük hedef
    currentDailyTarget: number   // Şu anki günlük hedef (kalan sayfa / kalan gün)

    // İlerleme durumu
    expectedPagesRead: number    // Bugüne kadar okunması gereken
    pagesAhead: number           // Hedefe göre kaç sayfa fark (+ önde, - geride)
    status: ReadingGoalStatus

    // Görüntüleme için
    statusMessage: string
    statusColor: 'green' | 'yellow' | 'red' | 'gray'
}

/**
 * Sayfa sayısına göre okuma süresi tahmini
 */
export function estimateReadingDays(pageCount: number): {
    fastReader: number    // 50 sf/gün
    normalReader: number  // 30 sf/gün
    casualReader: number  // 15 sf/gün
} {
    return {
        fastReader: Math.ceil(pageCount / 50),
        normalReader: Math.ceil(pageCount / 30),
        casualReader: Math.ceil(pageCount / 15),
    }
}

/**
 * Okuma hedefi hesaplaması
 */
export function calculateReadingGoal(book: {
    pageCount: number | null
    currentPage: number
    startDate: Date | string | null
    readingGoalDays: number | null
}): ReadingGoalInfo | null {
    // Gerekli veriler yoksa null döndür
    if (!book.pageCount || !book.startDate || !book.readingGoalDays) {
        return null
    }

    const totalPages = book.pageCount
    const currentPage = book.currentPage
    const goalDays = book.readingGoalDays
    const startDate = new Date(book.startDate)

    // Temel hesaplamalar
    const remainingPages = totalPages - currentPage
    const progressPercent = Math.round((currentPage / totalPages) * 100)

    // Zaman hesaplamaları
    const now = new Date()
    const elapsedMs = now.getTime() - startDate.getTime()
    // Bugün kaçıncı gün (1'den başlar)
    const elapsedDays = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)))
    // Bugün dahil kalan gün sayısı
    const remainingDays = Math.max(0, goalDays - elapsedDays + 1)

    // Hedef bitiş tarihi
    const goalEndDate = new Date(startDate)
    goalEndDate.setDate(goalEndDate.getDate() + goalDays)

    // Günlük hedefler
    const originalDailyTarget = Math.ceil(totalPages / goalDays)
    const currentDailyTarget = remainingDays > 0
        ? Math.ceil(remainingPages / remainingDays)
        : remainingPages // Süre dolduysa kalan tüm sayfalar

    // İlerleme durumu - dün sonuna kadar okunması gereken (bugün henüz bitmedi)
    const expectedPagesRead = Math.floor((totalPages / goalDays) * (elapsedDays - 1))
    const pagesAhead = currentPage - expectedPagesRead

    // Durum belirleme
    let status: ReadingGoalStatus
    let statusMessage: string
    let statusColor: 'green' | 'yellow' | 'red' | 'gray'

    if (remainingDays <= 0 && remainingPages > 0) {
        // Süre dolmuş ama bitmemiş
        status = 'overdue'
        statusMessage = `Süre doldu! ${remainingPages} sayfa kaldı`
        statusColor = 'red'
    } else if (pagesAhead >= originalDailyTarget) {
        // 1 günden fazla önde
        status = 'ahead'
        statusMessage = `${Math.abs(pagesAhead)} sayfa öndesin!`
        statusColor = 'green'
    } else if (pagesAhead >= 0) {
        // Hedefte
        status = 'on-track'
        statusMessage = 'Hedefte gidiyorsun'
        statusColor = 'green'
    } else if (pagesAhead > -originalDailyTarget) {
        // 1 günden az geride
        status = 'behind'
        statusMessage = `${Math.abs(pagesAhead)} sayfa geride`
        statusColor = 'yellow'
    } else {
        // 1 günden fazla geride
        status = 'behind'
        statusMessage = `${Math.abs(pagesAhead)} sayfa geride!`
        statusColor = 'red'
    }

    return {
        totalPages,
        currentPage,
        remainingPages,
        progressPercent,
        goalDays,
        elapsedDays,
        remainingDays,
        goalEndDate,
        originalDailyTarget,
        currentDailyTarget,
        expectedPagesRead,
        pagesAhead,
        status,
        statusMessage,
        statusColor,
    }
}

/**
 * Kalan gün metnini formatla
 */
export function formatRemainingDays(remainingDays: number): string {
    if (remainingDays <= 0) return 'Süre doldu'
    if (remainingDays === 1) return '1 gün kaldı'
    return `${remainingDays} gün kaldı`
}

/**
 * Günlük hedef metnini formatla
 */
export function formatDailyTarget(pages: number): string {
    return `Günde ${pages} sayfa`
}
