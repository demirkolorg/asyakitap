"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    User,
    Search,
    BookOpen,
    PenLine,
    Plus,
    Users,
    Grid3X3,
    List,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthorWithStats {
    id: string
    name: string
    imageUrl: string | null
    bio: string | null
    _count: {
        books: number
    }
    booksWithImza: number
}

interface AuthorsClientProps {
    authors: AuthorWithStats[]
}

type ViewMode = "grid" | "list"
type SortMode = "name" | "books" | "imza"

export function AuthorsClient({ authors }: AuthorsClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [sortMode, setSortMode] = useState<SortMode>("name")

    const stats = useMemo(() => ({
        totalAuthors: authors.length,
        totalBooks: authors.reduce((sum, a) => sum + a._count.books, 0),
        totalImza: authors.reduce((sum, a) => sum + a.booksWithImza, 0),
    }), [authors])

    const filteredAndSortedAuthors = useMemo(() => {
        let result = authors

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(a => a.name.toLowerCase().includes(query))
        }

        // Sort
        result = [...result].sort((a, b) => {
            if (sortMode === "name") return a.name.localeCompare(b.name, 'tr')
            if (sortMode === "books") return b._count.books - a._count.books
            if (sortMode === "imza") return b.booksWithImza - a.booksWithImza
            return 0
        })

        return result
    }, [authors, searchQuery, sortMode])

    // Group authors by first letter (only for list view)
    const groupedAuthors = useMemo(() => {
        if (viewMode !== "list") return {}
        const groups: Record<string, AuthorWithStats[]> = {}
        filteredAndSortedAuthors.forEach(author => {
            const firstLetter = author.name.charAt(0).toUpperCase()
            if (!groups[firstLetter]) {
                groups[firstLetter] = []
            }
            groups[firstLetter].push(author)
        })
        return groups
    }, [filteredAndSortedAuthors, viewMode])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Yazarlarım</h1>
                <p className="text-muted-foreground">
                    Kütüphanendeki tüm yazarları keşfet ve takip et.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-border transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam Yazar</span>
                    <span className="text-3xl font-black z-10">{stats.totalAuthors}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                        <BookOpen className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam Kitap</span>
                    <span className="text-3xl font-black text-primary z-10">{stats.totalBooks}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                        <PenLine className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam İmza</span>
                    <span className="text-3xl font-black text-amber-500 z-10">{stats.totalImza}</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 rounded-xl border border-border/50">
                {/* Search */}
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Yazar ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border/50 focus:border-primary"
                    />
                </div>

                {/* Sort Filters */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSortMode("name")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            sortMode === "name"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        İsme Göre
                    </button>
                    <button
                        onClick={() => setSortMode("books")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            sortMode === "books"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        Kitap Sayısı
                    </button>
                    <button
                        onClick={() => setSortMode("imza")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            sortMode === "imza"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        İmza Sayısı
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1 border border-border/50">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === "grid"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            viewMode === "list"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Authors */}
            {filteredAndSortedAuthors.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-muted-foreground mb-4">"{searchQuery}" için sonuç bulunamadı</p>
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Aramayı Temizle
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-medium mb-2">Henüz yazar yok</p>
                            <p className="text-muted-foreground mb-4 text-sm">
                                Kitap ekleyerek yazarları otomatik oluşturabilirsiniz
                            </p>
                            <Button asChild>
                                <Link href="/library/add">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Kitap Ekle
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                // Grid View
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredAndSortedAuthors.map((author) => (
                        <Link
                            key={author.id}
                            href={`/author/${author.id}`}
                            className="group flex flex-col items-center text-center"
                        >
                            <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-background shadow-lg group-hover:ring-primary/50 transition-all group-hover:-translate-y-1">
                                {author.imageUrl ? (
                                    <Image
                                        src={author.imageUrl}
                                        alt={author.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                                        <User className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 w-full">
                                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                    {author.name}
                                </h3>
                                <div className="flex items-center justify-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {author._count.books}
                                    </span>
                                    {author.booksWithImza > 0 && (
                                        <span className="flex items-center gap-1 text-amber-500">
                                            <PenLine className="h-3 w-3" />
                                            {author.booksWithImza}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                // List View (grouped by letter)
                <div className="space-y-8">
                    {Object.entries(groupedAuthors).map(([letter, letterAuthors]) => (
                        <div key={letter}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl font-black text-primary">{letter}</span>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">{letterAuthors.length} yazar</span>
                            </div>

                            <div className="grid gap-2">
                                {letterAuthors.map((author) => (
                                    <Link
                                        key={author.id}
                                        href={`/author/${author.id}`}
                                        className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
                                    >
                                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background">
                                            {author.imageUrl ? (
                                                <Image
                                                    src={author.imageUrl}
                                                    alt={author.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                                    <User className="h-7 w-7 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {author.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {author._count.books} kitap
                                                </span>
                                                {author.booksWithImza > 0 && (
                                                    <span className="flex items-center gap-1.5 text-amber-500">
                                                        <PenLine className="h-3.5 w-3.5" />
                                                        {author.booksWithImza} imza
                                                    </span>
                                                )}
                                            </div>
                                            {author.bio && (
                                                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                                                    {author.bio}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
