"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { BookOpen } from "lucide-react"

export default function LandingPage() {
    const supabase = createClient()

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold">AsyaKitap</span>
                </div>
                <Button onClick={handleLogin}>Giriş Yap</Button>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="max-w-3xl text-center space-y-8">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                        Kitaplarını Yönet,
                        <br />
                        <span className="text-primary">Tortularını</span> Sakla
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Okuduğun kitapları takip et, alıntı kaydet ve her kitaptan
                        aklında kalan tortuyu yaz. Kişisel kütüphaneni oluştur.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={handleLogin}>
                            <svg
                                className="mr-2 h-5 w-5"
                                viewBox="0 0 488 512"
                            >
                                <path
                                    fill="currentColor"
                                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                />
                            </svg>
                            Google ile Başla
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-muted-foreground border-t">
                AsyaKitap - Kişisel Kütüphane Yönetimi
            </footer>
        </div>
    )
}
