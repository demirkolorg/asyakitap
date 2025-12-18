import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Türkiye timezone'u (UTC+3)
export const TIMEZONE = "Europe/Istanbul"

// Tarih formatlama seçenekleri
type DateFormatOptions = {
  format?: "short" | "long" | "full" | "date-only" | "time-only" | "month-year" | "day-month"
  locale?: string
  // Sadece tarih alanları için (startDate, endDate gibi) - saat bilgisi yok, UTC olarak saklanmış
  dateOnly?: boolean
}

// Tarihi Türkiye timezone'unda formatla
export function formatDate(date: Date | string | null | undefined, options: DateFormatOptions = {}): string {
  if (!date) return ""

  const { format = "short", locale = "tr-TR", dateOnly = false } = options
  const d = typeof date === "string" ? new Date(date) : date

  // Eğer dateOnly true ise, UTC olarak göster (tarih kayması önlenir)
  // Aksi halde Türkiye timezone'unda göster (timestamp'ler için)
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: dateOnly ? "UTC" : TIMEZONE
  }

  switch (format) {
    case "short":
      // 12 Ara 2024
      formatOptions.day = "2-digit"
      formatOptions.month = "short"
      formatOptions.year = "numeric"
      break
    case "long":
      // 12 Aralık 2024, 14:30
      formatOptions.day = "2-digit"
      formatOptions.month = "long"
      formatOptions.year = "numeric"
      formatOptions.hour = "2-digit"
      formatOptions.minute = "2-digit"
      break
    case "full":
      // Perşembe, 12 Aralık 2024
      formatOptions.weekday = "long"
      formatOptions.day = "2-digit"
      formatOptions.month = "long"
      formatOptions.year = "numeric"
      break
    case "date-only":
      // 12.12.2024
      formatOptions.day = "2-digit"
      formatOptions.month = "2-digit"
      formatOptions.year = "numeric"
      break
    case "time-only":
      // 14:30
      formatOptions.hour = "2-digit"
      formatOptions.minute = "2-digit"
      break
    case "month-year":
      // Aralık 2024
      formatOptions.month = "long"
      formatOptions.year = "numeric"
      break
    case "day-month":
      // 12 Ara
      formatOptions.day = "2-digit"
      formatOptions.month = "short"
      break
  }

  return d.toLocaleString(locale, formatOptions)
}

// Şu anki Türkiye zamanını al
export function getNowInTurkey(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }))
}

// Tarihi Türkiye gece yarısına ayarla (saat bilgisi olmadan)
export function toTurkeyMidnight(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date
  const turkeyDate = new Date(d.toLocaleString("en-US", { timeZone: TIMEZONE }))
  turkeyDate.setHours(0, 0, 0, 0)
  return turkeyDate
}

// İki tarihi Türkiye timezone'unda karşılaştır (sadece gün bazında)
export function isSameDayInTurkey(date1: Date | string, date2: Date | string): boolean {
  const d1 = formatDate(date1, { format: "date-only" })
  const d2 = formatDate(date2, { format: "date-only" })
  return d1 === d2
}

// Bugünün tarihini Türkiye timezone'unda al (YYYY-MM-DD formatında)
export function getTodayInTurkey(): string {
  const now = new Date()
  return now.toLocaleDateString("sv-SE", { timeZone: TIMEZONE }) // sv-SE gives YYYY-MM-DD format
}

// Ayın ilk ve son gününü Türkiye timezone'unda al
export function getMonthBoundsInTurkey(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // Son gün
  return { start, end }
}
