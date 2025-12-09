# 📘 Proje Dokümantasyonu: Kişisel Kütüphane ve "Tortu" Takip Sistemi

## 1. Proje Özeti ve Vizyon
Kullanıcının kitap okuma sürecini yönetebileceği, kitaplardan edindiği kalıcı bilgileri (**Tortu**) saklayabileceği, modern, hızlı ve sade bir web uygulamasıdır.

- **Tasarım Dili:** Sosyal medya akışkanlığında (modern, kart yapılı) ancak gürültüden uzak, odaklı ve minimalist.
- **Temel Amaç:** Sadece okunan sayfa sayısını takip etmek değil, kitabı dijital bir "ikinci beyin" arşivine dönüştürmek.

---

## 2. Teknoloji Yığını (Tech Stack)
- **Framework:** Next.js 14+ (App Router)
- **Dil:** TypeScript
- **UI Kütüphanesi:** ShadcnUI + TailwindCSS
- **İkon Seti:** Lucide React
- **Veritabanı & Auth:** Supabase (PostgreSQL) + Google Auth
- **ORM:** Prisma
- **Editör:** Tiptap veya React-MD-Editor (Markdown desteği için)
- **Dış Servisler:** Google Books API (Kitap verilerini otomatik çekmek için)
- **Deployment:** Vercel

---

## 3. Temel Özellikler ve Fonksiyonlar

### A. Kitap Yönetimi
1. **Kitap Ekleme:**
   - **Otomatik:** Kitap adı/ISBN ile Google Books API'den veri çekme.
   - **Manuel:** Yazar, sayfa sayısı, kapak görseli gibi alanları elle düzenleyebilme.
2. **Okuma Süreci:**
   - Başlangıç ve Bitiş tarihleri.
   - Sayfa bazlı ilerleme takibi (Progress Bar).
3. **Durum Yönetimi (Status):**
   - `Okunacak` (To Read)
   - `Okunuyor` (Reading)
   - `Bitti` (Completed)
   - `Yarım Bıraktım` (DNF - Did Not Finish)

### B. Özel İçerik Alanları
1. **Alıntılar (Quotes):**
   - Kitapla ilgili önemli cümlelerin sayfa numarasıyla kaydedilmesi.
   - **Kişisel Arşiv:** Sadece kullanıcının görebileceği yapı.
2. **"Tortu" (Özel Not Alanı):**
   - **Tanım:** Kitabın özünü, okuyucuda bıraktığı izi temsil eden tek ve detaylı alan.
   - **Format:** Markdown editörü (Kalın, italik, liste, başlık desteği).
   - **Amaç:** Geri dönüp bakıldığında kitabın ruhunu hatırlatmak.

---

## 4. UI/UX Mimarisi ve Sayfa Yapısı

### Layout Düzeni
- **Root Layout:** Sabit bir sol **Sidebar** (Navigasyon) ve üst **Header** (Kullanıcı profili, Tema değiştirici). İçerik alanı (Content) dinamik değişir.
- **Mobil Uyumluluk:** Sidebar mobilde "Hamburger Menü" veya alt "Tab Bar"a dönüşebilir.

### Sayfa Hiyerarşisi
1. **Landing Page:**
   - Sade, etkileyici tanıtım.
   - **Google Login** butonu (Tek giriş yöntemi).
2. **Dashboard (Ana Sayfa):**
   - Şu an okunan kitap (Büyük kart, ilerleme çubuğu).
   - Son eklenen alıntılar.
   - Yıllık okuma hedefi/istatistiği.
3. **Kütüphanem (Kitaplar Sayfası):**
   - Filtreleme (Okunanlar, Bitenler, Yarım Kalanlar).
   - Görünüm: **Bento Grid** (Kutu kutu modern tasarım).
4. **Kitap Detay Sayfası:**
   - **Sekmeli Yapı (Tabs):**
     - *Genel Bakış:* Kapak, Yazar, Puan, Tarihler.
     - *Alıntılar:* Bu kitaba ait alıntı kartları.
     - *Tortu:* Markdown editörünün bulunduğu odak alanı.
5. **Genel Alıntılar Sayfası:** Tüm kitaplardan alınan alıntıların karışık listesi.
6. **İstatistikler:** Okuma hızları, tür dağılımı (Opsiyonel/İleri aşama).

---

## 5. Teknik Mimari

### Klasör Yapısı (Next.js App Router)
```text
app/
├── (auth)/                 # Giriş İşlemleri
│   └── login/page.tsx
├── (dashboard)/            # Uygulama İçi (Sidebar Dahil)
│   ├── layout.tsx
│   ├── page.tsx            # Dashboard
│   ├── library/            # Kitap Listesi
│   ├── book/[id]/          # Kitap Detay (Sekmeli yapı)
│   └── quotes/             # Tüm Alıntılar
├── api/                    # API Route'ları (Google Books Proxy vb.)
└── components/             # UI Parçaları
```


### Veritabanı Şeması (Prisma Taslağı)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  books     Book[]
}

enum BookStatus {
  TO_READ
  READING
  COMPLETED
  DNF
}

model Book {
  id          String     @id @default(cuid())
  userId      String
  title       String
  author      String
  coverUrl    String?
  pageCount   Int?
  status      BookStatus @default(TO_READ)
  currentPage Int        @default(0)
  tortu       String?    @db.Text // Özel Markdown Alanı
  quotes      Quote[]
}

model Quote {
  id        String   @id @default(cuid())
  bookId    String
  content   String   @db.Text
  page      Int?
}
```

## 6. Tasarım Stratejisi

Optimistic UI: Butonlara basıldığında (örn: "Okumaya Başla"), sunucu yanıtı beklenmeden arayüz anında güncellenecek.

Görsel Dil: "Clean Aesthetic". Bol beyaz (veya koyu) boşluk, net tipografi, yumuşak gölgeler. Karmaşık menüler yok.

Karanlık Mod: Kullanıcı kontrollü Dark/Light tema.