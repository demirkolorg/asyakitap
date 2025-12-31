"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Target,
    Plus,
    Loader2,
    Calendar,
    Trophy,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Flag,
    Pencil,
    CalendarPlus,
    Trash2
} from "lucide-react"
import { toast } from "sonner"
import { createChallenge, updateChallenge, createChallengeMonth, deleteChallengeMonth } from "@/actions/challenge"
import type { ChallengeTimeline, ChallengeMonth } from "@/actions/challenge"
import { cn } from "@/lib/utils"

interface ChallengesPageClientProps {
    timeline: ChallengeTimeline | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allChallenges: any[]
}

export function ChallengesPageClient({ timeline, allChallenges }: ChallengesPageClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Mevcut yılın hedefini varsayılan olarak seç
    const currentYear = new Date().getFullYear()
    const currentYearChallenge = allChallenges.find(c => c.year === currentYear)
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
        currentYearChallenge?.id || (allChallenges.length > 0 ? allChallenges[0].id : null)
    )
    const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null)
    const [createDialog, setCreateDialog] = useState<{
        open: boolean
        year: string
        name: string
        description: string
    }>({ open: false, year: new Date().getFullYear().toString(), name: "", description: "" })

    // Edit challenge dialog state
    const [editDialog, setEditDialog] = useState<{
        open: boolean
        id: string
        name: string
        description: string
    }>({ open: false, id: "", name: "", description: "" })

    // Create month dialog state
    const [monthDialog, setMonthDialog] = useState<{
        open: boolean
        challengeId: string
        monthNumber: string
        theme: string
        themeIcon: string
    }>({ open: false, challengeId: "", monthNumber: "", theme: "", themeIcon: "" })

    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]

    // Seçili challenge'ı bul
    const selectedChallenge = timeline?.challenges.find(c => c.id === selectedChallengeId) ||
        (timeline?.challenges[0] || null)

    // Seçili ay (varsayılan olarak şu anki ay veya ilk ay)
    const currentMonthNumber = new Date().getMonth() + 1
    const selectedMonth = selectedChallenge?.months.find(m =>
        selectedMonthId ? m.id === selectedMonthId : m.monthNumber === currentMonthNumber
    ) || selectedChallenge?.months[0]

    const handleCreateSubmit = async () => {
        const year = parseInt(createDialog.year)
        if (isNaN(year) || year < 2020 || year > 2100) {
            toast.error("Geçerli bir yıl girin")
            return
        }
        if (!createDialog.name.trim()) {
            toast.error("Hedef adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createChallenge({
                year,
                name: createDialog.name,
                description: createDialog.description || undefined
            })
            if (result.success) {
                toast.success("Okuma hedefi oluşturuldu")
                setCreateDialog({ open: false, year: "", name: "", description: "" })
                router.push(`/challenges/${year}`)
            } else {
                toast.error(result.error || "Hedef oluşturulamadı")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Edit challenge handler
    const handleEditSubmit = async () => {
        if (!editDialog.name.trim()) {
            toast.error("Hedef adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await updateChallenge(editDialog.id, {
                name: editDialog.name,
                description: editDialog.description || undefined
            })
            if (result.success) {
                toast.success("Hedef güncellendi")
                setEditDialog({ open: false, id: "", name: "", description: "" })
                router.refresh()
            } else {
                toast.error(result.error || "Hedef güncellenemedi")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Create month handler
    const handleMonthSubmit = async () => {
        const monthNum = parseInt(monthDialog.monthNumber)
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            toast.error("Geçerli bir ay seçin")
            return
        }
        if (!monthDialog.theme.trim()) {
            toast.error("Tema gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createChallengeMonth({
                challengeId: monthDialog.challengeId,
                monthNumber: monthNum,
                monthName: monthNames[monthNum - 1],
                theme: monthDialog.theme,
                themeIcon: monthDialog.themeIcon || undefined
            })
            if (result.success) {
                toast.success("Ay hedefi eklendi")
                setMonthDialog({ open: false, challengeId: "", monthNumber: "", theme: "", themeIcon: "" })
                router.refresh()
            } else {
                toast.error(result.error || "Ay eklenemedi")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Delete month handler
    const handleDeleteMonth = async (monthId: string, monthName: string) => {
        if (!confirm(`"${monthName}" ayını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        setIsLoading(true)
        try {
            const result = await deleteChallengeMonth(monthId)
            if (result.success) {
                toast.success("Ay silindi")
                router.refresh()
            } else {
                toast.error(result.error || "Ay silinemedi")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Empty state
    if (allChallenges.length === 0) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Yıllık Okuma Hedefleri</h1>
                        <p className="text-muted-foreground mt-1">
                            Okuma yolculuğunu planla, takip et ve hedeflerine ulaş.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateDialog({
                            open: true,
                            year: new Date().getFullYear().toString(),
                            name: `${new Date().getFullYear()} Okuma Hedefi`,
                            description: ""
                        })}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Hedef Ekle
                    </Button>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma hedefi eklenmemiş</p>
                    <p className="text-sm text-muted-foreground mb-4">İlk hedefinizi oluşturarak başlayın</p>
                    <Button
                        onClick={() => setCreateDialog({
                            open: true,
                            year: new Date().getFullYear().toString(),
                            name: `${new Date().getFullYear()} Okuma Hedefi`,
                            description: ""
                        })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Hedef Oluştur
                    </Button>
                </div>

                {/* Create Dialog */}
                <CreateChallengeDialog
                    createDialog={createDialog}
                    setCreateDialog={setCreateDialog}
                    handleCreateSubmit={handleCreateSubmit}
                    isLoading={isLoading}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Yıllık Okuma Hedefleri</h1>
                    <p className="text-muted-foreground mt-1">
                        Okuma yolculuğunu planla, takip et ve hedeflerine ulaş.
                    </p>
                </div>
                <Button
                    onClick={() => setCreateDialog({
                        open: true,
                        year: (new Date().getFullYear() + 1).toString(),
                        name: `${new Date().getFullYear() + 1} Okuma Hedefi`,
                        description: ""
                    })}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Hedef Ekle
                </Button>
            </div>

            {/* Hedefler Section */}
            <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Flag className="h-5 w-5 text-primary" />
                    Hedeflerin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allChallenges.map((challenge) => {
                        const isSelected = selectedChallengeId === challenge.id
                        const challengeDetail = timeline?.challenges.find(c => c.id === challenge.id)
                        const totalBooks = (Array.isArray(challenge.months) ? challenge.months : [])
                            .reduce((sum: number, m: { _count: { books: number } }) => sum + m._count.books, 0)

                        return (
                            <div
                                key={challenge.id}
                                onClick={() => setSelectedChallengeId(challenge.id)}
                                className={cn(
                                    "relative flex flex-col gap-4 rounded-2xl p-5 cursor-pointer transition-all",
                                    isSelected
                                        ? "bg-primary/10 border-2 border-primary shadow-[0_0_20px_rgba(var(--primary)/0.15)]"
                                        : "bg-card border border-border hover:border-primary/50"
                                )}
                            >
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    {isSelected && (
                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Seçili
                                        </span>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditDialog({
                                                open: true,
                                                id: challenge.id,
                                                name: challenge.name,
                                                description: challenge.description || ""
                                            })
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2.5 rounded-lg",
                                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{challenge.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {challenge.description || "Genel Okuma"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-background p-3 rounded-xl border">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                                            Ay Sayısı
                                        </span>
                                        <span className="text-xl font-bold">{challenge._count.months}</span>
                                    </div>
                                    <div className="bg-background p-3 rounded-xl border">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                                            Kitap
                                        </span>
                                        <span className="text-xl font-bold">{totalBooks}</span>
                                    </div>
                                </div>

                                {/* Progress bar if available */}
                                {challengeDetail?.totalProgress && (
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground">İlerleme</span>
                                            <span className="font-medium">
                                                {challengeDetail.totalProgress.completedBooks}/{challengeDetail.totalProgress.totalBooks}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${challengeDetail.totalProgress.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Divider */}
            <div className="w-full h-px bg-border" />

            {/* Aylık Temalar Section */}
            {selectedChallenge && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            {selectedChallenge.year} Detayları: Aylık Temalar
                        </h2>
                        <div className="flex gap-2">
                            {selectedChallenge.months.length > 0 && (
                                <>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => {
                                            const currentIndex = selectedChallenge.months.findIndex(m => m.id === selectedMonth?.id)
                                            if (currentIndex > 0) {
                                                setSelectedMonthId(selectedChallenge.months[currentIndex - 1].id)
                                            }
                                        }}
                                        disabled={!selectedMonth || selectedChallenge.months.findIndex(m => m.id === selectedMonth.id) === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => {
                                            const currentIndex = selectedChallenge.months.findIndex(m => m.id === selectedMonth?.id)
                                            if (currentIndex < selectedChallenge.months.length - 1) {
                                                setSelectedMonthId(selectedChallenge.months[currentIndex + 1].id)
                                            }
                                        }}
                                        disabled={!selectedMonth || selectedChallenge.months.findIndex(m => m.id === selectedMonth.id) === selectedChallenge.months.length - 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => {
                                    // Mevcut ayları bul
                                    const existingMonths = selectedChallenge.months.map(m => m.monthNumber)
                                    // İlk boş ayı bul
                                    let nextMonth = ""
                                    for (let i = 1; i <= 12; i++) {
                                        if (!existingMonths.includes(i)) {
                                            nextMonth = i.toString()
                                            break
                                        }
                                    }
                                    setMonthDialog({
                                        open: true,
                                        challengeId: selectedChallenge.id,
                                        monthNumber: nextMonth,
                                        theme: "",
                                        themeIcon: ""
                                    })
                                }}
                            >
                                <CalendarPlus className="h-4 w-4" />
                                Ay Ekle
                            </Button>
                        </div>
                    </div>

                    {/* Month Cards Strip */}
                    {selectedChallenge.months.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl bg-muted/30">
                            <CalendarPlus className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground mb-1">Henüz ay hedefi eklenmemiş</p>
                            <p className="text-sm text-muted-foreground">Yukarıdaki "Ay Ekle" butonuyla başlayın</p>
                        </div>
                    ) : (
                    <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
                        {selectedChallenge.months.map((month) => {
                            const isCurrentMonth = month.monthNumber === currentMonthNumber
                            const isSelectedMonth = selectedMonth?.id === month.id
                            const mainBooks = month.books.filter(b => b.role === "MAIN")
                            const completedMain = mainBooks.filter(b => b.book.status === "COMPLETED").length

                            return (
                                <div
                                    key={month.id}
                                    onClick={() => setSelectedMonthId(month.id)}
                                    className={cn(
                                        "min-w-[260px] snap-center flex flex-col justify-between p-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden group",
                                        isSelectedMonth
                                            ? "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary"
                                            : "bg-card border hover:border-primary/50"
                                    )}
                                >
                                    {/* Background Icon */}
                                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <span className="text-8xl">{month.themeIcon}</span>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={cn(
                                                "text-xl font-bold",
                                                isSelectedMonth ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                                            )}>
                                                {month.monthName}
                                            </h4>
                                            <div className="flex items-center gap-1">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    isSelectedMonth ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"
                                                )}>
                                                    <span className="text-lg">{month.themeIcon}</span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteMonth(month.id, month.monthName)
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Tema</p>
                                        <p className={cn(
                                            "font-semibold mb-4",
                                            isSelectedMonth ? "text-primary" : "text-foreground/90"
                                        )}>
                                            {month.theme}
                                        </p>
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-muted-foreground">İlerleme</span>
                                            <span className="font-medium">{completedMain} / {mainBooks.length} Kitap</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    isSelectedMonth ? "bg-primary shadow-[0_0_10px_rgba(var(--primary)/0.5)]" : "bg-primary"
                                                )}
                                                style={{ width: `${mainBooks.length > 0 ? (completedMain / mainBooks.length) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    )}
                </section>
            )}

            {/* Kitap Listesi Section */}
            {selectedMonth && (
                <MonthBookList
                    month={selectedMonth}
                    challengeYear={selectedChallenge?.year || new Date().getFullYear()}
                />
            )}

            {/* Create Dialog */}
            <CreateChallengeDialog
                createDialog={createDialog}
                setCreateDialog={setCreateDialog}
                handleCreateSubmit={handleCreateSubmit}
                isLoading={isLoading}
            />

            {/* Edit Dialog */}
            <EditChallengeDialog
                editDialog={editDialog}
                setEditDialog={setEditDialog}
                handleEditSubmit={handleEditSubmit}
                isLoading={isLoading}
            />

            {/* Create Month Dialog */}
            <CreateMonthDialog
                monthDialog={monthDialog}
                setMonthDialog={setMonthDialog}
                handleMonthSubmit={handleMonthSubmit}
                isLoading={isLoading}
                monthNames={monthNames}
            />
        </div>
    )
}

// Month Book List Component
function MonthBookList({ month, challengeYear }: { month: ChallengeMonth; challengeYear: number }) {
    const mainBooks = month.books.filter(b => b.role === "MAIN")
    const bonusBooks = month.books.filter(b => b.role === "BONUS")

    // Tüm ana kitapların tamamlanıp tamamlanmadığını kontrol et
    const isAllMainCompleted = mainBooks.length > 0 &&
        mainBooks.every(b => b.book.status === "COMPLETED")

    return (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold">{month.monthName} Kitap Listesi</h3>
                <div className="h-px bg-border flex-1" />
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                    {month.books.length} Kitap
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Main Books */}
                {mainBooks.map((book) => (
                    <BookCard key={book.id} book={book} type="main" />
                ))}

                {/* Bonus Books */}
                {bonusBooks.map((book) => (
                    <BookCard
                        key={book.id}
                        book={book}
                        type="bonus"
                        isLocked={!isAllMainCompleted}
                    />
                ))}
            </div>

            {/* Add Book Button */}
            <Link
                href={`/challenges/${challengeYear}`}
                className="w-full mt-4 py-4 rounded-xl border border-dashed text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50 transition-all flex items-center justify-center gap-2 group"
            >
                <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Bu Aya Kitap Ekle</span>
            </Link>
        </section>
    )
}

// Book Card Component
function BookCard({
    book,
    type,
    isLocked = false
}: {
    book: ChallengeMonth["books"][0]
    type: "main" | "bonus"
    isLocked?: boolean
}) {
    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"

    return (
        <Link
            href={`/book/${book.book.id}`}
            className={cn(
                "flex flex-col rounded-xl bg-card border overflow-hidden transition-all group",
                isCompleted && "border-green-500/30",
                !isCompleted && !isLocked && "hover:border-primary/50",
                isLocked && "opacity-60"
            )}
        >
            <div className="flex p-3 gap-3">
                {/* Book Cover */}
                <div className="w-20 shrink-0 shadow-lg rounded-md overflow-hidden aspect-[2/3] relative">
                    {book.book.coverUrl ? (
                        <Image
                            src={book.book.coverUrl}
                            alt={book.book.title}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-500 group-hover:scale-110",
                                isLocked && "grayscale"
                            )}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}

                    {/* Completed Overlay */}
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircle2 className="h-8 w-8 text-green-500 drop-shadow-lg" />
                        </div>
                    )}
                </div>

                {/* Book Info */}
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex gap-1.5 mb-1.5 flex-wrap">
                        <span className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                            type === "main"
                                ? "bg-primary/20 text-primary ring-primary/30"
                                : "bg-purple-400/10 text-purple-400 ring-purple-400/20"
                        )}>
                            {type === "main" ? "Ana Hedef" : "Bonus"}
                        </span>
                        {isCompleted && (
                            <span className="inline-flex items-center rounded-md bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-500 ring-1 ring-inset ring-green-500/30">
                                Tamamlandı
                            </span>
                        )}
                        {isReading && (
                            <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">
                                Okunuyor
                            </span>
                        )}
                        {!isCompleted && !isReading && !isLocked && (
                            <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                                Başlanmadı
                            </span>
                        )}
                    </div>

                    <h4 className="font-bold text-sm line-clamp-2 mb-0.5 group-hover:text-primary transition-colors">
                        {book.book.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                        {book.book.author?.name || "Bilinmeyen Yazar"}
                    </p>

                    <div className="mt-auto flex items-center text-[10px] text-muted-foreground gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{book.book.pageCount || "-"} Sayfa</span>
                    </div>
                </div>
            </div>

            {/* Reason */}
            {book.reason && (
                <div className="bg-muted/50 px-3 py-2 border-t">
                    <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                        "{book.reason}"
                    </p>
                </div>
            )}

            {/* Progress Bar */}
            <div className="h-1 w-full bg-muted">
                <div
                    className={cn(
                        "h-full transition-all",
                        isCompleted ? "bg-green-500 w-full" :
                            isReading ? "bg-yellow-500 w-1/2" :
                                "bg-transparent w-0"
                    )}
                />
            </div>
        </Link>
    )
}

// Create Challenge Dialog Component
function CreateChallengeDialog({
    createDialog,
    setCreateDialog,
    handleCreateSubmit,
    isLoading
}: {
    createDialog: { open: boolean; year: string; name: string; description: string }
    setCreateDialog: (dialog: { open: boolean; year: string; name: string; description: string }) => void
    handleCreateSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={createDialog.open} onOpenChange={(open) => !open && setCreateDialog({ ...createDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Okuma Hedefi</DialogTitle>
                    <DialogDescription>
                        Yeni bir yıllık okuma hedefi oluşturun
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="challenge-year">Yıl</Label>
                        <Input
                            id="challenge-year"
                            type="number"
                            placeholder="2026"
                            value={createDialog.year}
                            onChange={(e) => setCreateDialog({ ...createDialog, year: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge-name">Hedef Adı</Label>
                        <Input
                            id="challenge-name"
                            placeholder="Örn: 2026 Okuma Hedefi"
                            value={createDialog.name}
                            onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge-description">Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="challenge-description"
                            placeholder="Bu hedef hakkında kısa bir açıklama..."
                            value={createDialog.description}
                            onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialog({ ...createDialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={handleCreateSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Oluştur
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Edit Challenge Dialog Component
function EditChallengeDialog({
    editDialog,
    setEditDialog,
    handleEditSubmit,
    isLoading
}: {
    editDialog: { open: boolean; id: string; name: string; description: string }
    setEditDialog: (dialog: { open: boolean; id: string; name: string; description: string }) => void
    handleEditSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ ...editDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hedefi Düzenle</DialogTitle>
                    <DialogDescription>
                        Yıllık okuma hedefini düzenleyin
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Hedef Adı</Label>
                        <Input
                            id="edit-name"
                            placeholder="Örn: 2025 Okuma Hedefi"
                            value={editDialog.name}
                            onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Bu hedef hakkında kısa bir açıklama..."
                            value={editDialog.description}
                            onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialog({ ...editDialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={handleEditSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Create Month Dialog Component
function CreateMonthDialog({
    monthDialog,
    setMonthDialog,
    handleMonthSubmit,
    isLoading,
    monthNames
}: {
    monthDialog: { open: boolean; challengeId: string; monthNumber: string; theme: string; themeIcon: string }
    setMonthDialog: (dialog: { open: boolean; challengeId: string; monthNumber: string; theme: string; themeIcon: string }) => void
    handleMonthSubmit: () => void
    isLoading: boolean
    monthNames: string[]
}) {
    return (
        <Dialog open={monthDialog.open} onOpenChange={(open) => !open && setMonthDialog({ ...monthDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ay Hedefi Ekle</DialogTitle>
                    <DialogDescription>
                        Bu yıla yeni bir ay hedefi ekleyin
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="month-number">Ay</Label>
                        <Select
                            value={monthDialog.monthNumber}
                            onValueChange={(value) => setMonthDialog({ ...monthDialog, monthNumber: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Ay seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthNames.map((name, index) => (
                                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="month-theme">Tema</Label>
                        <Input
                            id="month-theme"
                            placeholder="Örn: Bilim Kurgu, Felsefe, Tarih..."
                            value={monthDialog.theme}
                            onChange={(e) => setMonthDialog({ ...monthDialog, theme: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="month-icon">Tema İkonu (Emoji)</Label>
                        <Input
                            id="month-icon"
                            placeholder="Örn: 🚀, 📚, 🌍..."
                            value={monthDialog.themeIcon}
                            onChange={(e) => setMonthDialog({ ...monthDialog, themeIcon: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setMonthDialog({ ...monthDialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={handleMonthSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Ekle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
