"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Target,
    Lock,
    CheckCircle2,
    BookOpen,
    Sparkles,
    Trophy,
    Flame
} from "lucide-react"
import { cn } from "@/lib/utils"
import { joinChallenge } from "@/actions/challenge"
import { toast } from "sonner"
import type { ChallengeTimeline, ChallengeMonthWithBooks } from "@/actions/challenge"

type ChallengeTimelineClientProps = {
    timeline: ChallengeTimeline
}

export function ChallengeTimelineClient({ timeline }: ChallengeTimelineClientProps) {
    const [localTimeline, setLocalTimeline] = useState(timeline)
    const [isJoining, setIsJoining] = useState<string | null>(null)

    const { challenges, currentPeriod } = localTimeline

    // Tüm ayları birleştir (2025 Level 0 + 2026 12 ay)
    const allMonths: { year: number; month: ChallengeMonthWithBooks; challengeId: string; isWarmup: boolean }[] = []

    challenges.forEach(challenge => {
        challenge.months.forEach(month => {
            allMonths.push({
                year: challenge.year,
                month,
                challengeId: challenge.id,
                isWarmup: challenge.year === 2025
            })
        })
    })

    // Aktif ay için default açık accordion
    const defaultOpenValue = `${currentPeriod.year}-${currentPeriod.month}`

    const handleJoin = async (challengeId: string) => {
        setIsJoining(challengeId)
        const result = await joinChallenge(challengeId)
        if (result.success) {
            toast.success("Challenge'a katıldınız!")
            window.location.reload()
        } else {
            toast.error(result.error)
        }
        setIsJoining(null)
    }

    // Toplam ilerleme hesapla
    const totalBooks = challenges.reduce((acc, c) => acc + (c.totalProgress?.totalBooks ?? 0), 0)
    const completedBooks = challenges.reduce((acc, c) => acc + (c.totalProgress?.completedBooks ?? 0), 0)
    const overallProgress = totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <Target className="h-7 w-7 text-primary" />
                            2025-2026 Okuma Hedefi
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Yatay Okuma Stratejisi: Türler arası geçişle sıkılmadan okuma
                        </p>
                    </div>
                    {currentPeriod.isWarmupPeriod && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300">
                            <Flame className="h-3 w-3 mr-1" />
                            Isınma Turu Aktif
                        </Badge>
                    )}
                </div>

                {/* Genel İlerleme */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Toplam İlerleme</span>
                            <span className="text-sm text-muted-foreground">
                                {completedBooks}/{totalBooks} kitap ({overallProgress}%)
                            </span>
                        </div>
                        <Progress value={overallProgress} className="h-3" />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>
                                <Trophy className="h-3 w-3 inline mr-1" />
                                {challenges.reduce((acc, c) => acc + (c.totalProgress?.mainCompleted ?? 0), 0)} ana kitap
                            </span>
                            <span>
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                {challenges.reduce((acc, c) => acc + (c.totalProgress?.bonusCompleted ?? 0), 0)} bonus kitap
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <Accordion type="single" collapsible defaultValue={defaultOpenValue} className="space-y-4">
                {allMonths.map(({ year, month, challengeId, isWarmup }) => {
                    const isCurrentMonth = year === currentPeriod.year && month.monthNumber === currentPeriod.month
                    const mainBook = month.books.find(b => b.role === "MAIN")
                    const bonusBooks = month.books.filter(b => b.role === "BONUS")

                    return (
                        <AccordionItem
                            key={`${year}-${month.monthNumber}`}
                            value={`${year}-${month.monthNumber}`}
                            className={cn(
                                "border rounded-lg overflow-hidden",
                                isCurrentMonth && isWarmup && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
                                isCurrentMonth && !isWarmup && "border-primary/50 bg-primary/5"
                            )}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{month.themeIcon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {isWarmup ? "Level 0: " : ""}{month.monthName}
                                            </span>
                                            {isCurrentMonth && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Aktif
                                                </Badge>
                                            )}
                                            {isWarmup && (
                                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                                    <Flame className="h-3 w-3 mr-1" />
                                                    Isınma
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">{month.theme}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mr-4">
                                        <Progress value={month.progress?.percentage ?? 0} className="w-20 h-2" />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                            {month.progress?.completed ?? 0}/{month.progress?.total ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4 pt-2">
                                    {/* Ana Kitap */}
                                    {mainBook && (
                                        <div className="relative">
                                            <div className="absolute -top-2 left-2 z-10">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                    isWarmup
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-primary text-primary-foreground"
                                                )}>
                                                    ANA HEDEF
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "flex gap-4 p-4 rounded-lg border-2 transition-all",
                                                mainBook.userStatus === "COMPLETED"
                                                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                    : isWarmup
                                                        ? "border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10"
                                                        : "border-primary/30 bg-background"
                                            )}>
                                                {/* Kapak */}
                                                <div className="relative h-28 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                    {mainBook.book.coverUrl ? (
                                                        <Image
                                                            src={mainBook.book.coverUrl}
                                                            alt={mainBook.book.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    {mainBook.userStatus === "COMPLETED" && (
                                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bilgi */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base">{mainBook.book.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{mainBook.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                    {mainBook.book.pageCount && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {mainBook.book.pageCount} sayfa
                                                        </p>
                                                    )}
                                                    {mainBook.reason && (
                                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                            {mainBook.reason}
                                                        </p>
                                                    )}

                                                    {/* Durum */}
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        {mainBook.userStatus === "COMPLETED" ? (
                                                            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Tamamlandı
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Bekliyor
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Takeaway */}
                                                    {mainBook.takeaway && (
                                                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                            <div className="flex items-start gap-2">
                                                                <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Aklımda kalan</p>
                                                                    <p className="text-sm italic text-amber-900 dark:text-amber-200">"{mainBook.takeaway}"</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bonus Kitaplar */}
                                    {bonusBooks.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    Bonus Kitaplar
                                                </span>
                                                {!month.isMainCompleted && (
                                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {bonusBooks.map(book => (
                                                    <div
                                                        key={book.id}
                                                        className={cn(
                                                            "relative flex gap-3 p-3 rounded-lg border transition-all",
                                                            book.userStatus === "LOCKED"
                                                                ? "opacity-60 border-dashed bg-muted/50"
                                                                : book.userStatus === "COMPLETED"
                                                                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
                                                                    : "border-muted-foreground/20 bg-background"
                                                        )}
                                                    >
                                                        {book.userStatus === "LOCKED" && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Ana kitabı bitir
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative h-16 w-11 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                            {book.book.coverUrl ? (
                                                                <Image
                                                                    src={book.book.coverUrl}
                                                                    alt={book.book.title}
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
                                                            <p className="text-sm font-medium line-clamp-1">{book.book.title}</p>
                                                            <p className="text-xs text-muted-foreground">{book.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                            {book.book.pageCount && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {book.book.pageCount} sayfa
                                                                </p>
                                                            )}

                                                            {/* Bonus kitap durum */}
                                                            <div className="flex items-center gap-1 mt-1">
                                                                {book.userStatus === "COMPLETED" && (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                )}
                                                            </div>

                                                            {/* Bonus kitap takeaway */}
                                                            {book.takeaway && (
                                                                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs italic text-amber-900 dark:text-amber-200">
                                                                    "{book.takeaway}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </div>
    )
}
