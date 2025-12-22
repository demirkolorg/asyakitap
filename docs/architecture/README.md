# AsyaKitap - Mimari Dokümantasyonu

## Genel Bakış

AsyaKitap, kişisel kitap takibi ve okuma deneyimi yönetimi için geliştirilmiş modern bir web uygulamasıdır. Kullanıcılar kitaplarını ekleyebilir, okuma durumlarını takip edebilir, notlar alabilir ve AI destekli içgörüler elde edebilir.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Backend | Next.js Server Actions, API Routes |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| AI | Google Gemini AI |
| Auth | Supabase Auth |
| PWA | @ducanh2912/next-pwa |

## Dokümantasyon İçeriği

- [C4 Model](./c4-model.md) - Sistem mimarisi diyagramları
- [Arc42](./arc42.md) - Kapsamlı mimari dokümantasyonu
- [Data Model](./data-model.md) - Veritabanı şeması ve ilişkiler
- [API Reference](./api-reference.md) - API endpoint'leri
- [ADRs](../adr/) - Mimari karar kayıtları
- [Diagrams](../diagrams/) - Mermaid diyagramları

## Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını hazırla
npx prisma generate
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama http://localhost:5000 adresinde çalışır.
