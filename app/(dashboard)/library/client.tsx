"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
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
    List,
    BookMarked,
    CheckCircle2,
    XCircle,
    Library,
    ExternalLink,
    Map,
    Target,
    Sparkles,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Book, BookStatus, Author, Publisher } from "@prisma/client"
import type { ChallengeTimeline } from "@/actions/challenge"
import type { ReadingListDetail } from "@/actions/reading-lists"
import { updateBook } from "@/actions/library"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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

export default function LibraryClient({ books: initialBooks, readingLists, challengeTimeline }: LibraryClientProps) {
    const router = useRouter()
    const [books, setBooks] = useState(initialBooks)
    const [activeView, setActiveView] = useState<ViewMode>("cards")
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [highlightInLibrary, setHighlightInLibrary] = useState(false)

    const handleToggleLibrary = async (bookId: string, currentValue: boolean) => {
        const newValue = !currentValue
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, inLibrary: newValue } : b))

        const result = await updateBook(bookId, { inLibrary: newValue })
        if (result.success) {
            toast.success(newValue ? "Kütüphanene eklendi" : "Kütüphaneden çıkarıldı")
        } else {
            setBooks(prev => prev.map(b => b.id === bookId ? { ...b, inLibrary: currentValue } : b))
            toast.error("Bir hata oluştu")
        }
    }

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

    // Book Card Component
    const BookCard = ({ book }: { book: BookWithRelations }) => {
        const isGrayscale = highlightInLibrary && !book.inLibrary
        const progress = book.pageCount ? Math.round((book.currentPage / book.pageCount) * 100) : 0

        return (
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="group relative flex flex-col gap-3 cursor-pointer">
                        <Link href={`/book/${book.id}`}>
                            <div className={cn(
                                "relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300",
                                "group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-primary/10",
                                "bg-muted",
                                isGrayscale && "grayscale opacity-60"
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
                                        <BookOpen className="h-8 w-8" />
                                    </div>
                                )}

                                {/* Status badge - only for READING */}
                                {book.status === "READING" && (
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            OKUNUYOR
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* Book Info */}
                        <div className="flex flex-col gap-1">
                            <Link href={`/book/${book.id}`}>
                                <h3 className={cn(
                                    "font-bold leading-tight truncate group-hover:text-primary transition-colors text-sm",
                                    isGrayscale && "text-muted-foreground"
                                )} title={book.title}>
                                    {book.title}
                                </h3>
                            </Link>
                            <p className="text-muted-foreground text-sm truncate">
                                {book.author?.name || "Bilinmiyor"}
                            </p>

                            {/* Progress Bar for Reading */}
                            {book.status === "READING" && book.pageCount && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        %{progress}
                                    </span>
                                </div>
                            )}

                            {/* Status Badge for non-reading */}
                            {book.status === "COMPLETED" && (
                                <div className="mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    <span className="text-xs text-green-500 font-medium">Tamamlandı</span>
                                </div>
                            )}
                            {book.status === "TO_READ" && (
                                <div className="mt-1 flex items-center gap-1">
                                    <BookMarked className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="text-xs text-orange-500 font-medium">Okunacak</span>
                                </div>
                            )}
                            {book.status === "DNF" && (
                                <div className="mt-1 flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    <span className="text-xs text-red-500 font-medium">Yarım Bırakıldı</span>
                                </div>
                            )}
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem
                        onClick={() => handleToggleLibrary(book.id, book.inLibrary)}
                        className="flex items-center"
                    >
                        <Library className={cn("h-4 w-4 mr-2", book.inLibrary && "text-primary")} />
                        {book.inLibrary ? "Kütüphaneden Çıkar" : "Kütüphaneme Ekle"}
                    </ContextMenuItem>
                    <ContextMenuItem asChild>
                        <Link href={`/book/${book.id}`} className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Kitaba Git
                        </Link>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="flex items-center text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        )
    }

    // Mini Book Card for Reading Lists and Challenges
    const MiniBookCard = ({ book, showInLibrary = false }: { book: { id: string; title: string; coverUrl: string | null; inLibrary?: boolean; author?: { name: string } | null }, showInLibrary?: boolean }) => {
        const isGrayscale = highlightInLibrary && !book.inLibrary

        return (
            <Link
                href={`/book/${book.id}`}
                className="group relative block"
            >
                <div className={cn(
                    "relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg transition-all duration-300",
                    "group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary",
                    isGrayscale && "grayscale opacity-60"
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
                            <BookOpen className="h-4 w-4" />
                        </div>
                    )}
                    {showInLibrary && book.inLibrary && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[8px] text-center py-0.5">
                            <Library className="h-2 w-2 inline" />
                        </div>
                    )}
                </div>
                <div className="mt-1.5">
                    <h4 className={cn(
                        "text-[11px] font-medium line-clamp-2 group-hover:text-primary transition-colors",
                        isGrayscale && "text-muted-foreground"
                    )}>
                        {book.title}
                    </h4>
                    {book.author && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {book.author.name}
                        </p>
                    )}
                </div>
            </Link>
        )
    }

    // Reading Lists View
    const ReadingListsView = () => (
        <div className="space-y-6">
            {readingLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Henüz okuma listesi yok</p>
                    <Button asChild variant="outline">
                        <Link href="/reading-lists">Okuma Listelerine Git</Link>
                    </Button>
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={readingLists.map(l => l.id)} className="space-y-4">
                    {readingLists.map((list) => (
                        <AccordionItem key={list.id} value={list.id} className="border rounded-xl overflow-hidden bg-card">
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
                                                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
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
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Henüz okuma hedefi yok</p>
                    <Button asChild variant="outline">
                        <Link href="/challenges">Okuma Hedeflerine Git</Link>
                    </Button>
                </div>
            ) : (
                <Accordion type="multiple" defaultValue={challengeTimeline.challenges.map(c => c.id)} className="space-y-4">
                    {challengeTimeline.challenges.map((challenge) => (
                        <AccordionItem key={challenge.id} value={challenge.id} className="border rounded-xl overflow-hidden bg-card">
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

                                                {mainBooks.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2 ml-7">
                                                            <Target className="h-3 w-3 text-primary" />
                                                            <span className="text-xs font-medium">Ana Hedefler</span>
                                                        </div>
                                                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 ml-7">
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

                                                {bonusBooks.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2 ml-7">
                                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                                            <span className="text-xs font-medium">Bonus Kitaplar</span>
                                                        </div>
                                                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 ml-7">
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                {/* Title & Subtitle */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Kütüphanem</h1>
                    <p className="text-muted-foreground">
                        Okuma yolculuğunu yönet, hedeflerini belirle ve ilerlemeni takip et.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-border">
                    <div className="flex gap-6 md:gap-8">
                        <button
                            onClick={() => setActiveView("cards")}
                            className={cn(
                                "relative flex flex-col items-center justify-center pb-3 pt-2 transition-colors",
                                activeView === "cards" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-sm font-bold tracking-wide">Kartlar</span>
                            {activeView === "cards" && (
                                <span className="absolute bottom-0 h-[3px] w-full bg-primary rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveView("reading-lists")}
                            className={cn(
                                "relative flex flex-col items-center justify-center pb-3 pt-2 transition-colors",
                                activeView === "reading-lists" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-sm font-bold tracking-wide">Okuma Listeleri</span>
                            {activeView === "reading-lists" && (
                                <span className="absolute bottom-0 h-[3px] w-full bg-primary rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveView("challenges")}
                            className={cn(
                                "relative flex flex-col items-center justify-center pb-3 pt-2 transition-colors",
                                activeView === "challenges" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-sm font-bold tracking-wide">Hedefler</span>
                            {activeView === "challenges" && (
                                <span className="absolute bottom-0 h-[3px] w-full bg-primary rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Control Bar - Only for Cards View */}
            {activeView === "cards" && (
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 rounded-xl border border-border/50">
                    {/* Search */}
                    <div className="relative w-full lg:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Kitap, yazar veya tür ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background border-border/50 focus:border-primary"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setActiveStatus("ALL")}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeStatus === "ALL"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                            )}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setActiveStatus("READING")}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeStatus === "READING"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                            )}
                        >
                            Okunuyor
                        </button>
                        <button
                            onClick={() => setActiveStatus("TO_READ")}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeStatus === "TO_READ"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                            )}
                        >
                            Okunacak
                        </button>
                        <button
                            onClick={() => setActiveStatus("COMPLETED")}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeStatus === "COMPLETED"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                            )}
                        >
                            Bitti
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                        {/* View Toggle */}
                        <div className="flex bg-muted rounded-lg p-1 border border-border/50">
                            <button className="p-1.5 rounded bg-background text-foreground shadow-sm">
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors">
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Add Book Button */}
                        <Button asChild className="shadow-lg shadow-primary/25">
                            <Link href="/library/add">
                                <Plus className="h-4 w-4 mr-2" />
                                Kitap Ekle
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats Section - Only for Cards View */}
            {activeView === "cards" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-border transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="h-12 w-12" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium z-10">Toplam Kitap</span>
                        <span className="text-3xl font-black z-10">{stats.total}</span>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                            <BookOpen className="h-12 w-12" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium z-10">Okunuyor</span>
                        <span className="text-3xl font-black text-primary z-10">{stats.reading}</span>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-orange-500">
                            <BookMarked className="h-12 w-12" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium z-10">Okunacak</span>
                        <span className="text-3xl font-black text-orange-500 z-10">{stats.toRead}</span>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-green-500/50 transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-green-500">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium z-10">Bitirilen</span>
                        <span className="text-3xl font-black text-green-500 z-10">{stats.completed}</span>
                    </div>
                </div>
            )}

            {/* Books Grid */}
            {activeView === "cards" && (
                <>
                    {filteredBooks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
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
                        <div className="grid gap-x-6 gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 pb-12">
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
        </div>
    )
}
