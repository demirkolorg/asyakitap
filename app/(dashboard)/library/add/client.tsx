"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { searchGoogleBooks } from "@/actions/google-books"
import { getBestCoverUrl } from "@/lib/book-utils"
import { addBookToLibrary } from "@/actions/library"
import { getOrCreateAuthor } from "@/actions/authors"
import { getOrCreatePublisher } from "@/actions/publisher"
import { linkBookToReadingList, searchReadingListBooks } from "@/actions/reading-lists"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, Map, X, Barcode, BookOpen, FileText, Search, List } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { AuthorCombobox } from "@/components/author/author-combobox"
import { AddAuthorModal } from "@/components/author/add-author-modal"
import { PublisherCombobox } from "@/components/publisher/publisher-combobox"
import { AddPublisherModal } from "@/components/publisher/add-publisher-modal"
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

export function AddBookForm() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const readingListBookId = searchParams.get("rlBookId")
    const readingListSlug = searchParams.get("rlSlug")

    const [addingBook, setAddingBook] = useState(false)
    const [fetchingISBN, setFetchingISBN] = useState(false)

    // Form state
    const [title, setTitle] = useState("")
    const [authorId, setAuthorId] = useState("")
    const [publisherId, setPublisherId] = useState("")
    const [pageCount, setPageCount] = useState("")
    const [coverUrl, setCoverUrl] = useState("")
    const [isbn, setIsbn] = useState("")
    const [publishedDate, setPublishedDate] = useState("")
    const [description, setDescription] = useState("")

    // Author modal
    const [authorModalOpen, setAuthorModalOpen] = useState(false)
    // Publisher modal
    const [publisherModalOpen, setPublisherModalOpen] = useState(false)

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

    const clearReadingListContext = () => {
        const url = new URL(window.location.href)
        url.searchParams.delete("rlBookId")
        url.searchParams.delete("q")
        router.replace(url.pathname)
    }

    const handleFetchFromISBN = async () => {
        if (!isbn.trim()) {
            toast.error("ISBN giriniz")
            return
        }

        setFetchingISBN(true)
        try {
            const books = await searchGoogleBooks(`isbn:${isbn.trim()}`)
            if (books.length > 0) {
                const book = books[0]
                setTitle(book.volumeInfo.title || "")
                setPageCount(book.volumeInfo.pageCount?.toString() || "")
                const cover = getBestCoverUrl(book)
                if (cover) setCoverUrl(cover)

                // Yazar varsa otomatik ekle/seç
                const authorName = book.volumeInfo.authors?.[0]
                if (authorName) {
                    const result = await getOrCreateAuthor(authorName)
                    if (result.success && result.author) {
                        setAuthorId(result.author.id)
                    }
                }

                // Yayınevi varsa otomatik ekle/seç
                const publisherName = book.volumeInfo.publisher
                if (publisherName) {
                    const result = await getOrCreatePublisher(publisherName)
                    if (result.success && result.publisher) {
                        setPublisherId(result.publisher.id)
                    }
                }

                toast.success("Kitap bilgileri dolduruldu")
            } else {
                toast.error("Bu ISBN ile kitap bulunamadı")
            }
        } catch (error) {
            toast.error("Kitap bilgileri alınamadı")
        }
        setFetchingISBN(false)
    }

    const clearForm = () => {
        setTitle("")
        setAuthorId("")
        setPublisherId("")
        setPageCount("")
        setCoverUrl("")
        setIsbn("")
        setPublishedDate("")
        setDescription("")
        setSelectedRlBook(null)
        setRlSearchQuery("")
        setRlSearchResults([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error("Kitap adı zorunludur")
            return
        }
        if (!authorId) {
            toast.error("Yazar seçiniz")
            return
        }

        setAddingBook(true)

        // Hangi reading list book id kullanılacak?
        const rlBookId = readingListBookId || selectedRlBook?.id

        const res = await addBookToLibrary({
            title: title.trim(),
            authorId,
            publisherId: publisherId || undefined,
            coverUrl: coverUrl.trim() || undefined,
            pageCount: pageCount ? parseInt(pageCount) : undefined,
            isbn: isbn.trim() || undefined,
            publishedDate: publishedDate.trim() || undefined,
            description: description.trim() || undefined,
            status: "TO_READ",
            readingListBookId: rlBookId || undefined,
        })

        if (res.success && res.book) {
            if (readingListBookId && readingListSlug) {
                // URL'den gelen okuma listesi bağlantısı (eski mantık)
                await linkBookToReadingList(res.book.id, readingListBookId, readingListSlug)
                toast.success("Kitap kütüphanene ve okuma listesine eklendi!")
                router.back()
            } else if (res.linkedToList) {
                // Manuel seçilen okuma listesi bağlantısı
                toast.success(`Kitap "${res.linkedToList}" listesine eklendi!`)
                clearForm()
            } else {
                toast.success("Kitap kütüphanenize eklendi")
                clearForm()
            }
        } else {
            toast.error("Kitap eklenirken bir hata oluştu")
        }
        setAddingBook(false)
    }

    const handleAuthorCreated = (author: { id: string; name: string }) => {
        setAuthorId(author.id)
    }

    const handlePublisherCreated = (publisher: { id: string; name: string }) => {
        setPublisherId(publisher.id)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Reading List Context Banner */}
            {readingListBookId && (
                <div className="flex items-center justify-between gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Map className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">Okuma Listesinden Ekliyorsun</p>
                            <p className="text-sm text-muted-foreground">
                                Bu kitap otomatik olarak okuma listesine bağlanacak
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearReadingListContext}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen className="h-8 w-8" />
                    Kitap Ekle
                </h1>
                <p className="text-muted-foreground">
                    ISBN ile kitap bilgilerini otomatik doldurabilir veya manuel girebilirsiniz.
                </p>
            </div>

            {/* ISBN ile Doldurma */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Barcode className="h-5 w-5" />
                        ISBN ile Doldur
                    </CardTitle>
                    <CardDescription>
                        Kitabın ISBN numarasını girerek bilgileri otomatik doldurun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            placeholder="ISBN (örn: 9789750719387)"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleFetchFromISBN}
                            disabled={fetchingISBN}
                        >
                            {fetchingISBN && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {fetchingISBN ? "Aranıyor..." : "Bilgileri Getir"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Manuel Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Kitap Bilgileri</CardTitle>
                    <CardDescription>
                        Kitap bilgilerini girin veya ISBN ile otomatik doldurun.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Kitap Adı *</Label>
                            <Input
                                id="title"
                                placeholder="Örn: Suç ve Ceza"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Yazar *</Label>
                            <AuthorCombobox
                                value={authorId}
                                onValueChange={setAuthorId}
                                onAddNew={() => setAuthorModalOpen(true)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Yayınevi</Label>
                            <PublisherCombobox
                                value={publisherId}
                                onValueChange={setPublisherId}
                                onAddNew={() => setPublisherModalOpen(true)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pageCount">Sayfa Sayısı</Label>
                                <Input
                                    id="pageCount"
                                    type="number"
                                    placeholder="Örn: 450"
                                    value={pageCount}
                                    onChange={(e) => setPageCount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="publishedDate">Yayın Tarihi</Label>
                                <Input
                                    id="publishedDate"
                                    placeholder="Örn: 29.10.2025"
                                    value={publishedDate}
                                    onChange={(e) => setPublishedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="isbnField">ISBN</Label>
                            <Input
                                id="isbnField"
                                placeholder="Örn: 9786253695033"
                                value={isbn}
                                onChange={(e) => setIsbn(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                ISBN numarası kitabın benzersiz kimliğidir.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverUrl">Kapak Görseli URL</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="coverUrl"
                                    type="url"
                                    placeholder="https://..."
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    className="flex-1"
                                />
                                {coverUrl && (
                                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded border">
                                        <Image
                                            src={coverUrl}
                                            alt="Kapak önizleme"
                                            fill
                                            className="object-cover"
                                            onError={() => setCoverUrl("")}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Kitapyurdu veya başka bir siteden kapak görselinin URL'ini yapıştırabilirsiniz.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Kitap Açıklaması
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Kitap hakkında kısa bir açıklama..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                Kitabın konusu veya özeti hakkında bilgi ekleyebilirsiniz.
                            </p>
                        </div>

                        {/* Okuma Listesi Seçici - URL'den gelmiyorsa göster */}
                        {!readingListBookId && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <List className="h-4 w-4" />
                                    Okuma Listesine Bağla (Opsiyonel)
                                </Label>

                                {selectedRlBook ? (
                                    <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <div>
                                            <p className="font-medium">{selectedRlBook.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedRlBook.author} • {selectedRlBook.listName}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
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
                                                className="pl-10"
                                            />
                                            {rlSearching && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                        </div>

                                        {rlSearchResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
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
                                                        <p className="font-medium">{book.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {book.author} • {book.listName} / {book.levelName}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Kitabı bir okuma listesiyle eşleştirmek için arama yapın.
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={addingBook} className="w-full">
                            {addingBook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {addingBook ? "Ekleniyor..." : "Kütüphaneye Ekle"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Add Author Modal */}
            <AddAuthorModal
                open={authorModalOpen}
                onOpenChange={setAuthorModalOpen}
                onAuthorCreated={handleAuthorCreated}
            />

            {/* Add Publisher Modal */}
            <AddPublisherModal
                open={publisherModalOpen}
                onOpenChange={setPublisherModalOpen}
                onPublisherCreated={handlePublisherCreated}
            />
        </div>
    )
}
