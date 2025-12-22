# ADR-005: Google Gemini AI Entegrasyonu

## Durum
Kabul

## Bağlam
Kitap içerik analizi için AI entegrasyonu planlanıyordu:
- OpenAI GPT
- Anthropic Claude
- Google Gemini
- Local LLM (Ollama)

## Karar
**Google Gemini AI** kullanmaya karar verdik.

### Gerekçe
1. **Ücretsiz Tier:** Gemini 1.5 Flash için cömert ücretsiz limit
2. **Türkçe Desteği:** İyi Türkçe anlama ve üretme
3. **Hız:** Flash modeli çok hızlı yanıt veriyor
4. **Context Window:** 1M token context (uzun içerikler için)
5. **Kolay Entegrasyon:** Official SDK

## Sonuçlar

### Olumlu
- Maliyet etkin (ücretsiz tier yeterli)
- Hızlı yanıt süreleri
- Tutarlı Türkçe çıktı
- JSON mode desteği

### Olumsuz
- Rate limiting (dakikada istek sınırı)
- Bazen tutarsız çıktılar
- API değişiklik riski

## Uygulama

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function analyzeContent(prompt: string) {
  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

## AI Kullanım Alanları

| Özellik | Açıklama |
|---------|----------|
| Tortu Analizi | Kullanıcının "aklında kalanlar" metninin analizi |
| İmza Analizi | Yazarın üslup ve tarzının değerlendirilmesi |
| Tema Çıkarımı | Kitap temalarının otomatik belirlenmesi |
| Tartışma Soruları | Kitap tartışma sorularının üretilmesi |
| Deneyim Raporu | Okuma deneyimi özetinin oluşturulması |
| İstatistik Yorumu | Okuma istatistiklerinin anlamlandırılması |
