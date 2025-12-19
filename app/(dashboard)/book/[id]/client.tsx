"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useRouter, useSearchParams } from "next/navigation"
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
    Clock,
    Plus,
    PenLine,
    Barcode,
    Bot,
    Loader2,
    RefreshCw,
    Map,
    Target,
    Sparkles,
    Library,
    Star,
    Heart,
    Share2,
    Flag,
    BookMarked,
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
import { cn, formatDate, getNowInTurkey } from "@/lib/utils"
import { estimateReadingDays, calculateReadingGoal, formatRemainingDays, formatDailyTarget } from "@/lib/reading-goal"

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
    const searchParams = useSearchParams()
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

    // Okuma hedefi modal state
    const [showStartReadingModal, setShowStartReadingModal] = useState(false)
    const [readingGoalDays, setReadingGoalDays] = useState("")
    const [isStartingReading, setIsStartingReading] = useState(false)

    // AI yorum state'leri - kaydedilmiş yorumları başlangıçta yükle
    const [tortuAiComment, setTortuAiComment] = useState<string | null>(book.tortuAiComment || null)
    const [imzaAiComment, setImzaAiComment] = useState<string | null>(book.imzaAiComment || null)
    const [isAnalyzingTortu, setIsAnalyzingTortu] = useState(false)
    const [isAnalyzingImza, setIsAnalyzingImza] = useState(false)

    useEffect(() => {
        setMounted(true)
        // URL'den action parametresini kontrol et
        const action = searchParams.get('action')
        if (action === 'progress' && currentStatus === 'READING') {
            setShowProgressDialog(true)
            // URL'den action parametresini temizle
            router.replace(`/book/${book.id}`, { scroll: false })
        }
    }, [searchParams, currentStatus, book.id, router])

    const progress = book.pageCount ? Math.round((currentPage / book.pageCount) * 100) : 0

    // Okuma hedefi hesaplama
    const readingGoalInfo = calculateReadingGoal({
        pageCount: book.pageCount,
        currentPage: currentPage,
        startDate: book.startDate,
        readingGoalDays: book.readingGoalDays,
    })

    // AI önerisi hesaplama (modal için)
    const aiSuggestion = book.pageCount ? estimateReadingDays(book.pageCount) : null

    // Okuma süresi hesaplama
    const readingDays = book.startDate && book.endDate
        ? Math.ceil((new Date(book.endDate).getTime() - new Date(book.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : book.startDate
            ? Math.ceil((new Date().getTime() - new Date(book.startDate).getTime()) / (1000 * 60 * 60 * 24))
            : null

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

    // Okumaya başla (eski yöntem - restart için)
    const handleStartReadingDirect = async (isRestart = false) => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "READING",
            startDate: getNowInTurkey(),
            endDate: null,
            readingGoalDays: null, // Restart'ta hedefi sıfırla
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

    // Modal ile okumaya başla
    const handleStartReadingWithGoal = async () => {
        setIsStartingReading(true)
        const goalDays = readingGoalDays ? parseInt(readingGoalDays) : null

        const result = await updateBook(book.id, {
            status: "READING",
            startDate: getNowInTurkey(),
            endDate: null,
            currentPage: 0,
            readingGoalDays: goalDays,
        })
        if (result.success) {
            await addReadingLog(book.id, "STARTED")
            setCurrentStatus("READING")
            setCurrentPage(0)
            setShowStartReadingModal(false)
            toast.success(goalDays
                ? `Okumaya başladın! Hedef: ${goalDays} gün`
                : "Okumaya başladın!"
            )
            router.refresh()
        } else {
            toast.error("Bir hata oluştu")
        }
        setIsStartingReading(false)
    }

    // Modal'ı aç (TO_READ durumunda)
    const handleOpenStartReadingModal = () => {
        setReadingGoalDays("")
        setShowStartReadingModal(true)
    }

    const handleFinishReading = async () => {
        setIsUpdatingStatus(true)
        const result = await updateBook(book.id, {
            status: "COMPLETED",
            endDate: getNowInTurkey(),
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
            endDate: getNowInTurkey(),
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

    const statusConfig: Record<BookStatus, { label: string; color: string; bgColor: string; icon: string }> = {
        TO_READ: { label: "Okunacak", color: "text-blue-500", bgColor: "bg-blue-500", icon: "menu_book" },
        READING: { label: "Okunuyor", color: "text-primary", bgColor: "bg-primary", icon: "auto_stories" },
        COMPLETED: { label: "Bitirdim", color: "text-green-500", bgColor: "bg-green-500", icon: "check_circle" },
        DNF: { label: "Yarım Bırakıldı", color: "text-red-500", bgColor: "bg-red-500", icon: "cancel" },
    }

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border/50 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    {/* Book Cover */}
                    <div className="w-full md:w-[200px] lg:w-[240px] flex-shrink-0 relative group">
                        <div className="relative aspect-[2/3] w-40 md:w-full mx-auto rounded-lg overflow-hidden shadow-2xl bg-muted">
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
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 w-full flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-2">
                                {/* Status Badge */}
                                <div className={cn(
                                    "inline-flex items-center gap-2 self-start px-3 py-1 rounded-full border",
                                    currentStatus === "READING" && "bg-primary/10 border-primary/20",
                                    currentStatus === "COMPLETED" && "bg-green-500/10 border-green-500/20",
                                    currentStatus === "TO_READ" && "bg-blue-500/10 border-blue-500/20",
                                    currentStatus === "DNF" && "bg-red-500/10 border-red-500/20"
                                )}>
                                    <BookMarked className={cn(
                                        "h-4 w-4",
                                        statusConfig[currentStatus].color
                                    )} />
                                    <span className={cn(
                                        "text-xs font-bold tracking-wide uppercase",
                                        statusConfig[currentStatus].color
                                    )}>
                                        {statusConfig[currentStatus].label}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-2">
                                    {book.title}
                                </h1>

                                {/* Author & Publisher */}
                                <div className="flex flex-wrap items-center gap-2 text-base md:text-lg">
                                    {book.author ? (
                                        <Link
                                            href={`/author/${book.author.id}`}
                                            className="font-medium hover:underline hover:text-primary transition-colors"
                                        >
                                            {book.author.name}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">Bilinmiyor</span>
                                    )}
                                    {book.publisher && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <Link
                                                href={`/publisher/${book.publisher.id}`}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {book.publisher.name}
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex gap-2">
                                <button
                                    onClick={handleToggleLibrary}
                                    disabled={isUpdatingLibrary}
                                    className={cn(
                                        "h-10 w-10 rounded-full border flex items-center justify-center transition-colors",
                                        inLibrary
                                            ? "border-primary/30 text-primary hover:bg-primary/10"
                                            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                    title={inLibrary ? "Kütüphanemde" : "Kütüphaneme Ekle"}
                                >
                                    <Library className="h-5 w-5" />
                                </button>
                                <button
                                    className="h-10 w-10 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                    title="Favorilere Ekle"
                                >
                                    <Heart className="h-5 w-5" />
                                </button>
                                <button
                                    className="h-10 w-10 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                    title="Paylaş"
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        {book.description && (
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3">
                                {book.description}
                            </p>
                        )}

                        {/* Primary Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            {mounted ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            className={cn(
                                                "h-12 px-6 text-base font-bold rounded-full shadow-lg transition-all",
                                                currentStatus === "READING" && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:shadow-primary/40",
                                                currentStatus === "COMPLETED" && "bg-green-500 hover:bg-green-600 text-white",
                                                currentStatus === "TO_READ" && "bg-blue-500 hover:bg-blue-600 text-white",
                                                currentStatus === "DNF" && "bg-red-500 hover:bg-red-600 text-white"
                                            )}
                                            disabled={isUpdatingStatus}
                                        >
                                            <Pencil className="h-5 w-5 mr-2" />
                                            {isUpdatingStatus ? "Güncelleniyor..." : "Durumu Güncelle"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[200px]">
                                        {currentStatus === "TO_READ" && (
                                            <DropdownMenuItem onClick={handleOpenStartReadingModal}>
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                Okumaya Başla
                                            </DropdownMenuItem>
                                        )}
                                        {currentStatus === "READING" && (
                                            <>
                                                <DropdownMenuItem onClick={() => setShowProgressDialog(true)}>
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                    İlerleme Güncelle
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
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
                                                <DropdownMenuItem onClick={() => handleStartReadingDirect(true)}>
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
                                    className="h-12 px-6 text-base font-bold rounded-full"
                                    disabled
                                >
                                    {statusConfig[currentStatus].label}
                                </Button>
                            )}

                            {/* More Options */}
                            {mounted && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
                                            <MoreHorizontal className="h-5 w-5" />
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {/* Ortalama Puan */}
                {book.rating && (
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 group-hover:text-yellow-400 transition-colors" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Ortalama Puan</p>
                        </div>
                        <p className="text-2xl font-bold">
                            {book.rating.ortalamaPuan.toFixed(1)}
                            <span className="text-sm text-muted-foreground font-normal">/10</span>
                        </p>
                    </div>
                )}

                {/* Sayfa Sayısı */}
                {book.pageCount && (
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Sayfa Sayısı</p>
                        </div>
                        <p className="text-2xl font-bold">{book.pageCount}</p>
                    </div>
                )}

                {/* Alıntı */}
                <div className="flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                        <Quote className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Alıntı</p>
                    </div>
                    <p className="text-2xl font-bold">{book.quotes.length}</p>
                </div>

                {/* Okuma Süresi */}
                {readingDays !== null && (
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Okuma Süresi</p>
                        </div>
                        <p className="text-2xl font-bold">{readingDays} Gün</p>
                    </div>
                )}

                {/* Yayın */}
                {book.publishedDate && (
                    <div className="flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Yayın</p>
                        </div>
                        <p className="text-2xl font-bold">{book.publishedDate}</p>
                    </div>
                )}
            </div>

            {/* Layout Split: Main Content & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (Tabs & Content) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Navigation Tabs */}
                    <div className="flex overflow-x-auto bg-card p-1.5 rounded-2xl border border-border/50 gap-1">
                        <button
                            onClick={() => setActiveSection("tortu")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                activeSection === "tortu"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Tortu
                        </button>
                        <button
                            onClick={() => setActiveSection("imza")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                activeSection === "imza"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            İmza
                        </button>
                        <button
                            onClick={() => setActiveSection("quotes")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                activeSection === "quotes"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Alıntılar
                        </button>
                        {currentStatus === "COMPLETED" && (
                            <button
                                onClick={() => setActiveSection("rating")}
                                className={cn(
                                    "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                    activeSection === "rating"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                Puanlama
                            </button>
                        )}
                        <button
                            onClick={() => setActiveSection("history")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                                activeSection === "history"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Geçmiş
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6">
                        {/* Tortu Section */}
                        {activeSection === "tortu" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Tortu
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Kitabın sende bıraktığı izler, düşünceler ve notlar. Okurken veya okuduktan sonra aklına gelenler.
                                </p>
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
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <PenLine className="h-5 w-5 text-primary" />
                                        İmza
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
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
                                </p>
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
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Quote className="h-5 w-5 text-primary" />
                                        Alıntılar
                                    </h3>
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
                                            <div
                                                key={quote.id}
                                                className="p-4 rounded-lg bg-muted/50 border border-border/50 relative"
                                            >
                                                <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/20" />
                                                <blockquote className="italic text-muted-foreground pr-8">
                                                    &quot;{quote.content}&quot;
                                                </blockquote>
                                                {quote.page && (
                                                    <p className="text-xs text-primary mt-2 text-right font-medium">
                                                        Sayfa {quote.page}
                                                    </p>
                                                )}
                                            </div>
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
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Okuma Geçmişi
                                </h3>
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

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                    {/* Reading Progress & Goal Widget */}
                    {currentStatus === "READING" && book.pageCount && (
                        <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Okuma İlerlemesi
                                </h4>
                                {readingGoalInfo && (
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full font-medium",
                                        readingGoalInfo.statusColor === 'green' && "bg-green-500/10 text-green-600 dark:text-green-400",
                                        readingGoalInfo.statusColor === 'yellow' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                        readingGoalInfo.statusColor === 'red' && "bg-red-500/10 text-red-600 dark:text-red-400",
                                    )}>
                                        {readingGoalInfo.statusMessage}
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm">
                                        Sayfa {currentPage} / {book.pageCount}
                                    </span>
                                    <span className="text-primary font-bold text-sm">%{progress}</span>
                                </div>
                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            readingGoalInfo?.statusColor === 'green' && "bg-green-500",
                                            readingGoalInfo?.statusColor === 'yellow' && "bg-yellow-500",
                                            readingGoalInfo?.statusColor === 'red' && "bg-red-500",
                                            !readingGoalInfo && "bg-primary"
                                        )}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Goal Stats */}
                            {readingGoalInfo && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Kalan Süre</span>
                                            <span className="text-sm font-medium">
                                                {formatRemainingDays(readingGoalInfo.remainingDays)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Günlük Hedef</span>
                                            <span className="text-sm font-medium">
                                                {readingGoalInfo.currentDailyTarget} sayfa
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No Goal Set */}
                            {!readingGoalInfo && book.pageCount && (
                                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                                    <Flag className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Hedef belirlenmedi</span>
                                        <span className="text-sm text-muted-foreground">
                                            Okumaya başlarken hedef belirleyebilirsin
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowProgressDialog(true)}
                            >
                                İlerleme Güncelle
                            </Button>
                        </div>
                    )}

                    {/* Book Details List */}
                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <h4 className="text-lg font-bold">Kitap Bilgileri</h4>
                        </div>
                        <div className="divide-y divide-border/50">
                            {book.isbn && (
                                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                    <span className="text-muted-foreground text-sm">ISBN</span>
                                    <span className="text-sm font-mono tracking-wide">{book.isbn}</span>
                                </div>
                            )}
                            {book.pageCount && (
                                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                    <span className="text-muted-foreground text-sm">Sayfa</span>
                                    <span className="text-sm">{book.pageCount}</span>
                                </div>
                            )}
                            {book.publishedDate && (
                                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                    <span className="text-muted-foreground text-sm">Yayın Tarihi</span>
                                    <span className="text-sm">{book.publishedDate}</span>
                                </div>
                            )}
                            {book.startDate && (
                                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                    <span className="text-muted-foreground text-sm">Başlangıç</span>
                                    <span className="text-sm">
                                        {formatDate(book.startDate, { format: "short", dateOnly: true })}
                                    </span>
                                </div>
                            )}
                            {book.endDate && (
                                <div className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                    <span className="text-muted-foreground text-sm">Bitiş</span>
                                    <span className="text-sm">
                                        {formatDate(book.endDate, { format: "short", dateOnly: true })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reading Lists - Detaylı Kartlar */}
                    {book.readingListBooks.length > 0 && (
                        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-4 border-b border-border/50 flex items-center gap-2">
                                <Map className="h-5 w-5 text-purple-500" />
                                <h4 className="text-sm font-bold">Okuma Listeleri</h4>
                            </div>
                            <div className="divide-y divide-border/50">
                                {book.readingListBooks.map((rlb) => (
                                    <div key={rlb.id} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {/* Liste Kapağı */}
                                            {rlb.level.readingList.coverUrl ? (
                                                <div className="relative h-14 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                    <Image
                                                        src={rlb.level.readingList.coverUrl}
                                                        alt={rlb.level.readingList.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-14 w-10 flex-shrink-0 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                    <Map className="h-5 w-5 text-purple-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h5 className="font-semibold text-sm truncate">
                                                        {rlb.level.readingList.name}
                                                    </h5>
                                                    <Link
                                                        href={`/reading-lists/${rlb.level.readingList.slug}`}
                                                        className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium transition-colors flex-shrink-0"
                                                    >
                                                        Git →
                                                    </Link>
                                                </div>
                                                {rlb.level.readingList.description && (
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">
                                                        {rlb.level.readingList.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                                                        Seviye {rlb.level.levelNumber}: {rlb.level.name}
                                                    </span>
                                                </div>
                                                {rlb.level.description && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        {rlb.level.description}
                                                    </p>
                                                )}
                                                {rlb.neden && (
                                                    <div className="mt-2 p-2 rounded bg-purple-500/5 border border-purple-500/10">
                                                        <p className="text-[10px]">
                                                            <span className="font-medium text-purple-600 dark:text-purple-400">Neden: </span>
                                                            <span className="text-muted-foreground">{rlb.neden}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Challenges - Detaylı Kartlar */}
                    {book.challengeBooks.length > 0 && (
                        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-4 border-b border-border/50 flex items-center gap-2">
                                <Target className="h-5 w-5 text-amber-500" />
                                <h4 className="text-sm font-bold">Okuma Hedefleri</h4>
                            </div>
                            <div className="divide-y divide-border/50">
                                {book.challengeBooks.map((cb) => (
                                    <div key={cb.id} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {/* Tema İkonu */}
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0",
                                                cb.role === "MAIN" ? "bg-amber-500/10" : "bg-blue-500/10"
                                            )}>
                                                {cb.month.themeIcon || "📚"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h5 className="font-semibold text-sm truncate">
                                                            {cb.month.challenge.name}
                                                        </h5>
                                                        <span className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                                                            cb.role === "MAIN"
                                                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                                : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                                        )}>
                                                            {cb.role === "MAIN" ? "ANA" : "BONUS"}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/challenges/${cb.month.challenge.year}`}
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded font-medium transition-colors flex-shrink-0",
                                                            cb.role === "MAIN"
                                                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                                : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                                        )}
                                                    >
                                                        Git →
                                                    </Link>
                                                </div>
                                                {cb.month.challenge.description && (
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">
                                                        {cb.month.challenge.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                        cb.role === "MAIN"
                                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                                    )}>
                                                        {cb.month.monthName} {cb.month.challenge.year}
                                                    </span>
                                                    {cb.month.theme && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Tema: {cb.month.theme}
                                                        </span>
                                                    )}
                                                </div>
                                                {cb.reason && (
                                                    <div className={cn(
                                                        "mt-2 p-2 rounded border",
                                                        cb.role === "MAIN"
                                                            ? "bg-amber-500/5 border-amber-500/10"
                                                            : "bg-blue-500/5 border-blue-500/10"
                                                    )}>
                                                        <p className="text-[10px]">
                                                            <span className={cn(
                                                                "font-medium",
                                                                cb.role === "MAIN" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                                                            )}>Neden: </span>
                                                            <span className="text-muted-foreground">{cb.reason}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

            {/* Start Reading Modal */}
            <Dialog open={showStartReadingModal} onOpenChange={setShowStartReadingModal}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            Okumaya Başla
                        </DialogTitle>
                        <DialogDescription>
                            Bu kitabı kaç günde bitirmek istiyorsun?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* AI Önerisi */}
                        {aiSuggestion && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bot className="h-5 w-5 text-primary" />
                                    <span className="font-medium text-primary">AI Önerisi</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button
                                        onClick={() => setReadingGoalDays(aiSuggestion.fastReader.toString())}
                                        className={cn(
                                            "w-full flex justify-between items-center p-2 rounded-md transition-colors",
                                            readingGoalDays === aiSuggestion.fastReader.toString()
                                                ? "bg-primary/20 text-primary"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <span>🚀 Hızlı (50 sf/gün)</span>
                                        <span className="font-medium">{aiSuggestion.fastReader} gün</span>
                                    </button>
                                    <button
                                        onClick={() => setReadingGoalDays(aiSuggestion.normalReader.toString())}
                                        className={cn(
                                            "w-full flex justify-between items-center p-2 rounded-md transition-colors",
                                            readingGoalDays === aiSuggestion.normalReader.toString()
                                                ? "bg-primary/20 text-primary"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <span>📖 Normal (30 sf/gün)</span>
                                        <span className="font-medium">{aiSuggestion.normalReader} gün</span>
                                    </button>
                                    <button
                                        onClick={() => setReadingGoalDays(aiSuggestion.casualReader.toString())}
                                        className={cn(
                                            "w-full flex justify-between items-center p-2 rounded-md transition-colors",
                                            readingGoalDays === aiSuggestion.casualReader.toString()
                                                ? "bg-primary/20 text-primary"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <span>☕ Rahat (15 sf/gün)</span>
                                        <span className="font-medium">{aiSuggestion.casualReader} gün</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manuel Gün Girişi */}
                        <div className="space-y-2">
                            <Label htmlFor="goalDays">Hedef Gün (Opsiyonel)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="goalDays"
                                    type="number"
                                    placeholder="Örn: 14"
                                    value={readingGoalDays}
                                    onChange={(e) => setReadingGoalDays(e.target.value)}
                                    min={1}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">gün</span>
                            </div>
                        </div>

                        {/* Günlük Sayfa Bilgisi */}
                        {readingGoalDays && book.pageCount && parseInt(readingGoalDays) > 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    Günde yaklaşık{" "}
                                    <span className="font-medium text-foreground">
                                        {Math.ceil(book.pageCount / parseInt(readingGoalDays))}
                                    </span>{" "}
                                    sayfa okumalısın
                                </span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStartReadingModal(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleStartReadingWithGoal} disabled={isStartingReading}>
                            {isStartingReading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Başlatılıyor...
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Okumaya Başla
                                </>
                            )}
                        </Button>
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
