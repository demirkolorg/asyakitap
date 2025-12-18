# AsyaKitap - Sayfa Verileri ve Açıklamaları

Bu doküman, AsyaKitap uygulamasındaki tüm sayfalarda gösterilen verileri ve bunların ne anlama geldiğini açıklar.

---

## 1. Dashboard (Genel Bakış) - `/dashboard`

Ana sayfa, kullanıcının okuma istatistiklerini ve son aktivitelerini özetler.

### İstatistik Kartları

| Veri | Açıklama |
|------|----------|
| **Toplam Kitap** | Kütüphanedeki toplam kitap sayısı |
| **Bitti** | Tamamlanmış kitap sayısı |
| **Yazar** | Farklı yazar sayısı |
| **Alıntı** | Toplam kaydedilen alıntı sayısı |
| **Tortu** | Tortu yazılmış kitap sayısı |
| **İmza** | İmza yazılmış kitap sayısı |

### Şu An Okunan

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitabın kapak görseli |
| **Başlık** | Kitabın adı |
| **Yazar** | Kitabın yazarı |
| **İlerleme %** | Okunan sayfa / toplam sayfa yüzdesi |
| **İlerleme Çubuğu** | Görsel ilerleme göstergesi |

### Okuma Hedefi Widget

| Veri | Açıklama |
|------|----------|
| **Yıl** | Hedefin ait olduğu yıl |
| **Ay/Tema** | Mevcut ayın teması ve ikonu |
| **Ana Hedefler** | Tamamlanan/toplam ana kitap sayısı |
| **İlerleme Çubuğu** | Ana hedef tamamlanma yüzdesi |
| **Ana Kitaplar** | O ayın ana hedef kitapları |
| **Bonus Kitaplar** | O ayın bonus kitapları (ana hedef tamamlanınca açılır) |

### Okuma Listeleri

| Veri | Açıklama |
|------|----------|
| **Liste Adı** | Okuma listesinin adı |
| **Kapak** | Liste kapak görseli |
| **Seviye Sayısı** | Listedeki seviye sayısı |
| **Kitap Sayısı** | Listedeki toplam kitap sayısı |

### Son Alıntılar

| Veri | Açıklama |
|------|----------|
| **Alıntı** | Alıntı metni (kısaltılmış) |
| **Kitap Adı** | Alıntının alındığı kitap |

### Son Tortular

| Veri | Açıklama |
|------|----------|
| **Kitap Adı** | Tortu yazılan kitap |
| **Tortu Önizleme** | Tortu metninin ilk 80 karakteri |

### Son İmzalar

| Veri | Açıklama |
|------|----------|
| **Kitap Adı** | İmza yazılan kitap |
| **İmza Önizleme** | İmza metninin ilk 80 karakteri |

### Son Tamamlananlar

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitap kapak görseli |
| **Başlık** | Kitabın adı |

---

## 2. Kütüphane - `/library`

Tüm kitapların listelendiği ana sayfa.

### Filtreler ve Görünümler

| Özellik | Açıklama |
|---------|----------|
| **Görünüm Modları** | Kartlar / Okuma Listeleri / Hedefler |
| **Durum Filtreleri** | Tümü / Okunuyor / Okunacak / Okudum / Yarım Bıraktım |
| **Arama** | Kitap adı veya yazar adına göre arama |
| **Kütüphanede Vurgula** | Fiziksel kütüphanedeki kitapları vurgula |

### İstatistikler

| Veri | Açıklama |
|------|----------|
| **Toplam** | Kütüphanedeki toplam kitap sayısı |
| **Okunuyor** | Şu an okunan kitap sayısı |
| **Okunacak** | Okunacaklar listesindeki kitap sayısı |
| **Okudum** | Tamamlanan kitap sayısı |
| **Yarım Bıraktım** | DNF (Did Not Finish) kitap sayısı |

### Kitap Kartı

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitap kapak görseli |
| **Başlık** | Kitabın adı |
| **Yazar** | Kitabın yazarı |
| **Durum Rozeti** | Okunuyor/Okunacak/Okudum/Yarım Bırakıldı |
| **İlerleme** | Okunuyor durumundaki kitaplar için yüzde |

### Sağ Tık Menüsü (Context Menu)

| İşlem | Açıklama |
|-------|----------|
| **Kütüphaneme Ekle/Çıkar** | Fiziksel kütüphane durumunu değiştir |
| **Kitaba Git** | Kitap detay sayfasına git |

---

## 3. Kitap Detay - `/book/[id]`

Tek bir kitabın tüm detayları.

### Temel Bilgiler

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitabın kapak görseli |
| **Başlık** | Kitabın adı |
| **Yazar** | Kitabı yazan kişi (tıklanabilir) |
| **Yayınevi** | Kitabı basan yayınevi (tıklanabilir) |
| **Durum** | Okuma durumu: Okunacak, Okunuyor, Okudum, Yarım Bırakıldı |
| **Kütüphanede** | Fiziksel kütüphanede olup olmadığı |

### İstatistik Kartları

| Veri | Açıklama |
|------|----------|
| **Puan** | Kullanıcının kitaba verdiği ortalama puan (1-10) |
| **Sayfa** | Kitabın toplam sayfa sayısı |
| **Alıntı** | Kitaptan kaydedilen alıntı sayısı |
| **Başlangıç** | Kitabı okumaya başlama tarihi |
| **Bitiş** | Kitabı bitirme tarihi |
| **Yayın** | Kitabın ilk yayınlanma tarihi/yılı |

### Ek Bilgiler

| Veri | Açıklama |
|------|----------|
| **ISBN** | Uluslararası Standart Kitap Numarası |
| **Açıklama** | Kitap hakkında özet/tanıtım metni |
| **İlerleme** | Okunuyor durumundaki kitaplar için okunan/toplam sayfa |

### Okuma Listesi Bağlantısı

| Veri | Açıklama |
|------|----------|
| **Liste Adı** | Kitabın dahil olduğu okuma listesi |
| **Liste Açıklaması** | Liste hakkında kısa bilgi |
| **Seviye** | Kitabın bulunduğu seviye numarası ve adı |
| **Neden Bu Listede** | Kitabın listeye eklenme nedeni |

### Okuma Hedefi Bağlantısı

| Veri | Açıklama |
|------|----------|
| **Hedef Adı** | Challenge adı (örn: 2025 Okuma Hedefi) |
| **Rol** | Ana Hedef veya Bonus |
| **Ay/Tema** | Kitabın ait olduğu ay ve tema |
| **Neden Bu Hedefte** | Kitabın hedefe eklenme nedeni |

### Sekmeler

#### Tortu Sekmesi
| Veri | Açıklama |
|------|----------|
| **Tortu Metni** | Kitaptan kalan düşünceler, öğrenilen dersler |
| **AI Analiz Butonu** | Tortuyu AI ile analiz ettir |

#### İmza Sekmesi
| Veri | Açıklama |
|------|----------|
| **İmza Metni** | Kitabın sende bıraktığı kişisel iz |
| **AI Analiz Butonu** | İmzayı AI ile analiz ettir |

#### Alıntılar Sekmesi
| Veri | Açıklama |
|------|----------|
| **Alıntı Metni** | Kaydedilen alıntı |
| **Sayfa No** | Alıntının bulunduğu sayfa |
| **Eklenme Tarihi** | Alıntının eklendiği tarih |

#### Puanlama Sekmesi (Sadece Okunan Kitaplar)

| Kategori | Açıklama |
|----------|----------|
| **Konu/Fikir** | Kitabın ana teması ve fikirlerinin özgünlüğü (1-10) |
| **Akıcılık** | Okumanın ne kadar kolay ve keyifli aktığı (1-10) |
| **Derinlik** | Konunun ne kadar derinlemesine işlendiği (1-10) |
| **Etki** | Kitabın üzerinde bıraktığı kalıcı etki (1-10) |
| **Dil/Üslup** | Yazarın dil kullanımı ve anlatım tarzı (1-10) |
| **Karakter/Anlatım** | Karakterlerin veya anlatımın gücü (1-10) |
| **Özgünlük** | Kitabın benzersizliği ve yaratıcılığı (1-10) |
| **Baskı/Tasarım** | Fiziksel kitabın kalitesi ve tasarımı (1-10) |
| **Tavsiye Ederim** | Başkalarına tavsiye etme derecesi (1-10) |
| **Genel Puan** | Kitabın genel değerlendirmesi (1-10) |
| **Ortalama Puan** | Tüm kategorilerin ortalaması |

#### Geçmiş Sekmesi
| Veri | Açıklama |
|------|----------|
| **Eylem** | Başlandı / Bitirildi / Yarım Bırakıldı / Tekrar Başlandı / Listeye Eklendi |
| **Tarih/Saat** | Eylemin gerçekleştiği zaman |

---

## 4. İstatistikler - `/stats`

Detaylı okuma analizleri ve istatistikler.

### Ana İstatistik Kartları

| Veri | Açıklama |
|------|----------|
| **Toplam Kitap** | Kütüphanedeki toplam kitap (okunacak sayısıyla birlikte) |
| **Tamamlanan** | Bitirilen kitap sayısı (okunuyor ile birlikte) |
| **Okunan Sayfa** | Toplam okunan sayfa sayısı (ortalama sayfa/kitap ile) |
| **Gün/Kitap** | Bir kitabı bitirmek için ortalama gün (toplam okuma günü ile) |
| **Sayfa/Gün** | Günlük ortalama okunan sayfa |
| **Tamamlanma** | Başlanan kitapların tamamlanma oranı (%) |

### Aylık Grafik

| Veri | Açıklama |
|------|----------|
| **Ay** | Yıl içindeki aylar |
| **Kitap Sayısı** | O ay bitirilen kitap sayısı |
| **Sayfa Sayısı** | O ay okunan toplam sayfa |

### Dönem İstatistikleri

| Veri | Açıklama |
|------|----------|
| **Bu Ay** | Bu ay bitirilen kitap ve sayfa sayısı |
| **Bu Yıl** | Bu yıl bitirilen kitap ve sayfa sayısı |
| **En İyi Ay** | En çok kitap bitirilen ay ve sayısı |

### En Çok Okunan Yazarlar

| Veri | Açıklama |
|------|----------|
| **Yazar Adı** | Yazarın adı |
| **Kitap Sayısı** | O yazardan okunan kitap sayısı |
| **Oran** | Tüm kitaplara göre yüzde |

### Durum Dağılımı

| Veri | Açıklama |
|------|----------|
| **Okudum** | Tamamlanan kitap sayısı ve yüzdesi |
| **Okunuyor** | Şu an okunan kitap sayısı ve yüzdesi |
| **Okunacak** | Bekleyen kitap sayısı ve yüzdesi |
| **Yarım Bıraktım** | DNF kitap sayısı ve yüzdesi |

### Alıntı İstatistikleri

| Veri | Açıklama |
|------|----------|
| **Toplam Alıntı** | Kaydedilen toplam alıntı sayısı |
| **Alıntı Yapılan Kitap** | Alıntı içeren kitap sayısı |
| **Kitap Başına Ortalama** | Her kitap için ortalama alıntı sayısı |
| **En Çok Alıntı Yapılan** | En fazla alıntı yapılan kitap |

### En Çok Okunan Yayınevleri

| Veri | Açıklama |
|------|----------|
| **Yayınevi Adı** | Yayınevinin adı |
| **Kitap Sayısı** | O yayınevinden okunan kitap sayısı |

### Okuma Hedefi İlerlemesi

| Veri | Açıklama |
|------|----------|
| **Yıl** | Hedefin yılı |
| **İlerleme %** | Tamamlanma yüzdesi |
| **Ana Kitap** | Tamamlanan ana hedef kitap sayısı |
| **Bonus Kitap** | Tamamlanan bonus kitap sayısı |
| **Toplam** | Tamamlanan/hedef toplam kitap sayısı |

### AI Okuma Analizi

| Veri | Açıklama |
|------|----------|
| **Analiz Metni** | AI tarafından oluşturulan kişiselleştirilmiş okuma analizi |

---

## 5. Okuma Hedefleri - `/challenges`

Yıllık okuma hedefleri ve ilerleme takibi.

### Hedef Listesi

| Veri | Açıklama |
|------|----------|
| **Hedef Adı** | Okuma hedefinin adı |
| **Yıl** | Hedefin ait olduğu yıl |
| **Ay Sayısı** | Tanımlanan ay sayısı |
| **Kitap Sayısı** | Toplam hedef kitap sayısı |

### Hedef Detay - `/challenges/[year]`

#### Ay Kartları

| Veri | Açıklama |
|------|----------|
| **Ay Adı** | Ayın Türkçe adı |
| **Tema** | O ayın teması |
| **Tema İkonu** | Temayı temsil eden emoji |
| **İlerleme** | Tamamlanan/toplam kitap |

#### Kitap Kartları

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitap kapak görseli |
| **Başlık** | Kitabın adı |
| **Yazar** | Kitabın yazarı |
| **Rol** | Ana Hedef veya Bonus |
| **Durum** | Başlanmadı / Okunuyor / Tamamlandı |
| **Neden** | Kitabın hedefe eklenme nedeni |
| **Sayfa** | Kitabın sayfa sayısı |

---

## 6. Okuma Listeleri - `/reading-lists`

Tematik okuma listeleri.

### Liste Kartları

| Veri | Açıklama |
|------|----------|
| **Kapak** | Liste kapak görseli |
| **Liste Adı** | Okuma listesinin adı |
| **Açıklama** | Liste hakkında kısa bilgi |
| **Seviye Sayısı** | Listedeki seviye sayısı |
| **Kitap Sayısı** | Listedeki toplam kitap sayısı |

### Liste Detay - `/reading-lists/[slug]`

#### Seviyeler

| Veri | Açıklama |
|------|----------|
| **Seviye No** | Seviye numarası |
| **Seviye Adı** | Seviyenin adı |
| **Açıklama** | Seviye hakkında bilgi |
| **Kitap Sayısı** | Seviyedeki kitap sayısı |

#### Kitap Kartları

| Veri | Açıklama |
|------|----------|
| **Kapak** | Kitap kapak görseli |
| **Başlık** | Kitabın adı |
| **Yazar** | Kitabın yazarı |
| **Sayfa** | Kitabın sayfa sayısı |
| **Neden** | Kitabın listeye eklenme nedeni |
| **Durum** | Kütüphanede olup olmadığı ve okuma durumu |

---

## 7. Alıntılar - `/quotes`

Kitaplardan kaydedilen alıntılar.

### Filtreler

| Özellik | Açıklama |
|---------|----------|
| **Arama** | Alıntı metni, kitap adı veya yazar adına göre arama |
| **Kitap Filtresi** | Belirli bir kitaptan alıntıları göster |

### Sol Kenar Çubuğu

| Veri | Açıklama |
|------|----------|
| **Kitap Adı** | Alıntı içeren kitap |
| **Alıntı Sayısı** | O kitaptan kaydedilen alıntı sayısı |

### Alıntı Kartları

| Veri | Açıklama |
|------|----------|
| **Alıntı Metni** | Kaydedilen alıntı içeriği |
| **Kitap Kapağı** | Kitabın kapak görseli |
| **Kitap Adı** | Alıntının alındığı kitap |
| **Yazar** | Kitabın yazarı |
| **Sayfa No** | Alıntının bulunduğu sayfa (varsa) |

### İşlemler

| İşlem | Açıklama |
|-------|----------|
| **Düzenle** | Alıntıyı düzenle |
| **Sil** | Alıntıyı sil |
| **Kopyala** | Alıntıyı panoya kopyala |

---

## 8. Tortular - `/summaries`

Kitaplardan kalan düşünceler ve özümsemeler.

### İstatistikler

| Veri | Açıklama |
|------|----------|
| **Toplam Tortu** | Tortu yazılmış kitap sayısı |
| **Toplam Kitap** | Kütüphanedeki toplam kitap |
| **Oran** | Tortu yazılan kitapların yüzdesi |

### Filtreler

| Özellik | Açıklama |
|---------|----------|
| **Arama** | Tortu metni veya kitap adına göre arama |
| **Sıralama** | En yeni / En eski / En uzun / A-Z |
| **Durum** | Tümü / Okudum / Okunuyor / Okunacak |

### Tortu Kartları

| Veri | Açıklama |
|------|----------|
| **Kitap Kapağı** | Kitabın kapak görseli |
| **Kitap Adı** | Tortu yazılan kitap |
| **Yazar** | Kitabın yazarı |
| **Tortu Önizleme** | Tortu metninin özeti |
| **Kelime Sayısı** | Tortunun kelime sayısı |
| **Sayfa** | Kitabın sayfa sayısı |
| **Tarih** | Son güncelleme tarihi |

---

## 9. İmzalar - `/imzalar`

Kitapların bıraktığı kişisel izler.

### İstatistikler

| Veri | Açıklama |
|------|----------|
| **Toplam İmza** | İmza yazılmış kitap sayısı |
| **Toplam Kitap** | Kütüphanedeki toplam kitap |
| **Oran** | İmza yazılan kitapların yüzdesi |

### Filtreler

| Özellik | Açıklama |
|---------|----------|
| **Arama** | İmza metni veya kitap adına göre arama |
| **Sıralama** | En yeni / En eski / En uzun / A-Z |
| **Durum** | Tümü / Okudum / Okunuyor / Okunacak |

### İmza Kartları

| Veri | Açıklama |
|------|----------|
| **Kitap Kapağı** | Kitabın kapak görseli |
| **Kitap Adı** | İmza yazılan kitap |
| **Yazar** | Kitabın yazarı |
| **İmza Önizleme** | İmza metninin özeti |
| **Kelime Sayısı** | İmzanın kelime sayısı |
| **Sayfa** | Kitabın sayfa sayısı |
| **Tarih** | Son güncelleme tarihi |

---

## 10. AI Yorumları - `/ai-comments`

AI tarafından oluşturulan Tortu ve İmza analizleri.

### Filtreler

| Özellik | Açıklama |
|---------|----------|
| **Kaynak Filtresi** | Tümü / Tortu / İmza / İstatistik |
| **Arama** | Yorum içeriğine göre arama |

### İstatistikler

| Veri | Açıklama |
|------|----------|
| **Toplam Yorum** | AI tarafından oluşturulan toplam yorum sayısı |
| **Tortu Yorumu** | Tortu için yapılan analiz sayısı |
| **İmza Yorumu** | İmza için yapılan analiz sayısı |

### Yorum Kartları

| Veri | Açıklama |
|------|----------|
| **Kaynak Tipi** | Tortu / İmza / İstatistik |
| **Kitap Kapağı** | İlgili kitabın kapak görseli |
| **Kitap Adı** | İlgili kitabın adı |
| **AI Yorumu** | AI tarafından oluşturulan analiz metni |
| **Tarih** | Yorumun oluşturulma tarihi |

---

## 11. Yazarlar - `/authors`

Kütüphanedeki yazarların listesi.

### Yazar Kartları

| Veri | Açıklama |
|------|----------|
| **Yazar Adı** | Yazarın adı |
| **Kitap Sayısı** | O yazardan kütüphanedeki kitap sayısı |
| **Okunan Kitap** | Tamamlanan kitap sayısı |

### Yazar Detay - `/author/[id]`

| Veri | Açıklama |
|------|----------|
| **Yazar Adı** | Yazarın tam adı |
| **Toplam Kitap** | Yazardan kütüphanedeki kitap sayısı |
| **Kitap Listesi** | Yazarın tüm kitapları |

---

## 12. Yayınevleri - `/publishers`

Kütüphanedeki yayınevlerinin listesi.

### Yayınevi Kartları

| Veri | Açıklama |
|------|----------|
| **Yayınevi Adı** | Yayınevinin adı |
| **Kitap Sayısı** | O yayınevinden kütüphanedeki kitap sayısı |

### Yayınevi Detay - `/publisher/[id]`

| Veri | Açıklama |
|------|----------|
| **Yayınevi Adı** | Yayınevinin tam adı |
| **Toplam Kitap** | Yayınevinden kütüphanedeki kitap sayısı |
| **Kitap Listesi** | Yayınevinin tüm kitapları |

---

## Terimler Sözlüğü

| Terim | Açıklama |
|-------|----------|
| **Tortu** | Kitaptan geriye kalan düşünceler, öğrenilen dersler, kısa özet. "Kitap bende ne bıraktı?" sorusunun cevabı. |
| **İmza** | Kitabın sende bıraktığı kişisel iz, duygusal etki. Daha öznel ve duygusal bir değerlendirme. |
| **DNF** | "Did Not Finish" - Yarım bırakılan kitaplar. |
| **Ana Hedef** | Okuma hedefindeki zorunlu/öncelikli kitaplar. |
| **Bonus** | Okuma hedefindeki opsiyonel/ek kitaplar (ana hedefler tamamlanınca açılır). |
| **Seviye** | Okuma listelerindeki zorluk veya ilerleme kademesi. |
| **Kütüphanede** | Kitabın fiziksel olarak rafta bulunup bulunmadığı. |

---

*Son güncelleme: Aralık 2024*
