"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Target,
    Lock,
    CheckCircle2,
    BookOpen,
    Sparkles,
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
        <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg",
                        isWarmupPeriod ? "bg-orange-500/20" : "bg-emerald-500/20"
                    )}>
                        <Target className={cn(
                            "h-3.5 w-3.5 md:h-4 md:w-4",
                            isWarmupPeriod ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                        )} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm md:text-base">
                            {isWarmupPeriod ? "Isınma Turu" : `${year} Okuma Hedefi`}
                        </h2>
                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                            <span>{currentMonth.themeIcon}</span>
                            <span>{currentMonth.monthName} - {currentMonth.theme}</span>
                        </p>
                    </div>
                </div>
                <Link href="/challenges" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Tümü →
                </Link>
            </div>

            <div className="p-3 md:p-4 space-y-3">
                {!hasJoined ? (
                    // Katılım butonu
                    <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground mb-2">
                            Okuma hedefine katılarak ilerlemenizi takip edin
                        </p>
                        <Button size="sm" onClick={handleJoin} disabled={isJoining}>
                            {isJoining ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Trophy className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Katıl
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* İlerleme çubuğu - sadece ana hedefler */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] md:text-xs">
                                <span className="text-muted-foreground">Ana Hedefler</span>
                                <span className="font-medium">
                                    {mainCompletedCount}/{mainTotalCount} {isAllMainCompleted && "✓"}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all",
                                        isWarmupPeriod ? "bg-orange-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Ana Kitaplar */}
                        {currentMonth.mainBooks.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Target className={cn(
                                        "h-3 w-3",
                                        isWarmupPeriod ? "text-orange-500" : "text-emerald-500"
                                    )} />
                                    <span className="text-[10px] font-medium text-muted-foreground">Ana Hedefler</span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    {currentMonth.mainBooks.map((mainBook) => (
                                        <div
                                            key={mainBook.id}
                                            className={cn(
                                                "relative flex gap-2 p-1.5 rounded-lg transition-all",
                                                mainBook.bookStatus === "COMPLETED"
                                                    ? "bg-green-500/10"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                {mainBook.coverUrl ? (
                                                    <Image
                                                        src={mainBook.coverUrl}
                                                        alt={mainBook.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                                {mainBook.bookStatus === "COMPLETED" && (
                                                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-medium line-clamp-2 leading-tight">
                                                    {mainBook.title}
                                                </p>
                                            </div>

                                            {mainBook.bookStatus === "COMPLETED" ? (
                                                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                            ) : mainBook.bookStatus === "READING" ? (
                                                <BookOpen className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bonus Kitaplar */}
                        {currentMonth.bonusBooks.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    <span className="text-[10px] font-medium text-muted-foreground">Bonus</span>
                                    {!isAllMainCompleted && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    {currentMonth.bonusBooks.map((book) => (
                                        <div
                                            key={book.id}
                                            className={cn(
                                                "relative flex gap-2 p-1.5 rounded-lg transition-all",
                                                book.isLocked
                                                    ? "opacity-40"
                                                    : book.bookStatus === "COMPLETED"
                                                        ? "bg-green-500/10"
                                                        : "hover:bg-muted/50"
                                            )}
                                        >
                                            {book.isLocked && (
                                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}

                                            <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                {book.coverUrl ? (
                                                    <Image
                                                        src={book.coverUrl}
                                                        alt={book.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-medium line-clamp-2 leading-tight">
                                                    {book.title}
                                                </p>
                                            </div>

                                            {book.bookStatus === "COMPLETED" && (
                                                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
