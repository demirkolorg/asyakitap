"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Quote, StickyNote, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateBook } from "@/actions/library"
import { addQuote } from "@/actions/quotes"
import { addReadingNote } from "@/actions/reading-notes"
import { MOOD_OPTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface QuickActionsProps {
    book: {
        id: string
        title: string
        currentPage: number
        pageCount: number | null
    }
}

export function QuickActions({ book }: QuickActionsProps) {
    // Progress Modal
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progressInput, setProgressInput] = useState(book.currentPage.toString())
    const [isSavingProgress, setIsSavingProgress] = useState(false)

    // Quote Modal
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [quoteContent, setQuoteContent] = useState("")
    const [quotePage, setQuotePage] = useState("")
    const [isSavingQuote, setIsSavingQuote] = useState(false)

    // Note Modal
    const [showNoteModal, setShowNoteModal] = useState(false)
    const [noteContent, setNoteContent] = useState("")
    const [notePage, setNotePage] = useState("")
    const [noteMood, setNoteMood] = useState("")
    const [isSavingNote, setIsSavingNote] = useState(false)

    const handleSaveProgress = async () => {
        const newPage = parseInt(progressInput)
        if (isNaN(newPage) || newPage < 0) {
            toast.error("Geçerli bir sayfa numarası girin")
            return
        }
        if (book.pageCount && newPage > book.pageCount) {
            toast.error(`Sayfa sayısı ${book.pageCount}'dan fazla olamaz`)
            return
        }

        setIsSavingProgress(true)
        try {
            await updateBook(book.id, { currentPage: newPage })
            toast.success("Sayfa güncellendi")
            setShowProgressModal(false)
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsSavingProgress(false)
        }
    }

    const handleSaveQuote = async () => {
        if (!quoteContent.trim()) {
            toast.error("Alıntı içeriği gerekli")
            return
        }

        setIsSavingQuote(true)
        try {
            const result = await addQuote(book.id, quoteContent, quotePage ? parseInt(quotePage) : undefined)
            if (result.success) {
                toast.success("Alıntı eklendi")
                setQuoteContent("")
                setQuotePage("")
                setShowQuoteModal(false)
            } else {
                toast.error(result.error || "Bir hata oluştu")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsSavingQuote(false)
        }
    }

    const handleSaveNote = async () => {
        if (!noteContent.trim()) {
            toast.error("Not içeriği gerekli")
            return
        }

        setIsSavingNote(true)
        try {
            const result = await addReadingNote(
                book.id,
                noteContent,
                notePage ? parseInt(notePage) : undefined,
                noteMood || undefined
            )
            if (result.success) {
                toast.success("Not eklendi")
                setNoteContent("")
                setNotePage("")
                setNoteMood("")
                setShowNoteModal(false)
            } else {
                toast.error(result.error || "Bir hata oluştu")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsSavingNote(false)
        }
    }

    return (
        <>
            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => setShowProgressModal(true)}
                    className="flex-1 py-1.5 md:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors text-[11px] md:text-sm flex items-center justify-center gap-1.5"
                >
                    <Edit className="h-3 md:h-3.5 w-3 md:w-3.5" />
                    Sayfa
                </button>
                <button
                    onClick={() => setShowQuoteModal(true)}
                    className="flex-1 py-1.5 md:py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors text-[11px] md:text-sm flex items-center justify-center gap-1.5"
                >
                    <Quote className="h-3 md:h-3.5 w-3 md:w-3.5" />
                    Alıntı
                </button>
                <button
                    onClick={() => setShowNoteModal(true)}
                    className="flex-1 py-1.5 md:py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors text-[11px] md:text-sm flex items-center justify-center gap-1.5"
                >
                    <StickyNote className="h-3 md:h-3.5 w-3 md:w-3.5" />
                    Not
                </button>
            </div>

            {/* Progress Modal */}
            <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sayfa Güncelle</DialogTitle>
                        <DialogDescription>
                            {book.title} - Şu anki sayfa: {book.currentPage}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Sayfa Numarası</Label>
                            <Input
                                type="number"
                                value={progressInput}
                                onChange={(e) => setProgressInput(e.target.value)}
                                min={0}
                                max={book.pageCount || undefined}
                            />
                            {book.pageCount && (
                                <p className="text-xs text-muted-foreground">
                                    Toplam: {book.pageCount} sayfa
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProgressModal(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveProgress} disabled={isSavingProgress}>
                            {isSavingProgress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quote Modal */}
            <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Alıntı Ekle</DialogTitle>
                        <DialogDescription>
                            {book.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Alıntı</Label>
                            <Textarea
                                value={quoteContent}
                                onChange={(e) => setQuoteContent(e.target.value)}
                                placeholder="Alıntıyı buraya yazın..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sayfa (opsiyonel)</Label>
                            <Input
                                type="number"
                                value={quotePage}
                                onChange={(e) => setQuotePage(e.target.value)}
                                placeholder="Sayfa no"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowQuoteModal(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveQuote} disabled={isSavingQuote}>
                            {isSavingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Note Modal */}
            <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Okuma Notu Ekle</DialogTitle>
                        <DialogDescription>
                            {book.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Not</Label>
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Notunuzu buraya yazın..."
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sayfa (opsiyonel)</Label>
                            <Input
                                type="number"
                                value={notePage}
                                onChange={(e) => setNotePage(e.target.value)}
                                placeholder="Sayfa no"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ruh Hali (opsiyonel)</Label>
                            <div className="flex flex-wrap gap-1">
                                {MOOD_OPTIONS.map((mood) => (
                                    <button
                                        key={mood.value}
                                        type="button"
                                        onClick={() => setNoteMood(noteMood === mood.value ? "" : mood.value)}
                                        className={cn(
                                            "px-2 py-1 rounded-md text-lg transition-all",
                                            noteMood === mood.value
                                                ? "bg-primary/20 ring-2 ring-primary"
                                                : "bg-muted hover:bg-muted/80"
                                        )}
                                        title={mood.label}
                                    >
                                        {mood.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveNote} disabled={isSavingNote}>
                            {isSavingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
