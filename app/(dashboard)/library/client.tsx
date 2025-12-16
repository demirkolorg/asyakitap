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
    Plus,
    Search,
    BookOpen,
    Grid3X3,
    BookMarked,
    CheckCircle2,
    XCircle,
    Library,
    List,
    ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author, Publisher } from "@prisma/client"

type BookWithRelations = Book & {
    author: Author | null
    publisher: Publisher | null
}

interface LibraryClientProps {
    books: BookWithRelations[]
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

export default function LibraryClient({ books }: LibraryClientProps) {
    const [activeTab, setActiveTab] = useState<"cards" | "list">("cards")
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

    // Book List Item Component
    const BookListItem = ({ book }: { book: BookWithRelations }) => (
        <Link
            href={`/book/${book.id}`}
            className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
            <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                {book.coverUrl ? (
                    <Image
                        src={book.coverUrl.replace("http:", "https:")}
                        alt={book.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.author?.name || "Bilinmiyor"}
                </p>
                {book.status === "READING" && book.pageCount && (
                    <div className="flex items-center gap-2 mt-1">
                        <Progress value={(book.currentPage / book.pageCount) * 100} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground">
                            {Math.round((book.currentPage / book.pageCount) * 100)}%
                        </span>
                    </div>
                )}
            </div>
            <div className={cn(
                "px-2 py-1 rounded text-[10px] font-medium text-white flex-shrink-0",
                statusBadgeConfig[book.status].bgColor
            )}>
                {statusBadgeConfig[book.status].label}
            </div>
        </Link>
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
                                {statusConfig[activeStatus].label}
                            </h1>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                {filteredBooks.length} kitap
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
                                    variant={activeTab === "list" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-l-none h-8 w-8 md:h-9 md:w-9"
                                    onClick={() => setActiveTab("list")}
                                    title="Liste Görünümü"
                                >
                                    <List className="h-4 w-4" />
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

                {/* List View */}
                {activeTab === "list" && (
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
                            <div className="space-y-2">
                                {filteredBooks.map((book) => (
                                    <BookListItem key={book.id} book={book} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
