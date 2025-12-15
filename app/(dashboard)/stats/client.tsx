"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
    RefreshCw
} from "lucide-react"
import { StatCard } from "@/components/stats/stat-card"
import { MonthlyChart } from "@/components/stats/monthly-chart"
import { StatusDistribution } from "@/components/stats/status-distribution"
import { TopAuthorsTable } from "@/components/stats/top-authors-table"
import { TopPublishersTable } from "@/components/stats/top-publishers-table"
import { analyzeReadingHabits } from "@/actions/ai"
import type { FullStatsData } from "@/actions/stats"

interface StatsClientProps {
    stats: FullStatsData
}

export function StatsClient({ stats }: StatsClientProps) {
    const { readingStats, monthlyData, topAuthors, topPublishers, quoteStats, challengeStats, bestMonth } = stats
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">İstatistikler</h1>
                <p className="text-muted-foreground">Okuma alışkanlıkların ve analizler</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    title="Toplam Kitap"
                    value={readingStats.totalBooks}
                    subtitle={`${readingStats.toReadBooks} okunacak`}
                    icon={BookOpen}
                    iconColor="text-blue-500"
                />
                <StatCard
                    title="Tamamlanan"
                    value={readingStats.completedBooks}
                    subtitle={`${readingStats.readingBooks} okunuyor`}
                    icon={CheckCircle2}
                    iconColor="text-green-500"
                />
                <StatCard
                    title="Okunan Sayfa"
                    value={readingStats.totalPagesRead.toLocaleString()}
                    subtitle={`Ort. ${readingStats.averageBookLength} sayfa/kitap`}
                    icon={FileText}
                    iconColor="text-purple-500"
                />
                <StatCard
                    title="Gün/Kitap"
                    value={readingStats.averageDaysPerBook ?? "-"}
                    subtitle={`${readingStats.totalReadingDays} toplam gün`}
                    icon={Clock}
                    iconColor="text-orange-500"
                />
                <StatCard
                    title="Sayfa/Gün"
                    value={readingStats.pagesPerDay ?? "-"}
                    subtitle="Günlük ortalama"
                    icon={Zap}
                    iconColor="text-yellow-500"
                />
                <StatCard
                    title="Tamamlanma"
                    value={`%${readingStats.completionRate}`}
                    subtitle={`${readingStats.dnfBooks} bırakılan`}
                    icon={Target}
                    iconColor="text-emerald-500"
                />
            </div>

            {/* Monthly Chart */}
            <MonthlyChart data={monthlyData} />

            {/* Two Column: Authors + Status Distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
                <TopAuthorsTable authors={topAuthors} />
                <StatusDistribution
                    completed={readingStats.completedBooks}
                    reading={readingStats.readingBooks}
                    toRead={readingStats.toReadBooks}
                    dnf={readingStats.dnfBooks}
                />
            </div>

            {/* Time Period Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Bu Ay
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{readingStats.booksThisMonth} kitap</div>
                        <p className="text-sm text-muted-foreground">
                            {readingStats.pagesThisMonth.toLocaleString()} sayfa
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Bu Yıl
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{readingStats.booksThisYear} kitap</div>
                        <p className="text-sm text-muted-foreground">
                            {readingStats.pagesThisYear.toLocaleString()} sayfa
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            En İyi Ay
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bestMonth ? (
                            <>
                                <div className="text-2xl font-bold">{bestMonth.month}</div>
                                <p className="text-sm text-muted-foreground">
                                    {bestMonth.count} kitap
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">Henüz veri yok</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quote Stats + Publishers */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quote Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Quote className="h-5 w-5" />
                            Alıntı İstatistikleri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Toplam Alıntı</span>
                            <span className="font-medium">{quoteStats.totalQuotes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Alıntı Yapılan Kitap</span>
                            <span className="font-medium">{quoteStats.booksWithQuotes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Kitap Başına Ortalama</span>
                            <span className="font-medium">{quoteStats.averageQuotesPerBook}</span>
                        </div>
                        {quoteStats.mostQuotedBook && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">En Çok Alıntı Yapılan</p>
                                <p className="text-sm font-medium truncate">
                                    {quoteStats.mostQuotedBook.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {quoteStats.mostQuotedBook.count} alıntı
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <TopPublishersTable publishers={topPublishers} />
            </div>

            {/* Challenge Stats */}
            {challengeStats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="h-5 w-5" />
                            {challengeStats.year} Okuma Hedefi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">İlerleme</span>
                            <span className="font-medium">%{challengeStats.percentage}</span>
                        </div>
                        <Progress value={challengeStats.percentage} className="h-3" />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {challengeStats.mainCompleted} Ana Kitap
                            </span>
                            <span className="text-muted-foreground">
                                {challengeStats.bonusCompleted} Bonus Kitap
                            </span>
                            <span className="font-medium">
                                {challengeStats.completedBooks}/{challengeStats.totalBooks} Toplam
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reading Progress (if any books are being read) */}
            {readingStats.readingBooks > 0 && readingStats.averageProgress > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BookOpen className="h-5 w-5" />
                            Şu An Okunan Kitaplar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {readingStats.readingBooks} kitap okunuyor
                            </span>
                            <span className="font-medium">Ort. %{readingStats.averageProgress}</span>
                        </div>
                        <Progress value={readingStats.averageProgress} className="h-2" />
                    </CardContent>
                </Card>
            )}

            {/* AI Analysis */}
            <Card className="border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Okuma Analizi
                        </CardTitle>
                        {aiAnalysis && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGetAIAnalysis}
                                disabled={isAnalyzing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!aiAnalysis && !isAnalyzing && !analysisError && (
                        <div className="text-center py-6">
                            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
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
                </CardContent>
            </Card>
        </div>
    )
}
