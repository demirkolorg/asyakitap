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
    BookMarked,
    Share2,
    Bookmark,
    CheckCircle2,
    Clock,
    FileText
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
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedList, setSelectedList] = useState<ReadingListDetail | null>(null)
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [createDialog, setCreateDialog] = useState<{
        open: boolean
        name: string
        description: string
        coverUrl: string
    }>({ open: false, name: "", description: "", coverUrl: "" })

    // Popüler listeler (ilk 2 veya featured olanlar)
    const featuredLists = lists.slice(0, 2)

    // Seçili seviye
    const selectedLevel = selectedList?.levels.find(l => l.id === selectedLevelId) ||
        selectedList?.levels[0]

    // Seviyedeki toplam sayfa sayısı
    const levelTotalPages = selectedLevel?.books.reduce((sum, b) => sum + (b.book.pageCount || 0), 0) || 0

    const handleSelectList = async (slug: string) => {
        setIsLoadingDetail(true)
        try {
            const detail = await getReadingListDetail(slug)
            if (detail) {
                setSelectedList(detail)
                setSelectedLevelId(detail.levels[0]?.id || null)
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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Tematik Okuma Listeleri</h1>
                        <p className="text-muted-foreground mt-1">
                            İlgi alanlarınıza göre özenle hazırlanmış, seviyelendirilmiş okuma yolculukları keşfedin.
                        </p>
                    </div>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma listesi eklenmemiş</p>
                    <p className="text-sm text-muted-foreground mb-4">Yukarıdaki &quot;Yeni Liste&quot; butonunu kullanarak başlayın</p>
                    <Button
                        onClick={() => setCreateDialog({ open: true, name: "", description: "", coverUrl: "" })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Liste Oluştur
                    </Button>
                </div>

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Okuma Listeleri</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">Tematik Okuma Listeleri</h1>
                    <p className="text-muted-foreground mt-1">
                        İlgi alanlarınıza göre özenle hazırlanmış, seviyelendirilmiş okuma yolculukları keşfedin.
                    </p>
                </div>

                {/* Search */}
                <div className="w-full md:w-auto md:min-w-[280px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Liste veya kitap ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Popüler Listeler Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Popüler Listeler
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {featuredLists.map((list) => (
                        <div
                            key={list.id}
                            className="group flex flex-col sm:flex-row items-stretch rounded-xl bg-card border hover:border-primary/50 transition-all overflow-hidden shadow-sm hover:shadow-md"
                        >
                            {/* Cover Image */}
                            <div className="w-full sm:w-44 h-36 sm:h-auto relative shrink-0 overflow-hidden">
                                {list.coverUrl ? (
                                    <Image
                                        src={list.coverUrl}
                                        alt={list.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <Map className="h-10 w-10 text-primary/40" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 p-4 justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                            {list.name}
                                        </h3>
                                        <Bookmark className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    {list.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {list.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-end justify-between gap-3 mt-auto">
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">
                                            {list.levelCount} Seviye
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">
                                            {list.totalBooks} Kitap
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSelectList(list.slug)}
                                        disabled={isLoadingDetail}
                                    >
                                        {isLoadingDetail ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "İncele"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Divider */}
            <div className="w-full h-px bg-border" />

            {/* Liste Detay Görünümü */}
            {selectedList ? (
                <section className="space-y-6">
                    {/* Liste Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded bg-primary text-primary-foreground">
                                <BookMarked className="h-5 w-5" />
                            </div>
                            {selectedList.name}
                            <span className="text-muted-foreground font-normal text-base ml-2 hidden sm:inline">
                                / Detay
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Bookmark className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Seviye Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b scrollbar-hide">
                        {selectedList.levels.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => setSelectedLevelId(level.id)}
                                className={cn(
                                    "flex-none px-4 py-2 rounded-t-lg border-b-2 text-sm font-medium transition-all whitespace-nowrap",
                                    selectedLevelId === level.id || (!selectedLevelId && level.id === selectedList.levels[0]?.id)
                                        ? "bg-card border-primary text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                Seviye {level.levelNumber}: {level.name}
                            </button>
                        ))}
                    </div>

                    {/* Seviye Bilgisi */}
                    {selectedLevel && (
                        <div className="bg-muted/30 rounded-xl p-5 border flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <h3 className="text-primary text-xs font-bold uppercase tracking-wider mb-1">
                                    Seviye {selectedLevel.levelNumber}
                                </h3>
                                <p className="text-lg font-bold mb-2">{selectedLevel.name}</p>
                                {selectedLevel.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                                        {selectedLevel.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 bg-background p-3 rounded-lg border">
                                <div className="text-center px-2">
                                    <span className="block text-xl font-bold">{selectedLevel.books.length}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">Kitap</span>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div className="text-center px-2">
                                    <span className="block text-xl font-bold">~{levelTotalPages}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">Sayfa</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Kitap Kartları Grid */}
                    {selectedLevel && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {selectedLevel.books.map((book) => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                /* Tüm Listeler Grid */
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Tüm Listeler</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {lists.map((list) => (
                            <button
                                key={list.id}
                                onClick={() => handleSelectList(list.slug)}
                                className="group text-left block"
                            >
                                <div className="relative flex flex-col rounded-xl border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all h-full">
                                    {/* Cover Image */}
                                    <div className="relative aspect-[16/9] overflow-hidden">
                                        {list.coverUrl ? (
                                            <Image
                                                src={list.coverUrl}
                                                alt={list.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <Map className="h-10 w-10 text-primary/40" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col">
                                        <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                            {list.name}
                                        </h2>

                                        {list.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                                                {list.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Layers className="h-3.5 w-3.5" />
                                                {list.levelCount} seviye
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                {list.totalBooks} kitap
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
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

// Book Card Component
function BookCard({ book }: { book: ReadingListBook }) {
    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"

    return (
        <Link
            href={`/book/${book.book.id}`}
            className="group flex flex-col bg-card rounded-xl overflow-hidden border hover:border-primary hover:-translate-y-1 transition-all shadow-sm"
        >
            {/* Book Cover */}
            <div className="relative w-full aspect-[2/3] overflow-hidden">
                {book.book.coverUrl ? (
                    <Image
                        src={book.book.coverUrl}
                        alt={book.book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                )}

                {/* Status Badge */}
                {isCompleted && (
                    <div className="absolute top-3 right-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white shadow-lg">
                            <CheckCircle2 className="h-5 w-5" />
                        </span>
                    </div>
                )}
                {isReading && (
                    <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/90 text-white text-xs font-bold shadow-lg">
                            <Clock className="h-3.5 w-3.5" />
                            Okunuyor
                        </span>
                    </div>
                )}
                {!isCompleted && !isReading && (
                    <div className="absolute top-3 right-3">
                        <button className="flex items-center justify-center h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Book Info */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                <div>
                    <h4 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {book.book.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {book.book.author?.name || "Bilinmeyen Yazar"}
                    </p>
                </div>

                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {book.book.pageCount || "-"} Sayfa
                </div>

                {/* Neden */}
                {book.neden && (
                    <div className="mt-auto pt-3 border-t">
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
                            Listeye Giriş Nedeni
                        </p>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-3">
                            {book.neden}
                        </p>
                    </div>
                )}
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

// Legacy export for backward compatibility
export function ReadingListsClient({ lists }: { lists: ReadingListWithCount[] }) {
    return null // No longer used
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
