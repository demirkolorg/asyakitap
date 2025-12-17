"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Target,
    Lock,
    CheckCircle2,
    BookOpen,
    Sparkles,
    ChevronRight,
    Trophy,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { joinChallenge } from "@/actions/challenge"
import { toast } from "sonner"
import { BookStatus } from "@prisma/client"

type MainBook = {
    id: string
    title: string
    author: string
    coverUrl: string | null
    pageCount: number | null
    reason: string | null
    bookStatus: BookStatus // Kitabın gerçek durumu
}

type BonusBook = {
    id: string
    title: string
    author: string
    coverUrl: string | null
    pageCount: number | null
    reason: string | null
    bookStatus: BookStatus // Kitabın gerçek durumu
    isLocked: boolean // Ana kitap tamamlanmadıysa kilitli
}

type ChallengeWidgetProps = {
    challenge: {
        challengeId: string
        year: number
        name: string
        hasJoined: boolean
        isWarmupPeriod?: boolean // Isınma turu mu?
        currentMonth: {
            monthNumber: number
            monthName: string
            theme: string
            themeIcon: string | null
            mainBooks: MainBook[] // Çoklu ana kitap desteği
            bonusBooks: BonusBook[]
            mainCompletedCount: number
            mainTotalCount: number
            isAllMainCompleted: boolean
        }
    } | null
}

export function ChallengeWidget({ challenge }: ChallengeWidgetProps) {
    const [isJoining, setIsJoining] = useState(false)
    const [localChallenge, setLocalChallenge] = useState(challenge)

    if (!localChallenge) {
        return null
    }

    const { currentMonth, hasJoined, challengeId, year, isWarmupPeriod } = localChallenge

    const handleJoin = async () => {
        setIsJoining(true)
        const result = await joinChallenge(challengeId)
        if (result.success) {
            toast.success("Challenge'a katıldınız!")
            setLocalChallenge(prev => prev ? { ...prev, hasJoined: true } : null)
        } else {
            toast.error(result.error)
        }
        setIsJoining(false)
    }

    // İlerleme sadece ana hedef kitaplarına göre hesaplanır (bonus kitaplar sayılmaz)
    const { mainCompletedCount, mainTotalCount, isAllMainCompleted } = currentMonth
    const progressPercentage = mainTotalCount > 0 ? Math.round((mainCompletedCount / mainTotalCount) * 100) : 0

    return (
        <Card className={cn(
            "overflow-hidden border-2 bg-gradient-to-br",
            isWarmupPeriod
                ? "border-orange-500/30 from-orange-500/5 to-orange-500/10"
                : "border-primary/20 from-primary/5 to-primary/10"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className={cn("h-5 w-5", isWarmupPeriod ? "text-orange-500" : "text-primary")} />
                        {isWarmupPeriod ? "Isınma Turu 🔥" : `${year} Okuma Hedefi`}
                    </CardTitle>
                    <Link
                        href="/challenges"
                        className={cn(
                            "text-xs hover:underline flex items-center gap-1",
                            isWarmupPeriod ? "text-orange-500" : "text-primary"
                        )}
                    >
                        Tümünü Gör
                        <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                {isWarmupPeriod && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/30 px-2 py-1 rounded-md w-fit">
                        <span>2026&apos;ya hazırlık - Level 0</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-lg">{currentMonth.themeIcon}</span>
                    <span>{currentMonth.monthName} - {currentMonth.theme}</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!hasJoined ? (
                    // Katılım butonu
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
                            Bu yılın okuma hedefine katılarak ilerlemenizi takip edin!
                        </p>
                        <Button onClick={handleJoin} disabled={isJoining}>
                            {isJoining ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trophy className="h-4 w-4 mr-2" />
                            )}
                            Challenge'a Katıl
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* İlerleme çubuğu - sadece ana hedefler */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Ana Hedefler</span>
                                <span className="font-medium">
                                    {mainCompletedCount}/{mainTotalCount} {isAllMainCompleted ? "✓" : ""}
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>

                        {/* Ana Kitaplar */}
                        {currentMonth.mainBooks.length > 0 && (
                            <div className="space-y-3">
                                {currentMonth.mainBooks.map((mainBook, index) => (
                                    <div key={mainBook.id} className="relative">
                                        <div className="absolute -top-2 left-2 z-10">
                                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                ANA HEDEF {currentMonth.mainBooks.length > 1 ? index + 1 : ""}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "flex gap-3 p-3 rounded-lg border-2 transition-all",
                                            mainBook.bookStatus === "COMPLETED"
                                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                : "border-primary/30 bg-background"
                                        )}>
                                            {/* Kapak */}
                                            <div className="relative h-24 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                {mainBook.coverUrl ? (
                                                    <Image
                                                        src={mainBook.coverUrl}
                                                        alt={mainBook.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                {mainBook.bookStatus === "COMPLETED" && (
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bilgi */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm line-clamp-1">
                                                    {mainBook.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {mainBook.author}
                                                </p>
                                                {mainBook.pageCount && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {mainBook.pageCount} sayfa
                                                    </p>
                                                )}

                                                {/* Durum göstergesi - Kitabın gerçek durumu */}
                                                <div className="mt-2">
                                                    {mainBook.bookStatus === "COMPLETED" ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Okudum
                                                        </span>
                                                    ) : mainBook.bookStatus === "READING" ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                            <BookOpen className="h-3 w-3" />
                                                            Okunuyor
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Okunacak
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bonus Kitaplar */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Bonus Kitaplar
                                </span>
                                {!isAllMainCompleted && (
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {currentMonth.bonusBooks.map((book) => (
                                    <div
                                        key={book.id}
                                        className={cn(
                                            "relative flex gap-2 p-2 rounded-lg border transition-all",
                                            book.isLocked
                                                ? "opacity-50 border-dashed bg-muted/50"
                                                : book.bookStatus === "COMPLETED"
                                                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
                                                    : "border-muted-foreground/20 bg-background"
                                        )}
                                    >
                                        {book.isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
                                                <Lock className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="relative h-14 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                                            {book.coverUrl ? (
                                                <Image
                                                    src={book.coverUrl}
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium line-clamp-2 leading-tight">
                                                {book.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                {book.author}
                                            </p>
                                        </div>

                                        {book.bookStatus === "COMPLETED" && (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
