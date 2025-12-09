"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Plus,
    Search,
    BookOpen,
    Grid3X3,
    List,
    BookMarked,
    CheckCircle2,
    Clock,
    XCircle,
    Library,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author } from "@prisma/client"

type BookWithAuthor = Book & { author: Author | null }

interface LibraryClientProps {
    books: BookWithAuthor[]
}

type ViewMode = "grid" | "list"
type ShelfFilter = "ALL" | BookStatus

const shelfConfig: Record<ShelfFilter, { label: string; icon: React.ReactNode; color: string }> = {
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
    const [activeShelf, setActiveShelf] = useState<ShelfFilter>("ALL")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
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

        // Filter by shelf
        if (activeShelf !== "ALL") {
            result = result.filter(b => b.status === activeShelf)
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) || (b.author?.name || "").toLowerCase().includes(query)
            )
        }

        return result
    }, [books, activeShelf, searchQuery])

    const getShelfCount = (shelf: ShelfFilter): number => {
        if (shelf === "ALL") return stats.total
        if (shelf === "READING") return stats.reading
        if (shelf === "TO_READ") return stats.toRead
        if (shelf === "COMPLETED") return stats.completed
        if (shelf === "DNF") return stats.dnf
        return 0
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Shelves */}
            <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    {/* Add Book Button */}
                    <Button asChild className="w-full mb-6">
                        <Link href="/library/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Kitap Ekle
                        </Link>
                    </Button>

                    {/* Shelves */}
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Raflar
                        </h3>
                        {(Object.keys(shelfConfig) as ShelfFilter[]).map((shelf) => (
                            <button
                                key={shelf}
                                onClick={() => setActiveShelf(shelf)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                    activeShelf === shelf
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {shelfConfig[shelf].icon}
                                    {shelfConfig[shelf].label}
                                </span>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    activeShelf === shelf
                                        ? "bg-primary-foreground/20"
                                        : "bg-muted-foreground/20"
                                )}>
                                    {getShelfCount(shelf)}
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
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {shelfConfig[activeShelf].label}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {filteredBooks.length} kitap
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Kitap veya yazar ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex border rounded-lg">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                className="rounded-r-none"
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="icon"
                                className="rounded-l-none"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Books */}
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
                                <p className="text-muted-foreground mb-4">Bu rafta henüz kitap yok</p>
                                <Button asChild variant="outline">
                                    <Link href="/library/add">Kitap Ekle</Link>
                                </Button>
                            </>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid View - Compact */
                    <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                        {filteredBooks.map((book) => (
                            <Link
                                key={book.id}
                                href={`/book/${book.id}`}
                                className="group"
                            >
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
                                    {/* Status Badge - Smaller */}
                                    <div className={cn(
                                        "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white",
                                        statusBadgeConfig[book.status].bgColor
                                    )}>
                                        {statusBadgeConfig[book.status].label}
                                    </div>
                                    {/* Progress Overlay for Reading */}
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
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-2">
                        {filteredBooks.map((book) => (
                            <Link
                                key={book.id}
                                href={`/book/${book.id}`}
                                className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                            >
                                {/* Cover */}
                                <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
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
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                        {book.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {book.author?.name || "Bilinmiyor"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded font-medium text-white",
                                            statusBadgeConfig[book.status].bgColor
                                        )}>
                                            {statusBadgeConfig[book.status].label}
                                        </span>
                                        {book.pageCount && (
                                            <span className="text-xs text-muted-foreground">
                                                {book.pageCount} sayfa
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress (for reading) */}
                                {book.status === "READING" && book.pageCount && (
                                    <div className="flex-shrink-0 w-24 flex flex-col justify-center">
                                        <div className="text-xs text-muted-foreground text-right mb-1">
                                            {Math.round((book.currentPage / book.pageCount) * 100)}%
                                        </div>
                                        <Progress
                                            value={(book.currentPage / book.pageCount) * 100}
                                            className="h-1.5"
                                        />
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
