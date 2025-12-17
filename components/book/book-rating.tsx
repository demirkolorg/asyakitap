"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
    Star,
    Loader2,
    Save,
    Trash2,
    ThumbsUp,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { saveBookRating, deleteBookRating, type BookRatingData } from "@/actions/rating"
import { RATING_CATEGORIES } from "@/lib/rating-categories"
import type { BookRating as BookRatingType } from "@prisma/client"

interface BookRatingProps {
    bookId: string
    rating: BookRatingType | null
    isCompleted: boolean
    inTab?: boolean // Tab içinde gösteriliyorsa card wrapper olmadan
}

// Gruplar için ikonlar ve renkler
const GROUP_CONFIG: Record<string, { icon: string; color: string }> = {
    "İçerik & Hikaye": { icon: "📖", color: "text-blue-500" },
    "Yazarlık & Üslup": { icon: "✍️", color: "text-purple-500" },
    "Teknik & Üretim": { icon: "🎨", color: "text-orange-500" },
    "Genel": { icon: "⭐", color: "text-yellow-500" },
}

export function BookRating({ bookId, rating, isCompleted, inTab = false }: BookRatingProps) {
    const [isExpanded, setIsExpanded] = useState(inTab || !!rating)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Form state - mevcut puanlama varsa onu kullan, yoksa varsayılan değerler
    const [formData, setFormData] = useState<BookRatingData>({
        konuFikir: rating?.konuFikir ?? 5,
        akicilik: rating?.akicilik ?? 5,
        derinlik: rating?.derinlik ?? 5,
        etki: rating?.etki ?? 5,
        dilUslup: rating?.dilUslup ?? 5,
        karakterAnlatim: rating?.karakterAnlatim ?? 5,
        ozgunluk: rating?.ozgunluk ?? 5,
        baskiTasarim: rating?.baskiTasarim ?? 5,
        genelPuan: rating?.genelPuan ?? 5,
        tapivsiyeEderim: rating?.tapivsiyeEderim ?? false,
    })

    const [currentRating, setCurrentRating] = useState<BookRatingType | null>(rating)

    // Kategorileri gruplara ayır
    const groupedCategories = RATING_CATEGORIES.reduce((acc, cat) => {
        if (!acc[cat.group]) {
            acc[cat.group] = []
        }
        acc[cat.group].push(cat)
        return acc
    }, {} as Record<string, typeof RATING_CATEGORIES[number][]>)

    // Ortalamayı hesapla
    const calculateAverage = () => {
        const values = [
            formData.konuFikir,
            formData.akicilik,
            formData.derinlik,
            formData.etki,
            formData.dilUslup,
            formData.karakterAnlatim,
            formData.ozgunluk,
            formData.baskiTasarim,
            formData.genelPuan
        ]
        return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await saveBookRating(bookId, formData)
            if (result.success) {
                toast.success("Puanlama kaydedildi")
                setCurrentRating(result.rating as BookRatingType)
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteBookRating(bookId)
            if (result.success) {
                toast.success("Puanlama silindi")
                setCurrentRating(null)
                // Reset form to defaults
                setFormData({
                    konuFikir: 5,
                    akicilik: 5,
                    derinlik: 5,
                    etki: 5,
                    dilUslup: 5,
                    karakterAnlatim: 5,
                    ozgunluk: 5,
                    baskiTasarim: 5,
                    genelPuan: 5,
                    tapivsiyeEderim: false,
                })
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsDeleting(false)
        }
    }

    const updateRating = (key: keyof BookRatingData, value: number | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    // Sadece tamamlanmış kitaplar için göster
    if (!isCompleted) {
        return null
    }

    // İçerik kısmı - hem tab içi hem card için ortak
    const ratingContent = (
        <div className="space-y-6">
            {/* Grupları render et */}
            {Object.entries(groupedCategories).map(([group, categories]) => (
                <div key={group} className="space-y-4">
                    <h3 className={cn("text-sm font-semibold flex items-center gap-2", GROUP_CONFIG[group]?.color)}>
                        <span>{GROUP_CONFIG[group]?.icon}</span>
                        {group}
                    </h3>
                    <div className="space-y-4 pl-4 border-l-2 border-muted">
                        {categories.map((category) => (
                            <div key={category.key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">{category.label}</Label>
                                        <p className="text-xs text-muted-foreground">{category.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold w-8 text-right">
                                            {formData[category.key as keyof BookRatingData] as number}
                                        </span>
                                    </div>
                                </div>
                                <Slider
                                    value={[formData[category.key as keyof BookRatingData] as number]}
                                    onValueChange={([value]) => updateRating(category.key as keyof BookRatingData, value)}
                                    min={1}
                                    max={10}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>1</span>
                                    <span>2</span>
                                    <span>3</span>
                                    <span>4</span>
                                    <span>5</span>
                                    <span>6</span>
                                    <span>7</span>
                                    <span>8</span>
                                    <span>9</span>
                                    <span>10</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Tavsiye */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                    <ThumbsUp className={cn("h-5 w-5", formData.tapivsiyeEderim ? "text-green-500" : "text-muted-foreground")} />
                    <div>
                        <Label className="text-sm font-medium">Tavsiye Eder misin?</Label>
                        <p className="text-xs text-muted-foreground">Bu kitabı başkalarına önerir misin?</p>
                    </div>
                </div>
                <Switch
                    checked={formData.tapivsiyeEderim}
                    onCheckedChange={(checked) => updateRating("tapivsiyeEderim", checked)}
                />
            </div>

            {/* Ortalama ve Kaydet */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ortalama</p>
                        <p className="text-2xl font-bold text-yellow-500">{calculateAverage()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {currentRating && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting || isSaving}
                            className="text-destructive hover:text-destructive"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isDeleting}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {currentRating ? "Güncelle" : "Kaydet"}
                    </Button>
                </div>
            </div>

            {/* Son güncelleme */}
            {currentRating && (
                <p className="text-xs text-muted-foreground text-right">
                    Son güncelleme: {new Date(currentRating.updatedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </p>
            )}
        </div>
    )

    // Tab içinde ise direkt içeriği göster
    if (inTab) {
        return ratingContent
    }

    // Standalone card olarak göster
    return (
        <Card className="border-yellow-500/20">
            <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Kitap Puanlaması
                        {currentRating && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-medium">
                                {currentRating.ortalamaPuan.toFixed(1)}/10
                            </span>
                        )}
                    </CardTitle>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent>
                    {ratingContent}
                </CardContent>
            )}
        </Card>
    )
}
