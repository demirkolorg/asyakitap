"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Layers,
    Check,
    Library,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    coverUrl: string | null
    books: ReadingListBook[]
}

interface ReadingListData {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    sortOrder: number
    levels: ReadingListLevel[]
    totalBooks: number
}

interface ByLevelClientProps {
    lists: ReadingListData[]
}

// Grouped level with books from different lists
interface GroupedLevel {
    levelNumber: number
    lists: {
        listId: string
        listName: string
        listSlug: string
        levelId: string
        levelName: string
        levelDescription: string | null
        books: ReadingListBook[]
    }[]
    totalBooks: number
}

export function ByLevelClient({ lists }: ByLevelClientProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]))
    const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")

    // Group all levels by levelNumber
    const groupedLevels = useMemo(() => {
        const levelMap = new Map<number, GroupedLevel>()

        lists.forEach(list => {
            list.levels.forEach(level => {
                if (!levelMap.has(level.levelNumber)) {
                    levelMap.set(level.levelNumber, {
                        levelNumber: level.levelNumber,
                        lists: [],
                        totalBooks: 0
                    })
                }

                const group = levelMap.get(level.levelNumber)!
                group.lists.push({
                    listId: list.id,
                    listName: list.name,
                    listSlug: list.slug,
                    levelId: level.id,
                    levelName: level.name,
                    levelDescription: level.description,
                    books: level.books
                })
                group.totalBooks += level.books.length
            })
        })

        // Sort by level number
        return Array.from(levelMap.values()).sort((a, b) => a.levelNumber - b.levelNumber)
    }, [lists])

    // Filter by search query
    const filteredLevels = useMemo(() => {
        if (!searchQuery.trim()) return groupedLevels

        const query = searchQuery.toLowerCase().trim()
        return groupedLevels.map(level => ({
            ...level,
            lists: level.lists.map(list => ({
                ...list,
                books: list.books.filter(book =>
                    book.book.title.toLowerCase().includes(query) ||
                    (book.book.author?.name || "").toLowerCase().includes(query) ||
                    list.listName.toLowerCase().includes(query)
                )
            })).filter(list => list.books.length > 0),
            totalBooks: level.lists.reduce((sum, list) =>
                sum + list.books.filter(book =>
                    book.book.title.toLowerCase().includes(query) ||
                    (book.book.author?.name || "").toLowerCase().includes(query) ||
                    list.listName.toLowerCase().includes(query)
                ).length, 0)
        })).filter(level => level.lists.length > 0)
    }, [groupedLevels, searchQuery])

    const totalBooks = useMemo(() =>
        groupedLevels.reduce((sum, level) => sum + level.totalBooks, 0)
        , [groupedLevels])

    const totalFilteredBooks = useMemo(() =>
        filteredLevels.reduce((sum, level) => sum + level.totalBooks, 0)
        , [filteredLevels])

    const toggleLevel = (levelNumber: number) => {
        setExpandedLevels(prev => {
            const next = new Set(prev)
            if (next.has(levelNumber)) {
                next.delete(levelNumber)
            } else {
                next.add(levelNumber)
            }
            return next
        })
    }

    const toggleList = (key: string) => {
        setExpandedLists(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Link */}
            <Link
                href="/reading-lists"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
                <ArrowLeft className="h-4 w-4" />
                Tüm Listeler
            </Link>

            {/* Header */}
            <div className="mb-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-semibold tracking-tight mb-2">
                            Seviye Görünümü
                        </h1>
                        <p className="text-muted-foreground">
                            Tüm okuma listelerindeki kitaplar, seviye bazında gruplandırılmış
                        </p>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 py-4 border-y">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{groupedLevels.length}</span>
                            <span className="text-muted-foreground ml-1">seviye</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Library className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{lists.length}</span>
                            <span className="text-muted-foreground ml-1">liste</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">{totalBooks}</span>
                            <span className="text-muted-foreground ml-1">kitap</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-8">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Kitap, yazar veya liste ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-11 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {searchQuery && (
                <p className="text-sm text-muted-foreground mb-6">
                    {totalFilteredBooks} kitap bulundu
                </p>
            )}

            {/* Levels */}
            <div className="space-y-4">
                {filteredLevels.length === 0 && searchQuery && (
                    <div className="text-center py-16">
                        <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">"{searchQuery}" ile eşleşen kitap bulunamadı</p>
                    </div>
                )}

                {filteredLevels.map((level) => {
                    const isExpanded = expandedLevels.has(level.levelNumber)
                    const completedBooks = level.lists.reduce((sum, list) =>
                        sum + list.books.filter(b => b.book.status === "COMPLETED").length, 0)

                    return (
                        <div key={level.levelNumber} className="border rounded-xl overflow-hidden">
                            {/* Level Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleLevel(level.levelNumber)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                        {level.levelNumber}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold flex items-center gap-2">
                                            Seviye {level.levelNumber}
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {completedBooks}/{level.totalBooks} kitap
                                            </span>
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {level.lists.length} farklı listeden
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Level Content - Lists */}
                            {isExpanded && (
                                <div className="border-t">
                                    {level.lists.map((list, listIndex) => {
                                        const listKey = `${level.levelNumber}-${list.listId}`
                                        const isListExpanded = expandedLists.has(listKey) || level.lists.length === 1

                                        return (
                                            <div key={list.listId} className={cn(listIndex > 0 && "border-t")}>
                                                {/* List Header */}
                                                <div
                                                    className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => toggleList(listKey)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={`/reading-lists/${list.listSlug}`}
                                                            className="text-sm font-medium hover:text-primary transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {list.listName}
                                                        </Link>
                                                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded-full">
                                                            {list.levelName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {list.books.length} kitap
                                                        </span>
                                                    </div>
                                                    {level.lists.length > 1 && (
                                                        isListExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        )
                                                    )}
                                                </div>

                                                {/* Books */}
                                                {isListExpanded && (
                                                    <div className="divide-y">
                                                        {list.books.map((book) => (
                                                            <BookRow key={book.id} book={book} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Book Row Component
function BookRow({ book }: { book: ReadingListBook }) {
    const isCompleted = book.book.status === "COMPLETED"
    const isReading = book.book.status === "READING"

    return (
        <Link
            href={`/book/${book.book.id}`}
            className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors group"
        >
            {/* Cover */}
            <div className="relative flex-shrink-0 w-10 h-[60px] rounded-md overflow-hidden bg-muted">
                {book.book.coverUrl ? (
                    <Image
                        src={book.book.coverUrl}
                        alt={book.book.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {book.book.title}
                    </h3>
                    {isCompleted && (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                            Okundu
                        </span>
                    )}
                    {isReading && (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Okunuyor
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {book.book.author?.name || "Bilinmeyen Yazar"}
                    {book.book.pageCount && ` • ${book.book.pageCount} sayfa`}
                </p>
            </div>
        </Link>
    )
}
