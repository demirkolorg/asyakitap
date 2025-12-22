"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    BookOpen,
    CheckCircle2,
    FileText,
    Clock,
    Zap,
    Target,
    Quote,
    Calendar,
    TrendingUp,
    Award,
    Sparkles,
    Loader2,
    RefreshCw,
    BarChart3,
    Building2,
    Tags
} from "lucide-react"
import { analyzeReadingHabits } from "@/actions/ai"
import type { FullStatsData } from "@/actions/stats"
import { cn } from "@/lib/utils"

interface StatsClientProps {
    stats: FullStatsData
}

export function StatsClient({ stats }: StatsClientProps) {
    const { readingStats, monthlyData, topAuthors, topPublishers, quoteStats, themeStats, challengeStats, bestMonth } = stats
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    const handleGetAIAnalysis = async () => {
        setIsAnalyzing(true)
        setAnalysisError(null)

        try {
            const result = await analyzeReadingHabits({
                totalBooks: readingStats.totalBooks,
                completedBooks: readingStats.completedBooks,
                readingBooks: readingStats.readingBooks,
                toReadBooks: readingStats.toReadBooks,
                dnfBooks: readingStats.dnfBooks,
                totalPagesRead: readingStats.totalPagesRead,
                averageDaysPerBook: readingStats.averageDaysPerBook,
                pagesPerDay: readingStats.pagesPerDay,
                booksThisMonth: readingStats.booksThisMonth,
                booksThisYear: readingStats.booksThisYear,
                completionRate: readingStats.completionRate,
                topAuthors: topAuthors.map(a => ({ name: a.name, bookCount: a.bookCount })),
                topPublishers: topPublishers.map(p => ({ name: p.name, bookCount: p.bookCount })),
                bestMonth
            })

            if (result.success && result.text) {
                setAiAnalysis(result.text)
            } else {
                setAnalysisError(result.error || "Analiz oluşturulamadı")
            }
        } catch {
            setAnalysisError("Bir hata oluştu")
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Son 12 ayı al ve sırala (en eskiden en yeniye)
    const last12Months = monthlyData.slice(-12)
    const maxBooks = Math.max(...last12Months.map(m => m.booksCompleted), 1)

    // Durum dağılımı yüzdeleri
    const total = readingStats.completedBooks + readingStats.readingBooks + readingStats.toReadBooks + readingStats.dnfBooks
    const completedPercent = total > 0 ? Math.round((readingStats.completedBooks / total) * 100) : 0
    const readingPercent = total > 0 ? Math.round((readingStats.readingBooks / total) * 100) : 0
    const toReadPercent = total > 0 ? Math.round((readingStats.toReadBooks / total) * 100) : 0
    const dnfPercent = total > 0 ? Math.round((readingStats.dnfBooks / total) * 100) : 0

    // Conic gradient için pozisyon hesapla
    const completedEnd = completedPercent
    const readingEnd = completedEnd + readingPercent
    const toReadEnd = readingEnd + toReadPercent

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Okuma Analizleri</h1>
                <p className="text-muted-foreground">Okuma alışkanlıklarını analiz et</p>
            </div>

            {/* 6 Hero Stat Cards */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {/* Toplam Kitap */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <BookOpen className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Toplam Kitap</p>
                        <p className="text-2xl font-bold text-blue-500">{readingStats.totalBooks}</p>
                        <p className="text-[10px] text-muted-foreground">{readingStats.toReadBooks} okunacak</p>
                    </div>
                </div>

                {/* Tamamlanan */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Tamamlanan</p>
                        <p className="text-2xl font-bold text-green-500">{readingStats.completedBooks}</p>
                        <p className="text-[10px] text-muted-foreground">{readingStats.readingBooks} okunuyor</p>
                    </div>
                </div>

                {/* Okunan Sayfa */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <FileText className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Okunan Sayfa</p>
                        <p className="text-2xl font-bold text-purple-500">{readingStats.totalPagesRead.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Ort. {readingStats.averageBookLength} sayfa/kitap</p>
                    </div>
                </div>

                {/* Gün/Kitap */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <Clock className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Gün/Kitap</p>
                        <p className="text-2xl font-bold text-orange-500">{readingStats.averageDaysPerBook ?? "-"}</p>
                        <p className="text-[10px] text-muted-foreground">{readingStats.totalReadingDays} toplam gün</p>
                    </div>
                </div>

                {/* Sayfa/Gün */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <Zap className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Sayfa/Gün</p>
                        <p className="text-2xl font-bold text-yellow-500">{readingStats.pagesPerDay ?? "-"}</p>
                        <p className="text-[10px] text-muted-foreground">Günlük ortalama</p>
                    </div>
                </div>

                {/* Tamamlanma */}
                <div className="relative overflow-hidden rounded-xl border bg-card p-4">
                    <div className="absolute top-2 right-2 opacity-10">
                        <Target className="h-12 w-12" />
                    </div>
                    <div className="relative">
                        <p className="text-xs text-muted-foreground">Tamamlanma</p>
                        <p className="text-2xl font-bold text-emerald-500">%{readingStats.completionRate}</p>
                        <p className="text-[10px] text-muted-foreground">{readingStats.dnfBooks} bırakılan</p>
                    </div>
                </div>
            </div>

            {/* Main Grid: Monthly Chart (8 cols) + Period Stats (4 cols) */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Aylık Okuma Grafiği */}
                <div className="lg:col-span-8 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Aylık Okuma Grafiği</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">Son 12 Ay</span>
                    </div>

                    <div className="flex items-end justify-between gap-2 h-40">
                        {last12Months.map((month, i) => {
                            const height = maxBooks > 0 ? (month.booksCompleted / maxBooks) * 100 : 0
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-medium">{month.booksCompleted}</span>
                                    <div
                                        className={cn(
                                            "w-full rounded-t transition-all",
                                            month.booksCompleted > 0 ? "bg-primary" : "bg-muted"
                                        )}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <span className="text-[9px] text-muted-foreground">{month.monthName.slice(0, 3)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Dönem İstatistikleri */}
                <div className="lg:col-span-4 rounded-xl border bg-card p-4 space-y-4">
                    <h3 className="font-semibold">Dönem İstatistikleri</h3>

                    {/* Bu Ay */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                            <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Bu Ay</p>
                            <p className="font-semibold">{readingStats.booksThisMonth} kitap</p>
                            <p className="text-[10px] text-muted-foreground">{readingStats.pagesThisMonth.toLocaleString()} sayfa</p>
                        </div>
                    </div>

                    {/* Bu Yıl */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Bu Yıl</p>
                            <p className="font-semibold">{readingStats.booksThisYear} kitap</p>
                            <p className="text-[10px] text-muted-foreground">{readingStats.pagesThisYear.toLocaleString()} sayfa</p>
                        </div>
                    </div>

                    {/* En İyi Ay */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                            <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">En İyi Ay</p>
                            {bestMonth ? (
                                <>
                                    <p className="font-semibold">{bestMonth.month}</p>
                                    <p className="text-[10px] text-muted-foreground">{bestMonth.count} kitap</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Henüz veri yok</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row: Authors/Publishers (4) + Donut (4) + Goal/Quotes (4) */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Yazarlar ve Yayınevleri */}
                <div className="lg:col-span-4 rounded-xl border bg-card p-4 space-y-4">
                    {/* En Çok Okunan Yazarlar */}
                    <div>
                        <h3 className="font-semibold mb-3">En Çok Okunan Yazarlar</h3>
                        <div className="space-y-2">
                            {topAuthors.slice(0, 5).map((author, i) => {
                                const maxAuthorBooks = Math.max(...topAuthors.map(a => a.completedCount), 1)
                                const percentage = (author.completedCount / maxAuthorBooks) * 100
                                return (
                                    <div key={author.id} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="truncate flex-1">{author.name}</span>
                                            <span className="text-muted-foreground ml-2">{author.completedCount} kitap</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Yayınevleri */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Yayınevleri</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {topPublishers.slice(0, 8).map((pub) => (
                                <span
                                    key={pub.id}
                                    className="px-2 py-1 text-[10px] rounded-full bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    {pub.name} ({pub.completedCount})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Durum Dağılımı (Donut Chart) */}
                <div className="lg:col-span-4 rounded-xl border bg-card p-4">
                    <h3 className="font-semibold mb-4">Durum Dağılımı</h3>

                    <div className="flex items-center justify-center">
                        {/* CSS Donut Chart */}
                        <div
                            className="relative w-36 h-36 rounded-full"
                            style={{
                                background: `conic-gradient(
                                    #22c55e 0% ${completedEnd}%,
                                    #3b82f6 ${completedEnd}% ${readingEnd}%,
                                    #eab308 ${readingEnd}% ${toReadEnd}%,
                                    #ef4444 ${toReadEnd}% 100%
                                )`
                            }}
                        >
                            <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{total}</p>
                                    <p className="text-[10px] text-muted-foreground">Toplam</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span>Tamamlandı ({readingStats.completedBooks})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span>Okunuyor ({readingStats.readingBooks})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <span>Okunacak ({readingStats.toReadBooks})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span>Bırakıldı ({readingStats.dnfBooks})</span>
                        </div>
                    </div>
                </div>

                {/* Hedef ve Alıntı */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Okuma Hedefi */}
                    {challengeStats && (
                        <div className="rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-semibold">{challengeStats.year} Okuma Hedefi</h3>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">İlerleme</span>
                                    <span className="font-medium">%{challengeStats.percentage}</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${challengeStats.percentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{challengeStats.mainCompleted} Ana</span>
                                    <span>{challengeStats.bonusCompleted} Bonus</span>
                                    <span className="font-medium text-foreground">
                                        {challengeStats.completedBooks}/{challengeStats.totalBooks}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alıntı İstatistikleri */}
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Quote className="h-5 w-5 text-amber-500" />
                            <h3 className="font-semibold">Alıntı İstatistikleri</h3>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Toplam Alıntı</span>
                                <span className="font-medium">{quoteStats.totalQuotes}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Alıntı Yapılan Kitap</span>
                                <span className="font-medium">{quoteStats.booksWithQuotes}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kitap Başına Ort.</span>
                                <span className="font-medium">{quoteStats.averageQuotesPerBook}</span>
                            </div>
                            {quoteStats.mostQuotedBook && (
                                <div className="pt-2 border-t mt-2">
                                    <p className="text-[10px] text-muted-foreground">En Çok Alıntı</p>
                                    <p className="text-xs font-medium truncate">{quoteStats.mostQuotedBook.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{quoteStats.mostQuotedBook.count} alıntı</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Statistics - Full Width */}
            {themeStats.topThemes.length > 0 && (
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-violet-500" />
                            <h3 className="font-semibold">Okuma Temaları</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{themeStats.uniqueThemes} farklı tema</span>
                            <span>•</span>
                            <span>{themeStats.booksWithThemes} kitapta</span>
                        </div>
                    </div>

                    {/* Theme bars */}
                    <div className="grid gap-3 md:grid-cols-2">
                        {themeStats.topThemes.slice(0, 10).map((theme, index) => {
                            const maxCount = themeStats.topThemes[0]?.count || 1
                            const barWidth = (theme.count / maxCount) * 100
                            const colors = [
                                'bg-violet-500',
                                'bg-purple-500',
                                'bg-indigo-500',
                                'bg-blue-500',
                                'bg-cyan-500',
                                'bg-teal-500',
                                'bg-emerald-500',
                                'bg-green-500',
                                'bg-lime-500',
                                'bg-yellow-500'
                            ]
                            return (
                                <div key={theme.name} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium truncate flex-1">{theme.name}</span>
                                        <span className="text-muted-foreground ml-2">
                                            {theme.count} kitap ({theme.percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all", colors[index % colors.length])}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {themeStats.topThemes.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            ve {themeStats.uniqueThemes - 10} tema daha...
                        </p>
                    )}
                </div>
            )}

            {/* AI Analysis Card - Full Width */}
            <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">AI Okuma Analizi</h3>
                            <p className="text-xs text-muted-foreground">Kişiselleştirilmiş okuma önerileri</p>
                        </div>
                    </div>
                    {aiAnalysis && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGetAIAnalysis}
                            disabled={isAnalyzing}
                        >
                            <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
                        </Button>
                    )}
                </div>

                {!aiAnalysis && !isAnalyzing && !analysisError && (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Okuma alışkanlıkların hakkında AI&apos;dan kişiselleştirilmiş bir analiz al
                        </p>
                        <Button onClick={handleGetAIAnalysis} disabled={isAnalyzing}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analiz Al
                        </Button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Analiz hazırlanıyor...</span>
                    </div>
                )}

                {analysisError && (
                    <div className="text-center py-6">
                        <p className="text-destructive mb-4">{analysisError}</p>
                        <Button variant="outline" onClick={handleGetAIAnalysis}>
                            Tekrar Dene
                        </Button>
                    </div>
                )}

                {aiAnalysis && !isAnalyzing && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {aiAnalysis}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
