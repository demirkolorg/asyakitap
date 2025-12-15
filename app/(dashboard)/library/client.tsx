"use client"

import { useState, useMemo, useTransition } from "react"
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    Plus,
    Search,
    BookOpen,
    Grid3X3,
    BookMarked,
    CheckCircle2,
    XCircle,
    Library,
    Layers,
    Map,
    ExternalLink,
    Loader2,
    Target,
    Calendar,
    Lock,
    Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author, Publisher } from "@prisma/client"
import { getReadingListColor } from "@/lib/reading-list-colors"
import { getReadingLists, linkBookToReadingList } from "@/actions/reading-lists"
import { toast } from "sonner"

type BookWithRelations = Book & {
    author: Author | null
    publisher: Publisher | null
}

interface BookLevel {
    levelNumber: number
    levelName: string
    books: BookWithRelations[]
}

interface BookGroup {
    id: string
    name: string
    levels?: BookLevel[]
    books: BookWithRelations[]
}

interface LinkedBookInfo {
    id: string
    title: string
    coverUrl: string | null
    status: BookStatus
    currentPage: number
    pageCount: number | null
    author: Author | null
    publisher: Publisher | null
}

interface ChallengeBookWithLinked {
    challengeBookId: string
    title: string
    author: string
    role: 'MAIN' | 'BONUS'
    status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    linkedBook: LinkedBookInfo | null
}

interface ChallengeMonth {
    monthNumber: number
    monthName: string
    theme: string
    themeIcon: string | null
    books: ChallengeBookWithLinked[]
    stats: {
        total: number
        completed: number
        linked: number
        percentage: number
    }
}

interface ChallengeGroup {
    id: string
    year: number
    name: string
    months: ChallengeMonth[]
    stats: {
        totalBooks: number
        completedBooks: number
        linkedBooks: number
        percentage: number
    }
}

interface ChallengeData {
    challenges: ChallengeGroup[]
    unlinkedBooks: BookWithRelations[]
}

// Minimal book type for display
type DisplayBook = {
    id: string
    title: string
    coverUrl: string | null
    status: BookStatus
    currentPage: number
    pageCount: number | null
    author: { name: string } | null
}

interface LibraryClientProps {
    books: BookWithRelations[]
    groupedBooks: { groups: BookGroup[] }
    challengeData: ChallengeData
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

// Types for reading list data
interface ReadingListBook {
    id: string
    title: string
    author: string
    neden: string | null
    pageCount: number | null
    sortOrder: number
}

interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
}

interface ReadingList {
    id: string
    slug: string
    name: string
    description: string | null
    levels: ReadingListLevel[]
    totalBooks: number
    levelCount: number
}

export default function LibraryClient({ books, groupedBooks, challengeData }: LibraryClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState<"cards" | "lists" | "challenge">("lists")
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    // Reading list link modal state
    const [linkModalOpen, setLinkModalOpen] = useState(false)
    const [selectedBookForLink, setSelectedBookForLink] = useState<DisplayBook | null>(null)
    const [readingLists, setReadingLists] = useState<ReadingList[]>([])
    const [linkSearchQuery, setLinkSearchQuery] = useState("")
    const [loadingLists, setLoadingLists] = useState(false)

    // Calculate stats
    const stats = useMemo(() => {
        return {
            total: books.length,
            reading: books.filter(b => b.status === "READING").length,
            toRead: books.filter(b => b.status === "TO_READ").length,
            completed: books.filter(b => b.status === "COMPLETED").length,
            dnf: books.filter(b => b.status === "DNF").length,
            groupCount: groupedBooks.groups.length
        }
    }, [books, groupedBooks])

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

    // Filter books in groups based on status and search
    const getFilteredGroupBooks = (groupBooks: BookWithRelations[]) => {
        let result = groupBooks

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

    // Filtered groups with levels (only show groups/levels that have matching books)
    const filteredGroups = useMemo(() => {
        return groupedBooks.groups.map(group => {
            // Her seviyedeki kitapları filtrele
            const filteredLevels = (group.levels || []).map(level => ({
                ...level,
                filteredBooks: getFilteredGroupBooks(level.books)
            })).filter(level => level.filteredBooks.length > 0)

            return {
                ...group,
                filteredLevels,
                filteredBooks: getFilteredGroupBooks(group.books)
            }
        }).filter(group => group.filteredBooks.length > 0 || (activeStatus === "ALL" && !searchQuery))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupedBooks, activeStatus, searchQuery])

    const getStatusCount = (status: StatusFilter): number => {
        if (status === "ALL") return stats.total
        if (status === "READING") return stats.reading
        if (status === "TO_READ") return stats.toRead
        if (status === "COMPLETED") return stats.completed
        if (status === "DNF") return stats.dnf
        return 0
    }

    // Open link modal and fetch reading lists
    const openLinkModal = async (book: DisplayBook) => {
        setSelectedBookForLink(book)
        setLinkModalOpen(true)
        setLinkSearchQuery("")
        setLoadingLists(true)

        try {
            const lists = await getReadingLists()
            setReadingLists(lists)
        } catch {
            toast.error("Okuma listeleri yüklenemedi")
        } finally {
            setLoadingLists(false)
        }
    }

    // Filter reading list books based on search
    const filteredReadingListBooks = useMemo(() => {
        if (!linkSearchQuery) {
            // Return all books grouped by list/level
            return readingLists.flatMap(list =>
                list.levels.flatMap(level =>
                    level.books.map(book => ({
                        ...book,
                        listName: list.name,
                        listSlug: list.slug,
                        levelName: level.name,
                        levelNumber: level.levelNumber
                    }))
                )
            )
        }

        const query = linkSearchQuery.toLowerCase()
        return readingLists.flatMap(list =>
            list.levels.flatMap(level =>
                level.books
                    .filter(book =>
                        book.title.toLowerCase().includes(query) ||
                        book.author.toLowerCase().includes(query) ||
                        list.name.toLowerCase().includes(query)
                    )
                    .map(book => ({
                        ...book,
                        listName: list.name,
                        listSlug: list.slug,
                        levelName: level.name,
                        levelNumber: level.levelNumber
                    }))
            )
        )
    }, [readingLists, linkSearchQuery])

    // Handle linking book to reading list
    const handleLinkToReadingList = (readingListBook: typeof filteredReadingListBooks[0]) => {
        if (!selectedBookForLink) return

        startTransition(async () => {
            const result = await linkBookToReadingList(
                selectedBookForLink.id,
                readingListBook.id,
                readingListBook.listSlug
            )

            if (result.success) {
                toast.success(`"${selectedBookForLink.title}" → "${readingListBook.title}" bağlandı`)
                setLinkModalOpen(false)
                setSelectedBookForLink(null)
                router.refresh()
            } else {
                toast.error(result.error || "Bir hata oluştu")
            }
        })
    }

    // Book Card Component with Context Menu
    const BookCard = ({ book, isShelfView = false }: { book: DisplayBook; isShelfView?: boolean }) => (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className={cn(
                    "group relative",
                    isShelfView && "transform transition-all duration-300 ease-out hover:-translate-y-2 hover:z-10"
                )}>
                    <Link href={`/book/${book.id}`}>
                        <div className={cn(
                            "relative aspect-[2/3] rounded-sm overflow-hidden bg-muted",
                            isShelfView
                                ? "shadow-md group-hover:shadow-xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10"
                                : "shadow group-hover:shadow-lg transition-shadow"
                        )}>
                            {book.coverUrl ? (
                                <Image
                                    src={book.coverUrl.replace("http:", "https:")}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                            )}
                            {/* Status badge */}
                            <div className={cn(
                                "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-sm",
                                statusBadgeConfig[book.status].bgColor
                            )}>
                                {statusBadgeConfig[book.status].label}
                            </div>
                            {/* Reading progress */}
                            {book.status === "READING" && book.pageCount && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <div className="text-white text-[10px] text-center mb-0.5">
                                        {Math.round((book.currentPage / book.pageCount) * 100)}%
                                    </div>
                                    <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all"
                                            style={{ width: `${(book.currentPage / book.pageCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Book spine effect for shelf view */}
                            {isShelfView && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-black/20 to-transparent" />
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
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem asChild>
                    <Link href={`/book/${book.id}`} className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Kitap Detayı
                    </Link>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => openLinkModal(book)}>
                    <Map className="h-4 w-4 mr-2" />
                    Okuma Listesine Bağla
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
            {/* Mobile Status Filter - Horizontal scrollable */}
            <div className="lg:hidden overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(Object.keys(statusConfig) as StatusFilter[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                                activeStatus === status
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {statusConfig[status].icon}
                            {statusConfig[status].label}
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px]",
                                activeStatus === status
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted-foreground/20"
                            )}>
                                {getStatusCount(status)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Left Sidebar - Desktop only */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
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
                                <span className="text-muted-foreground">Liste Sayısı</span>
                                <span className="font-medium">{stats.groupCount}</span>
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
                <div className="flex flex-col gap-3 mb-4 md:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold">
                                {activeTab === "lists" ? "Listelerim" : activeTab === "challenge" ? "Okuma Hedefim" : statusConfig[activeStatus].label}
                            </h1>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                {activeTab === "lists"
                                    ? `${filteredGroups.length} liste, ${filteredGroups.reduce((acc, g) => acc + g.filteredBooks.length, 0)} kitap${(activeStatus !== "ALL" || searchQuery) ? ` (filtrelenmiş)` : ""}`
                                    : activeTab === "challenge"
                                    ? "Okuma hedefindeki kitaplarınız"
                                    : `${filteredBooks.length} kitap`
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2">
                            <div className="flex border rounded-lg">
                                <Button
                                    variant={activeTab === "cards" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-r-none h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveTab("cards")}
                                    title="Kart Görünümü"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeTab === "lists" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveTab("lists")}
                                    title="Liste Görünümü"
                                >
                                    <Layers className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeTab === "challenge" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-l-none h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveTab("challenge")}
                                    title="Hedef Görünümü"
                                >
                                    <Target className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kitap veya yazar ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
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
                            <div className="grid gap-2 md:gap-3 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11">
                                {filteredBooks.map((book) => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* List View (Reading List Groups with Levels) */}
                {activeTab === "lists" && (
                    <div className="space-y-6 md:space-y-10">
                        {filteredGroups.map((group) => {
                            const color = group.id === "rafsiz" ? "#6b7280" : (getReadingListColor(group.id) || "#6b7280")
                            const isRafsiz = group.id === "rafsiz"

                            return (
                                <div key={group.id} className="relative">
                                    {/* Liste Başlığı - Modern Header */}
                                    <div className="flex items-center gap-3 mb-4 md:mb-5">
                                        <div
                                            className="w-1 h-8 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className={cn(
                                                    "text-base md:text-xl font-bold truncate",
                                                    isRafsiz && "text-muted-foreground"
                                                )}>
                                                    {group.name}
                                                </h2>
                                                <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                    {group.filteredBooks.length} kitap
                                                </span>
                                            </div>
                                        </div>
                                        {!isRafsiz && (
                                            <Link
                                                href={`/reading-lists/${group.id}`}
                                                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                                            >
                                                Listeye Git
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>

                                    {/* Seviyeler - Bookshelf Style */}
                                    {group.filteredLevels && group.filteredLevels.length > 0 ? (
                                        <div className="space-y-6">
                                            {group.filteredLevels.map((level) => (
                                                <div key={level.levelNumber} className="relative">
                                                    {/* Level Header */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div
                                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {level.levelNumber}
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {level.levelName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({level.filteredBooks.length})
                                                        </span>
                                                    </div>

                                                    {/* Books on Shelf */}
                                                    <div className="relative">
                                                        {/* Shelf background */}
                                                        <div
                                                            className="absolute -bottom-3 left-0 right-0 h-3 rounded-b-lg shadow-inner"
                                                            style={{
                                                                background: `linear-gradient(to bottom, ${color}15, ${color}25)`,
                                                                boxShadow: `inset 0 2px 4px ${color}20`
                                                            }}
                                                        />
                                                        {/* Shelf edge */}
                                                        <div
                                                            className="absolute -bottom-3 left-0 right-0 h-1 rounded-b-lg"
                                                            style={{ backgroundColor: color, opacity: 0.3 }}
                                                        />

                                                        {/* Books Grid */}
                                                        <div className="grid gap-3 md:gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 pb-4">
                                                            {level.filteredBooks.map((book) => (
                                                                <BookCard key={book.id} book={book} isShelfView />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : group.filteredBooks.length > 0 ? (
                                        // Seviye bilgisi yoksa (Rafsız) düz liste göster
                                        <div className={cn(
                                            "relative rounded-xl p-4 md:p-5",
                                            isRafsiz ? "bg-muted/30 border-2 border-dashed" : "bg-gradient-to-br from-muted/50 to-muted/20"
                                        )}>
                                            {/* Shelf background for non-leveled groups */}
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-2 rounded-b-xl"
                                                style={{
                                                    background: `linear-gradient(to bottom, transparent, ${color}20)`
                                                }}
                                            />
                                            <div className="grid gap-3 md:gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                                                {group.filteredBooks.map((book) => (
                                                    <BookCard key={book.id} book={book} isShelfView />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-8 md:py-12 border-2 border-dashed rounded-xl bg-muted/10">
                                            <div className="text-center">
                                                <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Bu listede henüz kitap yok
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {filteredGroups.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/20">
                                <Layers className="h-16 w-16 text-muted-foreground/40 mb-4" />
                                {(activeStatus !== "ALL" || searchQuery) ? (
                                    <>
                                        <p className="text-muted-foreground mb-3">Arama sonucu bulunamadı</p>
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setActiveStatus("ALL")
                                            setSearchQuery("")
                                        }}>
                                            Filtreleri Temizle
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground mb-4">Henüz okuma listesine bağlı kitap yok</p>
                                        <Button asChild size="sm">
                                            <Link href="/reading-lists">
                                                Okuma Listelerini Gör
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Challenge View (Reading Challenge Groups by Month) */}
                {activeTab === "challenge" && (
                    <div className="space-y-6 md:space-y-10">
                        {challengeData.challenges.length > 0 ? (
                            challengeData.challenges.map((challenge) => (
                                <div key={challenge.id} className="relative">
                                    {/* Challenge Header */}
                                    <div className="flex items-center justify-between gap-3 mb-4 md:mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 rounded-full bg-amber-500" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-base md:text-xl font-bold">
                                                        {challenge.name}
                                                    </h2>
                                                    <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                        {challenge.stats.completedBooks}/{challenge.stats.totalBooks} kitap
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress value={challenge.stats.percentage} className="h-1.5 w-32" />
                                                    <span className="text-xs text-muted-foreground">
                                                        %{challenge.stats.percentage}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href="/challenges"
                                            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                                        >
                                            Challenge'a Git
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    {/* Months */}
                                    <div className="space-y-6">
                                        {challenge.months.filter(month => month.books.some(b => b.linkedBook)).map((month) => (
                                            <div key={month.monthNumber} className="relative">
                                                {/* Month Header */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-amber-100 dark:bg-amber-900/30">
                                                        {month.themeIcon || <Calendar className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium">
                                                            {month.monthName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {month.theme}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        {month.stats.completed}/{month.stats.total}
                                                    </span>
                                                </div>

                                                {/* Books on Shelf */}
                                                <div className="relative">
                                                    <div
                                                        className="absolute -bottom-3 left-0 right-0 h-3 rounded-b-lg shadow-inner"
                                                        style={{
                                                            background: 'linear-gradient(to bottom, rgb(245 158 11 / 0.1), rgb(245 158 11 / 0.2))',
                                                            boxShadow: 'inset 0 2px 4px rgb(245 158 11 / 0.15)'
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute -bottom-3 left-0 right-0 h-1 rounded-b-lg bg-amber-500/30"
                                                    />

                                                    <div className="grid gap-3 md:gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 pb-4">
                                                        {month.books.map((challengeBook) => (
                                                            challengeBook.linkedBook ? (
                                                                <div key={challengeBook.challengeBookId} className="relative">
                                                                    <BookCard book={challengeBook.linkedBook} isShelfView />
                                                                    {/* Challenge status indicator */}
                                                                    <div className={cn(
                                                                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm z-20",
                                                                        challengeBook.status === 'COMPLETED' && "bg-green-500",
                                                                        challengeBook.status === 'IN_PROGRESS' && "bg-yellow-500",
                                                                        challengeBook.status === 'NOT_STARTED' && "bg-gray-400",
                                                                        challengeBook.status === 'LOCKED' && "bg-gray-600"
                                                                    )}>
                                                                        {challengeBook.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                                                                        {challengeBook.status === 'IN_PROGRESS' && <Play className="h-3 w-3" />}
                                                                        {challengeBook.status === 'LOCKED' && <Lock className="h-3 w-3" />}
                                                                        {challengeBook.role === 'MAIN' && challengeBook.status === 'NOT_STARTED' && '★'}
                                                                        {challengeBook.role === 'BONUS' && challengeBook.status === 'NOT_STARTED' && '+'}
                                                                    </div>
                                                                </div>
                                                            ) : null
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/20">
                                <Target className="h-16 w-16 text-muted-foreground/40 mb-4" />
                                <p className="text-muted-foreground mb-4">Henüz bir okuma hedefine katılmadınız</p>
                                <Button asChild size="sm">
                                    <Link href="/challenges">
                                        Okuma Hedeflerini Gör
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Unlinked Books */}
                        {challengeData.unlinkedBooks.length > 0 && challengeData.challenges.length > 0 && (
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4 md:mb-5">
                                    <div className="w-1 h-8 rounded-full bg-gray-400" />
                                    <div>
                                        <h2 className="text-base md:text-xl font-bold text-muted-foreground">
                                            Hedefe Bağlı Olmayan Kitaplar
                                        </h2>
                                        <span className="text-xs text-muted-foreground">
                                            {challengeData.unlinkedBooks.length} kitap
                                        </span>
                                    </div>
                                </div>

                                <div className="relative rounded-xl p-4 md:p-5 bg-muted/30 border-2 border-dashed">
                                    <div className="grid gap-3 md:gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                                        {challengeData.unlinkedBooks.slice(0, 24).map((book) => (
                                            <BookCard key={book.id} book={book} isShelfView />
                                        ))}
                                    </div>
                                    {challengeData.unlinkedBooks.length > 24 && (
                                        <p className="text-xs text-muted-foreground text-center mt-4">
                                            ve {challengeData.unlinkedBooks.length - 24} kitap daha...
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Reading List Link Modal */}
            <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Okuma Listesine Bağla</DialogTitle>
                        <DialogDescription>
                            {selectedBookForLink && (
                                <>
                                    <span className="font-medium text-foreground">{selectedBookForLink.title}</span>
                                    {" "}kitabını hangi okuma listesi kitabına bağlamak istiyorsunuz?
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kitap, yazar veya liste adı ara..."
                            value={linkSearchQuery}
                            onChange={(e) => setLinkSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loadingLists ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredReadingListBooks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mb-4" />
                                <p>Arama sonucu bulunamadı</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredReadingListBooks.map((book) => (
                                    <button
                                        key={book.id}
                                        onClick={() => handleLinkToReadingList(book)}
                                        disabled={isPending}
                                        className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm line-clamp-1">{book.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    {book.listName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Seviye {book.levelNumber}: {book.levelName}
                                                </span>
                                            </div>
                                        </div>
                                        {isPending && (
                                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
