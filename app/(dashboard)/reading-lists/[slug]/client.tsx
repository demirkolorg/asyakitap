"use client"

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Map,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Check,
    ArrowLeft,
    CheckCircle2,
    BookMarked,
    Search,
    X,
    Loader2,
    Unlink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { linkBookToReadingList, unlinkBookFromReadingList } from "@/actions/reading-lists"
import { toast } from "sonner"

type BookStatus = "not_added" | "added" | "reading" | "completed"

interface UserBook {
    id: string
    title: string
    coverUrl: string | null
    status: string
    author: { name: string } | null
}

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
    userBooks: UserBook[]
}

export default function ReadingListClient({ list, userBooks }: ReadingListClientProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
        new Set(list.levels.map(l => l.id))
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedReadingListBook, setSelectedReadingListBook] = useState<ReadingListBook | null>(null)
    const [modalSearch, setModalSearch] = useState("")
    const [isPending, startTransition] = useTransition()

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

    // Modal içindeki kitap filtreleme
    const filteredUserBooks = useMemo(() => {
        if (!modalSearch.trim()) return userBooks

        const query = modalSearch.toLowerCase().trim()
        return userBooks.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author?.name.toLowerCase().includes(query)
        )
    }, [userBooks, modalSearch])

    const overallProgress = list.progress.total > 0
        ? Math.round((list.progress.completed / list.progress.total) * 100)
        : 0

    const openSelectModal = (book: ReadingListBook) => {
        setSelectedReadingListBook(book)
        setModalSearch("")
        setModalOpen(true)
    }

    const handleSelectBook = (userBook: UserBook) => {
        if (!selectedReadingListBook) return

        startTransition(async () => {
            const result = await linkBookToReadingList(
                userBook.id,
                selectedReadingListBook.id,
                list.slug
            )

            if (result.success) {
                if (result.shelfAssigned) {
                    toast.success(`"${userBook.title}" okuma listesine ve rafa eklendi`)
                } else {
                    toast.success(`"${userBook.title}" okuma listesine bağlandı`)
                }
                setModalOpen(false)
                setSelectedReadingListBook(null)
            } else {
                toast.error(result.error || "Bir hata oluştu")
            }
        })
    }

    const handleUnlink = (book: ReadingListBook) => {
        startTransition(async () => {
            const result = await unlinkBookFromReadingList(book.id, list.slug)

            if (result.success) {
                toast.success("Bağlantı kaldırıldı")
            } else {
                toast.error(result.error || "Bir hata oluştu")
            }
        })
    }

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
                                            const isLinked = book.userStatus !== "not_added"
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
                                                        {/* Book Cover */}
                                                        {isLinked ? (
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
                                                            <div className="flex-shrink-0 h-20 w-14 rounded-md border bg-muted/50 flex items-center justify-center">
                                                                <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                                                            </div>
                                                        )}

                                                        {/* Book Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <h3 className="font-medium">
                                                                        {isLinked ? (
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

                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-2">
                                                                    {isLinked ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleUnlink(book)}
                                                                            disabled={isPending}
                                                                            className="text-muted-foreground hover:text-destructive"
                                                                        >
                                                                            <Unlink className="h-4 w-4" />
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => openSelectModal(book)}
                                                                            disabled={isPending}
                                                                        >
                                                                            Seç
                                                                        </Button>
                                                                    )}
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

            {/* Book Selection Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            Kütüphaneden Kitap Seç
                        </DialogTitle>
                        {selectedReadingListBook && (
                            <p className="text-sm text-muted-foreground">
                                &quot;{selectedReadingListBook.title}&quot; için kütüphanenizden bir kitap seçin
                            </p>
                        )}
                    </DialogHeader>

                    {/* Search in Modal */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Kitap ara..."
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Book List */}
                    <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        {userBooks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Kütüphaneniz boş</p>
                                <p className="text-sm mt-1">Önce kütüphanenize kitap ekleyin</p>
                                <Button asChild className="mt-4">
                                    <Link href="/library/add">Kitap Ekle</Link>
                                </Button>
                            </div>
                        ) : filteredUserBooks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Kitap bulunamadı</p>
                                <p className="text-sm mt-1">&quot;{modalSearch}&quot; ile eşleşen kitap yok</p>
                            </div>
                        ) : (
                            <div className="space-y-2 py-2">
                                {filteredUserBooks.map((book) => (
                                    <button
                                        key={book.id}
                                        onClick={() => handleSelectBook(book)}
                                        disabled={isPending}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary transition-colors text-left disabled:opacity-50"
                                    >
                                        {/* Cover */}
                                        <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                                            {book.coverUrl ? (
                                                <Image
                                                    src={book.coverUrl}
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{book.title}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {book.author?.name || "Bilinmeyen Yazar"}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-full font-medium flex-shrink-0",
                                            book.status === "COMPLETED" && "bg-green-100 text-green-700",
                                            book.status === "READING" && "bg-yellow-100 text-yellow-700",
                                            book.status === "TO_READ" && "bg-blue-100 text-blue-700",
                                            book.status === "DNF" && "bg-gray-100 text-gray-700"
                                        )}>
                                            {book.status === "COMPLETED" && "Okundu"}
                                            {book.status === "READING" && "Okunuyor"}
                                            {book.status === "TO_READ" && "Okunacak"}
                                            {book.status === "DNF" && "Bırakıldı"}
                                        </span>

                                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
