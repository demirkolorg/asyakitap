"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Wrench,
    Map,
    Target,
    ArrowLeft
} from "lucide-react"
import { repairAllLinks, confirmSuggestedLink, type RepairResult, type RepairSuggestion } from "@/actions/repair-links"
import { toast } from "sonner"
import Link from "next/link"

export function RepairLinksClient() {
    const [isRepairing, setIsRepairing] = useState(false)
    const [result, setResult] = useState<RepairResult | null>(null)
    const [confirmingId, setConfirmingId] = useState<string | null>(null)

    const handleRepair = async () => {
        setIsRepairing(true)
        const repairResult = await repairAllLinks()

        if (repairResult.success) {
            setResult(repairResult)

            const { stats } = repairResult
            const totalRepaired = stats.readingListsRepaired + stats.challengesRepaired

            if (totalRepaired > 0) {
                toast.success(`${totalRepaired} bağlantı otomatik olarak onarıldı!`)
            }

            if (stats.suggestionsFound > 0) {
                toast.info(`${stats.suggestionsFound} öneri bulundu - incelemeniz gerekiyor`)
            }

            if (totalRepaired === 0 && stats.suggestionsFound === 0 &&
                stats.readingListsScanned === 0 && stats.challengesScanned === 0) {
                toast.info("Kopuk bağlantı bulunamadı - her şey yolunda!")
            }
        } else {
            toast.error("Onarım sırasında hata oluştu")
        }

        setIsRepairing(false)
    }

    const handleConfirmSuggestion = async (
        suggestion: RepairSuggestion,
        bookId: string,
        index: number
    ) => {
        setConfirmingId(`${suggestion.targetId}-${bookId}`)

        const confirmResult = await confirmSuggestedLink(
            suggestion.type,
            suggestion.targetId,
            bookId
        )

        if (confirmResult.success) {
            toast.success("Bağlantı oluşturuldu!")

            // Öneriyi listeden kaldır
            setResult(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    suggestions: prev.suggestions.filter((_, i) => i !== index),
                    stats: {
                        ...prev.stats,
                        suggestionsFound: prev.stats.suggestionsFound - 1,
                        ...(suggestion.type === 'reading-list'
                            ? { readingListsRepaired: prev.stats.readingListsRepaired + 1 }
                            : { challengesRepaired: prev.stats.challengesRepaired + 1 }
                        )
                    }
                }
            })
        } else {
            toast.error(confirmResult.error || "Bağlantı oluşturulamadı")
        }

        setConfirmingId(null)
    }

    return (
        <div className="space-y-6">
            {/* Geri Butonu */}
            <Link href="/settings">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Ayarlara Dön
                </Button>
            </Link>

            {/* Tarama butonu */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Otomatik Tarama
                    </CardTitle>
                    <CardDescription>
                        Kitaplarınızı tarayıp kopuk bağlantıları bulmaya başlayın.
                        %75 ve üzeri eşleşmeler otomatik olarak bağlanacak.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleRepair}
                        disabled={isRepairing}
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        {isRepairing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Taranıyor...
                            </>
                        ) : (
                            <>
                                <Wrench className="h-4 w-4 mr-2" />
                                Bağlantıları Tara ve Onar
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Sonuçlar */}
            {result && (
                <>
                    {/* İstatistikler */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tarama Sonuçları</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Map className="h-4 w-4 text-violet-500" />
                                        <span className="text-sm font-medium">Okuma Listeleri</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {result.stats.readingListsRepaired}
                                        <span className="text-sm text-muted-foreground ml-1">
                                            / {result.stats.readingListsScanned}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Kopuk bağlantı onarıldı
                                    </p>
                                </div>

                                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-medium">Challenge'lar</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {result.stats.challengesRepaired}
                                        <span className="text-sm text-muted-foreground ml-1">
                                            / {result.stats.challengesScanned}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Kopuk bağlantı onarıldı
                                    </p>
                                </div>
                            </div>

                            {result.stats.suggestionsFound > 0 && (
                                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        {result.stats.suggestionsFound} öneri bulundu -
                                        manuel onay gerekiyor
                                    </span>
                                </div>
                            )}

                            {result.stats.readingListsScanned === 0 && result.stats.challengesScanned === 0 && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        Tüm bağlantılar sağlam - kopuk bağlantı bulunamadı!
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Öneriler */}
                    {result.suggestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Eşleştirme Önerileri</CardTitle>
                                <CardDescription>
                                    Bu bağlantılar otomatik olarak onarılamadı (%75 altı eşleşme).
                                    Lütfen manuel olarak inceleyin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {result.suggestions.map((suggestion, index) => (
                                    <div
                                        key={`${suggestion.type}-${suggestion.targetId}`}
                                        className="border rounded-lg p-4 space-y-3"
                                    >
                                        {/* Hedef kitap */}
                                        <div className="flex items-start gap-3">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    suggestion.type === 'reading-list'
                                                        ? "border-violet-300 text-violet-700 dark:text-violet-300"
                                                        : "border-amber-300 text-amber-700 dark:text-amber-300"
                                                }
                                            >
                                                {suggestion.type === 'reading-list' ? (
                                                    <><Map className="h-3 w-3 mr-1" /> Okuma Listesi</>
                                                ) : (
                                                    <><Target className="h-3 w-3 mr-1" /> Challenge</>
                                                )}
                                            </Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">
                                                    {suggestion.targetTitle}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {suggestion.targetAuthor}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {suggestion.listOrChallengeName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Adaylar */}
                                        <div className="space-y-2 pt-2 border-t">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Kütüphanenizdeki olası eşleşmeler:
                                            </p>
                                            {suggestion.candidates.map((candidate) => (
                                                <div
                                                    key={candidate.bookId}
                                                    className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {candidate.bookTitle}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant={
                                                                    candidate.confidence === 'medium'
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {Math.round(candidate.score * 100)}% eşleşme
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {candidate.confidence === 'medium'
                                                                    ? 'Orta güven'
                                                                    : 'Düşük güven'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirmSuggestion(
                                                            suggestion,
                                                            candidate.bookId,
                                                            index
                                                        )}
                                                        disabled={confirmingId === `${suggestion.targetId}-${candidate.bookId}`}
                                                    >
                                                        {confirmingId === `${suggestion.targetId}-${candidate.bookId}` ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Bağla
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
