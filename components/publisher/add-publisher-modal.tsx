"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPublisher } from "@/actions/publisher"
import { toast } from "sonner"

interface AddPublisherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPublisherCreated?: (publisher: { id: string; name: string }) => void
    defaultName?: string
}

export function AddPublisherModal({
    open,
    onOpenChange,
    onPublisherCreated,
    defaultName = ""
}: AddPublisherModalProps) {
    const [name, setName] = React.useState(defaultName)
    const [imageUrl, setImageUrl] = React.useState("")
    const [website, setWebsite] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setName(defaultName)
            setImageUrl("")
            setWebsite("")
        }
    }, [open, defaultName])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("Yayınevi adı zorunludur")
            return
        }

        setLoading(true)
        const result = await createPublisher({
            name: name.trim(),
            imageUrl: imageUrl.trim() || undefined,
            website: website.trim() || undefined
        })

        if (result.success && result.publisher) {
            toast.success("Yayınevi eklendi")
            onPublisherCreated?.(result.publisher)
            onOpenChange(false)
        } else {
            toast.error(result.error || "Yayınevi eklenemedi")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Yayınevi Ekle</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir yayınevi ekleyin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Yayınevi Adı *</Label>
                            <Input
                                id="name"
                                placeholder="Örn: İletişim Yayınları"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Logo URL</Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                placeholder="https://..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Yayınevinin logo URL&apos;ini yapıştırabilirsiniz.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Web Sitesi</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://..."
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Ekleniyor..." : "Ekle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
