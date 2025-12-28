# AsyaKitap Chrome Eklentisi

AsyaKitap için resmi Chrome eklentisi. Kitap sitelerinden tek tıkla kitap ekleyin ve okuma ilerlemenizi takip edin.

## Özellikler

- **Kitap Ekleme**: Kitapyurdu, İdefix, Amazon.com.tr, Goodreads, D&R, BKM Kitap sitelerinden tek tıkla kitap ekleyin
- **İlerleme Takibi**: Şu an okuduğunuz kitapların sayfa ilerlemesini güncelleyin
- **İstatistikler**: Toplam kitap sayısı, okunan ve tamamlanan kitapları görün

## Desteklenen Siteler

- kitapyurdu.com
- idefix.com
- amazon.com.tr
- goodreads.com
- dr.com.tr
- bkmkitap.com

## Kurulum

### 1. Icon'ları Oluşturun (İsteğe Bağlı)

```bash
# Ana proje dizininde
npm install sharp --save-dev
node extension/scripts/generate-icons.mjs
```

Veya `extension/assets/icons/icon.svg` dosyasını manuel olarak PNG formatına çevirin:
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

### 2. Chrome'a Yükleyin

1. Chrome'da `chrome://extensions` adresine gidin
2. Sağ üstten **Geliştirici modu**'nu açın
3. **Paketlenmemiş öğe yükle** butonuna tıklayın
4. `extension` klasörünü seçin

## Kullanım

1. Eklenti ikonuna tıklayın
2. AsyaKitap hesabınızla giriş yapın
3. Desteklenen bir kitap sitesine gidin
4. Popup'ta kitap bilgilerini görün ve **+ Kitaplığa Ekle** butonuna tıklayın
5. Okumakta olduğunuz kitapların sayfa ilerlemesini popup'tan güncelleyin

## Geliştirme

### Dosya Yapısı

```
extension/
├── manifest.json           # Chrome Extension manifest (V3)
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Stiller
│   └── popup.js            # Popup logic
├── content/
│   └── content.js          # Site scraping scripts
├── background/
│   └── service-worker.js   # Background tasks
├── assets/
│   └── icons/              # Extension icons
└── scripts/
    └── generate-icons.mjs  # Icon generator script
```

### API Endpoints

Extension şu API endpoint'lerini kullanır:

- `POST /api/v1/auth` - Giriş
- `GET /api/v1/auth/verify` - Token doğrulama
- `GET /api/v1/books` - Kitap listesi
- `POST /api/v1/books` - Kitap ekleme
- `PATCH /api/v1/books/:id/progress` - İlerleme güncelleme
- `POST /api/v1/scrape` - URL'den kitap bilgisi çekme

## Notlar

- Extension Manifest V3 kullanır
- Token `chrome.storage.local`'da saklanır
- Varsayılan API URL: `https://asyakitap.vercel.app`
- Ayarlardan farklı bir API URL belirleyebilirsiniz (local development için)
