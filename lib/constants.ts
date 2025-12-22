// Mood Options for Reading Notes
export const MOOD_OPTIONS = [
    { value: "excited", label: "Heyecanlı", emoji: "🤩" },
    { value: "thoughtful", label: "Düşünceli", emoji: "🤔" },
    { value: "sad", label: "Hüzünlü", emoji: "😢" },
    { value: "surprised", label: "Şaşkın", emoji: "😮" },
    { value: "angry", label: "Kızgın", emoji: "😤" },
    { value: "happy", label: "Mutlu", emoji: "😊" },
    { value: "confused", label: "Kafam Karışık", emoji: "😵" },
    { value: "inspired", label: "İlham Aldım", emoji: "✨" },
] as const

export type MoodValue = typeof MOOD_OPTIONS[number]['value']
