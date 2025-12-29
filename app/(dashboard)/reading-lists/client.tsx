"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    Plus,
    Loader2,
    BookOpen,
    ArrowRight,
    Layers,
    Search,
} from "lucide-react"
import { toast } from "sonner"
import { createReadingList } from "@/actions/reading-lists"
import { cn } from "@/lib/utils"

interface ReadingListSummary {
    id: string
    slug: string
    name: string
    description: string | null
    coverUrl: string | null
    levelCount: number
    totalBooks: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReadingListWithCount = any

interface ReadingListsPageClientProps {
    lists: ReadingListSummary[]
    allLists: ReadingListWithCount[]
}

export function ReadingListsPageClient({ lists: initialLists }: ReadingListsPageClientProps) {
    const router = useRouter()
    const [lists, setLists] = useState(initialLists)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog state
    const [listDialog, setListDialog] = useState({
        open: false,
        data: { name: "", description: "", coverUrl: "" }
    })

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }

    // Filter lists
    const filteredLists = lists.filter(list => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return list.name.toLowerCase().includes(query) ||
            (list.description?.toLowerCase().includes(query) ?? false)
    })

    // Handle list creation
    const handleListSubmit = async () => {
        if (!listDialog.data.name.trim()) {
            toast.error("Liste adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createReadingList({
                name: listDialog.data.name,
                description: listDialog.data.description || undefined,
                coverUrl: listDialog.data.coverUrl || undefined
            })
            if (result.success && result.list) {
                toast.success("Liste oluşturuldu")
                setListDialog({ open: false, data: { name: "", description: "", coverUrl: "" } })
                router.refresh()
            } else {
                toast.error(result.error || "Oluşturulamadı")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Empty state
    if (lists.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-3xl font-semibold tracking-tight">Okuma Listeleri</h1>
                    <p className="text-muted-foreground mt-2">
                        Tematik okuma yolculukları oluşturun ve takip edin.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center py-24 border border-dashed rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-medium mb-2">Henüz liste yok</h2>
                    <p className="text-muted-foreground text-sm mb-6">İlk okuma listenizi oluşturun</p>
                    <Button onClick={() => setListDialog({ open: true, data: { name: "", description: "", coverUrl: "" } })}>
                        <Plus className="h-4 w-4 mr-2" />
                        Liste Oluştur
                    </Button>
                </div>

                {/* Create Dialog */}
                <CreateListDialog
                    dialog={listDialog}
                    setDialog={setListDialog}
                    onSubmit={handleListSubmit}
                    isLoading={isLoading}
                />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Okuma Listeleri</h1>
                    <p className="text-muted-foreground mt-2">
                        {lists.length} liste, {lists.reduce((sum, l) => sum + l.totalBooks, 0)} kitap
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        asChild
                        className="flex-1 md:flex-initial"
                    >
                        <Link href="/reading-lists/by-level">
                            <Layers className="h-4 w-4 mr-2" />
                            Seviye Görünümü
                        </Link>
                    </Button>
                    <Button
                        onClick={() => setListDialog({ open: true, data: { name: "", description: "", coverUrl: "" } })}
                        className="flex-1 md:flex-initial"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Liste
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Liste ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
                />
            </div>

            {/* Lists Grid - 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredLists.map((list) => (
                    <Link
                        key={list.id}
                        href={`/reading-lists/${list.slug}`}
                        className="group block"
                    >
                        <div className="flex flex-col h-full rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all overflow-hidden">
                            {/* Cover */}
                            <div className="relative w-full aspect-[16/10] bg-muted">
                                {list.coverUrl ? (
                                    <Image
                                        src={list.coverUrl}
                                        alt={list.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                        <Layers className="h-12 w-12 text-primary/40" />
                                    </div>
                                )}
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                {/* Stats on image */}
                                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-xs text-white/90">
                                    <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                                        <Layers className="h-3 w-3" />
                                        {list.levelCount} seviye
                                    </span>
                                    <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                                        <BookOpen className="h-3 w-3" />
                                        {list.totalBooks} kitap
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4">
                                <h2 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                    {list.name}
                                </h2>
                                {list.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {list.description}
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-4">
                                <div className="flex items-center justify-between text-sm text-primary font-medium">
                                    <span>Listeyi Görüntüle</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* No results */}
            {filteredLists.length === 0 && searchQuery && (
                <div className="text-center py-16">
                    <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">"{searchQuery}" ile eşleşen liste bulunamadı</p>
                </div>
            )}

            {/* Create Dialog */}
            <CreateListDialog
                dialog={listDialog}
                setDialog={setListDialog}
                onSubmit={handleListSubmit}
                isLoading={isLoading}
            />
        </div>
    )
}

// Create List Dialog Component
type ListDialogType = {
    open: boolean
    data: { name: string; description: string; coverUrl: string }
}

function CreateListDialog({
    dialog,
    setDialog,
    onSubmit,
    isLoading,
}: {
    dialog: ListDialogType
    setDialog: React.Dispatch<React.SetStateAction<ListDialogType>>
    onSubmit: () => void
    isLoading: boolean
}) {
    return (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ ...dialog, open: false })}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Yeni Okuma Listesi</DialogTitle>
                    <DialogDescription>
                        Tematik bir okuma listesi oluşturun
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Liste Adı</Label>
                        <Input
                            placeholder="Örn: Bilim Kurgu Klasikleri"
                            value={dialog.data.name}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, name: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                        <Textarea
                            placeholder="Bu liste hakkında kısa bir açıklama..."
                            value={dialog.data.description}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, description: e.target.value }
                            })}
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Kapak URL <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
                        <Input
                            placeholder="https://..."
                            value={dialog.data.coverUrl}
                            onChange={(e) => setDialog({
                                ...dialog,
                                data: { ...dialog.data, coverUrl: e.target.value }
                            })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
                        Vazgeç
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading || !dialog.data.name.trim()}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Oluştur
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Legacy exports for backward compatibility
export function ReadingListsClient({ lists }: { lists: ReadingListWithCount[] }) {
    return null
}

export function CopyAllListsButton({ lists }: { lists: ReadingListWithCount[] }) {
    const handleCopyAllAsJson = () => {
        const jsonData = lists.map(list => ({
            name: list.name,
            slug: list.slug,
            description: list.description,
            levelCount: list._count?.levels || list.levels?.length || 0,
            totalBooks: list.levels?.reduce((sum: number, l: { _count?: { books: number } }) =>
                sum + (l._count?.books || 0), 0) || 0
        }))

        navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
            .then(() => toast.success("Tüm listeler JSON olarak kopyalandı"))
            .catch(() => toast.error("Kopyalama başarısız"))
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllAsJson}
            className="gap-2"
        >
            JSON Kopyala
        </Button>
    )
}
