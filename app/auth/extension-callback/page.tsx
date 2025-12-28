"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Loader2 } from "lucide-react"

export default function ExtensionCallbackPage() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")

    useEffect(() => {
        async function saveSessionForExtension() {
            try {
                const supabase = createClient()
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error || !session) {
                    setStatus("error")
                    setMessage("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
                    return
                }

                // Save session to localStorage for extension to read
                const extensionSession = {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    user: {
                        id: session.user.id,
                        email: session.user.email,
                    }
                }

                localStorage.setItem("asyakitap-extension-session", JSON.stringify(extensionSession))

                setStatus("success")
                setMessage("Giriş başarılı! Extension'a dönebilirsiniz.")

                // Auto close after 2 seconds if opened by extension
                setTimeout(() => {
                    window.close()
                }, 2000)

            } catch (err) {
                console.error("Extension callback error:", err)
                setStatus("error")
                setMessage("Bir hata oluştu.")
            }
        }

        saveSessionForExtension()
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10">
                        {status === "loading" && (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        )}
                        {status === "success" && (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        )}
                        {status === "error" && (
                            <span className="text-2xl">⚠️</span>
                        )}
                    </div>
                    <CardTitle className="text-xl">
                        {status === "loading" && "İşleniyor..."}
                        {status === "success" && "Başarılı!"}
                        {status === "error" && "Hata"}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    {status === "success" && (
                        <p>Bu sekme otomatik kapanacak. Kapanmazsa manuel kapatabilirsiniz.</p>
                    )}
                    {status === "error" && (
                        <a href="/auth/extension-login" className="text-primary hover:underline">
                            Tekrar deneyin
                        </a>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
