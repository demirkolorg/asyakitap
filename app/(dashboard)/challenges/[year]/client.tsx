"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
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
    DialogFooter,
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
    Play,
    Quote,
    Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    joinChallenge,
    markChallengeBookAsRead,
    updateChallengeBookStatus,
    updateTakeaway,
    type ChallengeOverview
} from "@/actions/challenge"
import { toast } from "sonner"
import { ChallengeBookStatus } from "@prisma/client"

type ChallengePageClientProps = {
    challenge: ChallengeOverview
}

export function ChallengePageClient({ challenge: initialChallenge }: ChallengePageClientProps) {
    const [challenge, setChallenge] = useState(initialChallenge)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [takeawayDialog, setTakeawayDialog] = useState<{
        open: boolean
        bookId: string
        bookTitle: string
        currentTakeaway: string
    }>({ open: false, bookId: "", bookTitle: "", currentTakeaway: "" })
    const [takeawayInput, setTakeawayInput] = useState("")

    const currentMonthNumber = new Date().getMonth() + 1

    const handleStartReading = async (bookId: string) => {
        setIsUpdating(bookId)
        const result = await updateChallengeBookStatus(bookId, "IN_PROGRESS")
        if (result.success) {
            toast.success("Okumaya başladınız!")
            // Local state güncelle
            setChallenge(prev => ({
                ...prev,
                months: prev.months.map(month => ({
                    ...month,
                    books: month.books.map(book =>
                        book.id === bookId ? { ...book, userStatus: "IN_PROGRESS" as ChallengeBookStatus } : book
                    )
                }))
            }))
        } else {
            toast.error(result.error)
        }
        setIsUpdating(null)
    }

    const handleComplete = async (bookId: string, monthId: string) => {
        setIsUpdating(bookId)
        const result = await markChallengeBookAsRead(bookId)
        if (result.success) {
            toast.success(result.message)

            // Local state güncelle
            setChallenge(prev => ({
                ...prev,
                months: prev.months.map(month => {
                    if (month.id !== monthId) return month

                    const updatedBooks = month.books.map(book => {
                        if (book.id === bookId) {
                            return { ...book, userStatus: "COMPLETED" as ChallengeBookStatus, completedAt: new Date() }
                        }
                        // Eğer MAIN tamamlandıysa BONUS'ları aç
                        if (result.wasMain && book.role === "BONUS" && book.userStatus === "LOCKED") {
                            return { ...book, userStatus: "NOT_STARTED" as ChallengeBookStatus }
                        }
                        return book
                    })

                    const completedCount = updatedBooks.filter(b => b.userStatus === "COMPLETED").length
                    const mainCompleted = updatedBooks.some(b => b.role === "MAIN" && b.userStatus === "COMPLETED")

                    return {
                        ...month,
                        books: updatedBooks,
                        isMainCompleted: mainCompleted,
                        progress: {
                            ...month.progress,
                            completed: completedCount,
                            percentage: Math.round((completedCount / month.progress.total) * 100)
                        }
                    }
                })
            }))

            // Takeaway dialog aç
            const book = challenge.months.flatMap(m => m.books).find(b => b.id === bookId)
            if (book) {
                setTakeawayDialog({
                    open: true,
                    bookId,
                    bookTitle: book.title,
                    currentTakeaway: ""
                })
                setTakeawayInput("")
            }
        } else {
            toast.error(result.error)
        }
        setIsUpdating(null)
    }

    const handleSaveTakeaway = async () => {
        if (!takeawayInput.trim()) {
            setTakeawayDialog({ ...takeawayDialog, open: false })
            return
        }

        const result = await updateTakeaway(takeawayDialog.bookId, takeawayInput)
        if (result.success) {
            toast.success("Notunuz kaydedildi!")
            setChallenge(prev => ({
                ...prev,
                months: prev.months.map(month => ({
                    ...month,
                    books: month.books.map(book =>
                        book.id === takeawayDialog.bookId
                            ? { ...book, takeaway: takeawayInput }
                            : book
                    )
                }))
            }))
        }
        setTakeawayDialog({ ...takeawayDialog, open: false })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Target className="h-8 w-8 text-primary" />
                        {challenge.name}
                    </h1>
                    {challenge.description && (
                        <p className="text-muted-foreground mt-1">{challenge.description}</p>
                    )}
                </div>

                {/* Genel İstatistikler */}
                <Card className="md:min-w-[280px]">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Toplam İlerleme</span>
                                    <span className="font-bold">
                                        {challenge.totalProgress.completedBooks}/{challenge.totalProgress.totalBooks}
                                    </span>
                                </div>
                                <Progress value={challenge.totalProgress.percentage} className="h-2" />
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Ana: {challenge.totalProgress.mainCompleted}/12</span>
                                    <span>Bonus: {challenge.totalProgress.bonusCompleted}/24</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Aylar Accordion */}
            <Accordion
                type="single"
                collapsible
                defaultValue={`month-${currentMonthNumber}`}
                className="space-y-3"
            >
                {challenge.months.map((month) => {
                    const isCurrentMonth = month.monthNumber === currentMonthNumber
                    const isPastMonth = month.monthNumber < currentMonthNumber
                    const mainBook = month.books.find(b => b.role === "MAIN")
                    const bonusBooks = month.books.filter(b => b.role === "BONUS")

                    return (
                        <AccordionItem
                            key={month.id}
                            value={`month-${month.monthNumber}`}
                            className={cn(
                                "border rounded-xl overflow-hidden",
                                isCurrentMonth && "border-primary/50 shadow-md",
                                month.progress.percentage === 100 && "border-green-500/50"
                            )}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-4 w-full">
                                    {/* Ay ikonu ve ismi */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{month.themeIcon}</span>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{month.monthName}</span>
                                                {isCurrentMonth && (
                                                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                                        BU AY
                                                    </span>
                                                )}
                                                {month.progress.percentage === 100 && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{month.theme}</span>
                                        </div>
                                    </div>

                                    {/* İlerleme */}
                                    <div className="ml-auto mr-4 flex items-center gap-3">
                                        <Progress value={month.progress.percentage} className="w-24 h-2" />
                                        <span className="text-sm text-muted-foreground w-12">
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
                                            <div className="absolute -top-2 left-3 z-10">
                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    ANA HEDEF
                                                </span>
                                            </div>
                                            <Card className={cn(
                                                "border-2",
                                                mainBook.userStatus === "COMPLETED"
                                                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                                                    : "border-primary/30"
                                            )}>
                                                <CardContent className="p-4">
                                                    <div className="flex gap-4">
                                                        {/* Kapak */}
                                                        <div className="relative h-32 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-md">
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

                                                        {/* Bilgi */}
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-lg">{mainBook.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{mainBook.author}</p>
                                                            {mainBook.pageCount && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {mainBook.pageCount} sayfa
                                                                </p>
                                                            )}

                                                            {mainBook.reason && (
                                                                <p className="text-sm mt-2 text-muted-foreground italic">
                                                                    "{mainBook.reason}"
                                                                </p>
                                                            )}

                                                            {/* Takeaway */}
                                                            {mainBook.takeaway && (
                                                                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                                    <div className="flex items-start gap-2">
                                                                        <Quote className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                        <p className="text-sm">{mainBook.takeaway}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Aksiyon */}
                                                            <div className="mt-3 flex items-center gap-2">
                                                                {mainBook.userStatus === "NOT_STARTED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleStartReading(mainBook.id)}
                                                                        disabled={isUpdating === mainBook.id}
                                                                    >
                                                                        {isUpdating === mainBook.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <Play className="h-4 w-4 mr-1" />
                                                                                Okumaya Başla
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                {mainBook.userStatus === "IN_PROGRESS" && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleComplete(mainBook.id, month.id)}
                                                                        disabled={isUpdating === mainBook.id}
                                                                    >
                                                                        {isUpdating === mainBook.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                                Tamamladım
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                {mainBook.userStatus === "COMPLETED" && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                            Tamamlandı
                                                                        </span>
                                                                        {mainBook.completedAt && (
                                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                {new Date(mainBook.completedAt).toLocaleDateString("tr-TR")}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Bonus Kitaplar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm font-medium">Bonus Kitaplar</span>
                                            {!month.isMainCompleted && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    Ana kitabı tamamlayınca açılır
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3">
                                            {bonusBooks.map((book) => (
                                                <Card
                                                    key={book.id}
                                                    className={cn(
                                                        "relative transition-all",
                                                        book.userStatus === "LOCKED" && "opacity-60",
                                                        book.userStatus === "COMPLETED" && "border-green-500/50 bg-green-50/30 dark:bg-green-950/10"
                                                    )}
                                                >
                                                    {book.userStatus === "LOCKED" && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-10">
                                                            <Lock className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}

                                                    <CardContent className="p-3">
                                                        <div className="flex gap-3">
                                                            <div className="relative h-20 w-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                                {book.coverUrl ? (
                                                                    <Image
                                                                        src={book.coverUrl}
                                                                        alt={book.title}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-sm line-clamp-1">{book.title}</h4>
                                                                <p className="text-xs text-muted-foreground">{book.author}</p>

                                                                {book.takeaway && (
                                                                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400 line-clamp-2">
                                                                        "{book.takeaway}"
                                                                    </p>
                                                                )}

                                                                <div className="mt-2">
                                                                    {book.userStatus === "NOT_STARTED" && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 text-xs"
                                                                            onClick={() => handleStartReading(book.id)}
                                                                            disabled={isUpdating === book.id}
                                                                        >
                                                                            {isUpdating === book.id ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : (
                                                                                "Başla"
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                    {book.userStatus === "IN_PROGRESS" && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-7 text-xs"
                                                                            onClick={() => handleComplete(book.id, month.id)}
                                                                            disabled={isUpdating === book.id}
                                                                        >
                                                                            {isUpdating === book.id ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : (
                                                                                "Tamamla"
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                    {book.userStatus === "COMPLETED" && (
                                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            Tamamlandı
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>

            {/* Takeaway Dialog */}
            <Dialog open={takeawayDialog.open} onOpenChange={(open) => setTakeawayDialog({ ...takeawayDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Quote className="h-5 w-5 text-amber-500" />
                            Aklında Kalan
                        </DialogTitle>
                        <DialogDescription>
                            "{takeawayDialog.bookTitle}" kitabından aklında kalan tek bir cümle veya düşünce neydi?
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Bu kitaptan öğrendiğim en önemli şey..."
                        value={takeawayInput}
                        onChange={(e) => setTakeawayInput(e.target.value)}
                        maxLength={280}
                    />
                    <p className="text-xs text-muted-foreground text-right">{takeawayInput.length}/280</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTakeawayDialog({ ...takeawayDialog, open: false })}>
                            Atla
                        </Button>
                        <Button onClick={handleSaveTakeaway}>
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
