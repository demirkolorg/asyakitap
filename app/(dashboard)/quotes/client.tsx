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
import { Quote, Plus, Search, Trash2, Edit, BookOpen, Copy, MessageSquare, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { addQuote, deleteQuote, updateQuote } from "@/actions/quotes"
import { analyzeQuoteSentiments, type QuoteSentimentResult } from "@/actions/ai"
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

// Sentiment renkleri ve etiketleri
const SENTIMENT_CONFIG = {
    inspiring: { label: "İlham Verici", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", emoji: "✨" },
    thoughtful: { label: "Düşündürücü", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", emoji: "🤔" },
    melancholic: { label: "Hüzünlü", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", emoji: "💜" },
    humorous: { label: "Mizahi", color: "bg-green-500/10 text-green-600 dark:text-green-400", emoji: "😄" },
    profound: { label: "Derin", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", emoji: "🌊" },
    neutral: { label: "Nötr", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400", emoji: "📖" },
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

    // Sentiment analysis state
    const [sentimentResults, setSentimentResults] = useState<Record<string, QuoteSentimentResult>>({})
    const [analyzingSentiments, setAnalyzingSentiments] = useState(false)

    // Get books with quotes for filter
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

    const handleAnalyzeSentiments = async () => {
        if (filteredQuotes.length === 0) {
            toast.error("Analiz için alıntı yok")
            return
        }

        setAnalyzingSentiments(true)

        try {
            // En fazla 10 alıntı analiz et
            const quotesToAnalyze = filteredQuotes.slice(0, 10).map(q => ({
                id: q.id,
                content: q.content
            }))

            const result = await analyzeQuoteSentiments(quotesToAnalyze)

            if (result.success && result.results) {
                const resultsMap: Record<string, QuoteSentimentResult> = {}
                result.results.forEach(r => {
                    resultsMap[r.quoteId] = r
                })
                setSentimentResults(prev => ({ ...prev, ...resultsMap }))
                toast.success(`${result.results.length} alıntı analiz edildi`)
            } else {
                toast.error(result.error || "Analiz başarısız")
            }
        } catch (e) {
            toast.error("Bir hata oluştu")
        } finally {
            setAnalyzingSentiments(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Alıntılar</h1>
                <p className="text-muted-foreground">
                    Kitaplardan biriktirdiğin özel cümleler.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-border transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Quote className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam Alıntı</span>
                    <span className="text-3xl font-black z-10">{quotes.length}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                        <BookOpen className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Kitap Sayısı</span>
                    <span className="text-3xl font-black text-primary z-10">{booksWithQuotes.length}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                        <MessageSquare className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Ortalama</span>
                    <span className="text-3xl font-black text-amber-500 z-10">
                        {booksWithQuotes.length > 0 ? (quotes.length / booksWithQuotes.length).toFixed(1) : 0}
                    </span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 rounded-xl border border-border/50">
                {/* Search */}
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Alıntı, kitap veya yazar ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border/50 focus:border-primary"
                    />
                </div>

                {/* Book Filters */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setFilterBookId("all")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filterBookId === "all"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tümü
                    </button>
                    {booksWithQuotes.slice(0, 4).map((book) => (
                        <button
                            key={book.id}
                            onClick={() => setFilterBookId(book.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all max-w-[150px] truncate",
                                filterBookId === book.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                            )}
                        >
                            {book.title}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleAnalyzeSentiments}
                        disabled={analyzingSentiments || filteredQuotes.length === 0}
                        className="gap-2"
                    >
                        {analyzingSentiments ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Analiz ediliyor...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                <span className="hidden sm:inline">Duygu Analizi</span>
                            </>
                        )}
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-lg shadow-primary/25">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Alıntı Ekle</span>
                        <span className="sm:hidden">Ekle</span>
                    </Button>
                </div>
            </div>

            {/* Quotes List */}
            {filteredQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
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
                <div className="grid gap-4">
                    {filteredQuotes.map((quote) => (
                        <div
                            key={quote.id}
                            className="group relative bg-card rounded-xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
                        >
                            {/* Quote Icon */}
                            <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10" />

                            {/* Sentiment Badge */}
                            {sentimentResults[quote.id] && (
                                <div className="absolute top-4 right-4 z-10">
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                        SENTIMENT_CONFIG[sentimentResults[quote.id].sentiment].color
                                    )}>
                                        <span>{SENTIMENT_CONFIG[sentimentResults[quote.id].sentiment].emoji}</span>
                                        <span className="hidden sm:inline">{SENTIMENT_CONFIG[sentimentResults[quote.id].sentiment].label}</span>
                                    </span>
                                </div>
                            )}

                            {/* Quote Content */}
                            <blockquote className="relative z-10 text-lg leading-relaxed pl-8 pr-4 italic">
                                &ldquo;{quote.content}&rdquo;
                            </blockquote>

                            {/* Book Info */}
                            <div className="mt-6 flex items-center gap-4">
                                <Link href={`/book/${quote.book.id}`} className="flex-shrink-0">
                                    <div className="relative h-16 w-12 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow bg-muted">
                                        {quote.book.coverUrl ? (
                                            <Image
                                                src={quote.book.coverUrl.replace("http:", "https:")}
                                                alt={quote.book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/book/${quote.book.id}`}
                                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
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
