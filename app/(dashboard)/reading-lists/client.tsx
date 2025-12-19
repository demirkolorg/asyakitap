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
    Map,
    Plus,
    Loader2,
    BookOpen,
    Layers,
    Sparkles,
    Search,
    Bookmark,
    CheckCircle2,
    Clock,
    ChevronUp,
    ChevronDown,
    Lightbulb,
    MoreHorizontal,
    Play,
    FileText,
    Check
} from "lucide-react"
import { toast } from "sonner"
import { createReadingList, getReadingListDetail } from "@/actions/reading-lists"
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

export function ReadingListsPageClient({ lists, allLists }: ReadingListsPageClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"all" | "popular" | "new">("all")
    const [selectedList, setSelectedList] = useState<ReadingListDetail | null>(null)
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [createDialog, setCreateDialog] = useState<{
        open: boolean
        name: string
        description: string
        coverUrl: string
    }>({ open: false, name: "", description: "", coverUrl: "" })

    // Toplam sayfa hesapla
    const totalPages = selectedList?.levels.reduce((sum, level) =>
        sum + level.books.reduce((bookSum, book) => bookSum + (book.book.pageCount || 0), 0), 0) || 0

    // İlerleme hesapla
    const getListProgress = (list: ReadingListSummary) => {
        // Basit bir hesaplama - gerçek veri olmalı
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

    const handleSelectList = async (slug: string) => {
        setIsLoadingDetail(true)
        try {
            const detail = await getReadingListDetail(slug)
            if (detail) {
                setSelectedList(detail)
                // İlk seviyeyi otomatik aç
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

    const handleCreateSubmit = async () => {
        if (!createDialog.name.trim()) {
            toast.error("Liste adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createReadingList({
                name: createDialog.name,
                description: createDialog.description || undefined,
                coverUrl: createDialog.coverUrl || undefined
            })
            if (result.success && result.list) {
                toast.success("Liste oluşturuldu")
                setCreateDialog({ open: false, name: "", description: "", coverUrl: "" })
                router.push(`/reading-lists/${result.list.slug}`)
            } else {
                toast.error(result.error || "Liste oluşturulamadı")
            }
        } finally {
            setIsLoading(false)
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
                    <Button onClick={() => setCreateDialog({ open: true, name: "", description: "", coverUrl: "" })}>
                        <Plus className="h-4 w-4 mr-2" />
                        Liste Oluştur
                    </Button>
                </div>

                <CreateListDialog
                    createDialog={createDialog}
                    setCreateDialog={setCreateDialog}
                    handleCreateSubmit={handleCreateSubmit}
                    isLoading={isLoading}
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
                            <div className="relative z-10 p-6 md:p-10 w-full max-w-4xl flex flex-col gap-4">
                                <div className="flex gap-2 flex-wrap">
                                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Küratör Seçimi
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                                    {selectedList.name}
                                </h1>

                                {selectedList.description && (
                                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                                        {selectedList.description}
                                    </p>
                                )}

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

                        {/* Accordion Levels */}
                        <div className="flex flex-col">
                            {selectedList.levels.map((level, index) => {
                                const isExpanded = expandedLevels.has(level.id)
                                const completedBooks = level.books.filter(b => b.book.status === "COMPLETED").length

                                return (
                                    <div key={level.id} className={cn(index < selectedList.levels.length - 1 && "border-b")}>
                                        {/* Level Header */}
                                        <button
                                            onClick={() => toggleLevel(level.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-5 transition-colors group text-left",
                                                isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                                            )}
                                        >
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
                                                </h3>
                                                {level.description && (
                                                    <p className="text-sm text-muted-foreground pl-11">
                                                        {level.description}
                                                    </p>
                                                )}
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-primary" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                            )}
                                        </button>

                                        {/* Level Content */}
                                        {isExpanded && (
                                            <div className="p-5 bg-background/50">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                    {level.books.map((book) => (
                                                        <BookCard key={book.id} book={book} />
                                                    ))}
                                                </div>

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
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Loading Overlay */}
            {isLoadingDetail && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Create Dialog */}
            <CreateListDialog
                createDialog={createDialog}
                setCreateDialog={setCreateDialog}
                handleCreateSubmit={handleCreateSubmit}
                isLoading={isLoading}
            />
        </div>
    )
}

// Horizontal Book Card Component
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

// Create List Dialog Component
function CreateListDialog({
    createDialog,
    setCreateDialog,
    handleCreateSubmit,
    isLoading
}: {
    createDialog: { open: boolean; name: string; description: string; coverUrl: string }
    setCreateDialog: (dialog: { open: boolean; name: string; description: string; coverUrl: string }) => void
    handleCreateSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={createDialog.open} onOpenChange={(open) => !open && setCreateDialog({ ...createDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Okuma Listesi</DialogTitle>
                    <DialogDescription>
                        Yeni bir tematik okuma listesi oluşturun
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="list-name">Liste Adı</Label>
                        <Input
                            id="list-name"
                            placeholder="Örn: Bilim Kurgu Klasikleri"
                            value={createDialog.name}
                            onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="list-description">Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="list-description"
                            placeholder="Bu liste hakkında kısa bir açıklama..."
                            value={createDialog.description}
                            onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="list-cover">Kapak URL (Opsiyonel)</Label>
                        <Input
                            id="list-cover"
                            placeholder="https://..."
                            value={createDialog.coverUrl}
                            onChange={(e) => setCreateDialog({ ...createDialog, coverUrl: e.target.value })}
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
