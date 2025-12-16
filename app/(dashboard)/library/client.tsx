"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Plus,
    Search,
    BookOpen,
    Grid3X3,
    BookMarked,
    CheckCircle2,
    XCircle,
    Library,
    ExternalLink,
    Map,
    Target,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author, Publisher } from "@prisma/client"
import type { ChallengeTimeline } from "@/actions/challenge"
import type { ReadingListDetail } from "@/actions/reading-lists"

type BookWithRelations = Book & {
    author: Author | null
    publisher: Publisher | null
}

interface LibraryClientProps {
    books: BookWithRelations[]
    readingLists: ReadingListDetail[]
    challengeTimeline: ChallengeTimeline | null
}

type StatusFilter = "ALL" | BookStatus
type ViewMode = "cards" | "reading-lists" | "challenges"

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

export default function LibraryClient({ books, readingLists, challengeTimeline }: LibraryClientProps) {
    const [activeView, setActiveView] = useState<ViewMode>("cards")
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

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

    // Filter books
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

    const getStatusCount = (status: StatusFilter): number => {
        if (status === "ALL") return stats.total
        if (status === "READING") return stats.reading
        if (status === "TO_READ") return stats.toRead
        if (status === "COMPLETED") return stats.completed
        if (status === "DNF") return stats.dnf
        return 0
    }

    // Book Card Component with Context Menu
    const BookCard = ({ book }: { book: BookWithRelations }) => (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className="group relative">
                    <Link href={`/book/${book.id}`}>
                        <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-muted shadow group-hover:shadow-lg transition-shadow">
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
            </ContextMenuContent>
        </ContextMenu>
    )

    // Mini Book Card for Reading Lists and Challenges
    const MiniBookCard = ({ book, showInLibrary = false }: { book: { id: string; title: string; coverUrl: string | null; inLibrary?: boolean; author?: { name: string } | null }, showInLibrary?: boolean }) => (
        <Link
            href={`/book/${book.id}`}
            className="group relative block"
        >
            <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-muted shadow group-hover:shadow-lg transition-all group-hover:ring-2 group-hover:ring-primary">
                {book.coverUrl ? (
                    <Image
                        src={book.coverUrl.replace("http:", "https:")}
                        alt={book.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                    </div>
                )}
                {showInLibrary && book.inLibrary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[8px] text-center py-0.5">
                        <Library className="h-2 w-2 inline" />
                    </div>
                )}
            </div>
            <div className="mt-1">
                <h4 className="text-[10px] font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {book.title}
                </h4>
                {book.author && (
                    <p className="text-[9px] text-muted-foreground line-clamp-1">
                        {book.author.name}
                    </p>
                )}
            </div>
        </Link>
    )

    // Reading Lists View
    const ReadingListsView = () => (
        <div className="space-y-6">
            {readingLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Henüz okuma listesi yok</p>
                    <Button asChild variant="outline">
                        <Link href="/reading-lists">Okuma Listelerine Git</Link>
                    </Button>
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={readingLists.map(l => l.id)} className="space-y-4">
                    {readingLists.map((list) => (
                        <AccordionItem key={list.id} value={list.id} className="border rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Map className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <span className="font-semibold">{list.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {list.totalBooks} kitap • {list.levels.length} seviye
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-6 pt-2">
                                    {list.levels.map((level) => (
                                        <div key={level.id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                                                    {level.levelNumber}
                                                </div>
                                                <span className="text-sm font-medium">{level.name}</span>
                                                <span className="text-xs text-muted-foreground">({level.books.length} kitap)</span>
                                            </div>
                                            {level.books.length > 0 ? (
                                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                                                    {level.books.map((rb) => (
                                                        <MiniBookCard
                                                            key={rb.id}
                                                            book={{
                                                                id: rb.book.id,
                                                                title: rb.book.title,
                                                                coverUrl: rb.book.coverUrl,
                                                                inLibrary: rb.book.inLibrary,
                                                                author: rb.book.author
                                                            }}
                                                            showInLibrary
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground pl-8">Bu seviyede kitap yok</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    )

    // Challenges View
    const ChallengesView = () => (
        <div className="space-y-6">
            {!challengeTimeline || challengeTimeline.challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Henüz okuma hedefi yok</p>
                    <Button asChild variant="outline">
                        <Link href="/challenges">Okuma Hedeflerine Git</Link>
                    </Button>
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={challengeTimeline.challenges.map(c => c.id)} className="space-y-4">
                    {challengeTimeline.challenges.map((challenge) => (
                        <AccordionItem key={challenge.id} value={challenge.id} className="border rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <span className="font-semibold">{challenge.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {challenge.totalProgress?.totalBooks || 0} kitap • {challenge.months.length} ay
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-6 pt-2">
                                    {challenge.months.map((month) => {
                                        const mainBooks = month.books.filter(b => b.role === "MAIN")
                                        const bonusBooks = month.books.filter(b => b.role === "BONUS")

                                        return (
                                            <div key={month.id}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xl">{month.themeIcon}</span>
                                                    <span className="text-sm font-medium">{month.monthName}</span>
                                                    <span className="text-xs text-muted-foreground">{month.theme}</span>
                                                </div>

                                                {/* Main Books */}
                                                {mainBooks.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2 ml-7">
                                                            <Target className="h-3 w-3 text-primary" />
                                                            <span className="text-xs font-medium">Ana Hedefler</span>
                                                        </div>
                                                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 ml-7">
                                                            {mainBooks.map((cb) => (
                                                                <MiniBookCard
                                                                    key={cb.id}
                                                                    book={{
                                                                        id: cb.book.id,
                                                                        title: cb.book.title,
                                                                        coverUrl: cb.book.coverUrl,
                                                                        inLibrary: cb.book.inLibrary,
                                                                        author: cb.book.author
                                                                    }}
                                                                    showInLibrary
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bonus Books */}
                                                {bonusBooks.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2 ml-7">
                                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                                            <span className="text-xs font-medium">Bonus Kitaplar</span>
                                                        </div>
                                                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 ml-7">
                                                            {bonusBooks.map((cb) => (
                                                                <MiniBookCard
                                                                    key={cb.id}
                                                                    book={{
                                                                        id: cb.book.id,
                                                                        title: cb.book.title,
                                                                        coverUrl: cb.book.coverUrl,
                                                                        inLibrary: cb.book.inLibrary,
                                                                        author: cb.book.author
                                                                    }}
                                                                    showInLibrary
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {month.books.length === 0 && (
                                                    <p className="text-sm text-muted-foreground ml-7">Bu ayda kitap yok</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    )

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
            {/* Mobile Status Filter - Horizontal scrollable (only for cards/list views) */}
            {activeView === "cards" && (
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
            )}

            {/* Left Sidebar - Desktop only */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    <Button asChild className="w-full mb-6">
                        <Link href="/library/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Kitap Ekle
                        </Link>
                    </Button>

                    {/* View Modes */}
                    <div className="space-y-1 mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Görünüm
                        </h3>
                        <button
                            onClick={() => setActiveView("cards")}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                activeView === "cards"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Grid3X3 className="h-4 w-4" />
                            Kart Görünümü
                        </button>
                        <button
                            onClick={() => setActiveView("reading-lists")}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                activeView === "reading-lists"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Map className="h-4 w-4" />
                            Okuma Listeleri
                        </button>
                        <button
                            onClick={() => setActiveView("challenges")}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                activeView === "challenges"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Target className="h-4 w-4" />
                            Okuma Hedefleri
                        </button>
                    </div>

                    {/* Status Filters (only for cards/list views) */}
                    {activeView === "cards" && (
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
                    )}

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
                {/* Header */}
                <div className="flex flex-col gap-3 mb-4 md:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold">
                                {activeView === "cards"
                                    ? statusConfig[activeStatus].label
                                    : activeView === "reading-lists"
                                        ? "Okuma Listeleri"
                                        : "Okuma Hedefleri"
                                }
                            </h1>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                {activeView === "cards"
                                    ? `${filteredBooks.length} kitap`
                                    : activeView === "reading-lists"
                                        ? `${readingLists.length} liste`
                                        : `${challengeTimeline?.challenges.length || 0} hedef`
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2">
                            <div className="flex border rounded-lg">
                                <Button
                                    variant={activeView === "cards" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-r-none h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveView("cards")}
                                    title="Kart Görünümü"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeView === "reading-lists" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8 md:h-9 md:w-9 rounded-none border-x"
                                    onClick={() => setActiveView("reading-lists")}
                                    title="Okuma Listeleri"
                                >
                                    <Map className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={activeView === "challenges" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-l-none h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveView("challenges")}
                                    title="Okuma Hedefleri"
                                >
                                    <Target className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {activeView === "cards" && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Kitap veya yazar ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    )}
                </div>

                {/* Card View */}
                {activeView === "cards" && (
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

                {/* Reading Lists View */}
                {activeView === "reading-lists" && <ReadingListsView />}

                {/* Challenges View */}
                {activeView === "challenges" && <ChallengesView />}
            </main>
        </div>
    )
}
