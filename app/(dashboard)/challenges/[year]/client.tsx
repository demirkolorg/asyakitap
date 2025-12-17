"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
    BookOpen,
    Sparkles,
    Trophy,
    Loader2,
    Calendar,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Settings,
    Link as LinkIcon,
    Library,
    Book,
    ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
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
    type ChallengeBook as ChallengeBookType,
    type ChallengeMonth as ChallengeMonthType
} from "@/actions/challenge"
import { toast } from "sonner"
import { ChallengeBookRole } from "@prisma/client"

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
    const [isLoading, setIsLoading] = useState(false)

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
        role: "MAIN",  // Default to MAIN
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

            if (result.success && result.month) {
                toast.success("Ay eklendi")
                // State'i güncelle - yeni ayı ekle
                const newMonth: ChallengeMonthType = {
                    id: result.month.id,
                    monthNumber: result.month.monthNumber,
                    monthName: result.month.monthName,
                    theme: result.month.theme,
                    themeIcon: result.month.themeIcon,
                    books: [],
                    progress: {
                        total: 0,
                        completed: 0,
                        percentage: 0
                    },
                    isMainCompleted: false
                }
                setChallenge(prev => ({
                    ...prev,
                    months: [...prev.months, newMonth].sort((a, b) => a.monthNumber - b.monthNumber)
                }))
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
            role: "MAIN",  // Default to MAIN
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

            if (result.success && result.challengeBook) {
                toast.success(`"${result.bookTitle}" eklendi`)
                // State'i güncelle - yeni kitabı ekle
                const newBook: ChallengeBookType = {
                    id: result.challengeBook.id,
                    bookId: result.challengeBook.bookId,
                    role: result.challengeBook.role,
                    reason: result.challengeBook.reason,
                    sortOrder: result.challengeBook.sortOrder,
                    book: {
                        id: result.challengeBook.book.id,
                        title: result.challengeBook.book.title,
                        coverUrl: result.challengeBook.book.coverUrl,
                        pageCount: result.challengeBook.book.pageCount,
                        inLibrary: result.challengeBook.book.inLibrary,
                        status: result.challengeBook.book.status,
                        author: result.challengeBook.book.author ? {
                            id: result.challengeBook.book.author.id,
                            name: result.challengeBook.book.author.name
                        } : null,
                        publisher: result.challengeBook.book.publisher ? {
                            id: result.challengeBook.book.publisher.id,
                            name: result.challengeBook.book.publisher.name
                        } : null
                    }
                }
                setChallenge(prev => ({
                    ...prev,
                    months: prev.months.map(month =>
                        month.id === bookDialog.monthId
                            ? {
                                ...month,
                                books: [...month.books, newBook],
                                progress: {
                                    ...month.progress!,
                                    total: (month.progress?.total || 0) + 1
                                }
                            }
                            : month
                    ),
                    totalProgress: prev.totalProgress ? {
                        ...prev.totalProgress,
                        totalBooks: prev.totalProgress.totalBooks + 1
                    } : undefined
                }))
            } else {
                toast.error(result.error || "Kitap eklenemedi")
                setIsLoading(false)
                return
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

            if (result.success && result.challengeBook) {
                toast.success("Kitap eklendi")
                // State'i güncelle - yeni kitabı ekle
                const newBook: ChallengeBookType = {
                    id: result.challengeBook.id,
                    bookId: result.challengeBook.bookId,
                    role: result.challengeBook.role,
                    reason: result.challengeBook.reason,
                    sortOrder: result.challengeBook.sortOrder,
                    book: {
                        id: result.challengeBook.book.id,
                        title: result.challengeBook.book.title,
                        coverUrl: result.challengeBook.book.coverUrl,
                        pageCount: result.challengeBook.book.pageCount,
                        inLibrary: result.challengeBook.book.inLibrary,
                        status: result.challengeBook.book.status,
                        author: result.challengeBook.book.author ? {
                            id: result.challengeBook.book.author.id,
                            name: result.challengeBook.book.author.name
                        } : null,
                        publisher: result.challengeBook.book.publisher ? {
                            id: result.challengeBook.book.publisher.id,
                            name: result.challengeBook.book.publisher.name
                        } : null
                    }
                }
                setChallenge(prev => ({
                    ...prev,
                    months: prev.months.map(month =>
                        month.id === bookDialog.monthId
                            ? {
                                ...month,
                                books: [...month.books, newBook],
                                progress: {
                                    ...month.progress!,
                                    total: (month.progress?.total || 0) + 1
                                }
                            }
                            : month
                    ),
                    totalProgress: prev.totalProgress ? {
                        ...prev.totalProgress,
                        totalBooks: prev.totalProgress.totalBooks + 1
                    } : undefined
                }))
            } else {
                toast.error(result.error || "Kitap eklenemedi")
                setIsLoading(false)
                return
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
                setIsLoading(false)
                return
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
                    books: month.books.filter(b => b.id !== deleteBookDialog.bookId),
                    progress: month.books.some(b => b.id === deleteBookDialog.bookId)
                        ? {
                            ...month.progress!,
                            total: Math.max(0, (month.progress?.total || 0) - 1)
                        }
                        : month.progress
                })),
                totalProgress: prev.totalProgress ? {
                    ...prev.totalProgress,
                    totalBooks: Math.max(0, prev.totalProgress.totalBooks - 1)
                } : undefined
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
                                <span>Ana: {challenge.totalProgress?.mainCompleted ?? 0}</span>
                                <span>Bonus: {challenge.totalProgress?.bonusCompleted ?? 0}</span>
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
                    const mainBooks = month.books.filter(b => b.role === "MAIN")
                    const bonusBooks = month.books.filter(b => b.role === "BONUS")

                    return (
                        <AccordionItem
                            key={month.id}
                            value={`month-${month.monthNumber}`}
                            className={cn(
                                "border rounded-xl overflow-hidden",
                                isCurrentMonth && "border-primary/50 shadow-md"
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
                                            </div>
                                            <span className="text-xs text-muted-foreground">{month.theme}</span>
                                        </div>
                                    </div>

                                    <div className="ml-auto mr-4 flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            {month.books.length} kitap
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
                                    {/* Main Books */}
                                    {mainBooks.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Target className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Ana Hedefler</span>
                                                <span className="text-xs text-muted-foreground">({mainBooks.length} kitap)</span>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                {mainBooks.map((book) => (
                                                    <Card key={book.id} className="border-2 border-primary/30">
                                                        <CardContent className="p-4">
                                                            <div className="flex gap-4">
                                                                {/* Book Cover - Clickable */}
                                                                <Link
                                                                    href={`/book/${book.book.id}`}
                                                                    className="relative h-24 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-md hover:ring-2 hover:ring-primary transition-all"
                                                                >
                                                                    {book.book.coverUrl ? (
                                                                        <Image
                                                                            src={book.book.coverUrl}
                                                                            alt={book.book.title}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center h-full">
                                                                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                                        </div>
                                                                    )}
                                                                    {book.book.inLibrary && (
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] text-center py-0.5">
                                                                            <Library className="h-3 w-3 inline" />
                                                                        </div>
                                                                    )}
                                                                </Link>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between">
                                                                        <Link
                                                                            href={`/book/${book.book.id}`}
                                                                            className="hover:text-primary transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <h3 className="font-bold line-clamp-2">{book.book.title}</h3>
                                                                                {book.book.status === "COMPLETED" && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white flex-shrink-0">Okudum</span>
                                                                                )}
                                                                                {book.book.status === "READING" && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-white flex-shrink-0">Okunuyor</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground">{book.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                                            {book.book.pageCount && (
                                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                                    {book.book.pageCount} sayfa
                                                                                </p>
                                                                            )}
                                                                        </Link>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
                                                                                    <MoreVertical className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem asChild>
                                                                                    <Link href={`/book/${book.book.id}`}>
                                                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                                                        Kitap Detayı
                                                                                    </Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => openEditBookDialog(book, month.id)}>
                                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                                    Düzenle
                                                                                </DropdownMenuItem>
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

                                                                    {book.reason && (
                                                                        <p className="text-sm mt-2 text-muted-foreground italic line-clamp-2">
                                                                            "{book.reason}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bonus Books */}
                                    {bonusBooks.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm font-medium">Bonus Kitaplar</span>
                                                <span className="text-xs text-muted-foreground">({bonusBooks.length} kitap)</span>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3">
                                                {bonusBooks.map((book) => (
                                                    <Card key={book.id} className="relative">
                                                        <CardContent className="p-3">
                                                            <div className="flex gap-3">
                                                                {/* Book Cover - Clickable */}
                                                                <Link
                                                                    href={`/book/${book.book.id}`}
                                                                    className="relative h-20 w-14 flex-shrink-0 rounded overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                                                                >
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
                                                                    {book.book.inLibrary && (
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[8px] text-center py-0.5">
                                                                            <Library className="h-2 w-2 inline" />
                                                                        </div>
                                                                    )}
                                                                </Link>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between">
                                                                        <Link
                                                                            href={`/book/${book.book.id}`}
                                                                            className="min-w-0 flex-1 hover:text-primary transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="font-semibold text-sm line-clamp-1">{book.book.title}</h4>
                                                                                {book.book.status === "COMPLETED" && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white flex-shrink-0">Okudum</span>
                                                                                )}
                                                                                {book.book.status === "READING" && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-white flex-shrink-0">Okunuyor</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">{book.book.author?.name || "Bilinmeyen Yazar"}</p>
                                                                        </Link>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0">
                                                                                    <MoreVertical className="h-3 w-3" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem asChild>
                                                                                    <Link href={`/book/${book.book.id}`}>
                                                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                                                        Kitap Detayı
                                                                                    </Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => openEditBookDialog(book, month.id)}>
                                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                                    Düzenle
                                                                                </DropdownMenuItem>
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

                                                                    {book.reason && (
                                                                        <p className="text-xs mt-1 text-muted-foreground italic line-clamp-2">
                                                                            "{book.reason}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {month.books.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Bu ayda kitap yok</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => openBookDialog(month.id, "kitapyurdu")}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Kitap Ekle
                                            </Button>
                                        </div>
                                    )}
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
