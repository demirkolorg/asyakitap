"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    FileText,
    BookOpen,
    ArrowRight,
    Search,
    Library,
    CheckCircle2,
    Clock,
    BookMarked,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn, formatDate } from "@/lib/utils"
import { Book, BookStatus, Author } from "@prisma/client"

type BookWithAuthor = Book & { author: Author | null }

interface BookWithoutTortu {
    id: string
    title: string
    coverUrl: string | null
}

interface SummariesClientProps {
    booksWithTortu: BookWithAuthor[]
    totalBookCount: number
    booksWithoutTortu: BookWithoutTortu[]
}

const statusConfig: Record<BookStatus, { label: string; color: string }> = {
    TO_READ: { label: "Okunacak", color: "text-blue-600" },
    READING: { label: "Okunuyor", color: "text-yellow-600" },
    COMPLETED: { label: "Okudum", color: "text-green-600" },
    DNF: { label: "Yarım Bırakıldı", color: "text-red-600" },
}

export default function SummariesClient({ booksWithTortu, totalBookCount, booksWithoutTortu }: SummariesClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | BookStatus>("all")

    // Stats
    const stats = useMemo(() => {
        const totalWords = booksWithTortu.reduce((acc, book) => {
            const words = book.tortu?.split(/\s+/).length || 0
            return acc + words
        }, 0)

        return {
            totalBooks: booksWithTortu.length,
            totalWords,
            completed: booksWithTortu.filter(b => b.status === "COMPLETED").length,
            reading: booksWithTortu.filter(b => b.status === "READING").length,
        }
    }, [booksWithTortu])

    // Filter books
    const filteredBooks = useMemo(() => {
        let result = booksWithTortu

        if (filterStatus !== "all") {
            result = result.filter(b => b.status === filterStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) ||
                    (b.author?.name || "").toLowerCase().includes(query) ||
                    b.tortu?.toLowerCase().includes(query)
            )
        }

        return result
    }, [booksWithTortu, filterStatus, searchQuery])

    // Strip HTML for preview
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    {/* Filter by Status */}
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Duruma Göre
                        </h3>
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                filterStatus === "all"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Library className="h-4 w-4" />
                                Tüm Tortular
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                filterStatus === "all"
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted-foreground/20"
                            )}>
                                {booksWithTortu.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setFilterStatus("COMPLETED")}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                filterStatus === "COMPLETED"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Okuduklarım
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                filterStatus === "COMPLETED"
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted-foreground/20"
                            )}>
                                {stats.completed}
                            </span>
                        </button>

                        <button
                            onClick={() => setFilterStatus("READING")}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                filterStatus === "READING"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Okuyorum
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                filterStatus === "READING"
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted-foreground/20"
                            )}>
                                {stats.reading}
                            </span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-sm font-semibold mb-3">İstatistikler</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tortu Yazılan</span>
                                <span className="font-medium">{stats.totalBooks} kitap</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Kelime</span>
                                <span className="font-medium">{stats.totalWords.toLocaleString()}</span>
                            </div>
                            {totalBookCount > 0 && (
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-muted-foreground">Kapsam</span>
                                        <span className="font-medium">
                                            {Math.round((stats.totalBooks / totalBookCount) * 100)}%
                                        </span>
                                    </div>
                                    <Progress value={(stats.totalBooks / totalBookCount) * 100} className="h-1.5" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {totalBookCount - stats.totalBooks} kitapta tortu yok
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Books without Tortu */}
                    {booksWithoutTortu.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Tortu Bekleyenler
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {booksWithoutTortu.slice(0, 5).map(book => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                                    >
                                        <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                            {book.coverUrl ? (
                                                <Image
                                                    src={book.coverUrl.replace("http:", "https:")}
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="truncate text-muted-foreground hover:text-foreground">
                                            {book.title}
                                        </span>
                                    </Link>
                                ))}
                                {booksWithoutTortu.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                        +{booksWithoutTortu.length - 5} kitap daha
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Tortular
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {filteredBooks.length} kitapta tortu
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kitap, yazar veya içerik ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Summaries List */}
                {filteredBooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        {searchQuery ? (
                            <>
                                <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Aramayı Temizle
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground mb-2">Henüz tortu yazılmamış</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Kitap detay sayfasında "Tortu" sekmesinden yazabilirsin
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href="/library">Kitaplara Git</Link>
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBooks.map((book) => (
                            <div
                                key={book.id}
                                className="group rounded-xl border bg-card hover:border-primary/30 transition-colors overflow-hidden"
                            >
                                <div className="flex">
                                    {/* Book Cover */}
                                    <Link href={`/book/${book.id}`} className="flex-shrink-0">
                                        <div className="relative w-24 sm:w-32 aspect-[2/3] bg-muted">
                                            {book.coverUrl ? (
                                                <Image
                                                    src={book.coverUrl.replace("http:", "https:")}
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="flex-1 p-4 sm:p-6 min-w-0">
                                        {/* Book Info */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/book/${book.id}`}
                                                    className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    {book.title}
                                                </Link>
                                                <p className="text-muted-foreground text-sm">
                                                    {book.author?.name || "Bilinmiyor"}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-1 rounded-full bg-muted flex-shrink-0",
                                                statusConfig[book.status].color
                                            )}>
                                                {statusConfig[book.status].label}
                                            </span>
                                        </div>

                                        {/* Tortu Preview */}
                                        <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                            {stripHtml(book.tortu || "").slice(0, 300)}
                                            {(book.tortu?.length || 0) > 300 && "..."}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>
                                                    {book.tortu?.split(/\s+/).length || 0} kelime
                                                </span>
                                                {book.pageCount && (
                                                    <span>{book.pageCount} sayfa</span>
                                                )}
                                                <span>
                                                    {formatDate(book.updatedAt, { format: "short" })}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/book/${book.id}`}>
                                                    Devamını Oku
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
