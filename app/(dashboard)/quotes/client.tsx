"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Quote, Plus, Search, Trash2, Edit, BookOpen, Library, Heart, Share2, Copy } from "lucide-react"
import { toast } from "sonner"
import { addQuote, deleteQuote, updateQuote } from "@/actions/quotes"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface QuoteWithBook {
    id: string
    content: string
    page: number | null
    createdAt: Date
    book: {
        id: string
        title: string
        author: { name: string } | null
        coverUrl: string | null
    }
}

interface BookForSelect {
    id: string
    title: string
}

interface QuotesClientProps {
    initialQuotes: QuoteWithBook[]
    books: BookForSelect[]
}

export default function QuotesClient({ initialQuotes, books }: QuotesClientProps) {
    const [quotes, setQuotes] = useState(initialQuotes)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterBookId, setFilterBookId] = useState<string>("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingQuote, setEditingQuote] = useState<QuoteWithBook | null>(null)

    // Form state
    const [selectedBookId, setSelectedBookId] = useState("")
    const [quoteContent, setQuoteContent] = useState("")
    const [quotePage, setQuotePage] = useState("")

    // Get books with quotes for sidebar
    const booksWithQuotes = useMemo(() => {
        const bookQuoteCounts = quotes.reduce((acc, q) => {
            acc[q.book.id] = (acc[q.book.id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return Object.entries(bookQuoteCounts)
            .map(([bookId, count]) => {
                const book = quotes.find(q => q.book.id === bookId)?.book
                return { ...book!, count }
            })
            .sort((a, b) => b.count - a.count)
    }, [quotes])

    const filteredQuotes = quotes.filter(q => {
        const matchesSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.book.author?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        const matchesBook = filterBookId === "all" || q.book.id === filterBookId
        return matchesSearch && matchesBook
    })

    const handleAddQuote = async () => {
        if (!selectedBookId || !quoteContent.trim()) {
            toast.error("Kitap ve alıntı içeriği gerekli")
            return
        }

        const result = await addQuote(selectedBookId, quoteContent, quotePage ? parseInt(quotePage) : undefined)
        if (result.success) {
            toast.success("Alıntı eklendi")
            setIsAddDialogOpen(false)
            resetForm()
            window.location.reload()
        } else {
            toast.error("Alıntı eklenemedi")
        }
    }

    const handleUpdateQuote = async () => {
        if (!editingQuote || !quoteContent.trim()) return

        const result = await updateQuote(editingQuote.id, quoteContent, quotePage ? parseInt(quotePage) : undefined)
        if (result.success) {
            toast.success("Alıntı güncellendi")
            setEditingQuote(null)
            resetForm()
            window.location.reload()
        } else {
            toast.error("Alıntı güncellenemedi")
        }
    }

    const handleDeleteQuote = async (quote: QuoteWithBook) => {
        const result = await deleteQuote(quote.id, quote.book.id)
        if (result.success) {
            toast.success("Alıntı silindi")
            setQuotes(quotes.filter(q => q.id !== quote.id))
        } else {
            toast.error("Alıntı silinemedi")
        }
    }

    const copyQuote = (quote: QuoteWithBook) => {
        const text = `"${quote.content}" - ${quote.book.title}, ${quote.book.author?.name || "Bilinmiyor"}`
        navigator.clipboard.writeText(text)
        toast.success("Alıntı kopyalandı")
    }

    const resetForm = () => {
        setSelectedBookId("")
        setQuoteContent("")
        setQuotePage("")
    }

    const openEditDialog = (quote: QuoteWithBook) => {
        setEditingQuote(quote)
        setQuoteContent(quote.content)
        setQuotePage(quote.page?.toString() || "")
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
                <div className="sticky top-6">
                    {/* Add Quote Button */}
                    <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mb-6">
                        <Plus className="mr-2 h-4 w-4" />
                        Alıntı Ekle
                    </Button>

                    {/* Filter by Book */}
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Kitaplara Göre
                        </h3>
                        <button
                            onClick={() => setFilterBookId("all")}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                filterBookId === "all"
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Library className="h-4 w-4" />
                                Tüm Alıntılar
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                filterBookId === "all"
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted-foreground/20"
                            )}>
                                {quotes.length}
                            </span>
                        </button>

                        {booksWithQuotes.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => setFilterBookId(book.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                    filterBookId === book.id
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="truncate flex-1 text-left">{book.title}</span>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full ml-2",
                                    filterBookId === book.id
                                        ? "bg-primary-foreground/20"
                                        : "bg-muted-foreground/20"
                                )}>
                                    {book.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-sm font-semibold mb-3">İstatistikler</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Alıntı</span>
                                <span className="font-medium">{quotes.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kitap Sayısı</span>
                                <span className="font-medium">{booksWithQuotes.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ortalama</span>
                                <span className="font-medium">
                                    {booksWithQuotes.length > 0
                                        ? (quotes.length / booksWithQuotes.length).toFixed(1)
                                        : 0} / kitap
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Quote className="h-6 w-6" />
                            Alıntılar
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {filteredQuotes.length} alıntı
                            {filterBookId !== "all" && ` • ${quotes.find(q => q.book.id === filterBookId)?.book.title}`}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Alıntı, kitap veya yazar ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Quotes List */}
                {filteredQuotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                        <Quote className="h-12 w-12 text-muted-foreground mb-4" />
                        {searchQuery ? (
                            <>
                                <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Aramayı Temizle
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground mb-4">Henüz alıntı eklenmemiş</p>
                                <Button onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    İlk Alıntıyı Ekle
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuotes.map((quote) => (
                            <div
                                key={quote.id}
                                className="group relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border hover:border-primary/30 transition-colors"
                            >
                                {/* Quote Icon */}
                                <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10" />

                                {/* Quote Content */}
                                <blockquote className="relative z-10 text-lg leading-relaxed pl-8 pr-4">
                                    "{quote.content}"
                                </blockquote>

                                {/* Book Info */}
                                <div className="mt-6 flex items-center gap-4">
                                    <Link href={`/book/${quote.book.id}`} className="flex-shrink-0">
                                        <div className="relative h-16 w-12 overflow-hidden rounded shadow-md hover:shadow-lg transition-shadow">
                                            {quote.book.coverUrl ? (
                                                <Image
                                                    src={quote.book.coverUrl.replace("http:", "https:")}
                                                    alt={quote.book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/book/${quote.book.id}`}
                                            className="font-medium hover:text-primary transition-colors line-clamp-1"
                                        >
                                            {quote.book.title}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            {quote.book.author?.name || "Bilinmiyor"}
                                            {quote.page && <span> • Sayfa {quote.page}</span>}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => copyQuote(quote)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditDialog(quote)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Alıntıyı sil?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu işlem geri alınamaz.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteQuote(quote)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Sil
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Alıntı Ekle</DialogTitle>
                        <DialogDescription>
                            Bir kitaptan alıntı kaydet
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kitap</label>
                            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kitap seç..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {books.map(book => (
                                        <SelectItem key={book.id} value={book.id}>
                                            {book.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Alıntı</label>
                            <Textarea
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                                placeholder="Alıntıyı buraya yaz..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sayfa (opsiyonel)</label>
                            <Input
                                type="number"
                                value={quotePage}
                                onChange={(e) => setQuotePage(e.target.value)}
                                placeholder="Sayfa numarası"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleAddQuote}>Ekle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingQuote} onOpenChange={(open) => !open && setEditingQuote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alıntıyı Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Alıntı</label>
                            <Textarea
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sayfa (opsiyonel)</label>
                            <Input
                                type="number"
                                value={quotePage}
                                onChange={(e) => setQuotePage(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingQuote(null)}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleUpdateQuote}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
