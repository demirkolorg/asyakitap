"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateBook, deleteBook } from "@/actions/library"
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
    Map,
    Layers,
    Barcode,
} from "lucide-react"
import { addQuote, deleteQuote } from "@/actions/quotes"
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
import { cn } from "@/lib/utils"

// Types
import { Book, Quote as QuoteType, BookStatus, ReadingLog, ReadingAction, Author, Publisher, Shelf, UserReadingListBook, ReadingListBook, ReadingListLevel, ReadingList } from "@prisma/client"

type UserReadingListBookWithDetails = UserReadingListBook & {
    readingListBook: ReadingListBook & {
        level: ReadingListLevel & {
            readingList: ReadingList
        }
    }
}

interface BookDetailClientProps {
    book: Book & {
        quotes: QuoteType[]
        readingLogs: ReadingLog[]
        author: Author | null
        publisher: Publisher | null
        shelf: Shelf | null
        userReadingListBooks: UserReadingListBookWithDetails[]
    }
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
    const router = useRouter()
    const [activeSection, setActiveSection] = useState<"tortu" | "imza" | "quotes" | "history">("tortu")
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
            toast.error("Kitap silinemedi")
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
        <div className="max-w-5xl mx-auto">
            {/* Main Book Section - Goodreads Style */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                {/* Left Column - Cover & Actions */}
                <div className="lg:w-[240px] flex-shrink-0">
                    {/* Mobile: Horizontal layout with cover and title */}
                    <div className="flex gap-4 lg:block">
                        {/* Book Cover */}
                        <div className="relative aspect-[2/3] w-[120px] sm:w-[160px] lg:w-full lg:max-w-[240px] mx-auto lg:mx-0 bg-muted rounded-lg overflow-hidden shadow-lg flex-shrink-0">
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
                                    <BookOpen className="h-10 w-10 lg:h-16 lg:w-16" />
                                </div>
                            )}
                        </div>

                        {/* Mobile: Title and info beside cover */}
                        <div className="flex-1 lg:hidden min-w-0">
                            <h1 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
                                {book.title}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="text-muted-foreground/70">yazan </span>
                                {book.author ? (
                                    <Link href={`/author/${book.author.id}`} className="text-foreground hover:underline">
                                        {book.author.name}
                                    </Link>
                                ) : (
                                    <span className="text-muted-foreground">Bilinmiyor</span>
                                )}
                            </p>
                            {/* Mobile progress bar */}
                            {currentStatus === "READING" && book.pageCount && (
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{currentPage} / {book.pageCount}</span>
                                        <span className="font-medium">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            )}
                            {/* Mobile quick stats */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                {book.pageCount && <span>{book.pageCount} sayfa</span>}
                                <span>{book.quotes.length} alıntı</span>
                            </div>
                        </div>
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
                    {/* Title & Author - Desktop only */}
                    <div className="hidden lg:block mb-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-xl text-muted-foreground mt-1">
                            <span className="text-muted-foreground/70">yazan </span>
                            {book.author ? (
                                <Link href={`/author/${book.author.id}`} className="text-foreground hover:underline">
                                    {book.author.name}
                                </Link>
                            ) : (
                                <span className="text-muted-foreground">Bilinmiyor</span>
                            )}
                        </p>
                    </div>

                    {/* Publisher, Shelf & Reading List Info */}
                    <div className="flex flex-wrap gap-2 lg:gap-3 mb-4">
                        {book.publisher && (
                            <Link
                                href={`/publisher/${book.publisher.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                            >
                                <Building2 className="h-3.5 w-3.5" />
                                {book.publisher.name}
                            </Link>
                        )}
                        {book.shelf && (
                            <Link
                                href="/library"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors"
                                style={{
                                    backgroundColor: book.shelf.color ? `${book.shelf.color}20` : 'hsl(var(--muted))',
                                    color: book.shelf.color || 'inherit'
                                }}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                {book.shelf.name}
                            </Link>
                        )}
                        {book.userReadingListBooks.length > 0 && book.userReadingListBooks.map((urlb) => (
                            <Link
                                key={urlb.id}
                                href={`/reading-lists/${urlb.readingListBook.level.readingList.slug}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-sm transition-colors"
                            >
                                <Map className="h-3.5 w-3.5" />
                                {urlb.readingListBook.level.readingList.name}
                            </Link>
                        ))}
                    </div>

                    {/* Progress Bar (when reading) - Desktop only */}
                    {currentStatus === "READING" && book.pageCount && (
                        <div className="hidden lg:block mb-6 p-4 bg-muted/50 rounded-lg">
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

                    {/* Book Stats - Hidden on mobile where we show condensed version */}
                    <div className="hidden lg:flex flex-wrap gap-6 py-4 border-y">
                        {book.pageCount && (
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <strong>{book.pageCount}</strong> sayfa
                                </span>
                            </div>
                        )}
                        {book.isbn && (
                            <div className="flex items-center gap-2">
                                <Barcode className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    ISBN: <strong>{book.isbn}</strong>
                                </span>
                            </div>
                        )}
                        {book.publishedDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Yayın: <strong>{book.publishedDate}</strong>
                                </span>
                            </div>
                        )}
                        {book.description && (
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {book.description}
                                </p>
                            </div>
                        )}
                        {book.startDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Başlangıç: <strong>{new Date(book.startDate).toLocaleDateString("tr-TR")}</strong>
                                </span>
                            </div>
                        )}
                        {book.endDate && (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Bitiş: <strong>{new Date(book.endDate).toLocaleDateString("tr-TR")}</strong>
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Quote className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                <strong>{book.quotes.length}</strong> alıntı
                            </span>
                        </div>
                    </div>

                    {/* Tabs/Sections */}
                    <div className="mt-4 lg:mt-6">
                        <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                            <button
                                onClick={() => setActiveSection("tortu")}
                                className={cn(
                                    "px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0",
                                    activeSection === "tortu"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FileText className="h-3.5 w-3.5 lg:h-4 lg:w-4 inline mr-1.5 lg:mr-2" />
                                Tortu
                            </button>
                            <button
                                onClick={() => setActiveSection("imza")}
                                className={cn(
                                    "px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0",
                                    activeSection === "imza"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <PenLine className="h-3.5 w-3.5 lg:h-4 lg:w-4 inline mr-1.5 lg:mr-2" />
                                İmza
                            </button>
                            <button
                                onClick={() => setActiveSection("quotes")}
                                className={cn(
                                    "px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0",
                                    activeSection === "quotes"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Quote className="h-3.5 w-3.5 lg:h-4 lg:w-4 inline mr-1.5 lg:mr-2" />
                                Alıntılar ({book.quotes.length})
                            </button>
                            <button
                                onClick={() => setActiveSection("history")}
                                className={cn(
                                    "px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0",
                                    activeSection === "history"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4 inline mr-1.5 lg:mr-2" />
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
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveTortu} disabled={isSavingTortu}>
                                            {isSavingTortu ? "Kaydediliyor..." : "Kaydet"}
                                        </Button>
                                    </div>
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
                                                    'in bu kitaptaki üslubu, tarzı ve dili hakkında notların
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
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveImza} disabled={isSavingImza}>
                                            {isSavingImza ? "Kaydediliyor..." : "Kaydet"}
                                        </Button>
                                    </div>
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
                                                            "{quote.content}"
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
                                                            {new Date(log.createdAt).toLocaleDateString("tr-TR", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
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
                            onClick={handleDeleteBook}
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
