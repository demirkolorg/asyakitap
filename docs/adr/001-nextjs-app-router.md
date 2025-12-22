# ADR-001: Next.js App Router Kullanımı

## Durum
Kabul

## Bağlam
Yeni bir kitap takip uygulaması geliştirirken, frontend framework seçimi yapılması gerekiyordu. Seçenekler:
- Next.js Pages Router (eski yaklaşım)
- Next.js App Router (yeni yaklaşım)
- Remix
- Pure React + Vite

## Karar
**Next.js 16 App Router** kullanmaya karar verdik.

### Gerekçe
1. **React Server Components (RSC):** Sunucu tarafında render edilen bileşenler ile daha az JavaScript gönderimi
2. **Streaming:** Kademeli sayfa yüklemesi ile daha iyi kullanıcı deneyimi
3. **Server Actions:** API endpoint'leri yazmadan sunucu işlemleri
4. **Nested Layouts:** Sayfa geçişlerinde layout korunması
5. **Parallel Routes:** Karmaşık UI yapıları için
6. **Built-in optimizations:** Image, Font, Script optimizasyonları

## Sonuçlar

### Olumlu
- Daha hızlı ilk sayfa yüklemesi
- Type-safe server actions
- Otomatik code splitting
- SEO dostu server rendering
- Modern React 19 özellikleri

### Olumsuz
- Öğrenme eğrisi (Server vs Client components)
- Bazı kütüphanelerin uyumsuzluğu
- Caching davranışının karmaşıklığı
