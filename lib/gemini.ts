import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite"

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set")
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface GeminiResponse {
    success: boolean
    text?: string
    error?: string
}

/**
 * Gemini AI ile metin üretme
 * @param prompt - Kullanıcı prompt'u
 * @param systemPrompt - Sistem prompt'u (opsiyonel)
 * @returns Üretilen metin veya hata
 */
export async function generateText(
    prompt: string,
    systemPrompt?: string
): Promise<GeminiResponse> {
    if (!genAI) {
        return {
            success: false,
            error: "Gemini API key is not configured"
        }
    }

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
        })

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        return {
            success: true,
            text
        }
    } catch (error) {
        console.error("Gemini API error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "AI yanıt üretemedi"
        }
    }
}

/**
 * Gemini AI ile sohbet (çoklu mesaj)
 * @param messages - Mesaj geçmişi
 * @param systemPrompt - Sistem prompt'u (opsiyonel)
 * @returns Üretilen yanıt veya hata
 */
export async function chat(
    messages: { role: "user" | "model"; content: string }[],
    systemPrompt?: string
): Promise<GeminiResponse> {
    if (!genAI) {
        return {
            success: false,
            error: "Gemini API key is not configured"
        }
    }

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
        })

        const chat = model.startChat({
            history: messages.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        })

        const lastMessage = messages[messages.length - 1]
        const result = await chat.sendMessage(lastMessage.content)
        const response = result.response
        const text = response.text()

        return {
            success: true,
            text
        }
    } catch (error) {
        console.error("Gemini chat error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "AI yanıt üretemedi"
        }
    }
}
