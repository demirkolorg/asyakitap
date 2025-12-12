// Okuma listeleri için sabit renk mapping
export const readingListColors: Record<string, string> = {
    "bilim-kurgu": "#3b82f6",           // Mavi
    "dusunce-dava": "#8b5cf6",          // Mor
    "tarih-medeniyet": "#f97316",       // Turuncu
    "ilahiyat-medeniyet": "#22c55e",    // Yeşil
    "istihbarat-strateji": "#ef4444",   // Kırmızı
    "teknoloji-yapay-zeka": "#06b6d4",  // Cyan
}

export function getReadingListColor(slug: string): string | null {
    return readingListColors[slug] || null
}
