"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
    Plus,
    Search,
    BookOpen,
    Grid3X3,
    BookMarked,
    CheckCircle2,
    Clock,
    XCircle,
    Library,
    Layers,
    MoreVertical,
    Edit,
    Trash2,
    FolderPlus,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author, Publisher, Shelf } from "@prisma/client"
import { createShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf } from "@/actions/shelf"
import { toast } from "sonner"

type BookWithRelations = Book & {
    author: Author | null
    publisher: Publisher | null
    shelf: Shelf | null
}

type ShelfWithBooks = Shelf & {
    books: BookWithRelations[]
    _count: { books: number }
}

interface LibraryClientProps {
    books: BookWithRelations[]
    shelves: ShelfWithBooks[]
}

type StatusFilter = "ALL" | BookStatus

const statusConfig: Record<StatusFilter, { label: string; icon: React.ReactNode; color: string }> = {
    ALL: { label: "Tümü", icon: <Library className="h-4 w-4" />, color: "text-foreground" },
    READING: { label: "Okunuyor", icon: <BookOpen className="h-4 w-4" />, color: "text-yellow-600" },
    TO_READ: { label: "Okunacak", icon: <BookMarked className="h-4 w-4" />, color: "text-blue-600" },
    COMPLETED: { label: "Okudum", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
    DNF: { label: "Yarım Bıraktım", icon: <XCircle className="h-4 w-4" />, color: "text-red-600" },
}

const statusBadgeConfig: Record<BookStatus, { label: string; bgColor: string }> = {
    TO_READ: { label: "Okunacak", bgColor: "bg-blue-600" },
    READING: { label: "Okunuyor", bgColor: "bg-yellow-600" },
    COMPLETED: { label: "Okudum", bgColor: "bg-green-600" },
    DNF: { label: "Yarım Bırakıldı", bgColor: "bg-red-600" },
}

const shelfColors = [
    { name: "Varsayılan", value: null },
    { name: "Kırmızı", value: "#ef4444" },
    { name: "Turuncu", value: "#f97316" },
    { name: "Sarı", value: "#eab308" },
    { name: "Yeşil", value: "#22c55e" },
    { name: "Mavi", value: "#3b82f6" },
    { name: "Mor", value: "#8b5cf6" },
    { name: "Pembe", value: "#ec4899" },
]

export default function LibraryClient({ books, shelves }: LibraryClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"cards" | "shelves">("shelves")
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    // Shelf management
    const [showShelfDialog, setShowShelfDialog] = useState(false)
    const [editingShelf, setEditingShelf] = useState<ShelfWithBooks | null>(null)
    const [shelfName, setShelfName] = useState("")
    const [shelfColor, setShelfColor] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Book to shelf assignment
    const [showAssignDialog, setShowAssignDialog] = useState(false)
    const [selectedBook, setSelectedBook] = useState<BookWithRelations | null>(null)

    // Calculate stats
    const stats = useMemo(() => {
        return {
            total: books.length,
            reading: books.filter(b => b.status === "READING").length,
            toRead: books.filter(b => b.status === "TO_READ").length,
            completed: books.filter(b => b.status === "COMPLETED").length,
            dnf: books.filter(b => b.status === "DNF").length,
        }
    }, [books])

    // Filter books for card view
    const filteredBooks = useMemo(() => {
        let result = books

        if (activeStatus !== "ALL") {
            result = result.filter(b => b.status === activeStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) ||
                     (b.author?.name || "").toLowerCase().includes(query)
            )
        }

        return result
    }, [books, activeStatus, searchQuery])

    // Books not in any shelf (with filters applied)
    const unshelfedBooks = useMemo(() => {
        let result = books.filter(b => !b.shelfId)

        if (activeStatus !== "ALL") {
            result = result.filter(b => b.status === activeStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) ||
                     (b.author?.name || "").toLowerCase().includes(query)
            )
        }

        return result
    }, [books, activeStatus, searchQuery])

    // Filter books in shelves based on status and search
    const getFilteredShelfBooks = (shelfBooks: BookWithRelations[]) => {
        let result = shelfBooks

        if (activeStatus !== "ALL") {
            result = result.filter(b => b.status === activeStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) ||
                     (b.author?.name || "").toLowerCase().includes(query)
            )
        }

        return result
    }

    // Filtered shelves (only show shelves that have matching books)
    const filteredShelves = useMemo(() => {
        return shelves.map(shelf => ({
            ...shelf,
            filteredBooks: getFilteredShelfBooks(shelf.books)
        })).filter(shelf => shelf.filteredBooks.length > 0 || (activeStatus === "ALL" && !searchQuery))
    }, [shelves, activeStatus, searchQuery])

    const getStatusCount = (status: StatusFilter): number => {
        if (status === "ALL") return stats.total
        if (status === "READING") return stats.reading
        if (status === "TO_READ") return stats.toRead
        if (status === "COMPLETED") return stats.completed
        if (status === "DNF") return stats.dnf
        return 0
    }

    // Shelf handlers
    const handleCreateShelf = async () => {
        if (!shelfName.trim()) {
            toast.error("Raf adı gerekli")
            return
        }

        setIsSubmitting(true)
        const result = await createShelf({
            name: shelfName,
            color: shelfColor || undefined
        })

        if (result.success) {
            toast.success("Raf oluşturuldu")
            setShowShelfDialog(false)
            setShelfName("")
            setShelfColor(null)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsSubmitting(false)
    }

    const handleUpdateShelf = async () => {
        if (!editingShelf || !shelfName.trim()) return

        setIsSubmitting(true)
        const result = await updateShelf(editingShelf.id, {
            name: shelfName,
            color: shelfColor
        } as { name?: string; color?: string | null })

        if (result.success) {
            toast.success("Raf güncellendi")
            setShowShelfDialog(false)
            setEditingShelf(null)
            setShelfName("")
            setShelfColor(null)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsSubmitting(false)
    }

    const handleDeleteShelf = async (shelf: ShelfWithBooks) => {
        if (!confirm(`"${shelf.name}" rafını silmek istediğinize emin misiniz? Kitaplar silinmez, sadece raftan çıkarılır.`)) {
            return
        }

        const result = await deleteShelf(shelf.id)
        if (result.success) {
            toast.success("Raf silindi")
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    const openEditShelf = (shelf: ShelfWithBooks) => {
        setEditingShelf(shelf)
        setShelfName(shelf.name)
        setShelfColor(shelf.color)
        setShowShelfDialog(true)
    }

    const openNewShelf = () => {
        setEditingShelf(null)
        setShelfName("")
        setShelfColor(null)
        setShowShelfDialog(true)
    }

    const handleAssignToShelf = async (shelfId: string | null) => {
        if (!selectedBook) return

        setIsSubmitting(true)

        if (shelfId === null) {
            const result = await removeBookFromShelf(selectedBook.id)
            if (result.success) {
                toast.success("Kitap raftan çıkarıldı")
            } else {
                toast.error(result.error)
            }
        } else {
            const result = await addBookToShelf(selectedBook.id, shelfId)
            if (result.success) {
                toast.success("Kitap rafa eklendi")
            } else {
                toast.error(result.error)
            }
        }

        setShowAssignDialog(false)
        setSelectedBook(null)
        setIsSubmitting(false)
        router.refresh()
    }

    // Book Card Component
    const BookCard = ({ book, showShelfButton = false }: { book: BookWithRelations; showShelfButton?: boolean }) => (
        <div className="group relative">
            <Link href={`/book/${book.id}`}>
                <div className="relative aspect-[2/3] rounded overflow-hidden bg-muted shadow group-hover:shadow-lg transition-shadow">
                    {book.coverUrl ? (
                        <Image
                            src={book.coverUrl.replace("http:", "https:")}
                            alt={book.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <BookOpen className="h-6 w-6" />
                        </div>
                    )}
                    <div className={cn(
                        "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white",
                        statusBadgeConfig[book.status].bgColor
                    )}>
                        {statusBadgeConfig[book.status].label}
                    </div>
                    {book.status === "READING" && book.pageCount && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="text-white text-[10px] text-center mb-0.5">
                                {Math.round((book.currentPage / book.pageCount) * 100)}%
                            </div>
                            <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full"
                                    style={{ width: `${(book.currentPage / book.pageCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-1.5">
                    <h3 className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {book.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {book.author?.name || "Bilinmiyor"}
                    </p>
                </div>
            </Link>
            {showShelfButton && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.preventDefault()
                        setSelectedBook(book)
                        setShowAssignDialog(true)
                    }}
                >
                    <FolderPlus className="h-3 w-3" />
                </Button>
            )}
        </div>
    )

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    <Button asChild className="w-full mb-6">
                        <Link href="/library/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Kitap Ekle
                        </Link>
                    </Button>

                    {/* Status Filters */}
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Durum
                        </h3>
                        {(Object.keys(statusConfig) as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveStatus(status)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                    activeStatus === status
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {statusConfig[status].icon}
                                    {statusConfig[status].label}
                                </span>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    activeStatus === status
                                        ? "bg-primary-foreground/20"
                                        : "bg-muted-foreground/20"
                                )}>
                                    {getStatusCount(status)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-sm font-semibold mb-3">İstatistikler</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Kitap</span>
                                <span className="font-medium">{stats.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Okunan</span>
                                <span className="font-medium">{stats.completed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Raf Sayısı</span>
                                <span className="font-medium">{shelves.length}</span>
                            </div>
                            {stats.total > 0 && (
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-muted-foreground">Tamamlama</span>
                                        <span className="font-medium">
                                            {Math.round((stats.completed / stats.total) * 100)}%
                                        </span>
                                    </div>
                                    <Progress value={(stats.completed / stats.total) * 100} className="h-1.5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {/* Unified Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {activeTab === "shelves" ? "Raflarım" : statusConfig[activeStatus].label}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {activeTab === "shelves"
                                ? `${filteredShelves.length} raf, ${filteredShelves.reduce((acc, s) => acc + s.filteredBooks.length, 0) + unshelfedBooks.length} kitap${(activeStatus !== "ALL" || searchQuery) ? ` (filtrelenmiş)` : ""}`
                                : `${filteredBooks.length} kitap`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Kitap veya yazar ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Button variant="outline" size="icon" onClick={openNewShelf} title="Raf Ekle">
                            <FolderPlus className="h-4 w-4" />
                        </Button>

                        <div className="flex border rounded-lg">
                            <Button
                                variant={activeTab === "cards" ? "secondary" : "ghost"}
                                size="icon"
                                className="rounded-r-none"
                                onClick={() => setActiveTab("cards")}
                                title="Kart Görünümü"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={activeTab === "shelves" ? "secondary" : "ghost"}
                                size="icon"
                                className="rounded-l-none"
                                onClick={() => setActiveTab("shelves")}
                                title="Raf Görünümü"
                            >
                                <Layers className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Card View */}
                {activeTab === "cards" && (
                    <>
                        {filteredBooks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                {searchQuery ? (
                                    <>
                                        <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                                            Aramayı Temizle
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground mb-4">Bu kategoride henüz kitap yok</p>
                                        <Button asChild variant="outline">
                                            <Link href="/library/add">Kitap Ekle</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                                {filteredBooks.map((book) => (
                                    <BookCard key={book.id} book={book} showShelfButton />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Shelf View */}
                {activeTab === "shelves" && (
                    <div className="space-y-8">
                        {filteredShelves.map((shelf) => (
                            <div key={shelf.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: shelf.color || '#6b7280' }}
                                        />
                                        <h2 className="text-lg font-semibold">{shelf.name}</h2>
                                        <span className="text-sm text-muted-foreground">
                                            ({shelf.filteredBooks.length}{(activeStatus !== "ALL" || searchQuery) && `/${shelf.books.length}`} kitap)
                                        </span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditShelf(shelf)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteShelf(shelf)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                {shelf.filteredBooks.length > 0 ? (
                                    <div className="grid gap-3 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                                        {shelf.filteredBooks.map((book) => (
                                            <BookCard key={book.id} book={book} showShelfButton />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                                        <p className="text-sm text-muted-foreground">
                                            Bu rafta henüz kitap yok
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Unshelved Books */}
                        {unshelfedBooks.length > 0 && (
                            <div className="border rounded-lg p-4 border-dashed">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                                    <h2 className="text-lg font-semibold text-muted-foreground">
                                        Rafsız Kitaplar
                                    </h2>
                                    <span className="text-sm text-muted-foreground">
                                        ({unshelfedBooks.length} kitap)
                                    </span>
                                </div>
                                <div className="grid gap-3 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                                    {unshelfedBooks.map((book) => (
                                        <BookCard key={book.id} book={book} showShelfButton />
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredShelves.length === 0 && unshelfedBooks.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                                {(activeStatus !== "ALL" || searchQuery) ? (
                                    <>
                                        <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                                        <Button variant="outline" onClick={() => {
                                            setActiveStatus("ALL")
                                            setSearchQuery("")
                                        }}>
                                            Filtreleri Temizle
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground mb-4">Henüz raf oluşturmadınız</p>
                                        <Button onClick={openNewShelf}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            İlk Rafı Oluştur
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Shelf Create/Edit Dialog */}
            <Dialog open={showShelfDialog} onOpenChange={setShowShelfDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingShelf ? "Rafı Düzenle" : "Yeni Raf Oluştur"}
                        </DialogTitle>
                        <DialogDescription>
                            Kitaplarınızı organize etmek için raf oluşturun
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="shelfName">Raf Adı</Label>
                            <Input
                                id="shelfName"
                                placeholder="örn: Fantastik, Bilim Kurgu..."
                                value={shelfName}
                                onChange={(e) => setShelfName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Renk</Label>
                            <div className="flex flex-wrap gap-2">
                                {shelfColors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setShelfColor(color.value)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-all",
                                            shelfColor === color.value
                                                ? "border-primary scale-110"
                                                : "border-transparent hover:scale-105"
                                        )}
                                        style={{ backgroundColor: color.value || '#6b7280' }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowShelfDialog(false)}>
                            Vazgeç
                        </Button>
                        <Button
                            onClick={editingShelf ? handleUpdateShelf : handleCreateShelf}
                            disabled={isSubmitting || !shelfName.trim()}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingShelf ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign to Shelf Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rafa Ekle</DialogTitle>
                        <DialogDescription>
                            {selectedBook?.title} kitabını hangi rafa eklemek istiyorsunuz?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        {selectedBook?.shelfId && (
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleAssignToShelf(null)}
                                disabled={isSubmitting}
                            >
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                Raftan Çıkar
                            </Button>
                        )}
                        {shelves.map((shelf) => (
                            <Button
                                key={shelf.id}
                                variant={selectedBook?.shelfId === shelf.id ? "secondary" : "outline"}
                                className="w-full justify-start"
                                onClick={() => handleAssignToShelf(shelf.id)}
                                disabled={isSubmitting || selectedBook?.shelfId === shelf.id}
                            >
                                <div
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: shelf.color || '#6b7280' }}
                                />
                                {shelf.name}
                                {selectedBook?.shelfId === shelf.id && (
                                    <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />
                                )}
                            </Button>
                        ))}
                        {shelves.length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-4">Henüz raf yok</p>
                                <Button onClick={() => {
                                    setShowAssignDialog(false)
                                    openNewShelf()
                                }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Raf Oluştur
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
