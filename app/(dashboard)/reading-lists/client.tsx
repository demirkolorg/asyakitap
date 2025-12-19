"use client"

import { useState, useMemo } from "react"
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
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    Map,
    Plus,
    Loader2,
    BookOpen,
    Layers,
    Search,
    Bookmark,
    ChevronUp,
    ChevronDown,
    Lightbulb,
    MoreHorizontal,
    Play,
    FileText,
    Check,
    Edit,
    Trash2,
    GripVertical,
    Link as LinkIcon,
    Settings,
} from "lucide-react"
import { toast } from "sonner"
import {
    createReadingList,
    updateReadingList,
    deleteReadingList,
    getReadingListDetail,
    createLevel,
    updateLevel,
    deleteLevel,
    addBookFromKitapyurduToLevel,
    addBookManuallyToLevel,
    updateReadingListBook,
    removeBookFromLevel,
    reorderLevels,
    reorderBooksInLevel,
} from "@/actions/reading-lists"
import { cn } from "@/lib/utils"

interface ReadingListSummary {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    levelCount: number
    totalBooks: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReadingListWithCount = any

interface ReadingListsPageClientProps {
    lists: ReadingListSummary[]
    allLists: ReadingListWithCount[]
}

// Level and Book types for detail view
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
    coverUrl: string | null
    books: ReadingListBook[]
}

interface ReadingListDetail {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    sortOrder: number
    levels: ReadingListLevel[]
    totalBooks: number
}

// Sortable Book Item Component
function SortableBookItem({
    book,
    onEdit,
    onDelete,
}: {
    book: ReadingListBook
    onEdit: () => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: book.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 bg-card border rounded-lg transition-all group",
                isDragging && "opacity-50 shadow-lg z-50"
            )}
        >
            <button
                className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* Cover */}
            <div className="h-12 w-8 rounded overflow-hidden bg-muted flex-shrink-0">
                {book.book.coverUrl ? (
                    <Image
                        src={book.book.coverUrl}
                        alt={book.book.title}
                        width={32}
                        height={48}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{book.book.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {book.book.author?.name || "Bilinmeyen Yazar"}
                </p>
            </div>

            {/* Status Badge */}
            {isCompleted && (
                <span className="text-[10px] font-bold uppercase bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                    Okundu
                </span>
            )}
            {isReading && (
                <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Okunuyor
                </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                    <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

export function ReadingListsPageClient({ lists: initialLists, allLists }: ReadingListsPageClientProps) {
    const router = useRouter()
    const [lists, setLists] = useState(initialLists)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"all" | "popular" | "new">("all")
    const [selectedList, setSelectedList] = useState<ReadingListDetail | null>(null)
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)

    // Dialog states
    const [listDialog, setListDialog] = useState({
        open: false,
        mode: "create" as "create" | "edit",
        data: { name: "", description: "", coverUrl: "", slug: "" }
    })

    const [levelDialog, setLevelDialog] = useState({
        open: false,
        mode: "create" as "create" | "edit",
        levelId: null as string | null,
        data: { name: "", description: "", coverUrl: "" }
    })

    const [bookDialog, setBookDialog] = useState({
        open: false,
        mode: "add-url" as "add-url" | "add-manual" | "edit",
        levelId: null as string | null,
        bookId: null as string | null,
        data: { url: "", title: "", author: "", pageCount: "", neden: "", inLibrary: false }
    })

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        type: "list" | "level" | "book"
        id: string
        name: string
    } | null>(null)

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Toplam sayfa hesapla
    const totalPages = selectedList?.levels.reduce((sum, level) =>
        sum + level.books.reduce((bookSum, book) => bookSum + (book.book.pageCount || 0), 0), 0) || 0

    // İlerleme hesapla
    const getListProgress = (list: ReadingListSummary) => {
        return { completed: 0, total: list.totalBooks, percentage: 0 }
    }

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

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }

    // Refresh selected list
    const refreshSelectedList = async (slug: string) => {
        const detail = await getReadingListDetail(slug)
        if (detail) {
            setSelectedList(detail)
            // Update lists array too
            setLists(prev => prev.map(l => l.slug === slug ? {
                ...l,
                name: detail.name,
                description: detail.description,
                coverUrl: detail.coverUrl,
                levelCount: detail.levels.length,
                totalBooks: detail.totalBooks
            } : l))
        }
    }

    const handleSelectList = async (slug: string) => {
        setIsLoadingDetail(true)
        try {
            const detail = await getReadingListDetail(slug)
            if (detail) {
                setSelectedList(detail)
                if (detail.levels.length > 0) {
                    setExpandedLevels(new Set([detail.levels[0].id]))
                }
            }
        } catch {
            toast.error("Liste yüklenemedi")
        } finally {
            setIsLoadingDetail(false)
        }
    }

    // LIST CRUD
    const openListDialog = (mode: "create" | "edit", list?: ReadingListDetail) => {
        if (mode === "edit" && list) {
            setListDialog({
                open: true,
                mode: "edit",
                data: {
                    name: list.name,
                    description: list.description || "",
                    coverUrl: list.coverUrl || "",
                    slug: list.slug
                }
            })
        } else {
            setListDialog({
                open: true,
                mode: "create",
                data: { name: "", description: "", coverUrl: "", slug: "" }
            })
        }
    }

    const handleListSubmit = async () => {
        if (!listDialog.data.name.trim()) {
            toast.error("Liste adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            if (listDialog.mode === "edit" && selectedList) {
                const result = await updateReadingList(selectedList.id, {
                    name: listDialog.data.name,
                    description: listDialog.data.description || undefined,
                    coverUrl: listDialog.data.coverUrl || undefined,
                    slug: listDialog.data.slug || undefined
                })
                if (result.success) {
                    toast.success("Liste güncellendi")
                    await refreshSelectedList(listDialog.data.slug || selectedList.slug)
                    setListDialog({ ...listDialog, open: false })
                } else {
                    toast.error(result.error || "Güncellenemedi")
                }
            } else {
                const result = await createReadingList({
                    name: listDialog.data.name,
                    description: listDialog.data.description || undefined,
                    coverUrl: listDialog.data.coverUrl || undefined
                })
                if (result.success && result.list) {
                    toast.success("Liste oluşturuldu")
                    setListDialog({ ...listDialog, open: false })
                    router.refresh()
                } else {
                    toast.error(result.error || "Oluşturulamadı")
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteList = async () => {
        if (!deleteDialog || deleteDialog.type !== "list") return

        setIsLoading(true)
        try {
            const result = await deleteReadingList(deleteDialog.id)
            if (result.success) {
                toast.success("Liste silindi")
                setLists(prev => prev.filter(l => l.id !== deleteDialog.id))
                setSelectedList(null)
                setDeleteDialog(null)
            } else {
                toast.error(result.error || "Silinemedi")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // LEVEL CRUD
    const openLevelDialog = (mode: "create" | "edit", level?: ReadingListLevel) => {
        if (mode === "edit" && level) {
            setLevelDialog({
                open: true,
                mode: "edit",
                levelId: level.id,
                data: { name: level.name, description: level.description || "", coverUrl: level.coverUrl || "" }
            })
        } else {
            setLevelDialog({
                open: true,
                mode: "create",
                levelId: null,
                data: { name: "", description: "", coverUrl: "" }
            })
        }
    }

    const handleLevelSubmit = async () => {
        if (!selectedList || !levelDialog.data.name.trim()) {
            toast.error("Seviye adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            if (levelDialog.mode === "edit" && levelDialog.levelId) {
                const result = await updateLevel(levelDialog.levelId, {
                    name: levelDialog.data.name,
                    description: levelDialog.data.description || undefined,
                    coverUrl: levelDialog.data.coverUrl || undefined
                })
                if (result.success) {
                    toast.success("Seviye güncellendi")
                    await refreshSelectedList(selectedList.slug)
                    setLevelDialog({ ...levelDialog, open: false })
                } else {
                    toast.error(result.error || "Güncellenemedi")
                }
            } else {
                const result = await createLevel({
                    readingListId: selectedList.id,
                    name: levelDialog.data.name,
                    description: levelDialog.data.description || undefined,
                    coverUrl: levelDialog.data.coverUrl || undefined
                })
                if (result.success) {
                    toast.success("Seviye eklendi")
                    await refreshSelectedList(selectedList.slug)
                    setLevelDialog({ ...levelDialog, open: false })
                } else {
                    toast.error(result.error || "Eklenemedi")
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteLevel = async () => {
        if (!deleteDialog || deleteDialog.type !== "level" || !selectedList) return

        setIsLoading(true)
        try {
            const result = await deleteLevel(deleteDialog.id)
            if (result.success) {
                toast.success("Seviye silindi")
                await refreshSelectedList(selectedList.slug)
                setDeleteDialog(null)
            } else {
                toast.error(result.error || "Silinemedi")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // BOOK CRUD
    const openBookDialog = (mode: "add-url" | "add-manual" | "edit", levelId: string, book?: ReadingListBook) => {
        if (mode === "edit" && book) {
            setBookDialog({
                open: true,
                mode: "edit",
                levelId,
                bookId: book.id,
                data: {
                    url: "",
                    title: book.book.title,
                    author: book.book.author?.name || "",
                    pageCount: book.book.pageCount?.toString() || "",
                    neden: book.neden || "",
                    inLibrary: book.book.inLibrary
                }
            })
        } else {
            setBookDialog({
                open: true,
                mode,
                levelId,
                bookId: null,
                data: { url: "", title: "", author: "", pageCount: "", neden: "", inLibrary: false }
            })
        }
    }

    const handleBookSubmit = async () => {
        if (!selectedList || !bookDialog.levelId) return

        setIsLoading(true)
        try {
            if (bookDialog.mode === "edit" && bookDialog.bookId) {
                const result = await updateReadingListBook(bookDialog.bookId, {
                    neden: bookDialog.data.neden || undefined
                })
                if (result.success) {
                    toast.success("Kitap güncellendi")
                    await refreshSelectedList(selectedList.slug)
                    setBookDialog({ ...bookDialog, open: false })
                } else {
                    toast.error(result.error || "Güncellenemedi")
                }
            } else if (bookDialog.mode === "add-url") {
                if (!bookDialog.data.url.trim()) {
                    toast.error("Kitapyurdu URL gerekli")
                    setIsLoading(false)
                    return
                }
                const result = await addBookFromKitapyurduToLevel({
                    levelId: bookDialog.levelId,
                    kitapyurduUrl: bookDialog.data.url,
                    neden: bookDialog.data.neden || undefined,
                    inLibrary: bookDialog.data.inLibrary
                })
                if (result.success) {
                    toast.success(`"${result.bookTitle}" eklendi`)
                    await refreshSelectedList(selectedList.slug)
                    setBookDialog({ ...bookDialog, open: false })
                } else {
                    toast.error(result.error || "Eklenemedi")
                }
            } else {
                if (!bookDialog.data.title.trim() || !bookDialog.data.author.trim()) {
                    toast.error("Kitap adı ve yazar gerekli")
                    setIsLoading(false)
                    return
                }
                const result = await addBookManuallyToLevel({
                    levelId: bookDialog.levelId,
                    title: bookDialog.data.title,
                    author: bookDialog.data.author,
                    pageCount: bookDialog.data.pageCount ? parseInt(bookDialog.data.pageCount) : undefined,
                    neden: bookDialog.data.neden || undefined,
                    inLibrary: bookDialog.data.inLibrary
                })
                if (result.success) {
                    toast.success("Kitap eklendi")
                    await refreshSelectedList(selectedList.slug)
                    setBookDialog({ ...bookDialog, open: false })
                } else {
                    toast.error(result.error || "Eklenemedi")
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteBook = async () => {
        if (!deleteDialog || deleteDialog.type !== "book" || !selectedList) return

        setIsLoading(true)
        try {
            const result = await removeBookFromLevel(deleteDialog.id)
            if (result.success) {
                toast.success("Kitap kaldırıldı")
                await refreshSelectedList(selectedList.slug)
                setDeleteDialog(null)
            } else {
                toast.error(result.error || "Kaldırılamadı")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // REORDER
    const handleLevelDragEnd = async (event: DragEndEvent) => {
        if (!selectedList) return
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = selectedList.levels.findIndex(l => l.id === active.id)
            const newIndex = selectedList.levels.findIndex(l => l.id === over.id)
            const newLevels = arrayMove(selectedList.levels, oldIndex, newIndex)

            // Optimistic update
            setSelectedList({
                ...selectedList,
                levels: newLevels.map((l, i) => ({ ...l, levelNumber: i + 1 }))
            })

            const result = await reorderLevels(selectedList.id, newLevels.map(l => l.id))
            if (!result.success) {
                toast.error("Sıralama güncellenemedi")
                await refreshSelectedList(selectedList.slug)
            }
        }
    }

    const handleBookDragEnd = async (levelId: string, event: DragEndEvent) => {
        if (!selectedList) return
        const { active, over } = event
        if (over && active.id !== over.id) {
            const level = selectedList.levels.find(l => l.id === levelId)
            if (!level) return

            const oldIndex = level.books.findIndex(b => b.id === active.id)
            const newIndex = level.books.findIndex(b => b.id === over.id)
            const newBooks = arrayMove(level.books, oldIndex, newIndex)

            // Optimistic update
            setSelectedList({
                ...selectedList,
                levels: selectedList.levels.map(l =>
                    l.id === levelId ? { ...l, books: newBooks } : l
                )
            })

            const result = await reorderBooksInLevel(levelId, newBooks.map(b => b.id))
            if (!result.success) {
                toast.error("Sıralama güncellenemedi")
                await refreshSelectedList(selectedList.slug)
            }
        }
    }

    // Empty state
    if (lists.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Keşfet & Takip Et</h1>
                        <p className="text-muted-foreground mt-1">
                            Küratörler tarafından hazırlanan tematik okuma yolculuklarına katılın.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma listesi eklenmemiş</p>
                    <Button onClick={() => openListDialog("create")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Liste Oluştur
                    </Button>
                </div>

                {/* Dialogs */}
                <ListDialog
                    dialog={listDialog}
                    setDialog={setListDialog}
                    onSubmit={handleListSubmit}
                    isLoading={isLoading}
                    generateSlug={generateSlug}
                />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header & Breadcrumbs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Okuma Listeleri</span>
                </div>

                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Keşfet & Takip Et</h1>
                        <p className="text-muted-foreground">
                            Küratörler tarafından hazırlanan tematik okuma yolculuklarına katılın.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-muted rounded-lg gap-1 border">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "px-4 py-2 rounded text-sm font-medium transition-colors",
                                    activeTab === "all"
                                        ? "bg-background shadow-sm border text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Tümü
                            </button>
                            <button
                                onClick={() => setActiveTab("popular")}
                                className={cn(
                                    "px-4 py-2 rounded text-sm font-medium transition-colors",
                                    activeTab === "popular"
                                        ? "bg-background shadow-sm border text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Popüler
                            </button>
                            <button
                                onClick={() => setActiveTab("new")}
                                className={cn(
                                    "px-4 py-2 rounded text-sm font-medium transition-colors",
                                    activeTab === "new"
                                        ? "bg-background shadow-sm border text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Yeni
                            </button>
                        </div>

                        {/* Create Button */}
                        <Button onClick={() => openListDialog("create")} className="shadow-lg shadow-primary/25">
                            <Plus className="h-4 w-4 mr-2" />
                            Liste Oluştur
                        </Button>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map((list) => {
                    const progress = getListProgress(list)

                    return (
                        <button
                            key={list.id}
                            onClick={() => handleSelectList(list.slug)}
                            className="group relative flex flex-col justify-end aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 text-left"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                                {list.coverUrl ? (
                                    <Image
                                        src={list.coverUrl}
                                        alt={list.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                                )}
                            </div>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-90" />

                            {/* Content */}
                            <div className="relative p-5 flex flex-col gap-3 z-10">
                                <div className="flex justify-between items-start">
                                    <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {list.levelCount} Seviye
                                    </span>
                                    <Bookmark className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                        {list.name}
                                    </h3>
                                    {list.description && (
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {list.description}
                                        </p>
                                    )}
                                </div>

                                {/* Progress */}
                                <div className="space-y-1.5 mt-2">
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>{progress.completed}/{progress.total} Kitap</span>
                                        <span>{progress.percentage > 0 ? `${progress.percentage}%` : "Başlanmadı"}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                progress.percentage > 0 ? "bg-primary" : "bg-muted"
                                            )}
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Liste Detay Görünümü */}
            {selectedList && (
                <>
                    {/* Divider */}
                    <div className="relative py-6 flex items-center justify-center">
                        <div className="h-px bg-border w-full absolute" />
                        <span className="relative bg-background px-4 text-xs text-muted-foreground font-mono uppercase tracking-wider">
                            Liste Detay Görünümü
                        </span>
                    </div>

                    <div className="rounded-2xl overflow-hidden border bg-card/50">
                        {/* Hero Section */}
                        <div className="relative h-80 md:h-96 w-full flex items-end">
                            {/* Background */}
                            <div className="absolute inset-0">
                                {selectedList.coverUrl ? (
                                    <Image
                                        src={selectedList.coverUrl}
                                        alt={selectedList.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

                            {/* Content */}
                            <div className="relative z-10 p-6 md:p-10 w-full flex flex-col gap-4">
                                <div className="flex gap-2 flex-wrap items-center">
                                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Küratör Seçimi
                                    </span>

                                    {/* Edit Mode Toggle */}
                                    <Button
                                        variant={isEditMode ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setIsEditMode(!isEditMode)}
                                        className="ml-auto"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        {isEditMode ? "Düzenlemeyi Bitir" : "Düzenle"}
                                    </Button>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                                            {selectedList.name}
                                        </h1>

                                        {selectedList.description && (
                                            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed mt-2">
                                                {selectedList.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* List Actions Menu */}
                                    {isEditMode && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openListDialog("edit", selectedList)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Listeyi Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeleteDialog({
                                                        open: true,
                                                        type: "list",
                                                        id: selectedList.id,
                                                        name: selectedList.name
                                                    })}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Listeyi Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{selectedList.totalBooks} Kitap</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{selectedList.levels.length} Seviye</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="font-medium">~{totalPages} Sayfa</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Level Button (Edit Mode) */}
                        {isEditMode && (
                            <div className="p-4 border-b">
                                <Button
                                    variant="outline"
                                    onClick={() => openLevelDialog("create")}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Yeni Seviye Ekle
                                </Button>
                            </div>
                        )}

                        {/* Accordion Levels */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleLevelDragEnd}
                        >
                            <SortableContext
                                items={selectedList.levels.map(l => l.id)}
                                strategy={verticalListSortingStrategy}
                                disabled={!isEditMode}
                            >
                                <div className="flex flex-col">
                                    {selectedList.levels.map((level, index) => {
                                        const isExpanded = expandedLevels.has(level.id)

                                        return (
                                            <LevelAccordion
                                                key={level.id}
                                                level={level}
                                                isExpanded={isExpanded}
                                                isEditMode={isEditMode}
                                                isLast={index === selectedList.levels.length - 1}
                                                onToggle={() => toggleLevel(level.id)}
                                                onEdit={() => openLevelDialog("edit", level)}
                                                onDelete={() => setDeleteDialog({
                                                    open: true,
                                                    type: "level",
                                                    id: level.id,
                                                    name: level.name
                                                })}
                                                onAddBook={(mode) => openBookDialog(mode, level.id)}
                                                onEditBook={(book) => openBookDialog("edit", level.id, book)}
                                                onDeleteBook={(book) => setDeleteDialog({
                                                    open: true,
                                                    type: "book",
                                                    id: book.id,
                                                    name: book.book.title
                                                })}
                                                onBookDragEnd={(e) => handleBookDragEnd(level.id, e)}
                                                sensors={sensors}
                                            />
                                        )
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {selectedList.levels.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="mb-2">Henüz seviye eklenmemiş</p>
                                {isEditMode && (
                                    <Button variant="link" onClick={() => openLevelDialog("create")}>
                                        İlk seviyeyi ekle
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Loading Overlay */}
            {isLoadingDetail && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Dialogs */}
            <ListDialog
                dialog={listDialog}
                setDialog={setListDialog}
                onSubmit={handleListSubmit}
                isLoading={isLoading}
                generateSlug={generateSlug}
            />

            <LevelDialog
                dialog={levelDialog}
                setDialog={setLevelDialog}
                onSubmit={handleLevelSubmit}
                isLoading={isLoading}
            />

            <BookDialog
                dialog={bookDialog}
                setDialog={setBookDialog}
                onSubmit={handleBookSubmit}
                isLoading={isLoading}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{deleteDialog?.name}&quot; silinecek.
                            {deleteDialog?.type === "list" && " Bu işlem tüm seviyeleri ve kitapları da silecektir."}
                            {deleteDialog?.type === "level" && " Bu işlem seviyedeki tüm kitapları da silecektir."}
                            {" "}Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteDialog?.type === "list") handleDeleteList()
                                else if (deleteDialog?.type === "level") handleDeleteLevel()
                                else if (deleteDialog?.type === "book") handleDeleteBook()
                            }}
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

// Level Accordion Component
function LevelAccordion({
    level,
    isExpanded,
    isEditMode,
    isLast,
    onToggle,
    onEdit,
    onDelete,
    onAddBook,
    onEditBook,
    onDeleteBook,
    onBookDragEnd,
    sensors,
}: {
    level: ReadingListLevel
    isExpanded: boolean
    isEditMode: boolean
    isLast: boolean
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onAddBook: (mode: "add-url" | "add-manual") => void
    onEditBook: (book: ReadingListBook) => void
    onDeleteBook: (book: ReadingListBook) => void
    onBookDragEnd: (event: DragEndEvent) => void
    sensors: ReturnType<typeof useSensors>
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: level.id, disabled: !isEditMode })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                !isLast && "border-b",
                isDragging && "opacity-50 shadow-lg z-50"
            )}
        >
            {/* Level Header */}
            <button
                onClick={onToggle}
                className={cn(
                    "relative w-full flex items-center justify-between p-5 transition-colors group text-left overflow-hidden",
                    isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                )}
            >
                {/* Level Cover Background (if expanded and has cover) */}
                {isExpanded && level.coverUrl && (
                    <>
                        <div className="absolute inset-0">
                            <Image
                                src={level.coverUrl}
                                alt={level.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
                    </>
                )}

                <div className="relative flex items-center gap-3">
                    {isEditMode && (
                        <div
                            className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
                            {...attributes}
                            {...listeners}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-5 w-5" />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <h3 className={cn(
                            "text-lg font-bold flex items-center gap-3",
                            isExpanded ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                        )}>
                            <span className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-full text-sm border",
                                isExpanded
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted text-muted-foreground border-transparent group-hover:text-foreground"
                            )}>
                                {level.levelNumber}
                            </span>
                            {level.name}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({level.books.length} kitap)
                            </span>
                        </h3>
                        {level.description && (
                            <p className="text-sm text-muted-foreground pl-11">
                                {level.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="relative flex items-center gap-2">
                    {isEditMode && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); onEdit() }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); onDelete() }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    )}
                </div>
            </button>

            {/* Level Content */}
            {isExpanded && (
                <div className="p-5 bg-background/50">
                    {/* Add Book Buttons (Edit Mode) */}
                    {isEditMode && (
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddBook("add-url")}
                                className="flex-1"
                            >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                URL ile Ekle
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddBook("add-manual")}
                                className="flex-1"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Manuel Ekle
                            </Button>
                        </div>
                    )}

                    {/* Books List */}
                    {isEditMode ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={onBookDragEnd}
                        >
                            <SortableContext
                                items={level.books.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {level.books.map((book) => (
                                        <SortableBookItem
                                            key={book.id}
                                            book={book}
                                            onEdit={() => onEditBook(book)}
                                            onDelete={() => onDeleteBook(book)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {level.books.map((book) => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    )}

                    {level.books.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Bu seviyede henüz kitap yok</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Horizontal Book Card Component (View Mode)
function BookCard({ book }: { book: ReadingListBook }) {
    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"
    const isNotStarted = book.book.status === "TO_READ" || (!isCompleted && !isReading)

    return (
        <Link
            href={`/book/${book.book.id}`}
            className={cn(
                "flex flex-col sm:flex-row gap-4 bg-card rounded-lg p-4 border transition-all group",
                isNotStarted && "opacity-75 hover:opacity-100",
                "hover:border-primary/50"
            )}
        >
            {/* Book Cover */}
            <div className={cn(
                "shrink-0 w-20 sm:w-24 aspect-[2/3] rounded overflow-hidden shadow-md transition-all",
                isNotStarted && "grayscale group-hover:grayscale-0"
            )}>
                {book.book.coverUrl ? (
                    <Image
                        src={book.book.coverUrl}
                        alt={book.book.title}
                        width={96}
                        height={144}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                )}
            </div>

            {/* Book Info */}
            <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-1">
                            {book.book.title}
                        </h4>

                        {/* Status Badge */}
                        {isCompleted && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full shrink-0">
                                <Check className="h-3 w-3" />
                                Okundu
                            </span>
                        )}
                        {isReading && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                                <BookOpen className="h-3 w-3" />
                                Okunuyor
                            </span>
                        )}
                        {isNotStarted && (
                            <span className="text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                                Sırada
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                        {book.book.author?.name || "Bilinmeyen Yazar"}
                    </p>

                    {/* Neden Tag */}
                    {book.neden && (
                        <div className="inline-flex items-start gap-2 bg-muted/50 border rounded-md px-2 py-1.5 max-w-fit">
                            <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground">
                                <span className="text-primary font-semibold">Neden: </span>
                                {book.neden}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end mt-3 sm:mt-0">
                    {isNotStarted ? (
                        <Button size="sm" className="gap-1">
                            <Play className="h-4 w-4" />
                            Başla
                        </Button>
                    ) : (
                        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}

// List Dialog Component
type ListDialogType = {
    open: boolean
    mode: "create" | "edit"
    data: { name: string; description: string; coverUrl: string; slug: string }
}

function ListDialog({
    dialog,
    setDialog,
    onSubmit,
    isLoading,
    generateSlug,
}: {
    dialog: ListDialogType
    setDialog: React.Dispatch<React.SetStateAction<ListDialogType>>
    onSubmit: () => void
    isLoading: boolean
    generateSlug: (name: string) => string
}) {
    return (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ ...dialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {dialog.mode === "edit" ? "Listeyi Düzenle" : "Yeni Okuma Listesi"}
                    </DialogTitle>
                    <DialogDescription>
                        Okuma listesi bilgilerini girin
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Liste Adı</Label>
                        <Input
                            placeholder="Örn: Bilim Kurgu Klasikleri"
                            value={dialog.data.name}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: {
                                    ...dialog.data,
                                    name: e.target.value,
                                    slug: dialog.mode === "create" ? generateSlug(e.target.value) : dialog.data.slug
                                }
                            })}
                        />
                    </div>
                    {dialog.mode === "edit" && (
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                value={dialog.data.slug}
                                onChange={(e) => setDialog({
                                    ...dialog,
                                    data: { ...dialog.data, slug: e.target.value }
                                })}
                            />
                            <p className="text-xs text-muted-foreground">
                                URL: /reading-lists/{dialog.data.slug}
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Açıklama (Opsiyonel)</Label>
                        <Textarea
                            placeholder="Bu liste hakkında kısa bir açıklama..."
                            value={dialog.data.description}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, description: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Kapak URL (Opsiyonel)</Label>
                        <Input
                            placeholder="https://..."
                            value={dialog.data.coverUrl}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, coverUrl: e.target.value }
                            })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {dialog.mode === "edit" ? "Güncelle" : "Oluştur"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Level Dialog Component
type LevelDialogType = {
    open: boolean
    mode: "create" | "edit"
    levelId: string | null
    data: { name: string; description: string; coverUrl: string }
}

function LevelDialog({
    dialog,
    setDialog,
    onSubmit,
    isLoading,
}: {
    dialog: LevelDialogType
    setDialog: React.Dispatch<React.SetStateAction<LevelDialogType>>
    onSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ ...dialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {dialog.mode === "edit" ? "Seviyeyi Düzenle" : "Yeni Seviye Ekle"}
                    </DialogTitle>
                    <DialogDescription>
                        Seviye bilgilerini girin
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Seviye Adı</Label>
                        <Input
                            placeholder="Örn: Başlangıç"
                            value={dialog.data.name}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, name: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama (Opsiyonel)</Label>
                        <Textarea
                            placeholder="Bu seviyede..."
                            value={dialog.data.description}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, description: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Kapak Görseli URL (Opsiyonel)</Label>
                        <Input
                            placeholder="https://..."
                            value={dialog.data.coverUrl}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, coverUrl: e.target.value }
                            })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Seviye için bir arka plan görseli belirleyin
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading || !dialog.data.name.trim()}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {dialog.mode === "edit" ? "Güncelle" : "Ekle"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Book Dialog Component
type BookDialogType = {
    open: boolean
    mode: "add-url" | "add-manual" | "edit"
    levelId: string | null
    bookId: string | null
    data: { url: string; title: string; author: string; pageCount: string; neden: string; inLibrary: boolean }
}

function BookDialog({
    dialog,
    setDialog,
    onSubmit,
    isLoading,
}: {
    dialog: BookDialogType
    setDialog: React.Dispatch<React.SetStateAction<BookDialogType>>
    onSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ ...dialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {dialog.mode === "edit" ? "Kitabı Düzenle" : dialog.mode === "add-url" ? "URL ile Kitap Ekle" : "Manuel Kitap Ekle"}
                    </DialogTitle>
                    <DialogDescription>
                        {dialog.mode === "add-url" ? "Kitapyurdu URL'si girerek kitap ekleyin" : "Kitap bilgilerini girin"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {dialog.mode === "add-url" && (
                        <div className="space-y-2">
                            <Label>Kitapyurdu URL</Label>
                            <Input
                                placeholder="https://www.kitapyurdu.com/kitap/..."
                                value={dialog.data.url}
                                onChange={(e) => setDialog({
                                    ...dialog,
                                    data: { ...dialog.data, url: e.target.value }
                                })}
                            />
                        </div>
                    )}

                    {dialog.mode === "add-manual" && (
                        <>
                            <div className="space-y-2">
                                <Label>Kitap Adı</Label>
                                <Input
                                    placeholder="Dune"
                                    value={dialog.data.title}
                                    onChange={(e) => setDialog({
                                        ...dialog,
                                        data: { ...dialog.data, title: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Yazar</Label>
                                <Input
                                    placeholder="Frank Herbert"
                                    value={dialog.data.author}
                                    onChange={(e) => setDialog({
                                        ...dialog,
                                        data: { ...dialog.data, author: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sayfa Sayısı (Opsiyonel)</Label>
                                <Input
                                    type="number"
                                    placeholder="412"
                                    value={dialog.data.pageCount}
                                    onChange={(e) => setDialog({
                                        ...dialog,
                                        data: { ...dialog.data, pageCount: e.target.value }
                                    })}
                                />
                            </div>
                        </>
                    )}

                    {dialog.mode === "edit" && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">{dialog.data.title}</p>
                            <p className="text-sm text-muted-foreground">{dialog.data.author}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Neden Bu Kitap? (Opsiyonel)</Label>
                        <Textarea
                            placeholder="Bu kitap türün temel taşıdır çünkü..."
                            value={dialog.data.neden}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, neden: e.target.value }
                            })}
                            rows={3}
                        />
                    </div>

                    {dialog.mode !== "edit" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="inLibrary"
                                checked={dialog.data.inLibrary}
                                onChange={(e) => setDialog({
                                    ...dialog,
                                    data: { ...dialog.data, inLibrary: e.target.checked }
                                })}
                                className="rounded border-border"
                            />
                            <Label htmlFor="inLibrary" className="text-sm font-normal cursor-pointer">
                                Kütüphanemde var
                            </Label>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {dialog.mode === "edit" ? "Güncelle" : "Ekle"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Legacy exports for backward compatibility
export function ReadingListsClient({ lists }: { lists: ReadingListWithCount[] }) {
    return null
}

export function CopyAllListsButton({ lists }: { lists: ReadingListWithCount[] }) {
    const handleCopyAllAsJson = () => {
        const jsonData = lists.map(list => ({
            name: list.name,
            slug: list.slug,
            description: list.description,
            levelCount: list._count?.levels || list.levels?.length || 0,
            totalBooks: list.levels?.reduce((sum: number, l: { _count?: { books: number } }) =>
                sum + (l._count?.books || 0), 0) || 0
        }))

        navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
            .then(() => toast.success("Tüm listeler JSON olarak kopyalandı"))
            .catch(() => toast.error("Kopyalama başarısız"))
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllAsJson}
            className="gap-2"
        >
            JSON Kopyala
        </Button>
    )
}
