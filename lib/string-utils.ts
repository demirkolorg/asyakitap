/**
 * Türkçe karakterleri ve metni normalize et
 * Başlık ve yazar eşleştirmesi için kullanılır
 */

const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
}

export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char] || char)
        .replace(/[^a-z0-9\s]/g, '') // Sadece harf, rakam ve boşluk
        .replace(/\s+/g, ' ') // Çoklu boşlukları teke indir
        .trim()
}

/**
 * İki metin arasındaki benzerlik skorunu hesapla (0-1 arası)
 */
export function calculateSimilarity(str1: string, str2: string): number {
    const s1 = normalizeText(str1)
    const s2 = normalizeText(str2)

    // Tam eşleşme
    if (s1 === s2) return 1

    // Boş string kontrolü
    if (!s1 || !s2) return 0

    // İçerme kontrolü (birisi diğerini içeriyor mu)
    if (s1.includes(s2) || s2.includes(s1)) {
        const containmentRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)
        return Math.max(0.85, containmentRatio)
    }

    // Kelime bazlı eşleşme
    const words1 = s1.split(/\s+/).filter(w => w.length > 1)
    const words2 = s2.split(/\s+/).filter(w => w.length > 1)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(w => words2.includes(w))
    const wordScore = commonWords.length / Math.max(words1.length, words2.length)

    // Levenshtein mesafesi (basit versiyon)
    const levenshteinScore = 1 - (levenshteinDistance(s1, s2) / Math.max(s1.length, s2.length))

    // İki skorun ağırlıklı ortalaması
    return Math.max(wordScore, levenshteinScore * 0.8)
}

/**
 * Levenshtein mesafesi - iki string arasındaki düzenleme mesafesi
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length

    // Performans için max uzunluk limiti
    if (m > 100 || n > 100) {
        return Math.abs(m - n)
    }

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // silme
                    dp[i][j - 1],     // ekleme
                    dp[i - 1][j - 1]  // değiştirme
                )
            }
        }
    }

    return dp[m][n]
}

/**
 * Kitap başlık ve yazar eşleştirmesi için bileşik skor
 * @returns 0-1 arası skor, 0.75+ eşleşme sayılır
 */
export function matchBookScore(
    title1: string,
    author1: string,
    title2: string,
    author2: string
): number {
    const titleSim = calculateSimilarity(title1, title2)
    const authorSim = calculateSimilarity(author1, author2)

    // Başlık daha önemli (%60), yazar %40
    return titleSim * 0.6 + authorSim * 0.4
}
