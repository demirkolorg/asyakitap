"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateBook, deleteBook } from "@/actions/library"
import { analyzeTortu, analyzeImza } from "@/actions/ai"
import { useRouter } from "next/navigation"
import {
    Trash2,
    PlayCircle,
    CheckCircle2,
    RotateCcw,
    XCircle,
    MoreHorizontal,
    Pencil,
    BookOpen,
    Calendar,
    FileText,
    Quote,
    ChevronDown,
    Clock,
    Plus,
    PenLine,
    Building2,
    Barcode,
    Bot,
    Loader2,
    RefreshCw,
    Map,
    Target,
    Sparkles,
    Library,
    Star,
} from "lucide-react"
import { addQuote } from "@/actions/quotes"
import { addReadingLog } from "@/actions/reading-logs"
import { toast } from "sonner"
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
import dynamic from "next/dynamic"
import Link from "next/link"
import { AuthorCombobox } from "@/components/author/author-combobox"
import { AddAuthorModal } from "@/components/author/add-author-modal"

const TortuEditor = dynamic(() => import("@/components/editor/tortu-editor"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] w-full animate-pulse rounded-lg border bg-muted" />
    ),
})

const ImzaEditor = dynamic(() => import("@/components/editor/imza-editor"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full animate-pulse rounded-lg border bg-muted" />
    ),
})
import { cn, formatDate } from "@/lib/utils"

// Types
import { Book, Quote as QuoteType, BookStatus, ReadingLog, ReadingAction, Author, Publisher, ChallengeBookRole, BookRating } from "@prisma/client"
import { BookRating as BookRatingComponent } from "@/components/book/book-rating"

interface ReadingListBookInfo {
    id: string
    neden: string | null
    level: {
        id: string
        levelNumber: number
        name: string
        description: string | null
        readingList: {
            id: string
            name: string
            slug: string
            description: string | null
            coverUrl: string | null
        }
    }
}

interface ChallengeBookInfo {
    id: string
    role: ChallengeBookRole
    reason: string | null
    month: {
        id: string
        monthNumber: number
        monthName: string
        theme: string | null
        themeIcon: string | null
        challenge: {
            id: string
            name: string
            year: number
            description: string | null
        }
    }
}

interface BookDetailClientProps {
    book: Book & {
        quotes: QuoteType[]
        readingLogs: ReadingLog[]
        author: Author | null
        publisher: Publisher | null
        readingListBooks: ReadingListBookInfo[]
        challengeBooks: ChallengeBookInfo[]
        rating: BookRating | null
    }
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
    const router = useRouter()
    const [activeSection, setActiveSection] = useState<"tortu" | "imza" | "quotes" | "rating" | "history">("tortu")
    const [tortu, setTortu] = useState(book.tortu || "")
    const [imza, setImza] = useState(book.imza || "")
    const [isSavingImza, setIsSavingImza] = useState(false)
    const [isSavingTortu, setIsSavingTortu] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(book.status)
    const [currentPage, setCurrentPage] = useState(book.currentPage)
    const [quoteContent, setQuoteContent] = useState("")
    const [quotePage, setQuotePage] = useState("")
    const [showQuoteDialog, setShowQuoteDialog] = useState(false)

    // Edit form state
    const [editTitle, setEditTitle] = useState(book.title)
    const [editAuthorId, setEditAuthorId] = useState(book.authorId || "")
    const [editPageCount, setEditPageCount] = useState(book.pageCount?.toString() || "")
    const [editIsbn, setEditIsbn] = useState(book.isbn || "")
    const [editPublishedDate, setEditPublishedDate] = useState(book.publishedDate || "")
    const [editDescription, setEditDescription] = useState(book.description || "")
    const [editCoverUrl, setEditCoverUrl] = useState(book.coverUrl || "")
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const [showAddAuthorModal, setShowAddAuthorModal] = useState(false)
    const [progressInput, setProgressInput] = useState(book.currentPage.toString())
    const [mounted, setMounted] = useState(false)
    const [inLibrary, setInLibrary] = useState(book.inLibrary)
    const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false)

    // AI yorum state'leri - kaydedilmiş yorumları başlangıçta yükle
    const [tortuAiComment, setTortuAiComment] = useState<string | null>(book.tortuAiComment || null)
    const [imzaAiComment, setImzaAiComment] = useState<string | null>(book.imzaAiComment || null)
    const [isAnalyzingTortu, setIsAnalyzingTortu] = useState(false)
    const [isAnalyzingImza, setIsAnalyzingImza] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const progress = book.pageCount ? Math.round((currentPage / book.pageCount) * 100) : 0

    const handleDeleteBook = async () => {
        setIsDeleting(true)
        const result = await deleteBook(book.id)

        if (result.success) {
            toast.success("Kitap silindi")
            router.push("/library")
        } else {
            toast.error(result.error || "Kitap silinemedi")
            setIsDeleting(false)
        }
    }

    const handleEditBook = async () => {
        if (!editTitle.trim()) {
            toast.error("Kitap adı gerekli")
            return
        }
        if (!editAuthorId) {
            toast.error("Yazar seçiniz")
            return
        }
        setIsSavingEdit(true)
        const result = await updateBook(book.id, {
            title: editTitle,
            authorId: editAuthorId,
            pageCount: editPageCount ? parseInt(editPageCount) : null,
            isbn: editIsbn.trim() || null,
            publishedDate: editPublishedDate.trim() || null,
            description: editDescription.trim() || null,
            coverUrl: editCoverUrl.trim() || null,
        })
        if (result.success) {
            toast.success("Kitap güncellendi")
            setShowEditDialog(false)
            router.refresh()
        } else {
            toast.error("Kitap güncellenemedi")
        }
        setIsSavingEdit(false)
    }

    const handleSaveImza = async () => {
        setIsSavingImza(true)
        await updateBook(book.id, { imza })
        setIsSavingImza(false)
        toast.success("İmza kaydedildi")

        // AI analizi başlat (arka planda)
        if (imza.trim().length > 50) {
            handleAnalyzeImza()
        }
    }

    const handleUpdateProgress = async () => {
        const page = parseInt(progressInput)
        if (isNaN(page) || page < 0) return

        const result = await updateBook(book.id, { currentPage: page })
        if (result.success) {
            setCurrentPage(page)
            setShowProgressDialog(false)
            toast.success("İlerleme güncellendi")
            router.refresh()
        }
    }

    const handleSaveTortu = async () => {
        setIsSavingTortu(true)
        await updateBook(book.id, { tortu })
        setIsSavingTortu(false)
        toast.success("Tortu kaydedildi")

        // AI analizi başlat (arka planda)
        if (tortu.trim().length > 50) {
            handleAnalyzeTortu()
        }
    }

    const handleAnalyzeTortu = async () => {
        if (!tortu.trim() || tortu.trim().length < 50) {
            toast.error("Tortu en az 50 karakter olmalı")
            return
        }

        setIsAnalyzingTortu(true)
        setTortuAiComment(null)

        const result = await analyzeTortu(
            tortu,
            book.title,
            book.author?.name || "Bilinmeyen Yazar",
            book.id // bookId parametresi - AI yorumunu DB'ye kaydetmek için
        )

        if (result.success && result.text) {
            setTortuAiComment(result.text)
        } else {
            toast.error(result.error || "AI yanıt üretemedi")
        }
        setIsAnalyzingTortu(false)
    }

    const handleAnalyzeImza = async () => {
        if (!imza.trim() || imza.trim().length < 50) {
            toast.error("İmza en az 50 karakter olmalı")
            return
        }

        setIsAnalyzingImza(true)
        setImzaAiComment(null)

        const result = await analyzeImza(
            imza,
            book.title,
            book.author?.name || "Bilinmeyen Yazar",
            book.id // bookId parametresi - AI yorumunu DB'ye kaydetmek için
        )

        if (result.success && result.text) {
            setImzaAiComment(result.text)
        } else {
            toast.error(result.error || "AI yanıt üretemedi")
        }
        setIsAnalyzingImza(false)
    }

    const handleCreateQuote = async () => {
        if (!quoteContent) return
        await addQuote(book.id, quoteContent, quotePage ? parseInt(quotePage) : undefined)
        setQuoteContent("")
        setQuotePage("")
        setShowQuoteDialog(false)
        toast.success("Alıntı eklendi")
        router.refresh()
    }

    const handleToggleLibrary = async () => {
        setIsUpdatingLibrary(true)
        const newValue = !inLibrary
        const result = await updateBook(book.id, { inLibrary: newValue })
        if (result.success) {
            setInLibrary(newValue)
            toast.success(newValue ? "Kütüphanene eklendi" : "Kütüphaneden çıkarıldı")
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsUpdatingLibrary(false)
    }

    const handleStartReading = async (isRestart = false) => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "READING",
            startDate: new Date(),
            endDate: null,
        })
        if (result.success) {
            await addReadingLog(book.id, isRestart ? "RESTARTED" : "STARTED")
            setCurrentStatus("READING")
            toast.success("Okumaya başladın!")
            router.refresh()
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsUpdatingStatus(false)
    }

    const handleFinishReading = async () => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "COMPLETED",
            endDate: new Date(),
            currentPage: book.pageCount || currentPage,
        })
        if (result.success) {
            await addReadingLog(book.id, "FINISHED")
            setCurrentStatus("COMPLETED")
            setCurrentPage(book.pageCount || currentPage)
            toast.success("Tebrikler! Kitabı bitirdin!")
            router.refresh()
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsUpdatingStatus(false)
    }

    const handleAbandonReading = async () => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "DNF",
            endDate: new Date(),
        })
        if (result.success) {
            await addReadingLog(book.id, "ABANDONED")
            setCurrentStatus("DNF")
            toast.success("Kitap yarım bırakıldı")
            router.refresh()
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsUpdatingStatus(false)
    }

    const handleResetToList = async () => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "TO_READ",
            startDate: null,
            endDate: null,
            currentPage: 0,
        })
        if (result.success) {
            await addReadingLog(book.id, "ADDED_TO_LIST")
            setCurrentStatus("TO_READ")
            setCurrentPage(0)
            toast.success("Kitap listeye eklendi")
            router.refresh()
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsUpdatingStatus(false)
    }

    const actionLabels: Record<ReadingAction, string> = {
        STARTED: "Okumaya başlandı",
        FINISHED: "Bitirildi",
        ABANDONED: "Yarım bırakıldı",
        RESTARTED: "Tekrar başlandı",
        ADDED_TO_LIST: "Listeye eklendi",
    }

    const statusConfig: Record<BookStatus, { label: string; color: string; bgColor: string }> = {
        TO_READ: { label: "Okunacak", color: "text-blue-600", bgColor: "bg-blue-600" },
        READING: { label: "Okunuyor", color: "text-yellow-600", bgColor: "bg-yellow-600" },
        COMPLETED: { label: "Bitirdim", color: "text-green-600", bgColor: "bg-green-600" },
        DNF: { label: "Yarım Bırakıldı", color: "text-red-600", bgColor: "bg-red-600" },
    }

    return (
        <div className="max-w-5xl mx-auto px-0 md:px-0">
            {/* Main Book Section - Goodreads Style */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                {/* Left Column - Cover & Actions */}
                <div className="md:w-[200px] lg:w-[240px] flex-shrink-0">
                    {/* Book Cover */}
                    <div className="relative aspect-[2/3] w-32 md:w-full max-w-[240px] mx-auto md:mx-0 bg-muted rounded-lg overflow-hidden shadow-lg">
                        {book.coverUrl ? (
                            <Image
                                src={book.coverUrl.replace("http:", "https:")}
                                alt={book.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <BookOpen className="h-16 w-16" />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                        {/* Main Status Button with Dropdown */}
                        {mounted ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className={cn(
                                            "w-full justify-between text-white",
                                            statusConfig[currentStatus].bgColor,
                                            "hover:opacity-90"
                                        )}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus ? "Güncelleniyor..." : statusConfig[currentStatus].label}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[200px]">
                                    {currentStatus === "TO_READ" && (
                                        <DropdownMenuItem onClick={() => handleStartReading(false)}>
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            Okumaya Başla
                                        </DropdownMenuItem>
                                    )}
                                    {currentStatus === "READING" && (
                                        <>
                                            <DropdownMenuItem onClick={handleFinishReading}>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Bitirdim
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleAbandonReading}>
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Bıraktım
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {(currentStatus === "COMPLETED" || currentStatus === "DNF") && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleStartReading(true)}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Tekrar Oku
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleResetToList}>
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                Listeye Ekle
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                className={cn(
                                    "w-full justify-between text-white",
                                    statusConfig[currentStatus].bgColor
                                )}
                                disabled
                            >
                                {statusConfig[currentStatus].label}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {/* Progress Update (only when reading) */}
                        {currentStatus === "READING" && book.pageCount && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowProgressDialog(true)}
                            >
                                İlerleme Güncelle
                            </Button>
                        )}

                        {/* More Options */}
                        {mounted ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="w-full">
                                        <MoreHorizontal className="h-4 w-4 mr-2" />
                                        Diğer İşlemler
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[200px]">
                                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Düzenle
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Sil
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="ghost" className="w-full" disabled>
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Diğer İşlemler
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Column - Book Details */}
                <div className="flex-1 min-w-0">
                    {/* Title & Author & Publisher */}
                    <div className="mb-4 text-center md:text-left">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-base md:text-xl text-muted-foreground mt-1">
                            <span className="text-muted-foreground/70">yazan </span>
                            {book.author ? (
                                <Link href={`/author/${book.author.id}`} className="text-foreground hover:underline">
                                    {book.author.name}
                                </Link>
                            ) : (
                                <span className="text-muted-foreground">Bilinmiyor</span>
                            )}
                            {book.publisher && (
                                <>
                                    <span className="text-muted-foreground/70"> · yayınlayan </span>
                                    <Link href={`/publisher/${book.publisher.id}`} className="text-foreground hover:underline">
                                        {book.publisher.name}
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Library Toggle */}
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-4 justify-center md:justify-start">
                        <button
                            onClick={handleToggleLibrary}
                            disabled={isUpdatingLibrary}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors",
                                inLibrary
                                    ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border border-green-500/30"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                        >
                            <Library className="h-3.5 w-3.5" />
                            {isUpdatingLibrary ? "..." : inLibrary ? "Kütüphanemde" : "Kütüphaneme Ekle"}
                        </button>
                    </div>

                    {/* Reading Lists & Challenges - Detaylı Kartlar */}
                    {(book.readingListBooks.length > 0 || book.challengeBooks.length > 0) && (
                        <div className="space-y-3 mb-6">
                            {/* Reading Lists */}
                            {book.readingListBooks.map((rlb) => (
                                <div
                                    key={rlb.id}
                                    className="p-4 rounded-xl bg-primary/5 border border-primary/20"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Liste Kapağı */}
                                        {rlb.level.readingList.coverUrl && (
                                            <div className="relative h-16 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                <Image
                                                    src={rlb.level.readingList.coverUrl}
                                                    alt={rlb.level.readingList.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Map className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <h4 className="font-semibold text-sm">{rlb.level.readingList.name}</h4>
                                                </div>
                                                <Link
                                                    href={`/reading-lists/${rlb.level.readingList.slug}`}
                                                    className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors flex-shrink-0"
                                                >
                                                    Listeye Git →
                                                </Link>
                                            </div>
                                            {rlb.level.readingList.description && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {rlb.level.readingList.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                    Seviye {rlb.level.levelNumber}: {rlb.level.name}
                                                </span>
                                            </div>
                                            {rlb.level.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {rlb.level.description}
                                                </p>
                                            )}
                                            {rlb.neden && (
                                                <p className="text-xs mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                                                    <span className="font-medium text-primary">Neden bu listede: </span>
                                                    {rlb.neden}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Challenges */}
                            {book.challengeBooks.map((cb) => (
                                <div
                                    key={cb.id}
                                    className={cn(
                                        "p-4 rounded-xl border",
                                        cb.role === "MAIN"
                                            ? "bg-amber-500/5 border-amber-500/20"
                                            : "bg-purple-500/5 border-purple-500/20"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Tema İkonu */}
                                        <div className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0",
                                            cb.role === "MAIN" ? "bg-amber-500/10" : "bg-purple-500/10"
                                        )}>
                                            {cb.month.themeIcon || "📚"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    {cb.role === "MAIN" ? (
                                                        <Target className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                                    ) : (
                                                        <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                    )}
                                                    <h4 className="font-semibold text-sm">{cb.month.challenge.name}</h4>
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                                        cb.role === "MAIN"
                                                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                            : "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                                                    )}>
                                                        {cb.role === "MAIN" ? "Ana Hedef" : "Bonus"}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/challenges/${cb.month.challenge.year}`}
                                                    className={cn(
                                                        "text-xs px-2 py-1 rounded font-medium transition-colors flex-shrink-0",
                                                        cb.role === "MAIN"
                                                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                            : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400"
                                                    )}
                                                >
                                                    Hedefe Git →
                                                </Link>
                                            </div>
                                            {cb.month.challenge.description && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {cb.month.challenge.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs mb-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full font-medium",
                                                    cb.role === "MAIN"
                                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                                        : "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                                                )}>
                                                    {cb.month.monthName} {cb.month.challenge.year}
                                                </span>
                                                {cb.month.theme && (
                                                    <span className="text-muted-foreground">
                                                        Tema: {cb.month.theme}
                                                    </span>
                                                )}
                                            </div>
                                            {cb.reason && (
                                                <p className={cn(
                                                    "text-xs mt-2 p-2 rounded border",
                                                    cb.role === "MAIN"
                                                        ? "bg-amber-500/5 border-amber-500/10"
                                                        : "bg-purple-500/5 border-purple-500/10"
                                                )}>
                                                    <span className={cn(
                                                        "font-medium",
                                                        cb.role === "MAIN" ? "text-amber-600" : "text-purple-600"
                                                    )}>Neden bu hedefte: </span>
                                                    {cb.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress Bar (when reading) */}
                    {currentStatus === "READING" && book.pageCount && (
                        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">İlerleme</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-2">
                                {currentPage} / {book.pageCount} sayfa okundu
                            </p>
                        </div>
                    )}

                    {/* Book Stats - Modern Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 py-4">
                        {/* Rating */}
                        {book.rating && (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mb-1" />
                                <span className="text-base md:text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                    {book.rating.ortalamaPuan.toFixed(1)}
                                </span>
                                <span className="text-[9px] text-yellow-600/70 dark:text-yellow-400/70">puan</span>
                            </div>
                        )}

                        {/* Sayfa */}
                        {book.pageCount && (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <BookOpen className="h-4 w-4 text-blue-500 mb-1" />
                                <span className="text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {book.pageCount}
                                </span>
                                <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70">sayfa</span>
                            </div>
                        )}

                        {/* Alıntı */}
                        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Quote className="h-4 w-4 text-amber-500 mb-1" />
                            <span className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-400">
                                {book.quotes.length}
                            </span>
                            <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70">alıntı</span>
                        </div>

                        {/* Başlangıç */}
                        {book.startDate && (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                                <Calendar className="h-4 w-4 text-green-500 mb-1" />
                                <span className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400">
                                    {formatDate(book.startDate, { format: "day-month", dateOnly: true })}
                                </span>
                                <span className="text-[9px] text-green-600/70 dark:text-green-400/70">başlangıç</span>
                            </div>
                        )}

                        {/* Bitiş */}
                        {book.endDate && (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
                                <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatDate(book.endDate, { format: "day-month", dateOnly: true })}
                                </span>
                                <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">bitiş</span>
                            </div>
                        )}

                        {/* Yayın Tarihi */}
                        {book.publishedDate && (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <Calendar className="h-4 w-4 text-violet-500 mb-1" />
                                <span className="text-xs md:text-sm font-bold text-violet-600 dark:text-violet-400">
                                    {book.publishedDate}
                                </span>
                                <span className="text-[9px] text-violet-600/70 dark:text-violet-400/70">yayın</span>
                            </div>
                        )}
                    </div>

                    {/* ISBN - Ayrı satır */}
                    {book.isbn && (
                        <div className="flex items-center justify-center md:justify-start gap-2 pb-4 text-xs text-muted-foreground">
                            <Barcode className="h-3.5 w-3.5" />
                            <span>ISBN: {book.isbn}</span>
                        </div>
                    )}

                    {/* Kitap Açıklaması */}
                    {book.description && (
                        <div className="py-4 border-t">
                            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Kitap Hakkında
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {book.description}
                            </p>
                        </div>
                    )}

                    {/* Tabs/Sections */}
                    <div className="mt-4 md:mt-6">
                        <div className="flex gap-0.5 md:gap-1 border-b overflow-x-auto">
                            <button
                                onClick={() => setActiveSection("tortu")}
                                className={cn(
                                    "px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                    activeSection === "tortu"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FileText className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                                Tortu
                            </button>
                            <button
                                onClick={() => setActiveSection("imza")}
                                className={cn(
                                    "px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                    activeSection === "imza"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <PenLine className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                                İmza
                            </button>
                            <button
                                onClick={() => setActiveSection("quotes")}
                                className={cn(
                                    "px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                    activeSection === "quotes"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Quote className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                                Alıntı ({book.quotes.length})
                            </button>
                            {currentStatus === "COMPLETED" && (
                                <button
                                    onClick={() => setActiveSection("rating")}
                                    className={cn(
                                        "px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                        activeSection === "rating"
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Star className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                                    Puanlama
                                </button>
                            )}
                            <button
                                onClick={() => setActiveSection("history")}
                                className={cn(
                                    "px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                    activeSection === "history"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Clock className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
                                Geçmiş
                            </button>
                        </div>

                        {/* Section Content */}
                        <div className="mt-6">
                            {/* Tortu Section */}
                            {activeSection === "tortu" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <FileText className="h-4 w-4" />
                                        <span>
                                            Kitabın sende bıraktığı izler, düşünceler ve notlar. Okurken veya okuduktan sonra aklına gelenler.
                                        </span>
                                    </div>
                                    <TortuEditor
                                        initialContent={tortu}
                                        onChange={(content) => setTortu(content)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleAnalyzeTortu}
                                            disabled={isAnalyzingTortu || tortu.trim().length < 50}
                                        >
                                            {isAnalyzingTortu ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Yorumlanıyor...
                                                </>
                                            ) : (
                                                <>
                                                    <Bot className="h-4 w-4 mr-2" />
                                                    AI Yorumu Al
                                                </>
                                            )}
                                        </Button>
                                        <Button onClick={handleSaveTortu} disabled={isSavingTortu}>
                                            {isSavingTortu ? "Kaydediliyor..." : "Kaydet"}
                                        </Button>
                                    </div>

                                    {/* AI Yorum Kartı */}
                                    {(isAnalyzingTortu || tortuAiComment) && (
                                        <div className="mt-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 overflow-hidden">
                                            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-violet-200 dark:border-violet-800 bg-violet-100/50 dark:bg-violet-900/30">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                    <span className="font-medium text-violet-700 dark:text-violet-300">AI Yorumu</span>
                                                </div>
                                                {tortuAiComment && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleAnalyzeTortu}
                                                        disabled={isAnalyzingTortu}
                                                        className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/50"
                                                    >
                                                        <RefreshCw className={cn("h-3 w-3 mr-1", isAnalyzingTortu && "animate-spin")} />
                                                        Yenile
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                {isAnalyzingTortu ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                                                        <span className="ml-2 text-muted-foreground">Düşünceleriniz yorumlanıyor...</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{tortuAiComment}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Imza Section */}
                            {activeSection === "imza" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <PenLine className="h-4 w-4" />
                                        <span>
                                            {book.author ? (
                                                <>
                                                    <Link href={`/author/${book.author.id}`} className="text-primary hover:underline">
                                                        {book.author.name}
                                                    </Link>
                                                    &apos;in bu kitaptaki üslubu, tarzı ve dili hakkında notların
                                                </>
                                            ) : (
                                                "Yazarın bu kitaptaki üslubu, tarzı ve dili hakkında notların"
                                            )}
                                        </span>
                                    </div>
                                    <ImzaEditor
                                        initialContent={imza}
                                        onChange={(content) => setImza(content)}
                                        authorName={book.author?.name}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleAnalyzeImza}
                                            disabled={isAnalyzingImza || imza.trim().length < 50}
                                        >
                                            {isAnalyzingImza ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Yorumlanıyor...
                                                </>
                                            ) : (
                                                <>
                                                    <Bot className="h-4 w-4 mr-2" />
                                                    AI Yorumu Al
                                                </>
                                            )}
                                        </Button>
                                        <Button onClick={handleSaveImza} disabled={isSavingImza}>
                                            {isSavingImza ? "Kaydediliyor..." : "Kaydet"}
                                        </Button>
                                    </div>

                                    {/* AI Yorum Kartı */}
                                    {(isAnalyzingImza || imzaAiComment) && (
                                        <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">
                                            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-emerald-200 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-900/30">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                    <span className="font-medium text-emerald-700 dark:text-emerald-300">AI Yorumu</span>
                                                </div>
                                                {imzaAiComment && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleAnalyzeImza}
                                                        disabled={isAnalyzingImza}
                                                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                                                    >
                                                        <RefreshCw className={cn("h-3 w-3 mr-1", isAnalyzingImza && "animate-spin")} />
                                                        Yenile
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                {isAnalyzingImza ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                                        <span className="ml-2 text-muted-foreground">Üslup analiziniz yorumlanıyor...</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{imzaAiComment}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quotes Section */}
                            {activeSection === "quotes" && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <h3 className="text-lg font-semibold">Alıntılar</h3>
                                        <Button onClick={() => setShowQuoteDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Alıntı Ekle
                                        </Button>
                                    </div>

                                    {book.quotes.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">
                                            Henüz alıntı eklenmemiş
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {book.quotes.map((quote) => (
                                                <Card key={quote.id}>
                                                    <CardContent className="pt-4">
                                                        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
                                                            &quot;{quote.content}&quot;
                                                        </blockquote>
                                                        {quote.page && (
                                                            <p className="text-xs text-muted-foreground mt-2 text-right">
                                                                Sayfa {quote.page}
                                                            </p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Rating Section - Sadece tamamlanan kitaplar için */}
                            {activeSection === "rating" && currentStatus === "COMPLETED" && (
                                <BookRatingComponent
                                    bookId={book.id}
                                    rating={book.rating}
                                    isCompleted={true}
                                    inTab={true}
                                />
                            )}

                            {/* History Section */}
                            {activeSection === "history" && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Okuma Geçmişi</h3>
                                    {book.readingLogs.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">
                                            Henüz kayıt yok
                                        </p>
                                    ) : (
                                        <div className="relative pl-6 border-l-2 border-muted space-y-6">
                                            {book.readingLogs.map((log) => (
                                                <div key={log.id} className="relative">
                                                    <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary" />
                                                    <div>
                                                        <p className="font-medium">{actionLabels[log.action]}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(log.createdAt, { format: "long" })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Kitabı Düzenle</DialogTitle>
                        <DialogDescription>Kitap bilgilerini güncelle</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Kitap Adı *</Label>
                            <Input
                                id="title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Yazar *</Label>
                            <AuthorCombobox
                                value={editAuthorId}
                                onValueChange={setEditAuthorId}
                                onAddNew={() => setShowAddAuthorModal(true)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pageCount">Sayfa Sayısı</Label>
                                <Input
                                    id="pageCount"
                                    type="number"
                                    value={editPageCount}
                                    onChange={(e) => setEditPageCount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publishedDate">Yayın Tarihi</Label>
                                <Input
                                    id="publishedDate"
                                    placeholder="Örn: 29.10.2025"
                                    value={editPublishedDate}
                                    onChange={(e) => setEditPublishedDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                placeholder="Örn: 9786253695033"
                                value={editIsbn}
                                onChange={(e) => setEditIsbn(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                                id="description"
                                placeholder="Kitap açıklaması..."
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coverUrl">Kapak Görseli URL</Label>
                            <Input
                                id="coverUrl"
                                type="url"
                                placeholder="https://example.com/cover.jpg"
                                value={editCoverUrl}
                                onChange={(e) => setEditCoverUrl(e.target.value)}
                            />
                            {editCoverUrl && (
                                <div className="mt-2 flex items-start gap-3">
                                    <div className="relative w-16 h-24 rounded overflow-hidden bg-muted flex-shrink-0">
                                        <Image
                                            src={editCoverUrl.replace("http:", "https:")}
                                            alt="Kapak önizleme"
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Önizleme
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleEditBook} disabled={isSavingEdit}>
                            {isSavingEdit ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Author Modal */}
            <AddAuthorModal
                open={showAddAuthorModal}
                onOpenChange={setShowAddAuthorModal}
                onAuthorCreated={(author) => setEditAuthorId(author.id)}
            />

            {/* Progress Dialog */}
            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>İlerleme Güncelle</DialogTitle>
                        <DialogDescription>Şu an kaçıncı sayfadasın?</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={progressInput}
                                onChange={(e) => setProgressInput(e.target.value)}
                                min={0}
                                max={book.pageCount || undefined}
                                className="w-24"
                            />
                            <span className="text-muted-foreground">/ {book.pageCount} sayfa</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleUpdateProgress}>Güncelle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quote Dialog */}
            <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Alıntı</DialogTitle>
                        <DialogDescription>Kitaptan bir alıntı ekle</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Alıntı</Label>
                            <Textarea
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                                placeholder="Alıntıyı buraya yaz..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sayfa (opsiyonel)</Label>
                            <Input
                                type="number"
                                value={quotePage}
                                onChange={(e) => setQuotePage(e.target.value)}
                                placeholder="Sayfa numarası"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleCreateQuote} disabled={!quoteContent.trim()}>
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kitabı silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Kitap ve tüm alıntıları kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteBook()
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
