"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { ActivityType } from "@prisma/client"
import { saveTimerSession } from "@/actions/timer"
import { toast } from "sonner"

// ==========================================
// Types
// ==========================================

interface TimerState {
    isRunning: boolean
    isPaused: boolean
    seconds: number
    activityType: ActivityType
    bookId: string | null
    bookTitle: string | null
    sessionStartTime: Date | null
    title: string | null
}

interface TimerContextType {
    // State
    state: TimerState

    // Actions
    startTimer: (options?: {
        activityType?: ActivityType
        bookId?: string
        bookTitle?: string
        title?: string
    }) => void
    pauseTimer: () => void
    resumeTimer: () => void
    stopTimer: () => void
    resetTimer: () => void

    // Setters
    setActivityType: (type: ActivityType) => void
    setBook: (bookId: string | null, bookTitle: string | null) => void
    setTitle: (title: string | null) => void

    // Save
    saveSession: (options?: {
        notes?: string
        pageStart?: number
        pageEnd?: number
        pagesRead?: number
    }) => Promise<boolean>

    // Helpers
    formatTime: (seconds: number) => string
    isActive: boolean
}

const STORAGE_KEY = "asyakitap_timer_state"

const defaultState: TimerState = {
    isRunning: false,
    isPaused: false,
    seconds: 0,
    activityType: "READING",
    bookId: null,
    bookTitle: null,
    sessionStartTime: null,
    title: null,
}

// ==========================================
// Context
// ==========================================

const TimerContext = createContext<TimerContextType | null>(null)

export function useTimer() {
    const context = useContext(TimerContext)
    if (!context) {
        throw new Error("useTimer must be used within a TimerProvider")
    }
    return context
}

// ==========================================
// Provider
// ==========================================

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TimerState>(defaultState)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // localStorage'dan state'i yükle
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)

                // Eğer timer çalışıyorken sayfa kapatıldıysa, geçen süreyi hesapla
                if (parsed.isRunning && parsed.sessionStartTime) {
                    const startTime = new Date(parsed.sessionStartTime)
                    const now = new Date()
                    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

                    setState({
                        ...parsed,
                        seconds: elapsedSeconds,
                        sessionStartTime: startTime,
                    })
                } else {
                    setState({
                        ...parsed,
                        sessionStartTime: parsed.sessionStartTime ? new Date(parsed.sessionStartTime) : null,
                    })
                }
            }
        } catch (error) {
            console.error("Timer state yüklenemedi:", error)
        }
    }, [])

    // State değiştiğinde localStorage'a kaydet
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...state,
                sessionStartTime: state.sessionStartTime?.toISOString() || null,
            }))
        } catch (error) {
            console.error("Timer state kaydedilemedi:", error)
        }
    }, [state])

    // Timer interval yönetimi
    useEffect(() => {
        if (state.isRunning && !state.isPaused) {
            intervalRef.current = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    seconds: prev.seconds + 1,
                }))
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [state.isRunning, state.isPaused])

    // Sayfa kapatılırken uyarı
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state.isRunning) {
                e.preventDefault()
                e.returnValue = "Timer çalışıyor. Sayfadan ayrılmak istediğinize emin misiniz?"
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [state.isRunning])

    // ==========================================
    // Actions
    // ==========================================

    const startTimer = useCallback((options?: {
        activityType?: ActivityType
        bookId?: string
        bookTitle?: string
        title?: string
    }) => {
        setState(prev => ({
            ...prev,
            isRunning: true,
            isPaused: false,
            seconds: 0,
            sessionStartTime: new Date(),
            activityType: options?.activityType || prev.activityType,
            bookId: options?.bookId || prev.bookId,
            bookTitle: options?.bookTitle || prev.bookTitle,
            title: options?.title || null,
        }))
    }, [])

    const pauseTimer = useCallback(() => {
        setState(prev => ({
            ...prev,
            isPaused: true,
        }))
    }, [])

    const resumeTimer = useCallback(() => {
        setState(prev => ({
            ...prev,
            isPaused: false,
        }))
    }, [])

    const stopTimer = useCallback(() => {
        setState(prev => ({
            ...prev,
            isRunning: false,
            isPaused: false,
        }))
    }, [])

    const resetTimer = useCallback(() => {
        setState(defaultState)
    }, [])

    const setActivityType = useCallback((type: ActivityType) => {
        setState(prev => ({
            ...prev,
            activityType: type,
        }))
    }, [])

    const setBook = useCallback((bookId: string | null, bookTitle: string | null) => {
        setState(prev => ({
            ...prev,
            bookId,
            bookTitle,
        }))
    }, [])

    const setTitle = useCallback((title: string | null) => {
        setState(prev => ({
            ...prev,
            title,
        }))
    }, [])

    const saveSession = useCallback(async (options?: {
        notes?: string
        pageStart?: number
        pageEnd?: number
        pagesRead?: number
    }): Promise<boolean> => {
        if (!state.sessionStartTime || state.seconds < 60) {
            toast.error("En az 1 dakika süre gerekli")
            return false
        }

        const result = await saveTimerSession({
            activityType: state.activityType,
            startTime: state.sessionStartTime,
            endTime: new Date(),
            durationSeconds: state.seconds,
            bookId: state.bookId || undefined,
            title: state.title || undefined,
            notes: options?.notes,
            pageStart: options?.pageStart,
            pageEnd: options?.pageEnd,
            pagesRead: options?.pagesRead,
        })

        if (result.success) {
            toast.success("Oturum kaydedildi")
            resetTimer()
            return true
        } else {
            toast.error(result.error || "Kayıt başarısız")
            return false
        }
    }, [state, resetTimer])

    // ==========================================
    // Helpers
    // ==========================================

    const formatTime = useCallback((seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }, [])

    const isActive = state.isRunning || state.seconds > 0

    // ==========================================
    // Context Value
    // ==========================================

    const value: TimerContextType = {
        state,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        setActivityType,
        setBook,
        setTitle,
        saveSession,
        formatTime,
        isActive,
    }

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    )
}
