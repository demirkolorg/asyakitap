# C4 Model - AsyaKitap

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - AsyaKitap

    Person(user, "Okuyucu", "Kitaplarını takip eden kullanıcı")

    System(asyakitap, "AsyaKitap", "Kişisel kitap takip ve okuma deneyimi yönetim sistemi")

    System_Ext(supabase, "Supabase", "Kimlik doğrulama ve veritabanı hizmeti")
    System_Ext(gemini, "Google Gemini AI", "Yapay zeka analiz hizmeti")
    System_Ext(kitapyurdu, "KitapYurdu", "Kitap bilgisi arama")
    System_Ext(googlebooks, "Google Books API", "Kitap metadata arama")

    Rel(user, asyakitap, "Kullanır", "HTTPS")
    Rel(asyakitap, supabase, "Kimlik doğrulama & veri saklama", "HTTPS")
    Rel(asyakitap, gemini, "AI analiz istekleri", "HTTPS")
    Rel(asyakitap, kitapyurdu, "Kitap arama", "Web Scraping")
    Rel(asyakitap, googlebooks, "Kitap arama", "REST API")
```

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram - AsyaKitap

    Person(user, "Okuyucu")

    Container_Boundary(app, "AsyaKitap Application") {
        Container(nextjs, "Next.js App", "TypeScript, React 19", "Kullanıcı arayüzü ve server-side rendering")
        Container(serveractions, "Server Actions", "TypeScript", "İş mantığı ve veritabanı işlemleri")
        Container(apiroutes, "API Routes", "TypeScript", "Harici entegrasyonlar ve revalidation")
    }

    ContainerDb(postgres, "PostgreSQL", "Supabase", "Kitaplar, kullanıcılar, notlar, listeler")

    System_Ext(supabase_auth, "Supabase Auth", "Kimlik doğrulama")
    System_Ext(gemini, "Gemini AI", "AI analiz")
    System_Ext(external_apis, "Harici API'ler", "Kitap arama")

    Rel(user, nextjs, "Kullanır", "HTTPS")
    Rel(nextjs, serveractions, "Çağırır")
    Rel(nextjs, apiroutes, "İstek gönderir")
    Rel(serveractions, postgres, "CRUD işlemleri", "Prisma")
    Rel(serveractions, gemini, "AI istekleri")
    Rel(apiroutes, external_apis, "Kitap arama")
    Rel(nextjs, supabase_auth, "Kimlik doğrulama")
```

## Level 3: Component Diagram

### Frontend Components

```mermaid
C4Component
    title Component Diagram - Frontend

    Container_Boundary(frontend, "Next.js Frontend") {
        Component(pages, "Pages", "React", "Sayfa bileşenleri")
        Component(layouts, "Layouts", "React", "Sayfa düzenleri")
        Component(ui, "UI Components", "Radix UI", "Yeniden kullanılabilir UI elemanları")
        Component(hooks, "Custom Hooks", "TypeScript", "Paylaşılan state ve logic")
        Component(providers, "Providers", "React Context", "Theme, Auth context")
    }

    Rel(pages, layouts, "İçerir")
    Rel(pages, ui, "Kullanır")
    Rel(pages, hooks, "Kullanır")
    Rel(layouts, providers, "Sarar")
```

### Backend Components

```mermaid
C4Component
    title Component Diagram - Backend (Server Actions)

    Container_Boundary(backend, "Server Actions") {
        Component(library, "Library Actions", "TypeScript", "Kitap CRUD işlemleri")
        Component(ai, "AI Actions", "TypeScript", "Gemini AI entegrasyonu")
        Component(stats, "Stats Actions", "TypeScript", "İstatistik hesaplamaları")
        Component(challenge, "Challenge Actions", "TypeScript", "Okuma hedefi yönetimi")
        Component(readinglists, "Reading List Actions", "TypeScript", "Liste yönetimi")
        Component(rating, "Rating Actions", "TypeScript", "Puanlama işlemleri")
    }

    ComponentDb(prisma, "Prisma Client", "ORM", "Veritabanı erişimi")

    Rel(library, prisma, "Kullanır")
    Rel(ai, prisma, "Kullanır")
    Rel(stats, prisma, "Kullanır")
    Rel(challenge, prisma, "Kullanır")
    Rel(readinglists, prisma, "Kullanır")
    Rel(rating, prisma, "Kullanır")
```

## Veri Akışı

### Kitap Ekleme Akışı

```mermaid
sequenceDiagram
    participant U as Kullanıcı
    participant F as Frontend
    participant SA as Server Action
    participant DB as PostgreSQL
    participant AI as Gemini AI

    U->>F: Kitap bilgilerini girer
    F->>SA: addBook()
    SA->>DB: Yazar/Yayınevi kontrol
    SA->>DB: Kitap oluştur
    DB-->>SA: Kitap ID
    SA-->>F: Başarılı
    F-->>U: Kitap eklendi

    Note over U,AI: Opsiyonel AI Analizi
    U->>F: Tortu/İmza yazar
    F->>SA: analyzeWithAI()
    SA->>AI: Analiz isteği
    AI-->>SA: AI yorumu
    SA->>DB: Yorum kaydet
    SA-->>F: Analiz tamamlandı
```

### Okuma Hedefi (Challenge) Akışı

```mermaid
sequenceDiagram
    participant U as Kullanıcı
    participant F as Frontend
    participant SA as Server Action
    participant DB as PostgreSQL

    U->>F: Challenge sayfasını açar
    F->>SA: getChallengeProgress()
    SA->>DB: Challenge + UserProgress sorgula
    DB-->>SA: Challenge verileri
    SA-->>F: Progress bilgileri
    F-->>U: Challenge durumu gösterilir

    U->>F: Kitabı tamamladı olarak işaretle
    F->>SA: markBookCompleted()
    SA->>DB: Status güncelle
    SA->>DB: Bonus kitapları kilidi aç
    DB-->>SA: Güncelleme başarılı
    SA-->>F: Progress güncellendi
    F-->>U: UI güncellenir
```
