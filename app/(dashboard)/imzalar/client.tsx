"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Pen,
    BookOpen,
    ArrowRight,
    Search,
    CheckCircle2,
    Clock,
    Users,
    Type,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn, formatDate } from "@/lib/utils"
import { Book, BookStatus, Author } from "@prisma/client"

type BookWithAuthor = Book & { author: Author | null }

interface ImzalarClientProps {
    booksWithImza: BookWithAuthor[]
    totalBookCount: number
    booksWithoutImza: { id: string; title: string; coverUrl: string | null }[]
}

const statusConfig: Record<BookStatus, { label: string; color: string; bgColor: string }> = {
    TO_READ: { label: "Okunacak", color: "text-blue-600", bgColor: "bg-blue-500/10" },
    READING: { label: "Okunuyor", color: "text-amber-600", bgColor: "bg-amber-500/10" },
    COMPLETED: { label: "Okudum", color: "text-green-600", bgColor: "bg-green-500/10" },
    DNF: { label: "Yarım Bırakıldı", color: "text-red-600", bgColor: "bg-red-500/10" },
}

export default function ImzalarClient({ booksWithImza, totalBookCount, booksWithoutImza }: ImzalarClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | BookStatus>("all")

    // Stats
    const stats = useMemo(() => {
        const totalWords = booksWithImza.reduce((acc, book) => {
            const words = book.imza?.split(/\s+/).length || 0
            return acc + words
        }, 0)

        // Unique authors with imza
        const authorsWithImza = new Set(booksWithImza.map(b => b.authorId).filter(Boolean))

        return {
            totalBooks: booksWithImza.length,
            totalWords,
            uniqueAuthors: authorsWithImza.size,
            completed: booksWithImza.filter(b => b.status === "COMPLETED").length,
            reading: booksWithImza.filter(b => b.status === "READING").length,
            coverage: totalBookCount > 0 ? Math.round((booksWithImza.length / totalBookCount) * 100) : 0,
        }
    }, [booksWithImza, totalBookCount])

    // Filter books
    const filteredBooks = useMemo(() => {
        let result = booksWithImza

        if (filterStatus !== "all") {
            result = result.filter(b => b.status === filterStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                b => b.title.toLowerCase().includes(query) ||
                    (b.author?.name || "").toLowerCase().includes(query) ||
                    b.imza?.toLowerCase().includes(query)
            )
        }

        return result
    }, [booksWithImza, filterStatus, searchQuery])

    // Strip HTML for preview
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">İmzalar</h1>
                <p className="text-muted-foreground">
                    Yazarın üslubu ve anlatım tarzı hakkında notların.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-border transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Pen className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">İmza Yazılan</span>
                    <span className="text-3xl font-black z-10">{stats.totalBooks}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                        <Users className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Farklı Yazar</span>
                    <span className="text-3xl font-black text-primary z-10">{stats.uniqueAuthors}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-green-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-green-500">
                        <Type className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam Kelime</span>
                    <span className="text-3xl font-black text-green-500 z-10">{stats.totalWords.toLocaleString()}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                        <Clock className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Kapsam</span>
                    <span className="text-3xl font-black text-amber-500 z-10">%{stats.coverage}</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 rounded-xl border border-border/50">
                {/* Search */}
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Kitap, yazar veya içerik ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border/50 focus:border-primary"
                    />
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filterStatus === "all"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilterStatus("COMPLETED")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filterStatus === "COMPLETED"
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-green-500/50 hover:text-green-500"
                        )}
                    >
                        Okudum
                    </button>
                    <button
                        onClick={() => setFilterStatus("READING")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filterStatus === "READING"
                                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-amber-500/50 hover:text-amber-500"
                        )}
                    >
                        Okuyorum
                    </button>
                </div>

                {/* Waiting Books */}
                {booksWithoutImza.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        <span className="text-orange-500 font-semibold">{booksWithoutImza.length}</span> kitap imza bekliyor
                    </div>
                )}
            </div>

            {/* Imzalar List */}
            {filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Pen className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Aramayı Temizle
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-muted-foreground mb-2">Henüz imza yazılmamış</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Kitap detay sayfasında &quot;İmza&quot; sekmesinden yazabilirsin
                            </p>
                            <Button variant="outline" asChild>
                                <Link href="/library">Kitaplara Git</Link>
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBooks.map((book) => (
                        <Link
                            key={book.id}
                            href={`/book/${book.id}`}
                            className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
                        >
                            <div className="flex">
                                {/* Book Cover */}
                                <div className="flex-shrink-0">
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
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4 sm:p-6 min-w-0">
                                    {/* Book Info */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                {book.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                {book.author?.name || "Bilinmiyor"}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-1 rounded-full flex-shrink-0",
                                            statusConfig[book.status].color,
                                            statusConfig[book.status].bgColor
                                        )}>
                                            {statusConfig[book.status].label}
                                        </span>
                                    </div>

                                    {/* Imza Preview */}
                                    <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {stripHtml(book.imza || "").slice(0, 300)}
                                        {(book.imza?.length || 0) > 300 && "..."}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Type className="h-3 w-3" />
                                                {book.imza?.split(/\s+/).length || 0} kelime
                                            </span>
                                            {book.pageCount && (
                                                <span>{book.pageCount} sayfa</span>
                                            )}
                                            <span>
                                                {formatDate(book.updatedAt, { format: "short" })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                            Devamını Oku
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
