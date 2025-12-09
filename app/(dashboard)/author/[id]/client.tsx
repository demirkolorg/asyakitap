"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
import {
    User,
    BookOpen,
    PenLine,
    ArrowLeft,
    ExternalLink,
    BookMarked,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    Quote,
    Pencil,
    Loader2,
    Sparkles,
} from "lucide-react"
import { updateAuthor } from "@/actions/authors"
import { generateAuthorBio } from "@/actions/ai"
import { toast } from "sonner"

interface Book {
    id: string
    title: string
    coverUrl: string | null
    status: BookStatus
    imza: string | null
    pageCount: number | null
    currentPage: number
    createdAt: Date
}

interface Author {
    id: string
    name: string
    imageUrl: string | null
    bio: string | null
    books: Book[]
}

interface AuthorDetailClientProps {
    author: Author
}

const statusConfig: Record<BookStatus, { label: string; icon: React.ReactNode; color: string }> = {
    TO_READ: { label: "Okunacak", icon: <BookMarked className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    READING: { label: "Okunuyor", icon: <Clock className="h-3 w-3" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    COMPLETED: { label: "Tamamlandı", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    DNF: { label: "Bırakıldı", icon: <XCircle className="h-3 w-3" />, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
}

export function AuthorDetailClient({ author: initialAuthor }: AuthorDetailClientProps) {
    const [author, setAuthor] = useState(initialAuthor)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [generatingBio, setGeneratingBio] = useState(false)

    // Edit form state
    const [editName, setEditName] = useState(author.name)
    const [editImageUrl, setEditImageUrl] = useState(author.imageUrl || "")
    const [editBio, setEditBio] = useState(author.bio || "")

    const booksWithImza = author.books.filter(book => book.imza && book.imza.trim() !== "")
    const completedBooks = author.books.filter(book => book.status === "COMPLETED")
    const readingBooks = author.books.filter(book => book.status === "READING")

    const handleOpenEditModal = () => {
        setEditName(author.name)
        setEditImageUrl(author.imageUrl || "")
        setEditBio(author.bio || "")
        setEditModalOpen(true)
    }

    const handleGenerateBio = async () => {
        if (!editName.trim()) {
            toast.error("Önce yazar adını girin")
            return
        }

        setGeneratingBio(true)
        const result = await generateAuthorBio(editName.trim())

        if (result.success && result.text) {
            setEditBio(result.text)
            toast.success("Biyografi oluşturuldu")
        } else {
            toast.error(result.error || "Biyografi oluşturulamadı")
        }
        setGeneratingBio(false)
    }

    const handleSaveAuthor = async () => {
        if (!editName.trim()) {
            toast.error("Yazar adı zorunludur")
            return
        }

        setSaving(true)
        const result = await updateAuthor(author.id, {
            name: editName.trim(),
            imageUrl: editImageUrl.trim() || null,
            bio: editBio.trim() || null,
        })

        if (result.success && result.author) {
            setAuthor({
                ...author,
                name: result.author.name,
                imageUrl: result.author.imageUrl,
                bio: result.author.bio,
            })
            toast.success("Yazar bilgileri güncellendi")
            setEditModalOpen(false)
        } else {
            toast.error("Güncelleme başarısız oldu")
        }
        setSaving(false)
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
                href="/authors"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Tüm Yazarlar
            </Link>

            {/* Author Header Section */}
            <div className="flex flex-col sm:flex-row gap-6 pb-8 border-b">
                {/* Author Photo */}
                <div className="flex-shrink-0">
                    <div className="relative h-40 w-40 overflow-hidden rounded-lg bg-muted shadow-md">
                        {author.imageUrl ? (
                            <Image
                                src={author.imageUrl}
                                alt={author.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                                <User className="h-20 w-20 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Author Info */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground">
                                {author.name}
                            </h1>
                            <p className="text-muted-foreground mt-1">Yazar</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenEditModal}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Düzenle
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{author.books.length}</span>
                            <span className="text-muted-foreground">kitap</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">{completedBooks.length}</span>
                            <span className="text-muted-foreground">tamamlandı</span>
                        </div>
                        {readingBooks.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">{readingBooks.length}</span>
                                <span className="text-muted-foreground">okunuyor</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <PenLine className="h-4 w-4 text-primary" />
                            <span className="font-medium">{booksWithImza.length}</span>
                            <span className="text-muted-foreground">imza</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            {author.bio && (
                <div className="py-8 border-b">
                    <h2 className="text-lg font-semibold mb-4">
                        {author.name} Hakkında
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {author.bio}
                    </p>
                </div>
            )}

            {/* Books Section */}
            <div className="py-8 border-b">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">
                        {author.name} Kitapları
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {author.books.length} kitap
                    </span>
                </div>

                {author.books.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Bu yazardan henüz kitap eklemediniz.
                        </p>
                        <Button asChild size="sm">
                            <Link href="/library/add">Kitap Ekle</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {author.books.map((book) => (
                            <Link
                                key={book.id}
                                href={`/book/${book.id}`}
                                className="group flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                                {/* Book Cover */}
                                <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded shadow-sm bg-muted">
                                    {book.coverUrl ? (
                                        <Image
                                            src={book.coverUrl}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>

                                {/* Book Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {author.name}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <Badge variant="secondary" className={`${statusConfig[book.status].color} gap-1 text-xs`}>
                                            {statusConfig[book.status].icon}
                                            {statusConfig[book.status].label}
                                        </Badge>
                                        {book.imza && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <PenLine className="h-3 w-3" />
                                                İmza
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 self-center group-hover:text-muted-foreground transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Imza Section */}
            {booksWithImza.length > 0 && (
                <div className="py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <PenLine className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">
                            İmzalar
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {booksWithImza.length} kitap
                        </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Yazarın kitaplarındaki üslubu ve tarzı hakkındaki değerlendirmeleriniz.
                    </p>

                    <div className="space-y-6">
                        {booksWithImza.map((book) => (
                            <div
                                key={book.id}
                                className="relative p-6 rounded-lg border bg-card"
                            >
                                {/* Quote Icon */}
                                <Quote className="absolute top-4 right-4 h-8 w-8 text-muted-foreground/10" />

                                {/* Book Reference */}
                                <Link
                                    href={`/book/${book.id}`}
                                    className="inline-flex items-center gap-3 mb-4 group"
                                >
                                    <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded shadow-sm bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                                            {book.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {statusConfig[book.status].label}
                                        </p>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                </Link>

                                <Separator className="mb-4" />

                                {/* Imza Content */}
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: book.imza || "" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Author Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yazar Bilgilerini Düzenle</DialogTitle>
                        <DialogDescription>
                            Yazarın adını, görselini ve biyografisini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Yazar Adı *</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Yazar adını girin"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-image">Görsel URL</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="edit-image"
                                    value={editImageUrl}
                                    onChange={(e) => setEditImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1"
                                />
                                {editImageUrl && (
                                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border">
                                        <Image
                                            src={editImageUrl}
                                            alt="Önizleme"
                                            fill
                                            className="object-cover"
                                            onError={() => setEditImageUrl("")}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Wikipedia veya başka bir kaynaktan yazar görselinin URL&apos;ini yapıştırın.
                            </p>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="edit-bio">Biyografi</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerateBio}
                                    disabled={generatingBio || !editName.trim()}
                                    className="h-7 gap-1.5 text-xs"
                                >
                                    {generatingBio ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                    {generatingBio ? "Oluşturuluyor..." : "AI ile Oluştur"}
                                </Button>
                            </div>
                            <Textarea
                                id="edit-bio"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Yazar hakkında kısa bilgi..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditModalOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleSaveAuthor} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
