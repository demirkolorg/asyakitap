"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Loader2,
    BookOpen,
    Check,
    AlertCircle,
    ExternalLink,
    User,
    FileText,
    Building2,
    Barcode,
    Calendar,
    AlignLeft,
    ClipboardPaste,
    Search,
    List,
    X
} from "lucide-react"
import { scrapeKitapyurdu, addBookFromKitapyurdu } from "@/actions/kitapyurdu"
import { searchReadingListBooks } from "@/actions/reading-lists"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import debounce from "lodash/debounce"

type ReadingListBookResult = {
    id: string
    title: string
    author: string
    listName: string
    levelName: string
    listSlug: string
}

interface ScrapedData {
    title: string
    author: string
    authorImageUrl: string | null
    pageCount: number | null
    coverUrl: string | null
    publisher: string | null
    publisherImageUrl: string | null
    isbn: string | null
    publishedDate: string | null
    description: string | null
}

type ModalStep = "input" | "loading" | "preview" | "success" | "error"

interface KitapyurduModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function KitapyurduModal({ open, onOpenChange }: KitapyurduModalProps) {
    const router = useRouter()
    const [step, setStep] = useState<ModalStep>("input")
    const [url, setUrl] = useState("")
    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
    const [error, setError] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [addedBookId, setAddedBookId] = useState<string | null>(null)

    // Reading list book search
    const [rlSearchQuery, setRlSearchQuery] = useState("")
    const [rlSearchResults, setRlSearchResults] = useState<ReadingListBookResult[]>([])
    const [rlSearching, setRlSearching] = useState(false)
    const [selectedRlBook, setSelectedRlBook] = useState<ReadingListBookResult | null>(null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedRlSearch = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setRlSearchResults([])
                return
            }
            setRlSearching(true)
            const results = await searchReadingListBooks(query)
            setRlSearchResults(results)
            setRlSearching(false)
        }, 300),
        []
    )

    const resetModal = () => {
        setStep("input")
        setUrl("")
        setScrapedData(null)
        setError("")
        setIsAdding(false)
        setAddedBookId(null)
        setSelectedRlBook(null)
        setRlSearchQuery("")
        setRlSearchResults([])
    }

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(resetModal, 200)
    }

    const handleScrape = async () => {
        if (!url.trim()) {
            setError("Lütfen bir URL girin")
            return
        }

        setStep("loading")
        setError("")

        const result = await scrapeKitapyurdu(url)

        if (result.success && result.data) {
            setScrapedData(result.data)
            setStep("preview")
        } else {
            setError(result.error || "Bir hata oluştu")
            setStep("error")
        }
    }

    const handleAddBook = async () => {
        if (!scrapedData) return

        setIsAdding(true)
        const result = await addBookFromKitapyurdu(scrapedData, selectedRlBook?.id)

        if (result.success) {
            setAddedBookId(result.bookId || null)
            setStep("success")
            toast.success(result.message)
        } else if (result.alreadyExists) {
            setAddedBookId(result.bookId || null)
            toast.info(result.message)
            setStep("success")
        } else {
            setError(result.error || "Kitap eklenirken hata oluştu")
            setStep("error")
        }
        setIsAdding(false)
    }

    const handleGoToBook = () => {
        if (addedBookId) {
            router.push(`/book/${addedBookId}`)
            handleClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-visible">
                {/* Input Step */}
                {step === "input" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ExternalLink className="h-5 w-5 text-orange-500" />
                                Kitapyurdu&apos;ndan Ekle
                            </DialogTitle>
                            <DialogDescription>
                                Kitapyurdu kitap sayfasının linkini yapıştırın
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">Kitapyurdu Linki</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="url"
                                        placeholder="https://www.kitapyurdu.com/kitap/..."
                                        value={url}
                                        onChange={(e) => {
                                            setUrl(e.target.value)
                                            setError("")
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText()
                                                if (text.trim()) {
                                                    setUrl(text)
                                                    setError("")
                                                    // Otomatik devam et
                                                    setStep("loading")
                                                    const result = await scrapeKitapyurdu(text)
                                                    if (result.success && result.data) {
                                                        setScrapedData(result.data)
                                                        setStep("preview")
                                                    } else {
                                                        setError(result.error || "Bir hata oluştu")
                                                        setStep("error")
                                                    }
                                                }
                                            } catch {
                                                toast.error("Pano erişimi reddedildi")
                                            }
                                        }}
                                        title="Yapıştır ve Devam Et"
                                    >
                                        <ClipboardPaste className="h-4 w-4" />
                                    </Button>
                                </div>
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Vazgeç
                            </Button>
                            <Button onClick={handleScrape} disabled={!url.trim()}>
                                Devam
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Loading Step */}
                {step === "loading" && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Kitap bilgileri alınıyor...</p>
                    </div>
                )}

                {/* Preview Step */}
                {step === "preview" && scrapedData && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Kitap Önizleme</DialogTitle>
                            <DialogDescription>
                                Bilgileri kontrol edin ve ekleyin
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex gap-4">
                                {/* Cover */}
                                <div className="relative h-36 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                                    {scrapedData.coverUrl ? (
                                        <Image
                                            src={scrapedData.coverUrl}
                                            alt={scrapedData.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-semibold leading-tight">
                                        {scrapedData.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        {scrapedData.author}
                                    </div>
                                    {scrapedData.pageCount && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            {scrapedData.pageCount} sayfa
                                        </div>
                                    )}
                                    {scrapedData.publisher && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                            {scrapedData.publisher}
                                        </div>
                                    )}
                                    {scrapedData.isbn && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Barcode className="h-4 w-4" />
                                            {scrapedData.isbn}
                                        </div>
                                    )}
                                    {scrapedData.publishedDate && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {scrapedData.publishedDate}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {scrapedData.description && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex items-start gap-2 text-sm">
                                        <AlignLeft className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                        <p className="text-muted-foreground line-clamp-4">
                                            {scrapedData.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Okuma Listesi Seçici */}
                            <div className="mt-4 pt-4 border-t space-y-2">
                                <Label className="flex items-center gap-2 text-sm">
                                    <List className="h-4 w-4" />
                                    Okuma Listesine Bağla (Opsiyonel)
                                </Label>

                                {selectedRlBook ? (
                                    <div className="flex items-center justify-between gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{selectedRlBook.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {selectedRlBook.author} • {selectedRlBook.listName}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => {
                                                setSelectedRlBook(null)
                                                setRlSearchQuery("")
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Kitap veya yazar ara..."
                                                value={rlSearchQuery}
                                                onChange={(e) => {
                                                    setRlSearchQuery(e.target.value)
                                                    debouncedRlSearch(e.target.value)
                                                }}
                                                className="pl-10 h-9"
                                            />
                                            {rlSearching && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                        </div>

                                        {rlSearchResults.length > 0 && (
                                            <div className="absolute z-[100] w-full mt-1 bg-background border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                {rlSearchResults.map((book) => (
                                                    <button
                                                        key={book.id}
                                                        type="button"
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                                                            "border-b last:border-b-0"
                                                        )}
                                                        onClick={() => {
                                                            setSelectedRlBook(book)
                                                            setRlSearchResults([])
                                                            setRlSearchQuery("")
                                                        }}
                                                    >
                                                        <p className="font-medium text-sm">{book.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {book.author} • {book.listName} / {book.levelName}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep("input")}>
                                Geri
                            </Button>
                            <Button onClick={handleAddBook} disabled={isAdding}>
                                {isAdding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Ekleniyor...
                                    </>
                                ) : (
                                    <>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Kütüphaneme Ekle
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Success Step */}
                {step === "success" && (
                    <>
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">Kitap Eklendi!</h3>
                            <p className="text-muted-foreground text-center">
                                {scrapedData?.title}
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center gap-2">
                            <Button variant="outline" onClick={() => {
                                resetModal()
                            }}>
                                Başka Ekle
                            </Button>
                            <Button onClick={handleGoToBook}>
                                Kitaba Git
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Error Step */}
                {step === "error" && (
                    <>
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">Hata Oluştu</h3>
                            <p className="text-muted-foreground text-center">
                                {error}
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button variant="outline" onClick={() => setStep("input")}>
                                Tekrar Dene
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
