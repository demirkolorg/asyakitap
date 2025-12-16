"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Copy, Plus, Map, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createReadingList } from "@/actions/reading-lists"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReadingListWithCount = any

interface ReadingListsClientProps {
    lists: ReadingListWithCount[]
}

export function ReadingListsClient({ lists }: ReadingListsClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [createDialog, setCreateDialog] = useState<{
        open: boolean
        name: string
        description: string
    }>({ open: false, name: "", description: "" })

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

    const handleCreateSubmit = async () => {
        if (!createDialog.name.trim()) {
            toast.error("Liste adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createReadingList({
                name: createDialog.name,
                description: createDialog.description || undefined
            })
            if (result.success && result.list) {
                toast.success("Liste oluşturuldu")
                setCreateDialog({ open: false, name: "", description: "" })
                router.push(`/reading-lists/${result.list.slug}`)
            } else {
                toast.error(result.error || "Liste oluşturulamadı")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Map className="h-8 w-8 text-primary" />
                        Okuma Listeleri
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tematik okuma yol haritaları ile okuma deneyimini zenginleştir
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAllAsJson}
                        className="gap-2"
                    >
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline">Tümünü Kopyala</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setCreateDialog({ open: true, name: "", description: "" })}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Liste
                    </Button>
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={createDialog.open} onOpenChange={(open) => !open && setCreateDialog({ ...createDialog, open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Okuma Listesi</DialogTitle>
                        <DialogDescription>
                            Yeni bir tematik okuma listesi oluşturun
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="list-name">Liste Adı</Label>
                            <Input
                                id="list-name"
                                placeholder="Örn: Bilim Kurgu Klasikleri"
                                value={createDialog.name}
                                onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="list-description">Açıklama (Opsiyonel)</Label>
                            <Textarea
                                id="list-description"
                                placeholder="Bu liste hakkında kısa bir açıklama..."
                                value={createDialog.description}
                                onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialog({ ...createDialog, open: false })}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleCreateSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Oluştur
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Legacy export for backward compatibility
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
            <Copy className="h-4 w-4" />
            Tümünü Kopyala
        </Button>
    )
}
