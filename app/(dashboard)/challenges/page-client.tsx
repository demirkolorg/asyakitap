"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Target, Plus, Loader2, Calendar, ChevronRight, Trophy } from "lucide-react"
import { toast } from "sonner"
import { createChallenge } from "@/actions/challenge"
import type { ChallengeTimeline } from "@/actions/challenge"
import { ChallengeTimelineClient } from "./timeline-client"

interface ChallengesPageClientProps {
    timeline: ChallengeTimeline | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allChallenges: any[]
}

export function ChallengesPageClient({ timeline, allChallenges }: ChallengesPageClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [createDialog, setCreateDialog] = useState<{
        open: boolean
        year: string
        name: string
        description: string
    }>({ open: false, year: new Date().getFullYear().toString(), name: "", description: "" })

    const handleCreateSubmit = async () => {
        const year = parseInt(createDialog.year)
        if (isNaN(year) || year < 2020 || year > 2100) {
            toast.error("Geçerli bir yıl girin")
            return
        }
        if (!createDialog.name.trim()) {
            toast.error("Hedef adı gerekli")
            return
        }

        setIsLoading(true)
        try {
            const result = await createChallenge({
                year,
                name: createDialog.name,
                description: createDialog.description || undefined
            })
            if (result.success) {
                toast.success("Okuma hedefi oluşturuldu")
                setCreateDialog({ open: false, year: "", name: "", description: "" })
                router.push(`/challenges/${year}`)
            } else {
                toast.error(result.error || "Hedef oluşturulamadı")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Eğer timeline varsa ve challenges varsa, timeline göster
    if (timeline && timeline.challenges.length > 0) {
        return (
            <>
                {/* Header with create button */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <Target className="h-7 w-7 text-primary" />
                            Okuma Hedefleri
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Yıllık okuma hedeflerini takip et
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setCreateDialog({
                            open: true,
                            year: (new Date().getFullYear() + 1).toString(),
                            name: `${new Date().getFullYear() + 1} Okuma Hedefi`,
                            description: ""
                        })}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Hedef
                    </Button>
                </div>

                {/* Timeline */}
                <ChallengeTimelineClient timeline={timeline} />

                {/* Create Dialog */}
                <Dialog open={createDialog.open} onOpenChange={(open) => !open && setCreateDialog({ ...createDialog, open: false })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Okuma Hedefi</DialogTitle>
                            <DialogDescription>
                                Yeni bir yıllık okuma hedefi oluşturun
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="challenge-year">Yıl</Label>
                                <Input
                                    id="challenge-year"
                                    type="number"
                                    placeholder="2026"
                                    value={createDialog.year}
                                    onChange={(e) => setCreateDialog({ ...createDialog, year: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="challenge-name">Hedef Adı</Label>
                                <Input
                                    id="challenge-name"
                                    placeholder="Örn: 2026 Okuma Hedefi"
                                    value={createDialog.name}
                                    onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="challenge-description">Açıklama (Opsiyonel)</Label>
                                <Textarea
                                    id="challenge-description"
                                    placeholder="Bu hedef hakkında kısa bir açıklama..."
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

    // Eğer hiç challenge yoksa veya timeline yoksa, boş state göster
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <Target className="h-7 w-7 text-primary" />
                        Okuma Hedefleri
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Yıllık okuma hedeflerini takip et
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setCreateDialog({
                        open: true,
                        year: new Date().getFullYear().toString(),
                        name: `${new Date().getFullYear()} Okuma Hedefi`,
                        description: ""
                    })}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Hedef
                </Button>
            </div>

            {/* Empty State or Challenge List */}
            {allChallenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma hedefi eklenmemiş</p>
                    <p className="text-sm text-muted-foreground mb-4">İlk hedefinizi oluşturarak başlayın</p>
                    <Button
                        onClick={() => setCreateDialog({
                            open: true,
                            year: new Date().getFullYear().toString(),
                            name: `${new Date().getFullYear()} Okuma Hedefi`,
                            description: ""
                        })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Hedef Oluştur
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {allChallenges.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.year}`}
                            className="block border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Trophy className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{challenge.name}</h2>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {challenge.year}
                                            </span>
                                            <span>
                                                {challenge._count.months} ay
                                            </span>
                                            <span>
                                                {challenge.months.reduce((sum: number, m: { _count: { books: number } }) => sum + m._count.books, 0)} kitap
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={createDialog.open} onOpenChange={(open) => !open && setCreateDialog({ ...createDialog, open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Okuma Hedefi</DialogTitle>
                        <DialogDescription>
                            Yeni bir yıllık okuma hedefi oluşturun
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="challenge-year-2">Yıl</Label>
                            <Input
                                id="challenge-year-2"
                                type="number"
                                placeholder="2026"
                                value={createDialog.year}
                                onChange={(e) => setCreateDialog({ ...createDialog, year: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challenge-name-2">Hedef Adı</Label>
                            <Input
                                id="challenge-name-2"
                                placeholder="Örn: 2026 Okuma Hedefi"
                                value={createDialog.name}
                                onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challenge-description-2">Açıklama (Opsiyonel)</Label>
                            <Textarea
                                id="challenge-description-2"
                                placeholder="Bu hedef hakkında kısa bir açıklama..."
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
        </div>
    )
}
