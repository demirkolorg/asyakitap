"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Building2,
    BookOpen,
    ArrowLeft,
    ExternalLink,
    BookMarked,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    Pencil,
    Loader2,
    Globe,
} from "lucide-react"
import { updatePublisher } from "@/actions/publisher"
import { toast } from "sonner"

interface Author {
    id: string
    name: string
}

interface Book {
    id: string
    title: string
    coverUrl: string | null
    status: BookStatus
    pageCount: number | null
    currentPage: number
    createdAt: Date
    author: Author | null
}

interface Publisher {
    id: string
    name: string
    imageUrl: string | null
    website: string | null
    books: Book[]
}

interface PublisherDetailClientProps {
    publisher: Publisher
}

const statusConfig: Record<BookStatus, { label: string; icon: React.ReactNode; color: string }> = {
    TO_READ: { label: "Okunacak", icon: <BookMarked className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    READING: { label: "Okunuyor", icon: <Clock className="h-3 w-3" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    COMPLETED: { label: "Tamamlandı", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    DNF: { label: "Bırakıldı", icon: <XCircle className="h-3 w-3" />, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
}

export function PublisherDetailClient({ publisher: initialPublisher }: PublisherDetailClientProps) {
    const [publisher, setPublisher] = useState(initialPublisher)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Edit form state
    const [editName, setEditName] = useState(publisher.name)
    const [editImageUrl, setEditImageUrl] = useState(publisher.imageUrl || "")
    const [editWebsite, setEditWebsite] = useState(publisher.website || "")

    const completedBooks = publisher.books.filter(book => book.status === "COMPLETED")
    const readingBooks = publisher.books.filter(book => book.status === "READING")

    const handleOpenEditModal = () => {
        setEditName(publisher.name)
        setEditImageUrl(publisher.imageUrl || "")
        setEditWebsite(publisher.website || "")
        setEditModalOpen(true)
    }

    const handleSavePublisher = async () => {
        if (!editName.trim()) {
            toast.error("Yayınevi adı zorunludur")
            return
        }

        setSaving(true)
        const result = await updatePublisher(publisher.id, {
            name: editName.trim(),
            imageUrl: editImageUrl.trim() || null,
            website: editWebsite.trim() || null,
        })

        if (result.success && result.publisher) {
            setPublisher({
                ...publisher,
                name: result.publisher.name,
                imageUrl: result.publisher.imageUrl,
                website: result.publisher.website,
            })
            toast.success("Yayınevi bilgileri güncellendi")
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
                href="/publishers"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Tüm Yayınevleri
            </Link>

            {/* Publisher Header Section */}
            <div className="flex flex-col sm:flex-row gap-6 pb-8 border-b">
                {/* Publisher Logo */}
                <div className="flex-shrink-0">
                    <div className="relative h-40 w-40 overflow-hidden rounded-lg bg-muted shadow-md">
                        {publisher.imageUrl ? (
                            <Image
                                src={publisher.imageUrl}
                                alt={publisher.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                                <Building2 className="h-20 w-20 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Publisher Info */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground">
                                {publisher.name}
                            </h1>
                            <p className="text-muted-foreground mt-1">Yayınevi</p>
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

                    {/* Website Link */}
                    {publisher.website && (
                        <a
                            href={publisher.website.startsWith('http') ? publisher.website : `https://${publisher.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <Globe className="h-4 w-4" />
                            {publisher.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{publisher.books.length}</span>
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
                    </div>
                </div>
            </div>

            {/* Books Section */}
            <div className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">
                        {publisher.name} Kitapları
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {publisher.books.length} kitap
                    </span>
                </div>

                {publisher.books.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Bu yayınevinden henüz kitap eklemediniz.
                        </p>
                        <Button asChild size="sm">
                            <Link href="/library/add">Kitap Ekle</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {publisher.books.map((book) => (
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
                                        {book.author && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {book.author.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <Badge variant="secondary" className={`${statusConfig[book.status].color} gap-1 text-xs`}>
                                            {statusConfig[book.status].icon}
                                            {statusConfig[book.status].label}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 self-center group-hover:text-muted-foreground transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Publisher Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yayınevi Bilgilerini Düzenle</DialogTitle>
                        <DialogDescription>
                            Yayınevinin adını, görselini ve web sitesini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Yayınevi Adı *</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Yayınevi adını girin"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-image">Logo URL</Label>
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
                                Yayınevinin logo URL&apos;ini yapıştırın.
                            </p>
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-website">Web Sitesi</Label>
                            <Input
                                id="edit-website"
                                value={editWebsite}
                                onChange={(e) => setEditWebsite(e.target.value)}
                                placeholder="https://..."
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
                        <Button onClick={handleSavePublisher} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
