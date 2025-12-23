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
    Tags,
    ArrowUp,
    ArrowDown,
    Minus,
    Trophy,
    Flame,
    Library,
    Star,
    Timer,
    BookMarked,
    Hash
} from "lucide-react"
import { analyzeReadingHabits } from "@/actions/ai"
import type { FullStatsData, ExtendedStatsData } from "@/actions/stats"
import { cn } from "@/lib/utils"
import { StreakHeatmap } from "@/components/streak-heatmap"

interface StatsClientProps {
    stats: FullStatsData
    extendedStats: ExtendedStatsData | null
}

export function StatsClient({ stats, extendedStats }: StatsClientProps) {
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

            {/* Extended Stats Section */}
            {extendedStats && (
                <>
                    {/* Streak Heatmap */}
                    {extendedStats.streakData && (
                        <StreakHeatmap data={extendedStats.streakData} />
                    )}

                    {/* Yıllık Karşılaştırma */}
                    {extendedStats.yearlyComparison && (
                        <div className="rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                <h3 className="font-semibold">Yıllık Karşılaştırma</h3>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {extendedStats.yearlyComparison.previousYear} vs {extendedStats.yearlyComparison.currentYear}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Kitap</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">{extendedStats.yearlyComparison.current.books}</span>
                                        <span className={cn("text-xs flex items-center", extendedStats.yearlyComparison.changes.books > 0 ? "text-green-500" : extendedStats.yearlyComparison.changes.books < 0 ? "text-red-500" : "text-muted-foreground")}>
                                            {extendedStats.yearlyComparison.changes.books > 0 ? <ArrowUp className="h-3 w-3" /> : extendedStats.yearlyComparison.changes.books < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                            {Math.abs(extendedStats.yearlyComparison.changes.books)}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Geçen yıl: {extendedStats.yearlyComparison.previous.books}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Sayfa</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">{extendedStats.yearlyComparison.current.pages.toLocaleString()}</span>
                                        <span className={cn("text-xs flex items-center", extendedStats.yearlyComparison.changes.pages > 0 ? "text-green-500" : extendedStats.yearlyComparison.changes.pages < 0 ? "text-red-500" : "text-muted-foreground")}>
                                            {extendedStats.yearlyComparison.changes.pages > 0 ? <ArrowUp className="h-3 w-3" /> : extendedStats.yearlyComparison.changes.pages < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                            {Math.abs(extendedStats.yearlyComparison.changes.pages)}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Geçen yıl: {extendedStats.yearlyComparison.previous.pages.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Ort. Puan</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">{extendedStats.yearlyComparison.current.avgRating}</span>
                                        <span className={cn("text-xs flex items-center", extendedStats.yearlyComparison.changes.avgRating > 0 ? "text-green-500" : extendedStats.yearlyComparison.changes.avgRating < 0 ? "text-red-500" : "text-muted-foreground")}>
                                            {extendedStats.yearlyComparison.changes.avgRating > 0 ? "+" : ""}{extendedStats.yearlyComparison.changes.avgRating}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Geçen yıl: {extendedStats.yearlyComparison.previous.avgRating}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Gün/Kitap</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">{extendedStats.yearlyComparison.current.avgDaysPerBook ?? "-"}</span>
                                        {extendedStats.yearlyComparison.changes.avgDaysPerBook !== null && (
                                            <span className={cn("text-xs flex items-center", extendedStats.yearlyComparison.changes.avgDaysPerBook < 0 ? "text-green-500" : extendedStats.yearlyComparison.changes.avgDaysPerBook > 0 ? "text-red-500" : "text-muted-foreground")}>
                                                {extendedStats.yearlyComparison.changes.avgDaysPerBook < 0 ? <ArrowDown className="h-3 w-3" /> : extendedStats.yearlyComparison.changes.avgDaysPerBook > 0 ? <ArrowUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                                {Math.abs(extendedStats.yearlyComparison.changes.avgDaysPerBook)} gün
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Geçen yıl: {extendedStats.yearlyComparison.previous.avgDaysPerBook ?? "-"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Puan Dağılımı ve Okuma Hızı Trendi */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Puan Dağılımı */}
                        {extendedStats.ratingDistribution && extendedStats.ratingDistribution.totalRated > 0 && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    <h3 className="font-semibold">Puan Dağılımı</h3>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {extendedStats.ratingDistribution.totalRated} değerlendirme
                                    </span>
                                </div>
                                <div className="flex items-end justify-between gap-1 h-24 mb-2">
                                    {extendedStats.ratingDistribution.distribution.map((item) => {
                                        const maxCount = Math.max(...extendedStats.ratingDistribution!.distribution.map(d => d.count), 1)
                                        const height = (item.count / maxCount) * 100
                                        return (
                                            <div key={item.rating} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-muted-foreground">{item.count}</span>
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t transition-all",
                                                        item.count > 0 ? "bg-yellow-500" : "bg-muted"
                                                    )}
                                                    style={{ height: `${Math.max(height, 4)}%` }}
                                                />
                                                <span className="text-[10px] font-medium">{item.rating}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                                    <span>Ort: <span className="font-medium text-foreground">{extendedStats.ratingDistribution.averageRating}</span></span>
                                    <span>En sık: <span className="font-medium text-foreground">{extendedStats.ratingDistribution.mostCommonRating}/10</span></span>
                                </div>
                            </div>
                        )}

                        {/* Okuma Hızı Trendi */}
                        {extendedStats.speedTrend && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Timer className="h-5 w-5 text-cyan-500" />
                                    <h3 className="font-semibold">Okuma Hızı Trendi</h3>
                                    <span className={cn("text-xs ml-auto px-2 py-0.5 rounded-full",
                                        extendedStats.speedTrend.trend === 'increasing' ? "bg-green-500/20 text-green-500" :
                                        extendedStats.speedTrend.trend === 'decreasing' ? "bg-red-500/20 text-red-500" :
                                        "bg-muted text-muted-foreground"
                                    )}>
                                        {extendedStats.speedTrend.trend === 'increasing' ? "Artıyor" :
                                         extendedStats.speedTrend.trend === 'decreasing' ? "Azalıyor" : "Stabil"}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between gap-2 h-24 mb-2">
                                    {extendedStats.speedTrend.months.map((month, i) => {
                                        const maxSpeed = Math.max(...extendedStats.speedTrend!.months.map(m => m.pagesPerDay || 0), 1)
                                        const height = month.pagesPerDay ? (month.pagesPerDay / maxSpeed) * 100 : 0
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-muted-foreground">{month.pagesPerDay ?? "-"}</span>
                                                <div
                                                    className={cn(
                                                        "w-full rounded-t transition-all",
                                                        month.pagesPerDay ? "bg-cyan-500" : "bg-muted"
                                                    )}
                                                    style={{ height: `${Math.max(height, 4)}%` }}
                                                />
                                                <span className="text-[9px] text-muted-foreground">{month.month.slice(0, 3)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t text-center">
                                    Ortalama: <span className="font-medium text-foreground">{extendedStats.speedTrend.averageSpeed} sayfa/gün</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sayfa Dağılımı ve En Hızlı/Yavaş Kitaplar */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Sayfa Sayısı Dağılımı */}
                        {extendedStats.pageDistribution && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                    <h3 className="font-semibold">Sayfa Sayısı Dağılımı</h3>
                                </div>
                                <div className="space-y-2">
                                    {extendedStats.pageDistribution.ranges.map((range) => {
                                        const maxCount = Math.max(...extendedStats.pageDistribution!.ranges.map(r => r.count), 1)
                                        const width = (range.count / maxCount) * 100
                                        return (
                                            <div key={range.range} className="flex items-center gap-2">
                                                <span className="text-xs w-16 text-muted-foreground">{range.range}</span>
                                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium w-8 text-right">{range.count}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs">
                                    {extendedStats.pageDistribution.shortestBook && (
                                        <div>
                                            <p className="text-muted-foreground">En kısa</p>
                                            <p className="font-medium truncate">{extendedStats.pageDistribution.shortestBook.title}</p>
                                            <p className="text-muted-foreground">{extendedStats.pageDistribution.shortestBook.pages} sayfa</p>
                                        </div>
                                    )}
                                    {extendedStats.pageDistribution.longestBook && (
                                        <div>
                                            <p className="text-muted-foreground">En uzun</p>
                                            <p className="font-medium truncate">{extendedStats.pageDistribution.longestBook.title}</p>
                                            <p className="text-muted-foreground">{extendedStats.pageDistribution.longestBook.pages} sayfa</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* En Hızlı/Yavaş Okunan Kitaplar */}
                        {extendedStats.readingSpeed && (extendedStats.readingSpeed.fastest.length > 0 || extendedStats.readingSpeed.slowest.length > 0) && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="h-5 w-5 text-orange-500" />
                                    <h3 className="font-semibold">Okuma Hızı Sıralaması</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-green-500 font-medium mb-2 flex items-center gap-1">
                                            <ArrowUp className="h-3 w-3" /> En Hızlı
                                        </p>
                                        <div className="space-y-2">
                                            {extendedStats.readingSpeed.fastest.slice(0, 3).map((book, i) => (
                                                <div key={i} className="text-xs">
                                                    <p className="font-medium truncate">{book.title}</p>
                                                    <p className="text-muted-foreground">{book.pagesPerDay} s/gün • {book.days} gün</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-500 font-medium mb-2 flex items-center gap-1">
                                            <ArrowDown className="h-3 w-3" /> En Yavaş
                                        </p>
                                        <div className="space-y-2">
                                            {extendedStats.readingSpeed.slowest.slice(0, 3).map((book, i) => (
                                                <div key={i} className="text-xs">
                                                    <p className="font-medium truncate">{book.title}</p>
                                                    <p className="text-muted-foreground">{book.pagesPerDay} s/gün • {book.days} gün</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Achievements / Rozetler */}
                    {extendedStats.achievements && extendedStats.achievements.length > 0 && (
                        <div className="rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                <h3 className="font-semibold">Başarılar</h3>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {extendedStats.achievements.filter(a => a.earned).length}/{extendedStats.achievements.length} kazanıldı
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {extendedStats.achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all",
                                            achievement.earned
                                                ? "bg-amber-500/10 border-amber-500/30"
                                                : "bg-muted/30 border-transparent opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl">{achievement.icon}</span>
                                            <span className="text-xs font-medium">{achievement.name}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mb-2">{achievement.description}</p>
                                        {!achievement.earned && (
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                    style={{ width: `${achievement.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {achievement.earned && (
                                            <span className="text-[10px] text-amber-500 font-medium">Kazanıldı!</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Kütüphane Değeri ve Word Cloud */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Kütüphane Değeri */}
                        {extendedStats.libraryValue && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Library className="h-5 w-5 text-emerald-500" />
                                    <h3 className="font-semibold">Kütüphane</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 rounded-lg bg-emerald-500/10">
                                        <p className="text-xs text-muted-foreground">Fiziksel Kitap</p>
                                        <p className="text-2xl font-bold text-emerald-500">{extendedStats.libraryValue.totalBooksInLibrary}</p>
                                        <p className="text-[10px] text-muted-foreground">/ {extendedStats.libraryValue.totalBooks} toplam</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-emerald-500/10">
                                        <p className="text-xs text-muted-foreground">Tahmini Değer</p>
                                        <p className="text-2xl font-bold text-emerald-500">{extendedStats.libraryValue.estimatedValue.toLocaleString()} TL</p>
                                        <p className="text-[10px] text-muted-foreground">~{extendedStats.libraryValue.averageBookPrice} TL/kitap</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t">
                                    {extendedStats.libraryValue.oldestBook && (
                                        <div>
                                            <p className="text-muted-foreground">İlk eklenen</p>
                                            <p className="font-medium truncate">{extendedStats.libraryValue.oldestBook.title}</p>
                                            <p className="text-muted-foreground">{extendedStats.libraryValue.oldestBook.addedDate}</p>
                                        </div>
                                    )}
                                    {extendedStats.libraryValue.newestBook && (
                                        <div>
                                            <p className="text-muted-foreground">Son eklenen</p>
                                            <p className="font-medium truncate">{extendedStats.libraryValue.newestBook.title}</p>
                                            <p className="text-muted-foreground">{extendedStats.libraryValue.newestBook.addedDate}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Word Cloud */}
                        {extendedStats.wordCloud && extendedStats.wordCloud.words.length > 0 && (
                            <div className="rounded-xl border bg-card p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hash className="h-5 w-5 text-pink-500" />
                                    <h3 className="font-semibold">Kelime Bulutu</h3>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        Alıntı ve notlardan
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {extendedStats.wordCloud.words.slice(0, 30).map((word, i) => {
                                        const maxValue = extendedStats.wordCloud!.words[0]?.value || 1
                                        const size = 0.7 + (word.value / maxValue) * 0.8
                                        const colors = [
                                            'text-pink-500', 'text-purple-500', 'text-blue-500',
                                            'text-cyan-500', 'text-teal-500', 'text-green-500',
                                            'text-yellow-500', 'text-orange-500', 'text-red-500'
                                        ]
                                        return (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "transition-all hover:scale-110",
                                                    colors[i % colors.length]
                                                )}
                                                style={{ fontSize: `${size}rem` }}
                                            >
                                                {word.text}
                                            </span>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-3 border-t">
                                    <span>Toplam: {extendedStats.wordCloud.totalWords.toLocaleString()} kelime</span>
                                    <span>Benzersiz: {extendedStats.wordCloud.uniqueWords.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
