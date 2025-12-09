"use client"

import * as React from "react"
import { Loader2, Sparkles } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { createAuthor } from "@/actions/authors"
import { generateAuthorBio } from "@/actions/ai"
import { toast } from "sonner"

interface AddAuthorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAuthorCreated?: (author: { id: string; name: string }) => void
    defaultName?: string
}

export function AddAuthorModal({
    open,
    onOpenChange,
    onAuthorCreated,
    defaultName = ""
}: AddAuthorModalProps) {
    const [name, setName] = React.useState(defaultName)
    const [imageUrl, setImageUrl] = React.useState("")
    const [bio, setBio] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [generatingBio, setGeneratingBio] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setName(defaultName)
            setImageUrl("")
            setBio("")
        }
    }, [open, defaultName])

    const handleGenerateBio = async () => {
        if (!name.trim()) {
            toast.error("Önce yazar adını girin")
            return
        }

        setGeneratingBio(true)
        const result = await generateAuthorBio(name.trim())

        if (result.success && result.text) {
            setBio(result.text)
            toast.success("Biyografi oluşturuldu")
        } else {
            toast.error(result.error || "Biyografi oluşturulamadı")
        }
        setGeneratingBio(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("Yazar adı zorunludur")
            return
        }

        setLoading(true)
        const result = await createAuthor({
            name: name.trim(),
            imageUrl: imageUrl.trim() || undefined,
            bio: bio.trim() || undefined
        })

        if (result.success && result.author) {
            toast.success("Yazar eklendi")
            onAuthorCreated?.(result.author)
            onOpenChange(false)
        } else {
            toast.error(result.error || "Yazar eklenemedi")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Yazar Ekle</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir yazar ekleyin. Daha sonra bu yazarın kitaplarını ekleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Yazar Adı *</Label>
                            <Input
                                id="name"
                                placeholder="Örn: Fyodor Dostoyevski"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Fotoğraf URL</Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                placeholder="https://..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Yazarın fotoğrafının URL'ini yapıştırabilirsiniz.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="bio">Biyografi</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerateBio}
                                    disabled={generatingBio || !name.trim()}
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
                                id="bio"
                                placeholder="Yazar hakkında kısa bir bilgi..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
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
