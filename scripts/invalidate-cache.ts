// Bu script production'da çalışmaz, sadece development için
// Production'da sayfayı refresh etmek veya revalidate endpoint kullanmak gerekir

import { revalidateTag } from "next/cache"

// Next.js cache tag'lerini invalidate et
const tags = [
    "reading-lists-all",
    "reading-list-bilim-kurgu",
    "reading-list-dusunce-dava",
    "reading-list-tarih-medeniyet",
    "reading-list-ilahiyat-medeniyet",
    "reading-list-istihbarat-strateji",
    "reading-list-teknoloji-yapay-zeka"
]

console.log("⚠️ Bu script sadece Next.js server context'inde çalışır.")
console.log("Cache'i temizlemek için:")
console.log("1. Development: Sayfayı hard refresh yap (Ctrl+Shift+R)")
console.log("2. Production: Vercel dashboard'dan Redeploy yap")
console.log("3. Veya API route ile revalidate et")

// Alternatif: .next/cache klasörünü sil
console.log("\nManuel temizlik için:")
console.log("  Windows: rmdir /s /q .next\\cache")
console.log("  Linux/Mac: rm -rf .next/cache")
