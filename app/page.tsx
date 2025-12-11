"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
    BookOpen,
    BookMarked,
    Quote,
    ListChecks,
    Sparkles,
    Library,
    PenLine,
    Target,
    TrendingUp,
    ChevronRight,
    Star,
    Bookmark,
    BookOpenCheck,
    Layers,
    Search,
    BarChart3
} from "lucide-react"

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

    const features = [
        {
            icon: Library,
            title: "Kişisel Kütüphane",
            description: "Tüm kitaplarını tek bir yerde topla. Okuduklarını, okumak istediklerini ve yarım bıraktıklarını kolayca takip et."
        },
        {
            icon: Layers,
            title: "Akıllı Raflar",
            description: "Kitaplarını kendi oluşturduğun raflarda organize et. Renk kodları ile kategorize et, istediğin gibi düzenle."
        },
        {
            icon: Quote,
            title: "Alıntı Defteri",
            description: "Seni etkileyen cümleleri sayfa numarasıyla kaydet. Tüm alıntılarını tek yerden görüntüle."
        },
        {
            icon: Sparkles,
            title: "Tortu & İmza",
            description: "Her kitaptan aklında kalanı yaz. Yazarın üslubunu not et. Kendi okuma deneyimini oluştur."
        },
        {
            icon: ListChecks,
            title: "Tematik Listeler",
            description: "Uzman küratörlüğünde hazırlanmış okuma yol haritaları. Basitten zora, seviye seviye ilerle."
        },
        {
            icon: Search,
            title: "Kolay Kitap Ekleme",
            description: "Kitapyurdu entegrasyonu ile kitap bilgilerini otomatik çek. Kapak, yazar, yayınevi hepsi hazır."
        },
        {
            icon: Target,
            title: "İlerleme Takibi",
            description: "Hangi sayfadasın? Kaç kitap bitirdin? Okuma alışkanlıklarını görselleştir."
        },
        {
            icon: PenLine,
            title: "Yazar Profilleri",
            description: "Sevdiğin yazarların tüm kitaplarını bir arada gör. Kütüphanendeki dağılımı keşfet."
        },
        {
            icon: BarChart3,
            title: "İstatistikler",
            description: "Okuma istatistiklerini takip et. Toplam sayfa, tamamlanan kitap, aylık ilerleme."
        }
    ]

    const readingLists = [
        {
            name: "Bilim Kurgu Okumaları",
            icon: "🚀",
            books: 58,
            levels: 10,
            color: "from-blue-500/20 to-purple-500/20",
            description: "Kolay okunan klasiklerden zihin büken başyapıtlara uzanan yol haritası"
        },
        {
            name: "Düşünce ve Dava",
            icon: "💡",
            books: 83,
            levels: 12,
            color: "from-amber-500/20 to-orange-500/20",
            description: "Entelektüel omurganı sıfırdan inşa edecek münevver olma projesi"
        },
        {
            name: "Tarih ve Medeniyet",
            icon: "🏛️",
            books: 57,
            levels: 10,
            color: "from-emerald-500/20 to-teal-500/20",
            description: "Romanlarla tarihi sev, akademik derinliğe ulaş"
        },
        {
            name: "Din ve İslam",
            icon: "📿",
            books: 53,
            levels: 10,
            color: "from-green-500/20 to-emerald-500/20",
            description: "Siyer'den fıkha, tasavvuftan modern meselelere"
        },
        {
            name: "İstihbarat ve Strateji",
            icon: "🎯",
            books: 56,
            levels: 10,
            color: "from-red-500/20 to-rose-500/20",
            description: "İnsan psikolojisinden jeopolitiğe, stratejik düşünce okulu"
        },
        {
            name: "Teknoloji ve Yapay Zeka",
            icon: "🤖",
            books: 60,
            levels: 10,
            color: "from-violet-500/20 to-purple-500/20",
            description: "Vizyonerlerden YZ felsefesine, geleceği şekillendir"
        }
    ]

    const stats = [
        { value: "367", label: "Kitap", icon: BookOpen },
        { value: "6", label: "Tematik Liste", icon: BookMarked },
        { value: "62", label: "Seviye", icon: TrendingUp },
        { value: "∞", label: "Alıntı & Tortu", icon: Sparkles }
    ]

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                            <BookOpen className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold">AsyaKitap</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm">
                        <a href="#ozellikler" className="text-muted-foreground hover:text-foreground transition-colors">Özellikler</a>
                        <a href="#listeler" className="text-muted-foreground hover:text-foreground transition-colors">Okuma Listeleri</a>
                        <a href="#nasil-calisir" className="text-muted-foreground hover:text-foreground transition-colors">Nasıl Çalışır</a>
                    </nav>
                    <Button onClick={handleLogin}>Giriş Yap</Button>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

                    <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
                        <div className="mx-auto max-w-4xl text-center">
                            {/* Badge */}
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span>367 kitaplık hazır okuma listeleri</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                Kitaplarını Yönet,
                                <br />
                                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    Tortularını Sakla
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
                                Okuduğun kitapları takip et, alıntıları kaydet ve her kitaptan aklında kalan
                                <span className="font-medium text-foreground"> tortuyu </span>
                                yaz. Kişisel kütüphaneni oluştur, tematik listelerle okuma yolculuğuna çık.
                            </p>

                            {/* CTA Buttons */}
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button size="lg" onClick={handleLogin} className="text-base h-12 px-8 w-full sm:w-auto">
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 488 512">
                                        <path
                                            fill="currentColor"
                                            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                        />
                                    </svg>
                                    Google ile Başla
                                </Button>
                                <Button size="lg" variant="outline" className="text-base h-12 px-8 w-full sm:w-auto" asChild>
                                    <a href="#listeler">
                                        Listeleri Keşfet
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-2xl mx-auto">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/30">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <stat.icon className="h-5 w-5 text-primary" />
                                            <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
                                        </div>
                                        <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="ozellikler" className="border-t bg-muted/30">
                    <div className="container mx-auto px-4 py-20 md:py-24">
                        <div className="text-center mb-12 md:mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                                Okuma Deneyimini Dönüştür
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                AsyaKitap, sadece kitap takibi değil - okuma alışkanlıklarını geliştiren,
                                öğrendiklerini kalıcı kılan bir platform.
                            </p>
                        </div>

                        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                    <CardContent className="p-5 md:p-6">
                                        <div className="mb-4 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <feature.icon className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <h3 className="text-base md:text-lg font-semibold mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Reading Lists Section */}
                <section id="listeler" className="border-t">
                    <div className="container mx-auto px-4 py-20 md:py-24">
                        <div className="text-center mb-12 md:mb-16">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-4 py-1.5 text-sm text-primary">
                                <BookMarked className="h-4 w-4" />
                                <span>Tematik Okuma Yol Haritaları</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                                Hazır Okuma Listeleri
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Basitten karmaşığa, seviye seviye ilerle. Her liste uzman küratörlüğüyle
                                hazırlanmış, neden okunması gerektiği açıklanmış kitaplardan oluşuyor.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {readingLists.map((list) => (
                                <Card key={list.name} className={`group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-gradient-to-br ${list.color}`}>
                                    <CardContent className="p-5 md:p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl md:text-4xl flex-shrink-0">{list.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-base md:text-lg mb-1">{list.name}</h3>
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                    {list.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                        <BookOpen className="h-4 w-4" />
                                                        {list.books} kitap
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                        <TrendingUp className="h-4 w-4" />
                                                        {list.levels} seviye
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-10 md:mt-12 text-center">
                            <Button size="lg" onClick={handleLogin} className="w-full sm:w-auto">
                                Listeleri Keşfetmeye Başla
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="nasil-calisir" className="border-t bg-muted/30">
                    <div className="container mx-auto px-4 py-20 md:py-24">
                        <div className="text-center mb-12 md:mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                                Nasıl Çalışır?
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Üç adımda okuma yolculuğuna başla
                            </p>
                        </div>

                        <div className="grid gap-8 md:gap-12 md:grid-cols-3 max-w-4xl mx-auto">
                            <div className="relative text-center">
                                <div className="mb-4 mx-auto flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl md:text-2xl font-bold shadow-lg">
                                    1
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Kayıt Ol</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Google hesabınla saniyeler içinde giriş yap. Karmaşık kayıt formları yok, hemen başla.
                                </p>
                                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                            </div>

                            <div className="relative text-center">
                                <div className="mb-4 mx-auto flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl md:text-2xl font-bold shadow-lg">
                                    2
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Kitaplarını Ekle</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Kitapyurdu'ndan otomatik bilgi çek veya hazır listelerden kütüphaneni oluştur.
                                </p>
                                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                            </div>

                            <div className="text-center">
                                <div className="mb-4 mx-auto flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl md:text-2xl font-bold shadow-lg">
                                    3
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Oku ve Kaydet</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Alıntıları kaydet, tortuyu yaz, imzayı not et. Okuma deneyimini zenginleştir.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tortu Explanation Section */}
                <section className="border-t">
                    <div className="container mx-auto px-4 py-20 md:py-24">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                <div className="order-2 md:order-1">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-orange-500/10 px-4 py-1.5 text-sm text-orange-600 dark:text-orange-400">
                                        <Sparkles className="h-4 w-4" />
                                        <span>AsyaKitap'ın Farkı</span>
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                                        Tortu Nedir?
                                    </h2>
                                    <p className="text-muted-foreground mb-6 leading-relaxed">
                                        Bir kitabı okuduktan sonra aklında kalan şey nedir? İşte o "tortu".
                                        Özet değil, analiz değil - sadece senin zihninde bıraktığı iz.
                                    </p>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Star className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <div>
                                                <span className="font-medium">Hislerini yaz</span>
                                                <p className="text-sm text-muted-foreground">Kitabın sana ne hissettirdiğini kaydet</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Bookmark className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <div>
                                                <span className="font-medium">İmzayı belirle</span>
                                                <p className="text-sm text-muted-foreground">Yazarın üslubunu ve tarzını not et</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <div>
                                                <span className="font-medium">Yıllar sonra hatırla</span>
                                                <p className="text-sm text-muted-foreground">Kendi sözlerinle yazdığın için kalıcı olur</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div className="relative order-1 md:order-2">
                                    <Card className="p-5 md:p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
                                        <div className="mb-3 text-sm font-medium text-orange-600 dark:text-orange-400">
                                            Tortu Örneği - Suç ve Ceza
                                        </div>
                                        <p className="text-foreground italic leading-relaxed">
                                            "İnsan vicdanından kaçamaz. Raskolnikov'un çöküşü, aslında hepimizin içindeki
                                            o 'üstün insan' yanılgısının çöküşü. Dostoyevski, psikolojik gerilimi öyle
                                            kurmuş ki, katille empati kurarken kendimden utandım."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-sm">
                                                FD
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-medium">Fyodor Dostoyevski</div>
                                                <div className="text-muted-foreground text-xs">671 sayfa</div>
                                            </div>
                                        </div>
                                    </Card>
                                    <div className="absolute -top-4 -right-4 h-24 w-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
                                    <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="border-t bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4 py-16 md:py-20">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                                Okuma Yolculuğuna Başla
                            </h2>
                            <p className="text-primary-foreground/80 text-base md:text-lg mb-8 leading-relaxed">
                                367 kitaplık hazır listeler, sınırsız alıntı ve tortu imkanı.
                                <br className="hidden sm:block" />
                                Tamamen ücretsiz, reklamsız.
                            </p>
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={handleLogin}
                                className="text-base h-12 px-8 w-full sm:w-auto"
                            >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 488 512">
                                    <path
                                        fill="currentColor"
                                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                    />
                                </svg>
                                Hemen Başla
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/30">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                        <div className="sm:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="text-xl font-bold">AsyaKitap</span>
                            </div>
                            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                                Kişisel kütüphane yönetimi ve okuma takibi. Kitaplarını yönet,
                                alıntılarını sakla, tortularını yaz.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Özellikler</h4>
                            <ul className="space-y-2.5 text-sm text-muted-foreground">
                                <li className="hover:text-foreground transition-colors cursor-pointer">Kitap Takibi</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">Alıntı Defteri</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">Tortu & İmza</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">Akıllı Raflar</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Okuma Listeleri</h4>
                            <ul className="space-y-2.5 text-sm text-muted-foreground">
                                <li className="hover:text-foreground transition-colors cursor-pointer">Bilim Kurgu</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">Düşünce ve Dava</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">Tarih ve Medeniyet</li>
                                <li className="hover:text-foreground transition-colors cursor-pointer">+3 liste daha</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t text-center">
                        <p className="text-sm text-muted-foreground">AsyaKitap - Kişisel Kütüphane Yönetimi</p>
                        <p className="mt-1 text-sm text-muted-foreground/70">Okumak güzeldir. Hatırlamak daha güzel.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
