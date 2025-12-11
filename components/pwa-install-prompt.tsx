"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already installed
        const standalone = window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as { standalone?: boolean }).standalone === true

        setIsStandalone(standalone)

        if (standalone) return

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem("pwa-prompt-dismissed")
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt)
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            if (daysSinceDismissed < 7) return // Don't show for 7 days after dismissal
        }

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
        setIsIOS(iOS)

        if (iOS) {
            // For iOS, show after a delay
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }

        // For other browsers, listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setTimeout(() => setShowPrompt(true), 3000)
        }

        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setShowPrompt(false)
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString())
    }

    if (isStandalone || !showPrompt) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Uygulamayı Yükle</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        AsyaKitap'ı ana ekranına ekle, daha hızlı erişim sağla.
                    </p>
                </div>
            </div>

            {isIOS ? (
                <div className="mt-3 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                        <Share className="h-4 w-4" />
                        <span className="font-medium">iOS için:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 ml-1">
                        <li>Safari'de <span className="font-medium">Paylaş</span> butonuna tıkla</li>
                        <li><span className="font-medium">Ana Ekrana Ekle</span>'yi seç</li>
                    </ol>
                </div>
            ) : (
                <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleInstall}>
                        Yükle
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDismiss}>
                        Sonra
                    </Button>
                </div>
            )}
        </div>
    )
}
