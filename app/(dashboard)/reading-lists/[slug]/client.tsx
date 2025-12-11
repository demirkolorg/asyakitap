"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
    Map,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Plus,
    Check,
    ArrowLeft,
    CheckCircle2,
    BookMarked,
    Search,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type BookStatus = "not_added" | "added" | "reading" | "completed"

interface ReadingListBook {
    id: string
    title: string
    author: string
    neden: string | null
    pageCount: number | null
    coverUrl: string | null
    userStatus: BookStatus
    userBook: {
        id: string
        status: string
        currentPage: number
        pageCount: number | null
        coverUrl: string | null
    } | null
}

interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
    progress: {
        added: number
        completed: number
        total: number
    }
}

interface ReadingListData {
    id: string
    slug: string
    name: string
    description: string | null
    levels: ReadingListLevel[]
    progress: {
        total: number
        added: number
        completed: number
    }
}

interface ReadingListClientProps {
    list: ReadingListData
}


export default function ReadingListClient({ list }: ReadingListClientProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
        new Set(list.levels.map(l => l.id))
    )
    const [searchQuery, setSearchQuery] = useState("")

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

    // Arama filtreleme
    const filteredLevels = useMemo(() => {
        if (!searchQuery.trim()) return list.levels

        const query = searchQuery.toLowerCase().trim()
        return list.levels.map(level => ({
            ...level,
            books: level.books.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            )
        })).filter(level => level.books.length > 0)
    }, [list.levels, searchQuery])

    const totalFilteredBooks = useMemo(() => {
        return filteredLevels.reduce((sum, level) => sum + level.books.length, 0)
    }, [filteredLevels])

    const overallProgress = list.progress.total > 0
        ? Math.round((list.progress.completed / list.progress.total) * 100)
        : 0

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Link */}
            <Link
                href="/reading-lists"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Tüm Listeler
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Map className="h-8 w-8 text-primary" />
                    {list.name}
                </h1>
                {list.description && (
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        {list.description}
                    </p>
                )}

                {/* Overall Progress */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Genel İlerleme</span>
                        <span className="text-sm text-muted-foreground">
                            {list.progress.completed}/{list.progress.total} kitap tamamlandı
                        </span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                    <div className="flex items-center gap-6 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            {list.levels.length} seviye
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                            <BookMarked className="h-4 w-4" />
                            {list.progress.added} eklendi
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            {list.progress.completed} okundu
                        </span>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Kitap veya yazar ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        {totalFilteredBooks} kitap bulundu
                    </p>
                )}
            </div>

            {/* Levels */}
            <div className="space-y-6">
                {searchQuery && filteredLevels.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Kitap bulunamadı</p>
                        <p className="text-sm mt-1">&quot;{searchQuery}&quot; ile eşleşen kitap yok</p>
                    </div>
                )}
                {filteredLevels.map((level) => {
                    const isExpanded = expandedLevels.has(level.id)
                    const levelProgress = level.progress.total > 0
                        ? Math.round((level.progress.completed / level.progress.total) * 100)
                        : 0
                    const isLevelComplete = levelProgress === 100

                    return (
                        <div key={level.id} className="border rounded-xl overflow-hidden">
                            {/* Level Header */}
                            <button
                                onClick={() => toggleLevel(level.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors",
                                    isLevelComplete && "bg-green-50 dark:bg-green-900/10"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                                        isLevelComplete
                                            ? "bg-green-500 text-white"
                                            : "bg-primary text-primary-foreground"
                                    )}>
                                        {isLevelComplete ? <Check className="h-5 w-5" /> : level.levelNumber}
                                    </div>
                                    <div className="text-left">
                                        <h2 className="font-semibold">
                                            Seviye {level.levelNumber}: {level.name}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {level.progress.completed}/{level.progress.total} kitap okundu
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:block w-32">
                                        <Progress value={levelProgress} className="h-1.5" />
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </button>

                            {/* Level Content */}
                            {isExpanded && (
                                <div className="border-t">
                                    {level.description && (
                                        <p className="px-4 py-3 text-sm text-muted-foreground bg-muted/30">
                                            {level.description}
                                        </p>
                                    )}

                                    <div className="divide-y">
                                        {level.books.map((book) => {
                                            const isInLibrary = book.userStatus !== "not_added"
                                            const coverUrl = book.userBook?.coverUrl || book.coverUrl

                                            return (
                                                <div
                                                    key={book.id}
                                                    className={cn(
                                                        "p-4 hover:bg-muted/30 transition-colors",
                                                        book.userStatus === "completed" && "bg-green-50/50 dark:bg-green-900/5"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Book Cover veya Ekle Butonu */}
                                                        {isInLibrary ? (
                                                            <Link href={`/book/${book.userBook?.id}`} className="flex-shrink-0 group">
                                                                <div className="relative h-20 w-14 overflow-hidden rounded-md border shadow-sm group-hover:shadow-md group-hover:ring-2 ring-primary transition-all">
                                                                    {coverUrl ? (
                                                                        <Image
                                                                            src={coverUrl}
                                                                            alt={book.title}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-full w-full bg-muted flex items-center justify-center">
                                                                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                                        </div>
                                                                    )}
                                                                    {/* Status indicator */}
                                                                    <div className={cn(
                                                                        "absolute bottom-0 left-0 right-0 py-0.5 text-center text-[10px] font-medium",
                                                                        book.userStatus === "completed" && "bg-green-500 text-white",
                                                                        book.userStatus === "reading" && "bg-yellow-500 text-white",
                                                                        book.userStatus === "added" && "bg-blue-500 text-white"
                                                                    )}>
                                                                        {book.userStatus === "completed" && "Okundu"}
                                                                        {book.userStatus === "reading" && "Okunuyor"}
                                                                        {book.userStatus === "added" && "Eklendi"}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={`/library/add?q=${encodeURIComponent(book.title + " " + book.author)}&rlBookId=${book.id}`}
                                                                className="flex-shrink-0"
                                                            >
                                                                <div className="h-20 w-14 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                                                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                                                    <span className="text-[10px] text-muted-foreground font-medium">Ekle</span>
                                                                </div>
                                                            </Link>
                                                        )}

                                                        {/* Book Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <h3 className="font-medium">
                                                                        {isInLibrary ? (
                                                                            <Link href={`/book/${book.userBook?.id}`} className="hover:underline hover:text-primary transition-colors">
                                                                                {book.title}
                                                                            </Link>
                                                                        ) : (
                                                                            book.title
                                                                        )}
                                                                    </h3>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {book.author}
                                                                        {book.pageCount && ` • ${book.pageCount} sayfa`}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Neden (Why) */}
                                                            {book.neden && (
                                                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                                                    <span className="font-medium text-foreground">Neden: </span>
                                                                    {book.neden}
                                                                </p>
                                                            )}

                                                            {/* Reading Progress */}
                                                            {book.userStatus === "reading" && book.userBook && book.userBook.pageCount && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Progress
                                                                        value={(book.userBook.currentPage / book.userBook.pageCount) * 100}
                                                                        className="h-1 flex-1 max-w-32"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {book.userBook.currentPage}/{book.userBook.pageCount}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
