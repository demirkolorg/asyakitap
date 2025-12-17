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
    CheckCircle2,
    BookOpen,
    Sparkles,
    Trophy
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

    // Tüm ayları birleştir
    const allMonths: { year: number; month: ChallengeMonthWithBooks; challengeId: string; challengeName: string }[] = []

    challenges.forEach(challenge => {
        challenge.months.forEach(month => {
            allMonths.push({
                year: challenge.year,
                month,
                challengeId: challenge.id,
                challengeName: challenge.name
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
                            Okuma Hedefleri
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {challenges.length} hedef • {allMonths.length} ay
                        </p>
                    </div>
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
                {allMonths.map(({ year, month, challengeId, challengeName }) => {
                    const isCurrentMonth = year === currentPeriod.year && month.monthNumber === currentPeriod.month
                    const mainBooks = month.books.filter(b => b.role === "MAIN")
                    const bonusBooks = month.books.filter(b => b.role === "BONUS")

                    return (
                        <AccordionItem
                            key={`${year}-${month.monthNumber}`}
                            value={`${year}-${month.monthNumber}`}
                            className={cn(
                                "border rounded-lg overflow-hidden",
                                isCurrentMonth && "border-primary/50 bg-primary/5"
                            )}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{month.themeIcon || "📚"}</span>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {month.monthName} {year}
                                            </span>
                                            {isCurrentMonth && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Aktif
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">{month.theme || challengeName}</span>
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
                                    {/* Ana Kitaplar */}
                                    {mainBooks.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Ana Hedefler</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {mainBooks.map(mainBook => (
                                                    <div
                                                        key={mainBook.id}
                                                        className={cn(
                                                            "flex gap-3 p-3 rounded-lg border-2 transition-all",
                                                            mainBook.userStatus === "COMPLETED"
                                                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                                : "border-primary/30 bg-background"
                                                        )}
                                                    >
                                                        {/* Kapak */}
                                                        <div className="relative h-20 w-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                            {mainBook.book.coverUrl ? (
                                                                <Image
                                                                    src={mainBook.book.coverUrl}
                                                                    alt={mainBook.book.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            {mainBook.userStatus === "COMPLETED" && (
                                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Bilgi */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm line-clamp-1">{mainBook.book.title}</h4>
                                                            <p className="text-xs text-muted-foreground">{mainBook.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                            {mainBook.reason && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                    {mainBook.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
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
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {bonusBooks.map(book => (
                                                    <div
                                                        key={book.id}
                                                        className={cn(
                                                            "flex gap-3 p-3 rounded-lg border transition-all",
                                                            book.userStatus === "COMPLETED"
                                                                ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
                                                                : "border-muted-foreground/20 bg-background"
                                                        )}
                                                    >
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
                                                            {book.reason && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                                    {book.reason}
                                                                </p>
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
