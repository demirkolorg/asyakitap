# Gemini AI Kullanım Rehberi

Bu dokümantasyon, AsyaKitap uygulamasında Gemini AI entegrasyonunun nasıl kullanılacağını açıklar.

## Dosya Yapısı

```
lib/
  gemini.ts          # Temel Gemini AI client
actions/
  ai.ts              # Server Actions (AI fonksiyonları)
```

## Konfigürasyon

`.env` dosyasında aşağıdaki değişkenler tanımlı olmalıdır:

```env
GEMINI_API_KEY="your-api-key"
GEMINI_MODEL="gemini-2.0-flash-lite"
```

---

## Server Actions Kullanımı

Tüm AI işlemleri server-side'da çalışır. Client component'lerde `actions/ai.ts` dosyasındaki fonksiyonları kullanın.

### 1. Genel Metin Üretme

```tsx
"use client"

import { useState } from "react"
import { aiGenerate } from "@/actions/ai"

export function MyComponent() {
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)

        const result = await aiGenerate(
            "Bana bir kitap öner",           // prompt
            "Sen bir kitap uzmanısın"        // system prompt (opsiyonel)
        )

        if (result.success) {
            setResponse(result.text!)
        } else {
            console.error(result.error)
        }

        setLoading(false)
    }

    return (
        <div>
            <button onClick={handleGenerate} disabled={loading}>
                {loading ? "Düşünüyor..." : "Öneri Al"}
            </button>
            {response && <p>{response}</p>}
        </div>
    )
}
```

### 2. Sohbet (Chat) Kullanımı

Çoklu mesaj geçmişi ile sohbet:

```tsx
"use client"

import { useState } from "react"
import { aiChat } from "@/actions/ai"

type Message = { role: "user" | "model"; content: string }

export function ChatComponent() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage: Message = { role: "user", content: input }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput("")
        setLoading(true)

        const result = await aiChat(
            newMessages,
            "Sen AsyaKitap uygulamasının kitap asistanısın. Türkçe yanıt ver."
        )

        if (result.success) {
            setMessages([
                ...newMessages,
                { role: "model", content: result.text! }
            ])
        }

        setLoading(false)
    }

    return (
        <div>
            <div className="messages">
                {messages.map((msg, i) => (
                    <div key={i} className={msg.role}>
                        {msg.content}
                    </div>
                ))}
                {loading && <div>Yazıyor...</div>}
            </div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Gönder</button>
        </div>
    )
}
```

---

## Hazır Kitap Fonksiyonları

`actions/ai.ts` dosyasında kitap uygulaması için hazır fonksiyonlar bulunur:

### Kitap Özeti Oluşturma

```tsx
import { generateBookSummary } from "@/actions/ai"

const result = await generateBookSummary("Suç ve Ceza", "Fyodor Dostoyevski")

if (result.success) {
    console.log(result.text)
    // "Suç ve Ceza, Dostoyevski'nin en ünlü romanlarından biridir..."
}
```

### Kitap Önerisi Alma

```tsx
import { getBookRecommendations } from "@/actions/ai"

const result = await getBookRecommendations(
    ["Suç ve Ceza", "1984", "Dune"],           // Okunan kitaplar
    "Bilim kurgu ve distopya seviyorum"        // Tercihler (opsiyonel)
)

if (result.success) {
    console.log(result.text)
    // "Size şu kitapları önerebilirim: 1. Cesur Yeni Dünya..."
}
```

### Okuma Notu Analizi

```tsx
import { analyzeReadingNote } from "@/actions/ai"

const result = await analyzeReadingNote(
    "Raskolnikov'un içsel çatışması beni çok etkiledi...",
    "Suç ve Ceza"
)

if (result.success) {
    console.log(result.text)
    // "Notunuz karakterin psikolojik derinliğine odaklanmış..."
}
```

### Kitap Hakkında Soru Sorma

```tsx
import { askAboutBook } from "@/actions/ai"

const result = await askAboutBook(
    "Suç ve Ceza",
    "Fyodor Dostoyevski",
    "Raskolnikov neden cinayet işledi?"
)

if (result.success) {
    console.log(result.text)
}
```

---

## Tam Örnek: Kitap Detay Sayfasında AI Asistan

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles } from "lucide-react"
import { generateBookSummary, askAboutBook } from "@/actions/ai"

interface BookAIAssistantProps {
    bookTitle: string
    authorName: string
}

export function BookAIAssistant({ bookTitle, authorName }: BookAIAssistantProps) {
    const [summary, setSummary] = useState("")
    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [loadingAnswer, setLoadingAnswer] = useState(false)

    const handleGetSummary = async () => {
        setLoadingSummary(true)
        const result = await generateBookSummary(bookTitle, authorName)
        if (result.success) {
            setSummary(result.text!)
        }
        setLoadingSummary(false)
    }

    const handleAskQuestion = async () => {
        if (!question.trim()) return
        setLoadingAnswer(true)
        const result = await askAboutBook(bookTitle, authorName, question)
        if (result.success) {
            setAnswer(result.text!)
        }
        setLoadingAnswer(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Asistan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Özet Butonu */}
                <div>
                    <Button
                        onClick={handleGetSummary}
                        disabled={loadingSummary}
                        variant="outline"
                        className="w-full"
                    >
                        {loadingSummary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loadingSummary ? "Özet hazırlanıyor..." : "AI ile Özet Oluştur"}
                    </Button>
                    {summary && (
                        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                            {summary}
                        </p>
                    )}
                </div>

                {/* Soru Sorma */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Bu kitap hakkında bir soru sor..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                        />
                        <Button onClick={handleAskQuestion} disabled={loadingAnswer}>
                            {loadingAnswer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sor"}
                        </Button>
                    </div>
                    {answer && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {answer}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
```

**Kullanım:**

```tsx
<BookAIAssistant bookTitle="Suç ve Ceza" authorName="Fyodor Dostoyevski" />
```

---

## Yeni AI Fonksiyonu Ekleme

`actions/ai.ts` dosyasına yeni fonksiyon eklemek için:

```tsx
// actions/ai.ts

/**
 * Yeni bir AI fonksiyonu
 */
export async function myNewAIFunction(param1: string, param2: string) {
    const systemPrompt = `Sistem talimatları buraya...`
    const prompt = `Kullanıcı prompt'u: ${param1}, ${param2}`

    return await generateText(prompt, systemPrompt)
}
```

---

## Hata Yönetimi

Tüm AI fonksiyonları aşağıdaki formatta yanıt döner:

```typescript
interface GeminiResponse {
    success: boolean
    text?: string      // Başarılı ise AI yanıtı
    error?: string     // Başarısız ise hata mesajı
}
```

**Örnek hata yönetimi:**

```tsx
const result = await aiGenerate("...")

if (result.success) {
    // Başarılı
    console.log(result.text)
} else {
    // Hata
    toast.error(result.error || "Bir hata oluştu")
}
```

---

## Notlar

1. **Rate Limiting:** Gemini API'nin kullanım limitleri vardır. Yoğun kullanımda rate limiting uygulanabilir.

2. **Maliyet:** Her API çağrısı maliyet oluşturur. Gereksiz çağrılardan kaçının.

3. **Güvenlik:** API key sadece server-side'da kullanılır. Client'a asla expose edilmez.

4. **Model:** Varsayılan model `gemini-2.0-flash-lite`'dır. Daha gelişmiş modeller için `.env` dosyasındaki `GEMINI_MODEL` değişkenini güncelleyin.
