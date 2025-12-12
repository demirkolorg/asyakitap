// Türkçe karakter normalize ve metin benzerlik fonksiyonları

const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
}

/**
 * Metni normalize eder: küçük harf, Türkçe karakterleri dönüştür, özel karakterleri kaldır
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char] || char)
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * İki metin arasındaki benzerlik skorunu hesaplar (0-1 arası)
 */
export function calculateSimilarity(str1: string, str2: string): number {
    const s1 = normalizeText(str1)
    const s2 = normalizeText(str2)

    // Boş string kontrolü
    if (!s1 || !s2) return 0

    // Tam eşleşme
    if (s1 === s2) return 1

    // İçerme kontrolü (biri diğerini içeriyor)
    if (s1.includes(s2) || s2.includes(s1)) return 0.9

    // Kelime bazlı eşleşme
    const words1 = s1.split(/\s+/).filter(w => w.length > 1)
    const words2 = s2.split(/\s+/).filter(w => w.length > 1)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(w => words2.includes(w))
    const wordScore = commonWords.length / Math.max(words1.length, words2.length)

    return wordScore
}

/**
 * Kitap başlığı için özel eşleştirme (alt başlıkları, seri numaralarını tolere eder)
 */
export function matchBookTitle(userTitle: string, listTitle: string): number {
    const s1 = normalizeText(userTitle)
    const s2 = normalizeText(listTitle)

    // Tam eşleşme
    if (s1 === s2) return 1

    // Biri diğerini içeriyor (örn: "Marslı" ve "Marslı (The Martian)")
    if (s1.includes(s2) || s2.includes(s1)) return 0.95

    // Ana kelime eşleşmesi
    const mainWord1 = s1.split(/\s+/)[0]
    const mainWord2 = s2.split(/\s+/)[0]

    if (mainWord1 === mainWord2 && mainWord1.length >= 3) return 0.85

    return calculateSimilarity(userTitle, listTitle)
}

/**
 * Yazar adı için özel eşleştirme
 */
export function matchAuthorName(userAuthor: string, listAuthor: string): number {
    const s1 = normalizeText(userAuthor)
    const s2 = normalizeText(listAuthor)

    // Tam eşleşme
    if (s1 === s2) return 1

    // Soyadı eşleşmesi (son kelime)
    const lastName1 = s1.split(/\s+/).pop() || ''
    const lastName2 = s2.split(/\s+/).pop() || ''

    if (lastName1 === lastName2 && lastName1.length >= 3) return 0.9

    // Biri diğerini içeriyor
    if (s1.includes(s2) || s2.includes(s1)) return 0.85

    return calculateSimilarity(userAuthor, listAuthor)
}
