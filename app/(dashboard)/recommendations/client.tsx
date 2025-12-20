"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getSmartRecommendations, type BookRecommendation } from "@/actions/ai"
import { Sparkles, BookOpen, Loader2, RefreshCw, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function RecommendationsClient() {
    const [loading, setLoading] = useState(false)
    const [recommendations, setRecommendations] = useState<BookRecommendation[] | null>(null)
    const [summary, setSummary] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchRecommendations = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await getSmartRecommendations()

            if (result.success && result.recommendations) {
                setRecommendations(result.recommendations)
                setSummary(result.summary || null)
                toast.success("Öneriler hazır!")
            } else {
                setError(result.error || "Bir hata oluştu")
                toast.error(result.error || "Öneriler alınamadı")
            }
        } catch (e) {
            setError("Bir hata oluştu")
            toast.error("Bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500 bg-green-500/10"
        if (score >= 60) return "text-yellow-500 bg-yellow-500/10"
        return "text-orange-500 bg-orange-500/10"
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="h-7 w-7 text-primary" />
                        Kitap Önerileri
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Okuma geçmişine ve tercihlerine göre AI destekli kişiselleştirilmiş öneriler
                    </p>
                </div>

                <Button
                    onClick={fetchRecommendations}
                    disabled={loading}
                    className="gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analiz ediliyor...
                        </>
                    ) : recommendations ? (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Yenile
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Öneri Al
                        </>
                    )}
                </Button>
            </div>

            {/* Initial State */}
            {!loading && !recommendations && !error && (
                <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Kişiselleştirilmiş Öneriler</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        AI, okuduğun kitapları, puanlarını ve notlarını analiz ederek sana özel kitap önerileri sunacak.
                    </p>
                    <Button onClick={fetchRecommendations} size="lg" className="gap-2">
                        <Sparkles className="h-5 w-5" />
                        Öneri Al
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Öneriler Hazırlanıyor</h2>
                    <p className="text-muted-foreground">
                        Okuma geçmişin analiz ediliyor ve sana özel öneriler oluşturuluyor...
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-6 text-center">
                    <p className="text-destructive font-medium">{error}</p>
                    {error.includes("3 tamamlanmış") && (
                        <p className="text-muted-foreground text-sm mt-2">
                            Daha fazla kitap okuduktan sonra tekrar dene!
                        </p>
                    )}
                </div>
            )}

            {/* Results */}
            {recommendations && (
                <div className="space-y-6">
                    {/* Summary */}
                    {summary && (
                        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 md:p-6 border border-primary/20">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h3 className="font-semibold mb-1">Okuma Profilin</h3>
                                    <p className="text-muted-foreground text-sm">{summary}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommendations Grid */}
                    <div className="grid gap-4">
                        {recommendations.map((rec, index) => (
                            <div
                                key={index}
                                className="bg-card rounded-xl border border-border/50 p-4 md:p-6 hover:border-primary/30 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Book Icon */}
                                    <div className="w-12 h-16 md:w-16 md:h-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg">{rec.title}</h3>
                                                <p className="text-muted-foreground text-sm">{rec.author}</p>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1",
                                                getScoreColor(rec.matchScore)
                                            )}>
                                                <Star className="h-3.5 w-3.5" />
                                                {rec.matchScore}%
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-sm">{rec.reason}</p>
                                    </div>

                                    {/* Action */}
                                    <Button variant="ghost" size="sm" className="shrink-0 hidden md:flex">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
