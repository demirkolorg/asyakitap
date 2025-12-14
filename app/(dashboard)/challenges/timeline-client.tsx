"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Target,
    Lock,
    CheckCircle2,
    BookOpen,
    Sparkles,
    Trophy,
    Loader2,
    Flame
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    joinChallenge,
    linkChallengeBookToLibrary,
    getUserBooksForLinking
} from "@/actions/challenge"
import { toast } from "sonner"
import type { ChallengeTimeline, ChallengeOverview, ChallengeMonthWithBooks } from "@/actions/challenge"
import { Link2, Link2Off, Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

type ChallengeTimelineClientProps = {
    timeline: ChallengeTimeline
}

export function ChallengeTimelineClient({ timeline }: ChallengeTimelineClientProps) {
    const [localTimeline, setLocalTimeline] = useState(timeline)
    const [isJoining, setIsJoining] = useState<string | null>(null)

    // Manuel eşleştirme state'leri
    const [linkDialog, setLinkDialog] = useState<{
        open: boolean
        challengeBookId: string
        challengeBookTitle: string
        currentLinkedBookId: string | null
    }>({ open: false, challengeBookId: "", challengeBookTitle: "", currentLinkedBookId: null })
    const [userBooks, setUserBooks] = useState<{ id: string; title: string; author: string; coverUrl: string | null }[]>([])
    const [isLoadingBooks, setIsLoadingBooks] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const [linkSearchQuery, setLinkSearchQuery] = useState("")

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
            // Refresh would be ideal here
            window.location.reload()
        } else {
            toast.error(result.error)
        }
        setIsJoining(null)
    }

    // Manuel eşleştirme dialog'unu aç
    const handleOpenLinkDialog = async (challengeBookId: string, challengeBookTitle: string, currentLinkedBookId: string | null) => {
        setLinkDialog({
            open: true,
            challengeBookId,
            challengeBookTitle,
            currentLinkedBookId
        })
        setLinkSearchQuery("")

        // Kullanıcının kitaplarını yükle
        setIsLoadingBooks(true)
        const books = await getUserBooksForLinking()
        setUserBooks(books)
        setIsLoadingBooks(false)
    }

    // Kitap eşleştir
    const handleLinkBook = async (libraryBookId: string | null) => {
        setIsLinking(true)
        const result = await linkChallengeBookToLibrary(linkDialog.challengeBookId, libraryBookId)
        if (result.success) {
            toast.success(libraryBookId ? "Kitap bağlandı!" : "Bağlantı kaldırıldı!")
            window.location.reload() // Basit yenileme
        } else {
            toast.error(result.error)
        }
        setIsLinking(false)
        setLinkDialog({ open: false, challengeBookId: "", challengeBookTitle: "", currentLinkedBookId: null })
    }

    // Filtrelenmiş kitaplar
    const filteredUserBooks = userBooks.filter(book =>
        book.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(linkSearchQuery.toLowerCase())
    )

    // Toplam ilerleme hesapla
    const totalBooks = challenges.reduce((acc, c) => acc + c.totalProgress.totalBooks, 0)
    const completedBooks = challenges.reduce((acc, c) => acc + c.totalProgress.completedBooks, 0)
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
                                {challenges.reduce((acc, c) => acc + c.totalProgress.mainCompleted, 0)} ana kitap
                            </span>
                            <span>
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                {challenges.reduce((acc, c) => acc + c.totalProgress.bonusCompleted, 0)} bonus kitap
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
                                        <Progress value={month.progress.percentage} className="w-20 h-2" />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                            {month.progress.completed}/{month.progress.total}
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
                                                {mainBook.linkedBookId ? (
                                                    <Link href={`/book/${mainBook.linkedBookId}`} className="relative h-28 w-20 flex-shrink-0 rounded overflow-hidden bg-muted group">
                                                        {(mainBook.linkedBookCoverUrl || mainBook.coverUrl) ? (
                                                            <Image
                                                                src={mainBook.linkedBookCoverUrl || mainBook.coverUrl!}
                                                                alt={mainBook.title}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform"
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
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                            <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div className="relative h-28 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                        {mainBook.coverUrl ? (
                                                            <Image
                                                                src={mainBook.coverUrl}
                                                                alt={mainBook.title}
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
                                                )}

                                                {/* Bilgi */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-base">{mainBook.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{mainBook.author}</p>
                                                    {mainBook.pageCount && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {mainBook.pageCount} sayfa
                                                        </p>
                                                    )}
                                                    {mainBook.reason && (
                                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                            {mainBook.reason}
                                                        </p>
                                                    )}

                                                    {/* Durum ve eşleştirme */}
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        {/* Durum göstergesi */}
                                                        {mainBook.userStatus === "COMPLETED" ? (
                                                            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Tamamlandı
                                                            </span>
                                                        ) : mainBook.linkedBookId ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                Kitap detayından durumu güncelleyin
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-amber-600">
                                                                Önce kütüphaneden eşleştirin →
                                                            </span>
                                                        )}
                                                        {/* Manuel eşleştirme butonu */}
                                                        <Button
                                                            size="sm"
                                                            variant={mainBook.linkedBookId ? "ghost" : "outline"}
                                                            className="h-8 px-3"
                                                            onClick={() => handleOpenLinkDialog(mainBook.id, mainBook.title, mainBook.linkedBookId)}
                                                        >
                                                            {mainBook.linkedBookId ? (
                                                                <>
                                                                    <Link2 className="h-4 w-4 mr-1 text-green-600" />
                                                                    Bağlı
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Link2Off className="h-4 w-4 mr-1" />
                                                                    Eşleştir
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {/* Takeaway */}
                                                    {mainBook.takeaway && (
                                                        <div className="mt-3 p-2 bg-muted/50 rounded text-xs italic">
                                                            "{mainBook.takeaway}"
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

                                                        {book.linkedBookId ? (
                                                            <Link href={`/book/${book.linkedBookId}`} className="relative h-16 w-11 flex-shrink-0 rounded overflow-hidden bg-muted group">
                                                                {(book.linkedBookCoverUrl || book.coverUrl) ? (
                                                                    <Image
                                                                        src={book.linkedBookCoverUrl || book.coverUrl!}
                                                                        alt={book.title}
                                                                        fill
                                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </Link>
                                                        ) : (
                                                            <div className="relative h-16 w-11 flex-shrink-0 rounded overflow-hidden bg-muted">
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
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                                                            <p className="text-xs text-muted-foreground">{book.author}</p>
                                                            {book.pageCount && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {book.pageCount} sayfa
                                                                </p>
                                                            )}

                                                            {/* Bonus kitap durum ve eşleştirme */}
                                                            <div className="flex items-center gap-1 mt-1">
                                                                {book.userStatus === "COMPLETED" ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                ) : book.userStatus !== "LOCKED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 px-2"
                                                                        onClick={() => handleOpenLinkDialog(book.id, book.title, book.linkedBookId)}
                                                                    >
                                                                        {book.linkedBookId ? (
                                                                            <Link2 className="h-3 w-3 text-green-600" />
                                                                        ) : (
                                                                            <>
                                                                                <Link2Off className="h-3 w-3 mr-1" />
                                                                                <span className="text-xs">Eşleştir</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
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

            {/* Manuel Eşleştirme Dialog */}
            <Dialog open={linkDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setLinkDialog({ open: false, challengeBookId: "", challengeBookTitle: "", currentLinkedBookId: null })
                    setLinkSearchQuery("")
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Kitap Eşleştir
                        </DialogTitle>
                        <DialogDescription>
                            "{linkDialog.challengeBookTitle}" kitabını kütüphanenizdeki bir kitapla eşleştirin.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Arama */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kitap ara..."
                            value={linkSearchQuery}
                            onChange={(e) => setLinkSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Kitap Listesi */}
                    <ScrollArea className="h-[300px] pr-4">
                        {isLoadingBooks ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUserBooks.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                {linkSearchQuery ? "Eşleşen kitap bulunamadı" : "Kütüphanenizde kitap yok"}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUserBooks.map(book => (
                                    <button
                                        key={book.id}
                                        onClick={() => handleLinkBook(book.id)}
                                        disabled={isLinking}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
                                            "hover:bg-accent hover:border-primary/50",
                                            linkDialog.currentLinkedBookId === book.id && "border-green-500 bg-green-50 dark:bg-green-950/20"
                                        )}
                                    >
                                        <div className="relative h-12 w-8 flex-shrink-0 rounded overflow-hidden bg-muted">
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
                                            <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                                            <p className="text-xs text-muted-foreground">{book.author}</p>
                                        </div>
                                        {linkDialog.currentLinkedBookId === book.id && (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Actions */}
                    <div className="flex justify-between">
                        {linkDialog.currentLinkedBookId && (
                            <Button
                                variant="outline"
                                onClick={() => handleLinkBook(null)}
                                disabled={isLinking}
                                className="text-destructive hover:text-destructive"
                            >
                                <Link2Off className="h-4 w-4 mr-2" />
                                Bağlantıyı Kaldır
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setLinkDialog({ open: false, challengeBookId: "", challengeBookTitle: "", currentLinkedBookId: null })}
                            className="ml-auto"
                        >
                            İptal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
