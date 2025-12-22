# ADR-006: 10 Kategorili Puanlama Sistemi

## Durum
Kabul

## Bağlam
Kitap değerlendirme sistemi tasarlanırken, basit 5 yıldız yerine daha detaylı bir sistem istendi.

## Karar
**10 kategorili detaylı puanlama sistemi** oluşturmaya karar verdik.

### Kategoriler

#### İçerik & Hikaye (4 kategori)
1. **Konu/Fikir (1-10):** Ana tema, mesaj veya fikrin özgünlüğü ve derinliği
2. **Akıcılık (1-10):** Okuma hızı, sayfa çevirme isteği
3. **Derinlik (1-10):** Konunun işlenme seviyesi, detay zenginliği
4. **Etki (1-10):** Kitabın bıraktığı iz, düşündürme gücü

#### Yazarlık & Üslup (3 kategori)
5. **Dil & Üslup (1-10):** Yazarın anlatım gücü, kelime seçimi
6. **Karakter/Anlatım (1-10):** Karakter derinliği veya anlatım tutarlılığı
7. **Özgünlük (1-10):** Yazarın kendine has sesi

#### Teknik & Üretim (1 kategori)
8. **Baskı/Tasarım (1-10):** Kapak, kağıt kalitesi, punto, sayfa düzeni

#### Genel (2 kategori)
9. **Tavsiye Eder misin? (1-10):** Başkalarına önerir misin?
10. **Genel Puan (1-10):** Tüm değerlendirmelerin özeti

## Sonuçlar

### Olumlu
- Detaylı ve anlamlı değerlendirmeler
- Karşılaştırılabilir metrikler
- İstatistiklerde kullanım kolaylığı
- Güçlü/zayıf yönlerin belirlenmesi

### Olumsuz
- Değerlendirme süresi uzar
- Bazı kategoriler her kitap için uygun değil

## Uygulama

```typescript
// lib/rating-categories.ts
export const ratingCategories = [
  { key: "konuFikir", label: "Konu/Fikir", group: "content" },
  { key: "akicilik", label: "Akıcılık", group: "content" },
  { key: "derinlik", label: "Derinlik", group: "content" },
  { key: "etki", label: "Etki", group: "content" },
  { key: "dilUslup", label: "Dil & Üslup", group: "writing" },
  { key: "karakterAnlatim", label: "Karakter/Anlatım", group: "writing" },
  { key: "ozgunluk", label: "Özgünlük", group: "writing" },
  { key: "baskiTasarim", label: "Baskı/Tasarım", group: "technical" },
  { key: "tavsiyeEderim", label: "Tavsiye Ederim", group: "general" },
  { key: "genelPuan", label: "Genel Puan", group: "general" },
]
```

### Ortalama Hesaplama

```typescript
const ortalamaPuan = (
  konuFikir + akicilik + derinlik + etki +
  dilUslup + karakterAnlatim + ozgunluk +
  baskiTasarim + tavsiyeEderim + genelPuan
) / 10
```
