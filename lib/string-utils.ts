/**
 * Türkçe karakterleri ve metni normalize et
 * Arama ve karşılaştırma için kullanılır
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
 * Türkçe karakterleri ASCII eşdeğerlerine dönüştür
 * Slug oluşturma için kullanılır
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char] || char)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
