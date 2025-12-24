"use client"

// Force rebuild - v2
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
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { updateBook, deleteBook } from "@/actions/library"
import { analyzeTortu, analyzeImza, generateReadingExperienceReport, analyzeReadingNotes, type ReadingExperienceReport, type ReadingNotesAnalysis } from "@/actions/ai"
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
    FileBarChart,
    TrendingUp,
    MessageCircle,
    Lightbulb,
    StickyNote,
    Trash2 as TrashIcon,
    Tags,
    X,
    HelpCircle,
    ExternalLink,
} from "lucide-react"
import { addQuote } from "@/actions/quotes"
import { addReadingNote, deleteReadingNote } from "@/actions/reading-notes"
import { analyzeBookThemes, addBookTheme, removeBookTheme, generateBookDiscussionQuestions, type BookThemeAnalysis, type BookDiscussionQuestion, type BookDiscussionResult } from "@/actions/ai"
import { MOOD_OPTIONS } from "@/lib/constants"
import { convertToDirectImageUrl } from "@/lib/url-helpers"
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

const MarkmapRenderer = dynamic(
    () => import("@/components/book/markmap-renderer").then(mod => ({ default: mod.MarkmapRenderer })),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] w-full animate-pulse rounded-lg border bg-muted" />
        ),
    }
)

import { cn, formatDate, getNowInTurkey } from "@/lib/utils"
import { estimateReadingDays, calculateReadingGoal, formatRemainingDays, formatDailyTarget } from "@/lib/reading-goal"

// Types
import { Book, Quote as QuoteType, BookStatus, ReadingLog, ReadingAction, Author, Publisher, ChallengeBookRole, BookRating, ReadingNote } from "@prisma/client"
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

interface BookTheme {
    id: string
    name: string
    description: string | null
    confidence: number
    isManual: boolean
}

interface DiscussionQuestion {
    id: string
    question: string
    type: 'REFLECTION' | 'ANALYSIS' | 'CONNECTION' | 'OPINION'
    difficulty: 'EASY' | 'MEDIUM' | 'DEEP'
    sortOrder: number
}

interface ExperienceReportData {
    id: string
    context: string | null
    overallExperience: string | null
    emotionalJourney: string | null
    keyInsights: string | null
    memorableMoments: string | null
    personalGrowth: string | null
    recommendation: string | null
    createdAt: Date
    updatedAt: Date
}

interface BookDetailClientProps {
    book: Book & {
        quotes?: QuoteType[]
        readingNotes?: ReadingNote[]
        readingLogs?: ReadingLog[]
        author: Author | null
        publisher: Publisher | null
        readingListBooks?: ReadingListBookInfo[]
        challengeBooks?: ChallengeBookInfo[]
        rating: BookRating | null
        themes?: BookTheme[]
        discussionQuestions?: DiscussionQuestion[]
        experienceReport?: ExperienceReportData | null
    }
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Safe array access
    const quotes = book.quotes || []
    const readingLogs = book.readingLogs || []
    const readingListBooks = book.readingListBooks || []
    const challengeBooks = book.challengeBooks || []

    const [activeSection, setActiveSection] = useState<"tortu" | "imza" | "quotes" | "notes" | "rating" | "discussion" | "report" | "mindmap" | "briefing" | "infographic">("tortu")
    const [tortu, setTortu] = useState(book.tortu || "")
    const [imza, setImza] = useState(book.imza || "")
    const [mindmapContent, setMindmapContent] = useState(book.mindmapContent || "")
    const [briefing, setBriefing] = useState(book.briefing || "")
    const [infographicUrl, setInfographicUrl] = useState(book.infographicUrl || "")
    const [isEditingInfographic, setIsEditingInfographic] = useState(false)
    const [isSavingInfographic, setIsSavingInfographic] = useState(false)
    const [bannerUrl, setBannerUrl] = useState(book.bannerUrl || "")
    const [showBannerDialog, setShowBannerDialog] = useState(false)
    const [bannerInput, setBannerInput] = useState(book.bannerUrl || "")
    const [isSavingBanner, setIsSavingBanner] = useState(false)
    const [isEditingBriefing, setIsEditingBriefing] = useState(false)
    const [isSavingBriefing, setIsSavingBriefing] = useState(false)
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

    // Okuma Notları state
    const [readingNotes, setReadingNotes] = useState(book.readingNotes || [])
    const [showNoteDialog, setShowNoteDialog] = useState(false)
    const [noteContent, setNoteContent] = useState("")
    const [notePage, setNotePage] = useState("")
    const [noteMood, setNoteMood] = useState("")
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
    const [notesAnalysis, setNotesAnalysis] = useState<ReadingNotesAnalysis | null>(null)
    const [isAnalyzingNotes, setIsAnalyzingNotes] = useState(false)
    const [showNotesAnalysisModal, setShowNotesAnalysisModal] = useState(false)

    // Tema state'leri
    const [themes, setThemes] = useState<BookTheme[]>(book.themes || [])
    const [isAnalyzingThemes, setIsAnalyzingThemes] = useState(false)
    const [showAddThemeDialog, setShowAddThemeDialog] = useState(false)
    const [newThemeName, setNewThemeName] = useState("")
    const [newThemeDescription, setNewThemeDescription] = useState("")
    const [isAddingTheme, setIsAddingTheme] = useState(false)
    const [removingThemeId, setRemovingThemeId] = useState<string | null>(null)

    // Tartışma soruları state'leri (DB'den başlat)
    const [discussionQuestions, setDiscussionQuestions] = useState<DiscussionQuestion[]>(book.discussionQuestions || [])
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

    // Okuma Deneyimi Raporu state'leri (DB'den başlat)
    const [savedExperienceReport, setSavedExperienceReport] = useState<ExperienceReportData | null>(book.experienceReport || null)
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)

    useEffect(() => {
        setMounted(true)
        // URL'den action parametresini kontrol et
        const action = searchParams.get('action')
        if (action === 'progress' && currentStatus === 'READING') {
            setShowProgressDialog(true)
            router.replace(`/book/${book.id}`, { scroll: false })
        } else if (action === 'quote') {
            setShowQuoteDialog(true)
            router.replace(`/book/${book.id}`, { scroll: false })
        } else if (action === 'note') {
            setShowNoteDialog(true)
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

    const handleCreateNote = async () => {
        if (!noteContent.trim()) return
        setIsAddingNote(true)
        const result = await addReadingNote(
            book.id,
            noteContent,
            notePage ? parseInt(notePage) : undefined,
            noteMood || undefined
        )
        if (result.success && result.note) {
            setReadingNotes([result.note, ...readingNotes])
            setNoteContent("")
            setNotePage("")
            setNoteMood("")
            setShowNoteDialog(false)
            toast.success("Not eklendi")
        } else {
            toast.error(result.error || "Not eklenirken hata oluştu")
        }
        setIsAddingNote(false)
    }

    const handleDeleteNote = async (noteId: string) => {
        setDeletingNoteId(noteId)
        const result = await deleteReadingNote(noteId)
        if (result.success) {
            setReadingNotes(readingNotes.filter(n => n.id !== noteId))
            toast.success("Not silindi")
        } else {
            toast.error(result.error || "Not silinirken hata oluştu")
        }
        setDeletingNoteId(null)
    }

    const handleAnalyzeNotes = async () => {
        setIsAnalyzingNotes(true)
        setShowNotesAnalysisModal(true)

        try {
            const result = await analyzeReadingNotes(book.id)

            if (result.success && result.analysis) {
                setNotesAnalysis(result.analysis)
                toast.success("Notlar analiz edildi!")
            } else {
                toast.error(result.error || "Analiz yapılamadı")
            }
        } catch (e) {
            toast.error("Bir hata oluştu")
        } finally {
            setIsAnalyzingNotes(false)
        }
    }

    // Tema fonksiyonları
    const handleAnalyzeThemes = async () => {
        setIsAnalyzingThemes(true)
        try {
            const result = await analyzeBookThemes(book.id)
            if (result.success && result.analysis) {
                // Yeni temaları state'e ekle
                const newThemes = result.analysis.themes.map((t, i) => ({
                    id: `temp-${i}`,
                    name: t.name,
                    description: t.description,
                    confidence: t.confidence,
                    isManual: false
                }))
                setThemes(newThemes)
                toast.success(`${result.analysis.themes.length} tema belirlendi`)
                router.refresh()
            } else {
                toast.error(result.error || "Tema analizi başarısız")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsAnalyzingThemes(false)
        }
    }

    const handleAddTheme = async () => {
        if (!newThemeName.trim()) {
            toast.error("Tema adı gerekli")
            return
        }

        setIsAddingTheme(true)
        try {
            const result = await addBookTheme(book.id, newThemeName, newThemeDescription || undefined)
            if (result.success) {
                toast.success("Tema eklendi")
                setNewThemeName("")
                setNewThemeDescription("")
                setShowAddThemeDialog(false)
                router.refresh()
            } else {
                toast.error(result.error || "Tema eklenemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsAddingTheme(false)
        }
    }

    const handleRemoveTheme = async (themeId: string) => {
        setRemovingThemeId(themeId)
        try {
            const result = await removeBookTheme(themeId)
            if (result.success) {
                setThemes(themes.filter(t => t.id !== themeId))
                toast.success("Tema kaldırıldı")
            } else {
                toast.error(result.error || "Tema kaldırılamadı")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setRemovingThemeId(null)
        }
    }

    // Tartışma soruları üret
    const handleGenerateDiscussionQuestions = async () => {
        setIsGeneratingQuestions(true)
        try {
            const result = await generateBookDiscussionQuestions(book.id)
            if (result.success && result.result) {
                // DB'den güncel soruları al (router.refresh yerine state güncelle)
                const newQuestions: DiscussionQuestion[] = result.result.questions.map((q, index) => ({
                    id: `temp-${index}`,
                    question: q.question,
                    type: q.type.toUpperCase() as DiscussionQuestion['type'],
                    difficulty: q.difficulty.toUpperCase() as DiscussionQuestion['difficulty'],
                    sortOrder: index
                }))
                setDiscussionQuestions(newQuestions)
                toast.success("Sorular oluşturuldu")
                router.refresh()
            } else {
                toast.error(result.error || "Sorular üretilemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsGeneratingQuestions(false)
        }
    }

    // Okuma deneyimi raporu üret
    const handleGenerateExperienceReport = async () => {
        setIsGeneratingReport(true)
        try {
            const result = await generateReadingExperienceReport(book.id)
            if (result.success && result.report) {
                // DB'den güncel raporu yansıt
                setSavedExperienceReport({
                    id: 'temp',
                    context: result.report.summary,
                    overallExperience: result.report.overallImpression,
                    emotionalJourney: result.report.authorInsight,
                    keyInsights: result.report.highlights.join('\n'),
                    memorableMoments: result.report.memorableQuote || null,
                    personalGrowth: null,
                    recommendation: result.report.wouldRecommend
                        ? `✅ Tavsiye Ederim: ${result.report.recommendTo}`
                        : `❌ Tavsiye Etmem: ${result.report.recommendTo}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
                toast.success("Rapor oluşturuldu")
                router.refresh()
            } else {
                toast.error(result.error || "Rapor üretilemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsGeneratingReport(false)
        }
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

    // Banner kaydetme fonksiyonu
    const handleSaveBanner = async () => {
        setIsSavingBanner(true)
        const result = await updateBook(book.id, { bannerUrl: bannerInput || null })
        if (result.success) {
            setBannerUrl(bannerInput)
            toast.success("Banner kaydedildi")
            setShowBannerDialog(false)
        } else {
            toast.error("Kaydetme başarısız")
        }
        setIsSavingBanner(false)
    }

    return (
        <div className="space-y-6">
            {/* Profile-Style Hero Section */}
            <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm bg-card">
                {/* Banner Area */}
                <div className="relative h-48 md:h-64 lg:h-72 group">
                    {/* Banner Image or Gradient Fallback */}
                    {bannerUrl ? (
                        <Image
                            src={convertToDirectImageUrl(bannerUrl)}
                            alt="Banner"
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : book.coverUrl ? (
                        <>
                            {/* Blurred Cover as Fallback Banner */}
                            <Image
                                src={book.coverUrl.replace("http:", "https:")}
                                alt="Banner"
                                fill
                                className="object-cover blur-2xl scale-110 opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        </>
                    ) : (
                        /* Gradient Fallback */
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-card" />
                    )}

                    {/* Overlay gradient at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card to-transparent" />

                    {/* Banner Edit Button */}
                    <button
                        onClick={() => {
                            setBannerInput(bannerUrl)
                            setShowBannerDialog(true)
                        }}
                        className="absolute top-4 right-4 h-9 px-3 rounded-lg bg-black/40 hover:bg-black/60 text-white text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                        <Pencil className="h-4 w-4" />
                        Banner Düzenle
                    </button>
                </div>

                {/* Content Area - Overlapping the banner */}
                <div className="relative px-4 md:px-6 lg:px-8 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Book Cover - Overlapping */}
                        <div className="relative -mt-24 md:-mt-32 z-10 flex-shrink-0">
                            <div className="relative w-32 md:w-40 lg:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-4 ring-card bg-muted">
                                {book.coverUrl ? (
                                    <Image
                                        src={book.coverUrl.replace("http:", "https:")}
                                        alt={book.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted to-muted-foreground/20">
                                        <BookOpen className="h-12 w-12" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 w-full pt-2 md:pt-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
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
                                <div className="hidden md:flex gap-2 flex-shrink-0">
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
                                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl line-clamp-2 mt-3">
                                    {book.description}
                                </p>
                            )}

                            {/* Primary Actions */}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                {mounted ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                className={cn(
                                                    "h-11 px-5 text-sm font-bold rounded-full shadow-lg transition-all",
                                                    currentStatus === "READING" && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:shadow-primary/40",
                                                    currentStatus === "COMPLETED" && "bg-green-500 hover:bg-green-600 text-white",
                                                    currentStatus === "TO_READ" && "bg-blue-500 hover:bg-blue-600 text-white",
                                                    currentStatus === "DNF" && "bg-red-500 hover:bg-red-600 text-white"
                                                )}
                                                disabled={isUpdatingStatus}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
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
                                        className="h-11 px-5 text-sm font-bold rounded-full"
                                        disabled
                                    >
                                        {statusConfig[currentStatus].label}
                                    </Button>
                                )}

                                {/* More Options */}
                                {mounted && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
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
                    <p className="text-2xl font-bold">{quotes.length}</p>
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
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
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
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
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
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "quotes"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Alıntılar
                        </button>
                        <button
                            onClick={() => setActiveSection("notes")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "notes"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Notlar
                        </button>
                        {currentStatus === "COMPLETED" && (
                            <button
                                onClick={() => setActiveSection("rating")}
                                className={cn(
                                    "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                    activeSection === "rating"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                Puanlama
                            </button>
                        )}
                        <button
                            onClick={() => setActiveSection("discussion")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "discussion"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Tartış
                        </button>
                        <button
                            onClick={() => setActiveSection("report")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "report"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Rapor
                        </button>
                        <button
                            onClick={() => setActiveSection("mindmap")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "mindmap"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Zihin Haritası
                        </button>
                        <button
                            onClick={() => setActiveSection("briefing")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "briefing"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            Detaylı Brifing
                        </button>
                        <button
                            onClick={() => setActiveSection("infographic")}
                            className={cn(
                                "flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                                activeSection === "infographic"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            İnfografik
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

                                {quotes.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        Henüz alıntı eklenmemiş
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {quotes.map((quote) => (
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

                        {/* Notes Section */}
                        {activeSection === "notes" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <StickyNote className="h-5 w-5 text-primary" />
                                        Okuma Notları
                                    </h3>
                                    <div className="flex gap-2">
                                        {readingNotes.length >= 3 && (
                                            <Button
                                                variant="outline"
                                                onClick={handleAnalyzeNotes}
                                                disabled={isAnalyzingNotes}
                                            >
                                                {isAnalyzingNotes ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                )}
                                                AI Analizi
                                            </Button>
                                        )}
                                        <Button onClick={() => setShowNoteDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Not Ekle
                                        </Button>
                                    </div>
                                </div>

                                {readingNotes.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed rounded-xl">
                                        <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-2">Henüz okuma notu yok</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Okurken aklına gelen düşünceleri, tepkilerini not al
                                        </p>
                                        <Button variant="outline" onClick={() => setShowNoteDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            İlk Notu Ekle
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {readingNotes.map((note) => {
                                            const moodConfig = MOOD_OPTIONS.find(m => m.value === note.mood)
                                            return (
                                                <div
                                                    key={note.id}
                                                    className="p-4 rounded-lg bg-muted/50 border border-border/50 relative group"
                                                >
                                                    {/* Delete Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        disabled={deletingNoteId === note.id}
                                                    >
                                                        {deletingNoteId === note.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <TrashIcon className="h-4 w-4" />
                                                        )}
                                                    </Button>

                                                    {/* Mood Badge */}
                                                    {moodConfig && (
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium mb-2">
                                                            <span>{moodConfig.emoji}</span>
                                                            <span>{moodConfig.label}</span>
                                                        </div>
                                                    )}

                                                    {/* Content */}
                                                    <p className="text-sm whitespace-pre-wrap pr-8">{note.content}</p>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                                        {note.page && (
                                                            <span className="text-xs text-primary font-medium">
                                                                Sayfa {note.page}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {formatDate(note.createdAt, { format: "long" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
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

                        {/* Discussion Section - Düşün & Tartış */}
                        {activeSection === "discussion" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <HelpCircle className="h-5 w-5 text-amber-500" />
                                        Düşün & Tartış
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateDiscussionQuestions}
                                        disabled={isGeneratingQuestions}
                                    >
                                        {isGeneratingQuestions ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2" />
                                        )}
                                        {discussionQuestions.length > 0 ? "Yeniden Üret" : "Soru Üret"}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Kitap hakkında düşündürücü sorular. Okuma deneyimini derinleştir, farklı perspektifler keşfet.
                                </p>

                                {discussionQuestions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>Henüz soru oluşturulmamış.</p>
                                        <p className="text-sm mt-2">
                                            &quot;Soru Üret&quot; butonuna tıklayarak AI ile düşündürücü sorular oluşturabilirsin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {discussionQuestions.map((q, index) => {
                                            const typeLabels: Record<string, { label: string; color: string }> = {
                                                REFLECTION: { label: "Yansıma", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                                                ANALYSIS: { label: "Analiz", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                                                CONNECTION: { label: "Bağlantı", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                                                OPINION: { label: "Görüş", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
                                            }
                                            const difficultyLabels: Record<string, { label: string; dots: number }> = {
                                                EASY: { label: "Kolay", dots: 1 },
                                                MEDIUM: { label: "Orta", dots: 2 },
                                                DEEP: { label: "Derin", dots: 3 },
                                            }
                                            const typeInfo = typeLabels[q.type] || { label: q.type, color: "bg-muted" }
                                            const diffInfo = difficultyLabels[q.difficulty] || { label: q.difficulty, dots: 1 }

                                            return (
                                                <div
                                                    key={q.id}
                                                    className="p-4 rounded-xl bg-muted/50 border border-border/50"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 space-y-2">
                                                            <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", typeInfo.color)}>
                                                                    {typeInfo.label}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    {Array.from({ length: diffInfo.dots }).map((_, i) => (
                                                                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                    ))}
                                                                    <span className="ml-1">{diffInfo.label}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Report Section - Okuma Deneyimi Raporu */}
                        {activeSection === "report" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FileBarChart className="h-5 w-5 text-emerald-500" />
                                        Okuma Deneyimi Raporu
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateExperienceReport}
                                        disabled={isGeneratingReport}
                                    >
                                        {isGeneratingReport ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2" />
                                        )}
                                        {savedExperienceReport ? "Yeniden Üret" : "Rapor Oluştur"}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Kitap hakkındaki tortu, imza, alıntı ve notlarınızı analiz eden kapsamlı bir okuma deneyimi özeti.
                                </p>

                                {!savedExperienceReport ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>Henüz rapor oluşturulmamış.</p>
                                        <p className="text-sm mt-2">
                                            &quot;Rapor Oluştur&quot; butonuna tıklayarak AI ile okuma deneyimi raporu oluşturabilirsin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Özet */}
                                        {savedExperienceReport.context && (
                                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4" />
                                                    Özet
                                                </h4>
                                                <p className="text-sm">{savedExperienceReport.context}</p>
                                            </div>
                                        )}

                                        {/* Genel İzlenim */}
                                        {savedExperienceReport.overallExperience && (
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-blue-500" />
                                                    Genel İzlenim
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{savedExperienceReport.overallExperience}</p>
                                            </div>
                                        )}

                                        {/* Öne Çıkanlar */}
                                        {savedExperienceReport.keyInsights && (
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                    Öne Çıkanlar
                                                </h4>
                                                <ul className="space-y-1">
                                                    {savedExperienceReport.keyInsights.split('\n').map((insight, i) => (
                                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                            <span className="text-yellow-500 mt-1">•</span>
                                                            {insight}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Yazar Hakkında */}
                                        {savedExperienceReport.emotionalJourney && (
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <PenLine className="h-4 w-4 text-purple-500" />
                                                    Yazar Hakkında
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{savedExperienceReport.emotionalJourney}</p>
                                            </div>
                                        )}

                                        {/* Akılda Kalan */}
                                        {savedExperienceReport.memorableMoments && (
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <Quote className="h-4 w-4 text-amber-500" />
                                                    Akılda Kalan
                                                </h4>
                                                <p className="text-sm text-muted-foreground italic">&quot;{savedExperienceReport.memorableMoments}&quot;</p>
                                            </div>
                                        )}

                                        {/* Tavsiye */}
                                        {savedExperienceReport.recommendation && (
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <Heart className="h-4 w-4 text-red-500" />
                                                    Tavsiye
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{savedExperienceReport.recommendation}</p>
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground text-right">
                                            Son güncelleme: {formatDate(savedExperienceReport.updatedAt, { format: "long" })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mindmap Section */}
                        {activeSection === "mindmap" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Map className="h-5 w-5 text-primary" />
                                        Zihin Haritası
                                    </h3>
                                </div>
                                <MarkmapRenderer
                                    content={mindmapContent}
                                    onChange={setMindmapContent}
                                    onSave={async (content) => {
                                        const result = await updateBook(book.id, { mindmapContent: content })
                                        if (result.success) {
                                            toast.success("Zihin haritası kaydedildi")
                                        } else {
                                            toast.error("Kaydetme başarısız")
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* Briefing Section */}
                        {activeSection === "briefing" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <BookMarked className="h-5 w-5 text-primary" />
                                        Detaylı Brifing
                                    </h3>
                                    {!isEditingBriefing && briefing && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditingBriefing(true)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Düzenle
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Kitap hakkında hazırladığın veya bulduğun detaylı brifing dökümanı.
                                </p>

                                {isEditingBriefing || !briefing ? (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Editor */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                    <Pencil className="h-4 w-4" />
                                                    Düzenle
                                                </div>
                                                <Textarea
                                                    value={briefing}
                                                    onChange={(e) => setBriefing(e.target.value)}
                                                    placeholder="Markdown formatında brifing yazın...

# Başlık
## Alt Başlık

- Liste öğesi
- Başka öğe

**Kalın** ve *italik* metin

> Alıntı bloğu"
                                                    className="min-h-[400px] font-mono text-sm resize-none"
                                                />
                                            </div>

                                            {/* Live Preview */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                    <BookOpen className="h-4 w-4" />
                                                    Önizleme
                                                </div>
                                                <div className="min-h-[400px] rounded-md border bg-muted/30 p-4 overflow-auto">
                                                    {briefing ? (
                                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-code:text-primary prose-pre:bg-muted">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {briefing}
                                                            </ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground italic">
                                                            Markdown yazmaya başlayın, önizleme burada görünecek...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Markdown: # Başlık, **kalın**, *italik*, - liste, {'>'} alıntı, ``` kod, | tablo |, - [x] checkbox
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            {briefing && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsEditingBriefing(false)}
                                                >
                                                    Vazgeç
                                                </Button>
                                            )}
                                            <Button
                                                onClick={async () => {
                                                    setIsSavingBriefing(true)
                                                    const result = await updateBook(book.id, { briefing })
                                                    if (result.success) {
                                                        toast.success("Brifing kaydedildi")
                                                        setIsEditingBriefing(false)
                                                    } else {
                                                        toast.error("Kaydetme başarısız")
                                                    }
                                                    setIsSavingBriefing(false)
                                                }}
                                                disabled={isSavingBriefing}
                                            >
                                                {isSavingBriefing ? "Kaydediliyor..." : "Kaydet"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-code:text-primary prose-pre:bg-muted">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {briefing}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Infographic Section */}
                        {activeSection === "infographic" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FileBarChart className="h-5 w-5 text-primary" />
                                        İnfografik
                                    </h3>
                                    {!isEditingInfographic && infographicUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditingInfographic(true)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            URL Düzenle
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    AI tarafından üretilen infografik görsel.
                                </p>

                                {isEditingInfographic || !infographicUrl ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="infographic-url">İnfografik URL</Label>
                                            <Input
                                                id="infographic-url"
                                                value={infographicUrl}
                                                onChange={(e) => setInfographicUrl(e.target.value)}
                                                placeholder="https://drive.google.com/... veya başka bir URL"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Google Drive, Dropbox veya direkt görsel linki yapıştırın.
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {infographicUrl && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsEditingInfographic(false)}
                                                >
                                                    Vazgeç
                                                </Button>
                                            )}
                                            <Button
                                                onClick={async () => {
                                                    setIsSavingInfographic(true)
                                                    const result = await updateBook(book.id, { infographicUrl: infographicUrl || null })
                                                    if (result.success) {
                                                        toast.success("İnfografik kaydedildi")
                                                        setIsEditingInfographic(false)
                                                    } else {
                                                        toast.error("Kaydetme başarısız")
                                                    }
                                                    setIsSavingInfographic(false)
                                                }}
                                                disabled={isSavingInfographic}
                                            >
                                                {isSavingInfographic ? "Kaydediliyor..." : "Kaydet"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative w-full rounded-lg border overflow-hidden bg-muted/30">
                                            <img
                                                src={convertToDirectImageUrl(infographicUrl)}
                                                alt={`${book.title} infografik`}
                                                className="w-full h-auto"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(convertToDirectImageUrl(infographicUrl), '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Tam Boyut Aç
                                            </Button>
                                        </div>
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

                    {/* Okuma Geçmişi */}
                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <h4 className="text-sm font-bold">Okuma Geçmişi</h4>
                            </div>
                        </div>
                        <div className="p-4">
                            {readingLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    Henüz kayıt yok
                                </p>
                            ) : (
                                <div className="relative pl-4 border-l-2 border-muted space-y-3">
                                    {readingLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className="relative">
                                            <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{actionLabels[log.action]}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(log.createdAt, { format: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {readingLogs.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center pt-2">
                                            +{readingLogs.length - 5} daha fazla kayıt
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Temalar */}
                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tags className="h-5 w-5 text-indigo-500" />
                                <h4 className="text-sm font-bold">Temalar</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddThemeDialog(true)}
                                    className="h-7 px-2 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Ekle
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAnalyzeThemes}
                                    disabled={isAnalyzingThemes}
                                    className="h-7 px-2 text-xs"
                                >
                                    {isAnalyzingThemes ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    AI Analiz
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            {themes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Henüz tema belirlenmemiş. AI ile analiz edin veya manuel ekleyin.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {themes.map((theme) => (
                                        <div
                                            key={theme.id}
                                            className={cn(
                                                "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                                                theme.isManual
                                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                                    : "bg-muted text-foreground"
                                            )}
                                            title={theme.description || undefined}
                                        >
                                            <span>{theme.name}</span>
                                            {!theme.isManual && theme.confidence < 1 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {Math.round(theme.confidence * 100)}%
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleRemoveTheme(theme.id)}
                                                disabled={removingThemeId === theme.id}
                                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {removingThemeId === theme.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <X className="h-3 w-3 hover:text-destructive" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reading Lists - Detaylı Kartlar */}
                    {readingListBooks.length > 0 && (
                        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-4 border-b border-border/50 flex items-center gap-2">
                                <Map className="h-5 w-5 text-purple-500" />
                                <h4 className="text-sm font-bold">Okuma Listeleri</h4>
                            </div>
                            <div className="divide-y divide-border/50">
                                {readingListBooks.map((rlb) => (
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
                    {challengeBooks.length > 0 && (
                        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-4 border-b border-border/50 flex items-center gap-2">
                                <Target className="h-5 w-5 text-amber-500" />
                                <h4 className="text-sm font-bold">Okuma Hedefleri</h4>
                            </div>
                            <div className="divide-y divide-border/50">
                                {challengeBooks.map((cb) => (
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
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Quote className="h-5 w-5 text-primary" />
                            Yeni Alıntı
                        </DialogTitle>
                        <DialogDescription>
                            {book.title} kitabından bir alıntı ekle
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Alıntı</Label>
                            <Textarea
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                                placeholder="Alıntıyı buraya yaz..."
                                rows={5}
                                className="resize-none"
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

            {/* Note Dialog */}
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <StickyNote className="h-5 w-5 text-primary" />
                            Okuma Notu
                        </DialogTitle>
                        <DialogDescription>
                            {book.title} okurken aklına gelenleri not al
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Not</Label>
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Düşüncelerini, tepkilerini, sorularını yaz..."
                                rows={5}
                                className="resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sayfa (opsiyonel)</Label>
                                <Input
                                    type="number"
                                    value={notePage}
                                    onChange={(e) => setNotePage(e.target.value)}
                                    placeholder="Sayfa no"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ruh Hali (opsiyonel)</Label>
                                <div className="flex flex-wrap gap-1">
                                    {MOOD_OPTIONS.map((mood) => (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            onClick={() => setNoteMood(noteMood === mood.value ? "" : mood.value)}
                                            className={cn(
                                                "px-2 py-1 rounded-md text-lg transition-all",
                                                noteMood === mood.value
                                                    ? "bg-primary/20 ring-2 ring-primary"
                                                    : "hover:bg-muted"
                                            )}
                                            title={mood.label}
                                        >
                                            {mood.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleCreateNote} disabled={!noteContent.trim() || isAddingNote}>
                            {isAddingNote ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Ekleniyor...
                                </>
                            ) : (
                                "Ekle"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reading Notes Analysis Modal */}
            <Dialog open={showNotesAnalysisModal} onOpenChange={setShowNotesAnalysisModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Okuma Notları Analizi
                        </DialogTitle>
                        <DialogDescription>
                            {book.title} - {readingNotes.length} not analiz edildi
                        </DialogDescription>
                    </DialogHeader>

                    {isAnalyzingNotes ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Notlarınız analiz ediliyor...</p>
                        </div>
                    ) : notesAnalysis ? (
                        <div className="space-y-6 py-4">
                            {/* Summary */}
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Özet
                                </h4>
                                <p className="text-sm leading-relaxed">{notesAnalysis.summary}</p>
                            </div>

                            {/* Emotional Journey */}
                            <div className="space-y-3">
                                <h4 className="font-bold flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    Duygusal Yolculuk
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {notesAnalysis.emotionalJourney}
                                </p>
                            </div>

                            {/* Key Insights */}
                            <div className="space-y-3">
                                <h4 className="font-bold flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    Önemli Çıkarımlar
                                </h4>
                                <ul className="space-y-2">
                                    {(notesAnalysis.keyInsights || []).map((insight, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Reading Pattern */}
                            <div className="space-y-3">
                                <h4 className="font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    Okuma Örüntüsü
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {notesAnalysis.readingPattern}
                                </p>
                            </div>

                            {/* Recommendation */}
                            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-violet-600" />
                                    Öneri
                                </h4>
                                <p className="text-sm leading-relaxed">{notesAnalysis.recommendation}</p>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNotesAnalysisModal(false)}>
                            Kapat
                        </Button>
                        {notesAnalysis && (
                            <Button
                                onClick={handleAnalyzeNotes}
                                disabled={isAnalyzingNotes}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Yeniden Analiz Et
                            </Button>
                        )}
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

            {/* Tema Ekleme Dialog */}
            <Dialog open={showAddThemeDialog} onOpenChange={setShowAddThemeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-indigo-500" />
                            Tema Ekle
                        </DialogTitle>
                        <DialogDescription>
                            {book.title} için yeni tema ekleyin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tema Adı</Label>
                            <Input
                                value={newThemeName}
                                onChange={(e) => setNewThemeName(e.target.value)}
                                placeholder="Örn: Aşk, Dostluk, Savaş..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama (opsiyonel)</Label>
                            <Textarea
                                value={newThemeDescription}
                                onChange={(e) => setNewThemeDescription(e.target.value)}
                                placeholder="Bu tema kitapta nasıl işleniyor?"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddThemeDialog(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleAddTheme} disabled={isAddingTheme || !newThemeName.trim()}>
                            {isAddingTheme && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Banner Düzenleme Dialog */}
            <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            Banner Düzenle
                        </DialogTitle>
                        <DialogDescription>
                            Kitap sayfası için özel bir banner görseli ekleyin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Banner URL</Label>
                            <Input
                                value={bannerInput}
                                onChange={(e) => setBannerInput(e.target.value)}
                                placeholder="https://... veya Google Drive linki"
                            />
                            <p className="text-xs text-muted-foreground">
                                Google Drive, Dropbox veya direkt görsel linklerini destekler.
                            </p>
                        </div>

                        {/* Preview */}
                        {bannerInput && (
                            <div className="space-y-2">
                                <Label>Önizleme</Label>
                                <div className="relative h-32 w-full rounded-lg overflow-hidden bg-muted border">
                                    <img
                                        src={convertToDirectImageUrl(bannerInput)}
                                        alt="Banner önizleme"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        {bannerUrl && (
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    setIsSavingBanner(true)
                                    const result = await updateBook(book.id, { bannerUrl: null })
                                    if (result.success) {
                                        setBannerUrl("")
                                        setBannerInput("")
                                        toast.success("Banner kaldırıldı")
                                        setShowBannerDialog(false)
                                    } else {
                                        toast.error("İşlem başarısız")
                                    }
                                    setIsSavingBanner(false)
                                }}
                                disabled={isSavingBanner}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Kaldır
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => setShowBannerDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleSaveBanner} disabled={isSavingBanner}>
                            {isSavingBanner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSavingBanner ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
