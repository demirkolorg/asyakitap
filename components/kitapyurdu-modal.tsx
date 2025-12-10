"use client"

import { useState } from "react"
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
    Calendar
} from "lucide-react"
import { scrapeKitapyurdu, addBookFromKitapyurdu } from "@/actions/kitapyurdu"
import { toast } from "sonner"

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

    const resetModal = () => {
        setStep("input")
        setUrl("")
        setScrapedData(null)
        setError("")
        setIsAdding(false)
        setAddedBookId(null)
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
        const result = await addBookFromKitapyurdu(scrapedData)

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
            <DialogContent className="sm:max-w-md">
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
                                <Input
                                    id="url"
                                    placeholder="https://www.kitapyurdu.com/kitap/..."
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value)
                                        setError("")
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                                />
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
