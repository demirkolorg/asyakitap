"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, User, Palette, Bug, Wrench, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { getDebugInfo } from "@/actions/debug"
import Link from "next/link"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [readingGoal, setReadingGoal] = useState("12")
    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        if (showDebug) {
            getDebugInfo().then(setDebugInfo)
        }
    }, [showDebug])

    const handleSaveGoal = () => {
        // In real app, save to database
        toast.success("Hedef kaydedildi")
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Ayarlar</h1>
                <p className="text-muted-foreground">Uygulama tercihlerini yönet</p>
            </div>

            {/* Theme Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Görünüm
                    </CardTitle>
                    <CardDescription>Tema ve görünüm ayarları</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tema</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="mr-2 h-4 w-4" />
                                Açık
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="mr-2 h-4 w-4" />
                                Koyu
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="mr-2 h-4 w-4" />
                                Sistem
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Repair Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Bağlantıları Onar
                    </CardTitle>
                    <CardDescription>
                        Kitaplarınız ile okuma listeleri ve challenge'lar arasındaki kopuk bağlantıları onarın
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/settings/repair-links">
                        <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Bağlantıları Tara ve Onar
                            </span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Reading Goal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Okuma Hedefi
                    </CardTitle>
                    <CardDescription>Yıllık okuma hedefini belirle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="goal">Yıllık Kitap Hedefi</Label>
                        <div className="flex gap-2">
                            <Input
                                id="goal"
                                type="number"
                                value={readingGoal}
                                onChange={(e) => setReadingGoal(e.target.value)}
                                className="w-24"
                                min="1"
                                max="365"
                            />
                            <span className="flex items-center text-muted-foreground">kitap / yıl</span>
                        </div>
                    </div>
                    <Button onClick={handleSaveGoal}>Kaydet</Button>
                </CardContent>
            </Card>

            {/* Account */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Hesap
                    </CardTitle>
                    <CardDescription>Hesap bilgileri ve işlemleri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Google ile Giriş Yapıldı</p>
                            <p className="text-sm text-muted-foreground">Hesabınız Google ile bağlantılı</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-destructive">Tehlikeli Bölge</p>
                            <p className="text-sm text-muted-foreground">Hesabı ve tüm verileri sil</p>
                        </div>
                        <Button variant="destructive" size="sm" disabled>
                            Hesabı Sil
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bug className="h-5 w-5" />
                        Debug Bilgisi
                    </CardTitle>
                    <CardDescription>Sistem durumu ve veri sayıları</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowDebug(!showDebug)}
                    >
                        {showDebug ? "Gizle" : "Debug Bilgisini Göster"}
                    </Button>

                    {showDebug && debugInfo && (
                        <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
                            <p><strong>Authenticated:</strong> {debugInfo.authenticated ? "Evet" : "Hayır"}</p>
                            {debugInfo.authError && <p className="text-destructive"><strong>Auth Error:</strong> {debugInfo.authError}</p>}
                            <p><strong>User ID:</strong> {debugInfo.userId || "N/A"}</p>
                            <p><strong>Email:</strong> {debugInfo.email || "N/A"}</p>

                            {debugInfo.counts && (
                                <>
                                    <Separator className="my-2" />
                                    <p className="font-semibold">Kullanıcı Verileri:</p>
                                    <p>- Kitaplar: {debugInfo.counts.userBooks}</p>
                                    <p>- Yazarlar: {debugInfo.counts.userAuthors}</p>
                                    <p>- Yayınevleri: {debugInfo.counts.userPublishers}</p>
                                    <p>- Alıntılar: {debugInfo.counts.userQuotes}</p>

                                    <Separator className="my-2" />
                                    <p className="font-semibold">Toplam Veriler (Tüm Kullanıcılar):</p>
                                    <p>- Kitaplar: {debugInfo.counts.totalBooks}</p>
                                    <p>- Yazarlar: {debugInfo.counts.totalAuthors}</p>
                                    <p>- Yayınevleri: {debugInfo.counts.totalPublishers}</p>
                                </>
                            )}

                            {debugInfo.dbError && <p className="text-destructive"><strong>DB Error:</strong> {debugInfo.dbError}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
