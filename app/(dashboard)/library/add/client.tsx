"use client"

import { useState } from "react"
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
import { linkBookToReadingList } from "@/actions/reading-lists"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, Map, X, Barcode, BookOpen, FileText } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { AuthorCombobox } from "@/components/author/author-combobox"
import { AddAuthorModal } from "@/components/author/add-author-modal"
import { PublisherCombobox } from "@/components/publisher/publisher-combobox"
import { AddPublisherModal } from "@/components/publisher/add-publisher-modal"

export function AddBookForm() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const readingListBookId = searchParams.get("rlBookId")

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
        })

        if (res.success && res.book) {
            if (readingListBookId) {
                await linkBookToReadingList(res.book.id, readingListBookId)
                toast.success("Kitap kütüphanene ve okuma listesine eklendi!")
                router.back()
            } else {
                toast.success("Kitap kütüphanenize eklendi")
                // Clear form
                setTitle("")
                setAuthorId("")
                setPublisherId("")
                setPageCount("")
                setCoverUrl("")
                setIsbn("")
                setPublishedDate("")
                setDescription("")
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
        <div className="max-w-2xl mx-auto space-y-4 lg:space-y-8">
            {/* Reading List Context Banner */}
            {readingListBookId && (
                <div className="flex items-center justify-between gap-3 p-3 lg:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <Map className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
                        <div>
                            <p className="font-medium text-sm lg:text-base">Okuma Listesinden Ekliyorsun</p>
                            <p className="text-xs lg:text-sm text-muted-foreground">
                                Otomatik listeye bağlanacak
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearReadingListContext}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="space-y-1 lg:space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2 lg:gap-3">
                    <BookOpen className="h-6 w-6 lg:h-8 lg:w-8" />
                    Kitap Ekle
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground">
                    ISBN ile doldur veya manuel gir.
                </p>
            </div>

            {/* ISBN ile Doldurma */}
            <Card>
                <CardHeader className="p-4 lg:p-6">
                    <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                        <Barcode className="h-4 w-4 lg:h-5 lg:w-5" />
                        ISBN ile Doldur
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                        ISBN ile kitap bilgilerini otomatik doldur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 lg:p-6 lg:pt-0">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                            className="shrink-0"
                        >
                            {fetchingISBN && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {fetchingISBN ? "Aranıyor..." : "Getir"}
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
