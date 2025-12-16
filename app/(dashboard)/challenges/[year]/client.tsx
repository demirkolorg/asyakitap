"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    Calendar,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Settings,
    Link as LinkIcon,
    Library,
    Book,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    joinChallenge,
    markChallengeBookAsRead,
    updateChallengeBookStatus,
    updateTakeaway,
    createChallengeMonth,
    updateChallengeMonth,
    deleteChallengeMonth,
    addBookFromKitapyurduToChallenge,
    addBookManuallyToChallenge,
    updateChallengeBook,
    removeBookFromChallenge,
    updateChallenge,
    deleteChallenge,
    type ChallengeOverview,
    type ChallengeBook as ChallengeBookType
} from "@/actions/challenge"
import { toast } from "sonner"
import { ChallengeBookStatus, ChallengeBookRole } from "@prisma/client"

type ChallengePageClientProps = {
    challenge: ChallengeOverview
}

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]

const MONTH_ICONS = ["❄️", "💕", "🌸", "🌷", "🌺", "☀️", "🌴", "🌻", "🍂", "🎃", "🍁", "🎄"]

export function ChallengePageClient({ challenge: initialChallenge }: ChallengePageClientProps) {
    const router = useRouter()
    const [challenge, setChallenge] = useState(initialChallenge)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Takeaway Dialog
    const [takeawayDialog, setTakeawayDialog] = useState<{
        open: boolean
        bookId: string
        bookTitle: string
        currentTakeaway: string
    }>({ open: false, bookId: "", bookTitle: "", currentTakeaway: "" })
    const [takeawayInput, setTakeawayInput] = useState("")

    // Month Dialog
    const [monthDialog, setMonthDialog] = useState<{
        open: boolean
        mode: "create" | "edit"
        monthId?: string
        monthNumber: number
        theme: string
        themeIcon: string
    }>({ open: false, mode: "create", monthNumber: 1, theme: "", themeIcon: "" })

    // Book Dialog
    const [bookDialog, setBookDialog] = useState<{
        open: boolean
        mode: "kitapyurdu" | "manual" | "edit"
        monthId: string
        bookId?: string
        kitapyurduUrl: string
        title: string
        author: string
        pageCount: string
        coverUrl: string
        publisher: string
        role: ChallengeBookRole
        reason: string
        inLibrary: boolean
    }>({
        open: false,
        mode: "kitapyurdu",
        monthId: "",
        kitapyurduUrl: "",
        title: "",
        author: "",
        pageCount: "",
        coverUrl: "",
        publisher: "",
        role: "BONUS",
        reason: "",
        inLibrary: false
    })

    // Delete Dialogs
    const [deleteMonthDialog, setDeleteMonthDialog] = useState<{
        open: boolean
        monthId: string
        monthName: string
    }>({ open: false, monthId: "", monthName: "" })

    const [deleteBookDialog, setDeleteBookDialog] = useState<{
        open: boolean
        bookId: string
        bookTitle: string
    }>({ open: false, bookId: "", bookTitle: "" })

    // Challenge Settings Dialog
    const [settingsDialog, setSettingsDialog] = useState<{
        open: boolean
        name: string
        description: string
    }>({ open: false, name: "", description: "" })

    // Delete Challenge Dialog
    const [deleteChallengeDialog, setDeleteChallengeDialog] = useState(false)

    const currentMonthNumber = new Date().getMonth() + 1

    // ==========================================
    // User Progress Handlers
    // ==========================================

    const handleStartReading = async (bookId: string) => {
        setIsUpdating(bookId)
        const result = await updateChallengeBookStatus(bookId, "IN_PROGRESS")
        if (result.success) {
            toast.success("Okumaya başladınız!")
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

            setChallenge(prev => ({
                ...prev,
                months: prev.months.map(month => {
                    if (month.id !== monthId) return month

                    const updatedBooks = month.books.map(book => {
                        if (book.id === bookId) {
                            return { ...book, userStatus: "COMPLETED" as ChallengeBookStatus, completedAt: new Date() }
                        }
                        if (result.wasMain && book.role === "BONUS" && book.userStatus === "LOCKED") {
                            return { ...book, userStatus: "NOT_STARTED" as ChallengeBookStatus }
                        }
                        return book
                    })

                    const completedCount = updatedBooks.filter(b => b.userStatus === "COMPLETED").length
                    const mainCompleted = updatedBooks.some(b => b.role === "MAIN" && b.userStatus === "COMPLETED")
                    const total = month.progress?.total || updatedBooks.length

                    return {
                        ...month,
                        books: updatedBooks,
                        isMainCompleted: mainCompleted,
                        progress: {
                            total,
                            completed: completedCount,
                            percentage: Math.round((completedCount / total) * 100)
                        }
                    }
                })
            }))

            const book = challenge.months.flatMap(m => m.books).find(b => b.id === bookId)
            if (book) {
                setTakeawayDialog({
                    open: true,
                    bookId,
                    bookTitle: book.book.title,
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

    // ==========================================
    // Month CRUD Handlers
    // ==========================================

    const handleCreateMonth = () => {
        const existingMonths = challenge.months.map(m => m.monthNumber)
        const nextMonth = Array.from({ length: 12 }, (_, i) => i + 1).find(n => !existingMonths.includes(n)) || 1

        setMonthDialog({
            open: true,
            mode: "create",
            monthNumber: nextMonth,
            theme: "",
            themeIcon: MONTH_ICONS[nextMonth - 1]
        })
    }

    const handleEditMonth = (month: { id: string; monthNumber: number; theme: string; themeIcon: string | null }) => {
        setMonthDialog({
            open: true,
            mode: "edit",
            monthId: month.id,
            monthNumber: month.monthNumber,
            theme: month.theme,
            themeIcon: month.themeIcon || ""
        })
    }

    const handleMonthSubmit = async () => {
        setIsLoading(true)

        if (monthDialog.mode === "create") {
            const result = await createChallengeMonth({
                challengeId: challenge.id,
                monthNumber: monthDialog.monthNumber,
                monthName: MONTH_NAMES[monthDialog.monthNumber - 1],
                theme: monthDialog.theme || `${MONTH_NAMES[monthDialog.monthNumber - 1]} Teması`,
                themeIcon: monthDialog.themeIcon || undefined
            })

            if (result.success) {
                toast.success("Ay eklendi")
                router.refresh()
            } else {
                toast.error(result.error || "Ay eklenemedi")
            }
        } else {
            const result = await updateChallengeMonth(monthDialog.monthId!, {
                theme: monthDialog.theme,
                themeIcon: monthDialog.themeIcon || undefined
            })

            if (result.success) {
                toast.success("Ay güncellendi")
                setChallenge(prev => ({
                    ...prev,
                    months: prev.months.map(m =>
                        m.id === monthDialog.monthId
                            ? { ...m, theme: monthDialog.theme, themeIcon: monthDialog.themeIcon }
                            : m
                    )
                }))
            } else {
                toast.error(result.error || "Ay güncellenemedi")
            }
        }

        setIsLoading(false)
        setMonthDialog({ ...monthDialog, open: false })
    }

    const handleDeleteMonth = async () => {
        setIsLoading(true)
        const result = await deleteChallengeMonth(deleteMonthDialog.monthId)

        if (result.success) {
            toast.success("Ay silindi")
            setChallenge(prev => ({
                ...prev,
                months: prev.months.filter(m => m.id !== deleteMonthDialog.monthId)
            }))
        } else {
            toast.error(result.error || "Ay silinemedi")
        }

        setIsLoading(false)
        setDeleteMonthDialog({ open: false, monthId: "", monthName: "" })
    }

    // ==========================================
    // Book CRUD Handlers
    // ==========================================

    const openBookDialog = (monthId: string, mode: "kitapyurdu" | "manual") => {
        setBookDialog({
            open: true,
            mode,
            monthId,
            kitapyurduUrl: "",
            title: "",
            author: "",
            pageCount: "",
            coverUrl: "",
            publisher: "",
            role: "BONUS",
            reason: "",
            inLibrary: false
        })
    }

    const openEditBookDialog = (book: ChallengeBookType, monthId: string) => {
        setBookDialog({
            open: true,
            mode: "edit",
            monthId,
            bookId: book.id,
            kitapyurduUrl: "",
            title: book.book.title,
            author: book.book.author?.name || "",
            pageCount: book.book.pageCount?.toString() || "",
            coverUrl: book.book.coverUrl || "",
            publisher: book.book.publisher?.name || "",
            role: book.role,
            reason: book.reason || "",
            inLibrary: book.book.inLibrary
        })
    }

    const handleBookSubmit = async () => {
        setIsLoading(true)

        if (bookDialog.mode === "kitapyurdu") {
            if (!bookDialog.kitapyurduUrl.includes("kitapyurdu.com")) {
                toast.error("Geçerli bir Kitapyurdu URL'si girin")
                setIsLoading(false)
                return
            }

            const result = await addBookFromKitapyurduToChallenge({
                monthId: bookDialog.monthId,
                kitapyurduUrl: bookDialog.kitapyurduUrl,
                role: bookDialog.role,
                reason: bookDialog.reason || undefined,
                inLibrary: bookDialog.inLibrary
            })

            if (result.success) {
                toast.success(`"${result.bookTitle}" eklendi`)
                router.refresh()
            } else {
                toast.error(result.error || "Kitap eklenemedi")
            }
        } else if (bookDialog.mode === "manual") {
            if (!bookDialog.title.trim() || !bookDialog.author.trim()) {
                toast.error("Kitap adı ve yazar gerekli")
                setIsLoading(false)
                return
            }

            const result = await addBookManuallyToChallenge({
                monthId: bookDialog.monthId,
                title: bookDialog.title,
                author: bookDialog.author,
                role: bookDialog.role,
                pageCount: bookDialog.pageCount ? parseInt(bookDialog.pageCount) : undefined,
                coverUrl: bookDialog.coverUrl || undefined,
                publisher: bookDialog.publisher || undefined,
                reason: bookDialog.reason || undefined,
                inLibrary: bookDialog.inLibrary
            })

            if (result.success) {
                toast.success("Kitap eklendi")
                router.refresh()
            } else {
                toast.error(result.error || "Kitap eklenemedi")
            }
        } else if (bookDialog.mode === "edit") {
            const result = await updateChallengeBook(bookDialog.bookId!, {
                role: bookDialog.role,
                reason: bookDialog.reason || undefined
            })

            if (result.success) {
                toast.success("Kitap güncellendi")
                setChallenge(prev => ({
                    ...prev,
                    months: prev.months.map(month => ({
                        ...month,
                        books: month.books.map(book =>
                            book.id === bookDialog.bookId
                                ? { ...book, role: bookDialog.role, reason: bookDialog.reason }
                                : book
                        )
                    }))
                }))
            } else {
                toast.error(result.error || "Kitap güncellenemedi")
            }
        }

        setIsLoading(false)
        setBookDialog({ ...bookDialog, open: false })
    }

    const handleDeleteBook = async () => {
        setIsLoading(true)
        const result = await removeBookFromChallenge(deleteBookDialog.bookId)

        if (result.success) {
            toast.success("Kitap kaldırıldı")
            setChallenge(prev => ({
                ...prev,
                months: prev.months.map(month => ({
                    ...month,
                    books: month.books.filter(b => b.id !== deleteBookDialog.bookId)
                }))
            }))
        } else {
            toast.error(result.error || "Kitap kaldırılamadı")
        }

        setIsLoading(false)
        setDeleteBookDialog({ open: false, bookId: "", bookTitle: "" })
    }

    // ==========================================
    // Challenge Settings Handlers
    // ==========================================

    const handleSettingsSubmit = async () => {
        setIsLoading(true)
        const result = await updateChallenge(challenge.id, {
            name: settingsDialog.name,
            description: settingsDialog.description || undefined
        })

        if (result.success) {
            toast.success("Hedef güncellendi")
            setChallenge(prev => ({
                ...prev,
                name: settingsDialog.name,
                description: settingsDialog.description
            }))
        } else {
            toast.error(result.error || "Hedef güncellenemedi")
        }

        setIsLoading(false)
        setSettingsDialog({ ...settingsDialog, open: false })
    }

    const handleDeleteChallenge = async () => {
        setIsLoading(true)
        const result = await deleteChallenge(challenge.id)

        if (result.success) {
            toast.success("Hedef silindi")
            router.push("/challenges")
        } else {
            toast.error(result.error || "Hedef silinemedi")
        }

        setIsLoading(false)
        setDeleteChallengeDialog(false)
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

                <div className="flex items-center gap-2">
                    {/* Add Month Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCreateMonth}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Ay Ekle
                    </Button>

                    {/* Settings Button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSettingsDialog({
                            open: true,
                            name: challenge.name,
                            description: challenge.description || ""
                        })}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Card */}
            <Card className="md:max-w-md">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Toplam İlerleme</span>
                                <span className="font-bold">
                                    {challenge.totalProgress?.completedBooks ?? 0}/{challenge.totalProgress?.totalBooks ?? 0}
                                </span>
                            </div>
                            <Progress value={challenge.totalProgress?.percentage ?? 0} className="h-2" />
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Ana: {challenge.totalProgress?.mainCompleted ?? 0}/12</span>
                                <span>Bonus: {challenge.totalProgress?.bonusCompleted ?? 0}/24</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Months Accordion */}
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
                                (month.progress?.percentage ?? 0) === 100 && "border-green-500/50"
                            )}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-4 w-full">
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
                                                {(month.progress?.percentage ?? 0) === 100 && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{month.theme}</span>
                                        </div>
                                    </div>

                                    <div className="ml-auto mr-4 flex items-center gap-3">
                                        <Progress value={month.progress?.percentage ?? 0} className="w-24 h-2" />
                                        <span className="text-sm text-muted-foreground w-12">
                                            {month.progress?.completed ?? 0}/{month.progress?.total ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-4 pb-4">
                                {/* Month Actions */}
                                <div className="flex items-center justify-end gap-2 mb-4 pt-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="outline" className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Kitap Ekle
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openBookDialog(month.id, "kitapyurdu")}>
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                Kitapyurdu'dan Ekle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openBookDialog(month.id, "manual")}>
                                                <Book className="h-4 w-4 mr-2" />
                                                Manuel Ekle
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditMonth(month)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Ayı Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeleteMonthDialog({
                                                    open: true,
                                                    monthId: month.id,
                                                    monthName: month.monthName
                                                })}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Ayı Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-4">
                                    {/* Main Book */}
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
                                                        <div className="relative h-32 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-md">
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

                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h3 className="font-bold text-lg">{mainBook.book.title}</h3>
                                                                    <p className="text-sm text-muted-foreground">{mainBook.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                                    {mainBook.book.pageCount && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {mainBook.book.pageCount} sayfa
                                                                        </p>
                                                                    )}
                                                                    {mainBook.book.inLibrary && (
                                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                                                                            <Library className="h-3 w-3" />
                                                                            Kütüphanemde
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-8 w-8">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => openEditBookDialog(mainBook, month.id)}>
                                                                            <Edit className="h-4 w-4 mr-2" />
                                                                            Düzenle
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onClick={() => setDeleteBookDialog({
                                                                                open: true,
                                                                                bookId: mainBook.id,
                                                                                bookTitle: mainBook.book.title
                                                                            })}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Kaldır
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            {mainBook.reason && (
                                                                <p className="text-sm mt-2 text-muted-foreground italic">
                                                                    "{mainBook.reason}"
                                                                </p>
                                                            )}

                                                            {mainBook.takeaway && (
                                                                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                                    <div className="flex items-start gap-2">
                                                                        <Quote className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                        <p className="text-sm">{mainBook.takeaway}</p>
                                                                    </div>
                                                                </div>
                                                            )}

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

                                    {/* Bonus Books */}
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
                                                                {book.book.coverUrl ? (
                                                                    <Image
                                                                        src={book.book.coverUrl}
                                                                        alt={book.book.title}
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
                                                                <div className="flex items-start justify-between">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4 className="font-semibold text-sm line-clamp-1">{book.book.title}</h4>
                                                                        <p className="text-xs text-muted-foreground">{book.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                                        {book.book.inLibrary && (
                                                                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                                                <Library className="h-3 w-3" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0">
                                                                                <MoreVertical className="h-3 w-3" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => openEditBookDialog(book, month.id)}>
                                                                                <Edit className="h-4 w-4 mr-2" />
                                                                                Düzenle
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="text-destructive"
                                                                                onClick={() => setDeleteBookDialog({
                                                                                    open: true,
                                                                                    bookId: book.id,
                                                                                    bookTitle: book.book.title
                                                                                })}
                                                                            >
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Kaldır
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

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

            {/* Empty State */}
            {challenge.months.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-xl bg-muted/40">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz ay eklenmemiş</p>
                    <p className="text-sm text-muted-foreground mb-4">İlk ayı ekleyerek başlayın</p>
                    <Button onClick={handleCreateMonth}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ay Ekle
                    </Button>
                </div>
            )}

            {/* ==================== DIALOGS ==================== */}

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

            {/* Month Dialog */}
            <Dialog open={monthDialog.open} onOpenChange={(open) => setMonthDialog({ ...monthDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {monthDialog.mode === "create" ? "Yeni Ay Ekle" : "Ayı Düzenle"}
                        </DialogTitle>
                        <DialogDescription>
                            {monthDialog.mode === "create"
                                ? "Challenge'a yeni bir ay ekleyin"
                                : "Ay bilgilerini güncelleyin"
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {monthDialog.mode === "create" && (
                            <div className="space-y-2">
                                <Label>Ay</Label>
                                <Select
                                    value={monthDialog.monthNumber.toString()}
                                    onValueChange={(v) => {
                                        const num = parseInt(v)
                                        setMonthDialog({
                                            ...monthDialog,
                                            monthNumber: num,
                                            themeIcon: MONTH_ICONS[num - 1]
                                        })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_NAMES.map((name, i) => (
                                            <SelectItem
                                                key={i}
                                                value={(i + 1).toString()}
                                                disabled={challenge.months.some(m => m.monthNumber === i + 1)}
                                            >
                                                {MONTH_ICONS[i]} {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="month-theme">Tema</Label>
                            <Input
                                id="month-theme"
                                placeholder="Örn: Bilim Kurgu Ayı"
                                value={monthDialog.theme}
                                onChange={(e) => setMonthDialog({ ...monthDialog, theme: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="month-icon">Tema İkonu (Emoji)</Label>
                            <Input
                                id="month-icon"
                                placeholder="🚀"
                                value={monthDialog.themeIcon}
                                onChange={(e) => setMonthDialog({ ...monthDialog, themeIcon: e.target.value })}
                                maxLength={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMonthDialog({ ...monthDialog, open: false })}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleMonthSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {monthDialog.mode === "create" ? "Ekle" : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Book Dialog */}
            <Dialog open={bookDialog.open} onOpenChange={(open) => setBookDialog({ ...bookDialog, open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {bookDialog.mode === "kitapyurdu" && "Kitapyurdu'dan Ekle"}
                            {bookDialog.mode === "manual" && "Manuel Kitap Ekle"}
                            {bookDialog.mode === "edit" && "Kitabı Düzenle"}
                        </DialogTitle>
                        <DialogDescription>
                            {bookDialog.mode === "kitapyurdu" && "Kitapyurdu URL'sini yapıştırın"}
                            {bookDialog.mode === "manual" && "Kitap bilgilerini girin"}
                            {bookDialog.mode === "edit" && "Kitap bilgilerini güncelleyin"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {bookDialog.mode === "kitapyurdu" && (
                            <div className="space-y-2">
                                <Label htmlFor="book-url">Kitapyurdu URL</Label>
                                <Input
                                    id="book-url"
                                    placeholder="https://www.kitapyurdu.com/kitap/..."
                                    value={bookDialog.kitapyurduUrl}
                                    onChange={(e) => setBookDialog({ ...bookDialog, kitapyurduUrl: e.target.value })}
                                />
                            </div>
                        )}

                        {bookDialog.mode === "manual" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="book-title">Kitap Adı *</Label>
                                    <Input
                                        id="book-title"
                                        value={bookDialog.title}
                                        onChange={(e) => setBookDialog({ ...bookDialog, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="book-author">Yazar *</Label>
                                    <Input
                                        id="book-author"
                                        value={bookDialog.author}
                                        onChange={(e) => setBookDialog({ ...bookDialog, author: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="book-pages">Sayfa Sayısı</Label>
                                        <Input
                                            id="book-pages"
                                            type="number"
                                            value={bookDialog.pageCount}
                                            onChange={(e) => setBookDialog({ ...bookDialog, pageCount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="book-publisher">Yayınevi</Label>
                                        <Input
                                            id="book-publisher"
                                            value={bookDialog.publisher}
                                            onChange={(e) => setBookDialog({ ...bookDialog, publisher: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="book-cover">Kapak URL</Label>
                                    <Input
                                        id="book-cover"
                                        placeholder="https://..."
                                        value={bookDialog.coverUrl}
                                        onChange={(e) => setBookDialog({ ...bookDialog, coverUrl: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {bookDialog.mode === "edit" && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="font-medium">{bookDialog.title}</p>
                                <p className="text-sm text-muted-foreground">{bookDialog.author}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <Select
                                value={bookDialog.role}
                                onValueChange={(v) => setBookDialog({ ...bookDialog, role: v as ChallengeBookRole })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAIN">Ana Hedef</SelectItem>
                                    <SelectItem value="BONUS">Bonus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="book-reason">Neden Bu Kitap?</Label>
                            <Textarea
                                id="book-reason"
                                placeholder="Bu kitabı seçme nedeniniz..."
                                value={bookDialog.reason}
                                onChange={(e) => setBookDialog({ ...bookDialog, reason: e.target.value })}
                                rows={2}
                            />
                        </div>

                        {bookDialog.mode !== "edit" && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="book-in-library"
                                    checked={bookDialog.inLibrary}
                                    onCheckedChange={(checked) => setBookDialog({ ...bookDialog, inLibrary: !!checked })}
                                />
                                <Label htmlFor="book-in-library" className="flex items-center gap-2 cursor-pointer">
                                    <Library className="h-4 w-4" />
                                    Kütüphanemde var
                                </Label>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBookDialog({ ...bookDialog, open: false })}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleBookSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {bookDialog.mode === "edit" ? "Kaydet" : "Ekle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Month Dialog */}
            <AlertDialog open={deleteMonthDialog.open} onOpenChange={(open) => setDeleteMonthDialog({ ...deleteMonthDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ayı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteMonthDialog.monthName}" ayını silmek istediğinize emin misiniz?
                            Bu işlem geri alınamaz ve aydaki tüm kitaplar da kaldırılacaktır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMonth}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Book Dialog */}
            <AlertDialog open={deleteBookDialog.open} onOpenChange={(open) => setDeleteBookDialog({ ...deleteBookDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kitabı Kaldır</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteBookDialog.bookTitle}" kitabını bu aydan kaldırmak istediğinize emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteBook}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaldır
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Challenge Settings Dialog */}
            <Dialog open={settingsDialog.open} onOpenChange={(open) => setSettingsDialog({ ...settingsDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hedef Ayarları</DialogTitle>
                        <DialogDescription>
                            Okuma hedefinin bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="challenge-name">Hedef Adı</Label>
                            <Input
                                id="challenge-name"
                                value={settingsDialog.name}
                                onChange={(e) => setSettingsDialog({ ...settingsDialog, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challenge-description">Açıklama</Label>
                            <Textarea
                                id="challenge-description"
                                value={settingsDialog.description}
                                onChange={(e) => setSettingsDialog({ ...settingsDialog, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setSettingsDialog({ ...settingsDialog, open: false })
                                setDeleteChallengeDialog(true)
                            }}
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hedefi Sil
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setSettingsDialog({ ...settingsDialog, open: false })}>
                                Vazgeç
                            </Button>
                            <Button onClick={handleSettingsSubmit} disabled={isLoading}>
                                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Kaydet
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Challenge Dialog */}
            <AlertDialog open={deleteChallengeDialog} onOpenChange={setDeleteChallengeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hedefi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{challenge.name}" hedefini silmek istediğinize emin misiniz?
                            Bu işlem geri alınamaz ve tüm aylar ve kitaplar da silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteChallenge}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
