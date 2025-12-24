"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    BookOpen,
    ChevronDown,
    ChevronRight,
    ArrowLeft,
    Search,
    X,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ExternalLink,
    Loader2,
    Settings,
    Library,
    Share2,
    Check,
    Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    createLevel,
    updateLevel,
    deleteLevel,
    updateReadingListBook,
    removeBookFromLevel,
    addBookFromKitapyurduToLevel,
    addBookManuallyToLevel,
    updateReadingList,
} from "@/actions/reading-lists"

interface ReadingListBook {
    id: string
    bookId: string
    neden: string | null
    sortOrder: number
    book: {
        id: string
        title: string
        coverUrl: string | null
        pageCount: number | null
        inLibrary: boolean
        status: "TO_READ" | "READING" | "COMPLETED" | "DNF"
        author: { id: string; name: string } | null
        publisher: { id: string; name: string } | null
    }
}

interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
}

interface ReadingListData {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    sortOrder: number
    levels: ReadingListLevel[]
    totalBooks: number
}

interface ReadingListClientProps {
    list: ReadingListData
}

export default function ReadingListClient({ list: initialList }: ReadingListClientProps) {
    const router = useRouter()
    const [list, setList] = useState(initialList)
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
        new Set(list.levels.map(l => l.id))
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Dialog states
    const [levelDialog, setLevelDialog] = useState<{
        open: boolean
        mode: "create" | "edit"
        levelId?: string
        name: string
        description: string
    }>({ open: false, mode: "create", name: "", description: "" })

    const [bookDialog, setBookDialog] = useState<{
        open: boolean
        mode: "kitapyurdu" | "manual" | "edit"
        levelId: string
        bookId?: string
        url: string
        title: string
        author: string
        pageCount: string
        coverUrl: string
        neden: string
        inLibrary: boolean
    }>({ open: false, mode: "kitapyurdu", levelId: "", url: "", title: "", author: "", pageCount: "", coverUrl: "", neden: "", inLibrary: false })

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        type: "level" | "book"
        id: string
        name: string
    }>({ open: false, type: "level", id: "", name: "" })

    const [listSettingsDialog, setListSettingsDialog] = useState<{
        open: boolean
        name: string
        description: string
        coverUrl: string
    }>({ open: false, name: "", description: "", coverUrl: "" })

    const toggleLevel = (levelId: string) => {
        setExpandedLevels(prev => {
            const next = new Set(prev)
            if (next.has(levelId)) {
                next.delete(levelId)
            } else {
                next.add(levelId)
            }
            return next
        })
    }

    // Filtering
    const filteredLevels = useMemo(() => {
        if (!searchQuery.trim()) return list.levels

        const query = searchQuery.toLowerCase().trim()
        return list.levels.map(level => ({
            ...level,
            books: level.books.filter(book =>
                book.book.title.toLowerCase().includes(query) ||
                (book.book.author?.name || "").toLowerCase().includes(query)
            )
        })).filter(level => level.books.length > 0)
    }, [list.levels, searchQuery])

    const totalFilteredBooks = useMemo(() => {
        return filteredLevels.reduce((sum, level) => sum + level.books.length, 0)
    }, [filteredLevels])

    // Stats
    const completedBooks = list.levels.reduce((sum, level) =>
        sum + level.books.filter(b => b.book.status === "COMPLETED").length, 0)
    const progressPercentage = list.totalBooks > 0
        ? Math.round((completedBooks / list.totalBooks) * 100)
        : 0

    // Copy as Text
    const handleCopyAsText = () => {
        let text = `📚 ${list.name}\n`
        if (list.description) {
            text += `${list.description}\n`
        }
        text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`
        text += `Toplam: ${list.totalBooks} kitap, ${list.levels.length} seviye\n`
        text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`

        list.levels.forEach((level, levelIndex) => {
            text += `▸ SEVİYE ${level.levelNumber}: ${level.name.toUpperCase()}\n`
            if (level.description) {
                text += `  ${level.description}\n`
            }
            text += `  (${level.books.length} kitap)\n\n`

            level.books.forEach((book, bookIndex) => {
                const num = `${bookIndex + 1}`.padStart(2, ' ')
                text += `  ${num}. ${book.book.title}\n`
                text += `      ✍️ ${book.book.author?.name || "Bilinmeyen Yazar"}`
                if (book.book.pageCount) {
                    text += ` • ${book.book.pageCount} sayfa`
                }
                text += `\n`
                if (book.neden) {
                    text += `      💡 ${book.neden}\n`
                }
                text += `\n`
            })

            if (levelIndex < list.levels.length - 1) {
                text += `──────────────────────\n\n`
            }
        })

        text += `\n📖 AsyaKitap Okuma Listesi`

        navigator.clipboard.writeText(text)
            .then(() => toast.success("Liste panoya kopyalandı"))
            .catch(() => toast.error("Kopyalama başarısız"))
    }

    // Level handlers
    const handleLevelSubmit = async () => {
        if (!levelDialog.name.trim()) {
            toast.error("Seviye adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            if (levelDialog.mode === "create") {
                const result = await createLevel({
                    readingListId: list.id,
                    name: levelDialog.name,
                    description: levelDialog.description || undefined
                })
                if (result.success && result.level) {
                    toast.success("Seviye eklendi")
                    const newLevel: ReadingListLevel = {
                        id: result.level.id,
                        levelNumber: result.level.levelNumber,
                        name: result.level.name,
                        description: result.level.description,
                        books: []
                    }
                    setList(prev => ({
                        ...prev,
                        levels: [...prev.levels, newLevel]
                    }))
                    setExpandedLevels(prev => new Set([...prev, result.level!.id]))
                } else {
                    toast.error(result.error)
                }
            } else if (levelDialog.levelId) {
                const result = await updateLevel(levelDialog.levelId, {
                    name: levelDialog.name,
                    description: levelDialog.description || undefined
                })
                if (result.success) {
                    toast.success("Seviye güncellendi")
                    setList(prev => ({
                        ...prev,
                        levels: prev.levels.map(l =>
                            l.id === levelDialog.levelId
                                ? { ...l, name: levelDialog.name, description: levelDialog.description || null }
                                : l
                        )
                    }))
                } else {
                    toast.error(result.error)
                }
            }
            setLevelDialog({ open: false, mode: "create", name: "", description: "" })
        } finally {
            setIsLoading(false)
        }
    }

    // Book handlers
    const handleBookSubmit = async () => {
        setIsLoading(true)
        try {
            if (bookDialog.mode === "kitapyurdu") {
                if (!bookDialog.url.trim()) {
                    toast.error("URL gerekli")
                    setIsLoading(false)
                    return
                }
                const result = await addBookFromKitapyurduToLevel({
                    levelId: bookDialog.levelId,
                    kitapyurduUrl: bookDialog.url,
                    neden: bookDialog.neden || undefined,
                    inLibrary: bookDialog.inLibrary
                })
                if (result.success && result.readingListBook) {
                    toast.success(`"${result.bookTitle}" eklendi`)
                    const newBook: ReadingListBook = {
                        id: result.readingListBook.id,
                        bookId: result.readingListBook.bookId,
                        neden: result.readingListBook.neden,
                        sortOrder: result.readingListBook.sortOrder,
                        book: {
                            id: result.readingListBook.book.id,
                            title: result.readingListBook.book.title,
                            coverUrl: result.readingListBook.book.coverUrl,
                            pageCount: result.readingListBook.book.pageCount,
                            inLibrary: result.readingListBook.book.inLibrary,
                            status: result.readingListBook.book.status,
                            author: result.readingListBook.book.author ? {
                                id: result.readingListBook.book.author.id,
                                name: result.readingListBook.book.author.name
                            } : null,
                            publisher: result.readingListBook.book.publisher ? {
                                id: result.readingListBook.book.publisher.id,
                                name: result.readingListBook.book.publisher.name
                            } : null
                        }
                    }
                    setList(prev => ({
                        ...prev,
                        totalBooks: prev.totalBooks + 1,
                        levels: prev.levels.map(level =>
                            level.id === bookDialog.levelId
                                ? { ...level, books: [...level.books, newBook] }
                                : level
                        )
                    }))
                } else {
                    toast.error(result.error)
                    setIsLoading(false)
                    return
                }
            } else if (bookDialog.mode === "manual") {
                if (!bookDialog.title.trim() || !bookDialog.author.trim()) {
                    toast.error("Kitap adı ve yazar gerekli")
                    setIsLoading(false)
                    return
                }
                const result = await addBookManuallyToLevel({
                    levelId: bookDialog.levelId,
                    title: bookDialog.title,
                    author: bookDialog.author,
                    pageCount: bookDialog.pageCount ? parseInt(bookDialog.pageCount) : undefined,
                    coverUrl: bookDialog.coverUrl || undefined,
                    neden: bookDialog.neden || undefined,
                    inLibrary: bookDialog.inLibrary
                })
                if (result.success && result.readingListBook) {
                    toast.success("Kitap eklendi")
                    const newBook: ReadingListBook = {
                        id: result.readingListBook.id,
                        bookId: result.readingListBook.bookId,
                        neden: result.readingListBook.neden,
                        sortOrder: result.readingListBook.sortOrder,
                        book: {
                            id: result.readingListBook.book.id,
                            title: result.readingListBook.book.title,
                            coverUrl: result.readingListBook.book.coverUrl,
                            pageCount: result.readingListBook.book.pageCount,
                            inLibrary: result.readingListBook.book.inLibrary,
                            status: result.readingListBook.book.status,
                            author: result.readingListBook.book.author ? {
                                id: result.readingListBook.book.author.id,
                                name: result.readingListBook.book.author.name
                            } : null,
                            publisher: result.readingListBook.book.publisher ? {
                                id: result.readingListBook.book.publisher.id,
                                name: result.readingListBook.book.publisher.name
                            } : null
                        }
                    }
                    setList(prev => ({
                        ...prev,
                        totalBooks: prev.totalBooks + 1,
                        levels: prev.levels.map(level =>
                            level.id === bookDialog.levelId
                                ? { ...level, books: [...level.books, newBook] }
                                : level
                        )
                    }))
                } else {
                    toast.error(result.error)
                    setIsLoading(false)
                    return
                }
            } else if (bookDialog.mode === "edit" && bookDialog.bookId) {
                const result = await updateReadingListBook(bookDialog.bookId, {
                    neden: bookDialog.neden || undefined
                })
                if (result.success) {
                    toast.success("Kitap güncellendi")
                    setList(prev => ({
                        ...prev,
                        levels: prev.levels.map(level => ({
                            ...level,
                            books: level.books.map(book =>
                                book.id === bookDialog.bookId
                                    ? { ...book, neden: bookDialog.neden || null }
                                    : book
                            )
                        }))
                    }))
                } else {
                    toast.error(result.error)
                    setIsLoading(false)
                    return
                }
            }
            setBookDialog({ open: false, mode: "kitapyurdu", levelId: "", url: "", title: "", author: "", pageCount: "", coverUrl: "", neden: "", inLibrary: false })
        } finally {
            setIsLoading(false)
        }
    }

    // Delete handlers
    const handleDelete = async () => {
        setIsLoading(true)
        try {
            if (deleteDialog.type === "level") {
                const result = await deleteLevel(deleteDialog.id)
                if (result.success) {
                    toast.success("Seviye silindi")
                    const deletedLevel = list.levels.find(l => l.id === deleteDialog.id)
                    const deletedBookCount = deletedLevel?.books.length || 0
                    setList(prev => ({
                        ...prev,
                        totalBooks: prev.totalBooks - deletedBookCount,
                        levels: prev.levels.filter(l => l.id !== deleteDialog.id)
                    }))
                } else {
                    toast.error(result.error)
                }
            } else {
                const result = await removeBookFromLevel(deleteDialog.id)
                if (result.success) {
                    toast.success("Kitap listeden kaldırıldı")
                    setList(prev => ({
                        ...prev,
                        totalBooks: prev.totalBooks - 1,
                        levels: prev.levels.map(level => ({
                            ...level,
                            books: level.books.filter(b => b.id !== deleteDialog.id)
                        }))
                    }))
                } else {
                    toast.error(result.error)
                }
            }
            setDeleteDialog({ open: false, type: "level", id: "", name: "" })
        } finally {
            setIsLoading(false)
        }
    }

    // List settings handler
    const handleListSettingsSubmit = async () => {
        if (!listSettingsDialog.name.trim()) {
            toast.error("Liste adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await updateReadingList(list.id, {
                name: listSettingsDialog.name,
                description: listSettingsDialog.description || undefined,
                coverUrl: listSettingsDialog.coverUrl || undefined
            })
            if (result.success) {
                toast.success("Liste güncellendi")
                setList(prev => ({
                    ...prev,
                    name: listSettingsDialog.name,
                    description: listSettingsDialog.description || null,
                    coverUrl: listSettingsDialog.coverUrl || null
                }))
            } else {
                toast.error(result.error)
            }
            setListSettingsDialog({ open: false, name: "", description: "", coverUrl: "" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
                href="/reading-lists"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
                <ArrowLeft className="h-4 w-4" />
                Tüm Listeler
            </Link>

            {/* Header */}
            <div className="mb-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-semibold tracking-tight mb-2">
                            {list.name}
                        </h1>
                        {list.description && (
                            <p className="text-muted-foreground max-w-2xl">
                                {list.description}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAsText}
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Paylaş
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setListSettingsDialog({
                                open: true,
                                name: list.name,
                                description: list.description || "",
                                coverUrl: list.coverUrl || ""
                            })}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 py-4 border-y">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{list.levels.length}</span>
                            <span className="text-muted-foreground ml-1">seviye</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{list.totalBooks}</span>
                            <span className="text-muted-foreground ml-1">kitap</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{completedBooks}</span>
                            <span className="text-muted-foreground ml-1">okundu</span>
                        </span>
                    </div>
                    {progressPercentage > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium">{progressPercentage}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Add */}
            <div className="flex items-center gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Kitap veya yazar ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-11 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button
                    onClick={() => setLevelDialog({ open: true, mode: "create", name: "", description: "" })}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Seviye Ekle
                </Button>
            </div>

            {searchQuery && (
                <p className="text-sm text-muted-foreground mb-6">
                    {totalFilteredBooks} kitap bulundu
                </p>
            )}

            {/* Levels */}
            <div className="space-y-4">
                {list.levels.length === 0 && (
                    <div className="text-center py-20 border border-dashed rounded-xl">
                        <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h2 className="text-lg font-medium mb-2">Henüz seviye yok</h2>
                        <p className="text-sm text-muted-foreground mb-6">İlk seviyeyi ekleyerek başlayın</p>
                        <Button
                            onClick={() => setLevelDialog({ open: true, mode: "create", name: "", description: "" })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Seviye Ekle
                        </Button>
                    </div>
                )}

                {searchQuery && filteredLevels.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">"{searchQuery}" ile eşleşen kitap bulunamadı</p>
                    </div>
                )}

                {filteredLevels.map((level) => {
                    const isExpanded = expandedLevels.has(level.id)
                    const levelCompleted = level.books.filter(b => b.book.status === "COMPLETED").length

                    return (
                        <div key={level.id} className="border rounded-xl overflow-hidden">
                            {/* Level Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleLevel(level.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                        {level.levelNumber}
                                    </div>
                                    <div>
                                        <h2 className="font-medium flex items-center gap-2">
                                            {level.name}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {levelCompleted}/{level.books.length}
                                            </span>
                                        </h2>
                                        {level.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {level.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                setBookDialog({
                                                    open: true,
                                                    mode: "kitapyurdu",
                                                    levelId: level.id,
                                                    url: "",
                                                    title: "",
                                                    author: "",
                                                    pageCount: "",
                                                    coverUrl: "",
                                                    neden: "",
                                                    inLibrary: false
                                                })
                                            }}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Kitapyurdu'ndan Ekle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                setBookDialog({
                                                    open: true,
                                                    mode: "manual",
                                                    levelId: level.id,
                                                    url: "",
                                                    title: "",
                                                    author: "",
                                                    pageCount: "",
                                                    coverUrl: "",
                                                    neden: "",
                                                    inLibrary: false
                                                })
                                            }}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Manuel Ekle
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                setLevelDialog({
                                                    open: true,
                                                    mode: "edit",
                                                    levelId: level.id,
                                                    name: level.name,
                                                    description: level.description || ""
                                                })
                                            }}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteDialog({
                                                        open: true,
                                                        type: "level",
                                                        id: level.id,
                                                        name: level.name
                                                    })
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Level Content */}
                            {isExpanded && (
                                <div className="border-t">
                                    {level.books.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="mb-3">Bu seviyede kitap yok</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setBookDialog({
                                                    open: true,
                                                    mode: "kitapyurdu",
                                                    levelId: level.id,
                                                    url: "",
                                                    title: "",
                                                    author: "",
                                                    pageCount: "",
                                                    coverUrl: "",
                                                    neden: "",
                                                    inLibrary: false
                                                })}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Kitap Ekle
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {level.books.map((book) => (
                                                <BookRow
                                                    key={book.id}
                                                    book={book}
                                                    levelId={level.id}
                                                    onEdit={() => setBookDialog({
                                                        open: true,
                                                        mode: "edit",
                                                        levelId: level.id,
                                                        bookId: book.id,
                                                        url: "",
                                                        title: book.book.title,
                                                        author: book.book.author?.name || "",
                                                        pageCount: book.book.pageCount?.toString() || "",
                                                        coverUrl: book.book.coverUrl || "",
                                                        neden: book.neden || "",
                                                        inLibrary: book.book.inLibrary
                                                    })}
                                                    onDelete={() => setDeleteDialog({
                                                        open: true,
                                                        type: "book",
                                                        id: book.id,
                                                        name: book.book.title
                                                    })}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Level Dialog */}
            <Dialog open={levelDialog.open} onOpenChange={(open) => !open && setLevelDialog({ ...levelDialog, open: false })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {levelDialog.mode === "create" ? "Yeni Seviye" : "Seviye Düzenle"}
                        </DialogTitle>
                        <DialogDescription>
                            {levelDialog.mode === "create"
                                ? "Listeye yeni bir seviye ekleyin"
                                : "Seviye bilgilerini güncelleyin"
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Seviye Adı</Label>
                            <Input
                                placeholder="Örn: Başlangıç"
                                value={levelDialog.name}
                                onChange={(e) => setLevelDialog({ ...levelDialog, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                            <Textarea
                                placeholder="Bu seviyede hangi kitaplar var?"
                                value={levelDialog.description}
                                onChange={(e) => setLevelDialog({ ...levelDialog, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLevelDialog({ ...levelDialog, open: false })}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleLevelSubmit} disabled={isLoading || !levelDialog.name.trim()}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {levelDialog.mode === "create" ? "Ekle" : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Book Dialog */}
            <Dialog open={bookDialog.open} onOpenChange={(open) => !open && setBookDialog({ ...bookDialog, open: false })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {bookDialog.mode === "kitapyurdu" && "Kitapyurdu'ndan Ekle"}
                            {bookDialog.mode === "manual" && "Manuel Kitap Ekle"}
                            {bookDialog.mode === "edit" && "Kitap Düzenle"}
                        </DialogTitle>
                        <DialogDescription>
                            {bookDialog.mode === "kitapyurdu" && "Kitapyurdu linkini yapıştırın"}
                            {bookDialog.mode === "manual" && "Kitap bilgilerini girin"}
                            {bookDialog.mode === "edit" && "Kitap bilgilerini güncelleyin"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {bookDialog.mode === "kitapyurdu" && (
                            <div className="space-y-2">
                                <Label>Kitapyurdu Linki</Label>
                                <Input
                                    placeholder="https://www.kitapyurdu.com/kitap/..."
                                    value={bookDialog.url}
                                    onChange={(e) => setBookDialog({ ...bookDialog, url: e.target.value })}
                                />
                            </div>
                        )}

                        {bookDialog.mode === "manual" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Kitap Adı</Label>
                                    <Input
                                        placeholder="Kitap adı"
                                        value={bookDialog.title}
                                        onChange={(e) => setBookDialog({ ...bookDialog, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Yazar</Label>
                                    <Input
                                        placeholder="Yazar adı"
                                        value={bookDialog.author}
                                        onChange={(e) => setBookDialog({ ...bookDialog, author: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sayfa <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                                        <Input
                                            type="number"
                                            placeholder="300"
                                            value={bookDialog.pageCount}
                                            onChange={(e) => setBookDialog({ ...bookDialog, pageCount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kapak URL <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                                        <Input
                                            placeholder="https://..."
                                            value={bookDialog.coverUrl}
                                            onChange={(e) => setBookDialog({ ...bookDialog, coverUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {bookDialog.mode === "edit" && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-medium">{bookDialog.title}</p>
                                <p className="text-sm text-muted-foreground">{bookDialog.author}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Bu Kitap Neden Okunmalı? <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                            <Textarea
                                placeholder="Bu kitabı neden bu listeye eklediniz?"
                                value={bookDialog.neden}
                                onChange={(e) => setBookDialog({ ...bookDialog, neden: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {bookDialog.mode !== "edit" && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="inLibrary"
                                    checked={bookDialog.inLibrary}
                                    onCheckedChange={(checked) => setBookDialog({ ...bookDialog, inLibrary: checked === true })}
                                />
                                <Label htmlFor="inLibrary" className="text-sm font-normal cursor-pointer">
                                    Bu kitap kütüphanemde var
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

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {deleteDialog.type === "level" ? "Seviyeyi Sil" : "Kitabı Kaldır"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog.type === "level"
                                ? `"${deleteDialog.name}" seviyesini ve içindeki tüm kitapları silmek istediğinize emin misiniz?`
                                : `"${deleteDialog.name}" kitabını bu listeden kaldırmak istediğinize emin misiniz?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* List Settings Dialog */}
            <Dialog open={listSettingsDialog.open} onOpenChange={(open) => !open && setListSettingsDialog({ ...listSettingsDialog, open: false })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Liste Ayarları</DialogTitle>
                        <DialogDescription>
                            Liste bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Liste Adı</Label>
                            <Input
                                value={listSettingsDialog.name}
                                onChange={(e) => setListSettingsDialog({ ...listSettingsDialog, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={listSettingsDialog.description}
                                onChange={(e) => setListSettingsDialog({ ...listSettingsDialog, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kapak URL</Label>
                            <Input
                                placeholder="https://..."
                                value={listSettingsDialog.coverUrl}
                                onChange={(e) => setListSettingsDialog({ ...listSettingsDialog, coverUrl: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setListSettingsDialog({ ...listSettingsDialog, open: false })}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleListSettingsSubmit} disabled={isLoading || !listSettingsDialog.name.trim()}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Book Row Component
function BookRow({
    book,
    levelId,
    onEdit,
    onDelete,
}: {
    book: ReadingListBook
    levelId: string
    onEdit: () => void
    onDelete: () => void
}) {
    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"

    return (
        <div className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors group">
            {/* Cover */}
            <Link
                href={`/book/${book.book.id}`}
                className="relative flex-shrink-0 w-12 h-[72px] rounded-md overflow-hidden bg-muted hover:ring-2 hover:ring-primary/50 transition-all"
            >
                {book.book.coverUrl ? (
                    <Image
                        src={book.book.coverUrl}
                        alt={book.book.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                )}
            </Link>

            {/* Info */}
            <Link
                href={`/book/${book.book.id}`}
                className="flex-1 min-w-0 hover:text-primary transition-colors"
            >
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium line-clamp-1">
                        {book.book.title}
                    </h3>
                    {isCompleted && (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                            Okundu
                        </span>
                    )}
                    {isReading && (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Okunuyor
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {book.book.author?.name || "Bilinmeyen Yazar"}
                    {book.book.pageCount && ` • ${book.book.pageCount} sayfa`}
                </p>
                {book.neden && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {book.neden}
                    </p>
                )}
            </Link>

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Listeden Kaldır
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
