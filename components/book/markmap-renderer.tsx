"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Transformer } from "markmap-lib"
import { Markmap } from "markmap-view"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Pencil, Eye, Save, X, ZoomIn, ZoomOut, Maximize2, Fullscreen, ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarkmapRendererProps {
    content: string
    onChange?: (content: string) => void
    onSave?: (content: string) => Promise<void>
    readOnly?: boolean
    className?: string
}

const transformer = new Transformer()

const DEFAULT_MINDMAP = `# Kitap Adı

## Ana Tema 1
- Alt konu 1.1
- Alt konu 1.2
  - Detay

## Ana Tema 2
- Alt konu 2.1
- Alt konu 2.2

## Karakterler
- Karakter 1
- Karakter 2

## Önemli Noktalar
- Nokta 1
- Nokta 2
`

export function MarkmapRenderer({
    content,
    onChange,
    onSave,
    readOnly = false,
    className,
}: MarkmapRendererProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const fullscreenSvgRef = useRef<SVGSVGElement>(null)
    const markmapRef = useRef<Markmap | null>(null)
    const fullscreenMarkmapRef = useRef<Markmap | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [editContent, setEditContent] = useState(content || DEFAULT_MINDMAP)
    const [isSaving, setIsSaving] = useState(false)

    // Markmap'i render et
    useEffect(() => {
        if (svgRef.current && !isEditing) {
            const contentToRender = content || DEFAULT_MINDMAP
            const { root } = transformer.transform(contentToRender)

            if (markmapRef.current) {
                markmapRef.current.setData(root)
                markmapRef.current.fit()
            } else {
                markmapRef.current = Markmap.create(svgRef.current, {
                    autoFit: true,
                    duration: 500,
                    maxWidth: 300,
                    paddingX: 16,
                }, root)
            }
        }
    }, [content, isEditing])

    // Fullscreen Markmap'i render et
    useEffect(() => {
        if (!isFullscreen) {
            // Modal kapandığında temizle
            if (fullscreenMarkmapRef.current) {
                fullscreenMarkmapRef.current.destroy()
                fullscreenMarkmapRef.current = null
            }
            return
        }

        // Modal açıldığında biraz bekle (DOM'un hazır olması için)
        const timer = setTimeout(() => {
            if (fullscreenSvgRef.current) {
                const contentToRender = content || DEFAULT_MINDMAP
                const { root } = transformer.transform(contentToRender)

                // Önceki instance'ı temizle
                if (fullscreenMarkmapRef.current) {
                    fullscreenMarkmapRef.current.destroy()
                    fullscreenMarkmapRef.current = null
                }

                // Yeni instance oluştur
                fullscreenMarkmapRef.current = Markmap.create(fullscreenSvgRef.current, {
                    autoFit: true,
                    duration: 500,
                    maxWidth: 400,
                    paddingX: 24,
                }, root)

                // Fit et
                setTimeout(() => {
                    fullscreenMarkmapRef.current?.fit()
                }, 50)
            }
        }, 150)

        return () => clearTimeout(timer)
    }, [content, isFullscreen])

    // Pencere boyutu değiştiğinde fit et
    useEffect(() => {
        const handleResize = () => {
            if (markmapRef.current) {
                markmapRef.current.fit()
            }
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleEdit = () => {
        setEditContent(content || DEFAULT_MINDMAP)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setEditContent(content || DEFAULT_MINDMAP)
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!onSave) return
        setIsSaving(true)
        try {
            await onSave(editContent)
            onChange?.(editContent)
            setIsEditing(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleZoomIn = () => {
        if (markmapRef.current) {
            markmapRef.current.rescale(1.25)
        }
    }

    const handleZoomOut = () => {
        if (markmapRef.current) {
            markmapRef.current.rescale(0.8)
        }
    }

    const handleFit = () => {
        if (markmapRef.current) {
            markmapRef.current.fit()
        }
    }

    // Fullscreen zoom fonksiyonları
    const handleFullscreenZoomIn = () => {
        if (fullscreenMarkmapRef.current) {
            fullscreenMarkmapRef.current.rescale(1.25)
        }
    }

    const handleFullscreenZoomOut = () => {
        if (fullscreenMarkmapRef.current) {
            fullscreenMarkmapRef.current.rescale(0.8)
        }
    }

    const handleFullscreenFit = () => {
        if (fullscreenMarkmapRef.current) {
            fullscreenMarkmapRef.current.fit()
        }
    }

    // Tüm düğümleri aç
    const handleExpandAll = () => {
        if (markmapRef.current) {
            const contentToRender = content || DEFAULT_MINDMAP
            const { root } = transformer.transform(contentToRender)
            markmapRef.current.setData(root, { initialExpandLevel: -1 })
            setTimeout(() => markmapRef.current?.fit(), 100)
        }
    }

    // Tüm düğümleri kapat
    const handleCollapseAll = () => {
        if (markmapRef.current) {
            const contentToRender = content || DEFAULT_MINDMAP
            const { root } = transformer.transform(contentToRender)
            markmapRef.current.setData(root, { initialExpandLevel: 1 })
            setTimeout(() => markmapRef.current?.fit(), 100)
        }
    }

    // Fullscreen - Tüm düğümleri aç
    const handleFullscreenExpandAll = () => {
        if (fullscreenMarkmapRef.current) {
            const contentToRender = content || DEFAULT_MINDMAP
            const { root } = transformer.transform(contentToRender)
            fullscreenMarkmapRef.current.setData(root, { initialExpandLevel: -1 })
            setTimeout(() => fullscreenMarkmapRef.current?.fit(), 100)
        }
    }

    // Fullscreen - Tüm düğümleri kapat
    const handleFullscreenCollapseAll = () => {
        if (fullscreenMarkmapRef.current) {
            const contentToRender = content || DEFAULT_MINDMAP
            const { root } = transformer.transform(contentToRender)
            fullscreenMarkmapRef.current.setData(root, { initialExpandLevel: 1 })
            setTimeout(() => fullscreenMarkmapRef.current?.fit(), 100)
        }
    }

    if (isEditing) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Markdown formatında zihin haritası düzenleyin. # ile başlıklar, - ile alt maddeler oluşturulur.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="h-4 w-4 mr-1" />
                            İptal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {isSaving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </div>
                <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="# Kitap Adı&#10;## Tema 1&#10;- Alt konu&#10;## Tema 2"
                />
                <div className="text-xs text-muted-foreground">
                    <strong>İpucu:</strong> NotebookLM&apos;den aldığınız PNG&apos;yi ChatGPT veya Claude&apos;a yükleyip
                    &quot;Bu zihin haritasını Markdown formatına çevir&quot; diyebilirsiniz.
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleZoomIn} title="Yakınlaştır">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleZoomOut} title="Uzaklaştır">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleFit} title="Sığdır">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExpandAll} title="Tümünü Aç">
                            <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCollapseAll} title="Tümünü Kapat">
                            <ChevronsDownUp className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)} title="Tam Ekran">
                            <Fullscreen className="h-4 w-4" />
                        </Button>
                    </div>
                    {!readOnly && (
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Düzenle
                        </Button>
                    )}
                </div>
                <div className="relative w-full h-[500px] border rounded-lg bg-background overflow-hidden">
                    <svg
                        ref={svgRef}
                        className="w-full h-full"
                        style={{ background: "var(--background)" }}
                    />
                    {!content && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-muted-foreground">
                                <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Henüz zihin haritası eklenmemiş</p>
                                {!readOnly && (
                                    <p className="text-sm">Düzenle butonuna tıklayarak ekleyebilirsiniz</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Modal */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent
                    showCloseButton={false}
                    className="fixed inset-0 translate-x-0 translate-y-0 top-0 left-0 p-0 rounded-none border-none gap-0 bg-background"
                    style={{ maxWidth: '100vw', width: '100vw', height: '100vh', maxHeight: '100vh' }}
                >
                    <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
                        <span className="text-base font-semibold">Zihin Haritası</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleFullscreenZoomIn} title="Yakınlaştır">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleFullscreenZoomOut} title="Uzaklaştır">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleFullscreenFit} title="Sığdır">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleFullscreenExpandAll} title="Tümünü Aç">
                                <ChevronsUpDown className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleFullscreenCollapseAll} title="Tümünü Kapat">
                                <ChevronsDownUp className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)} title="Kapat">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="w-full h-full pt-12 overflow-hidden">
                        <svg
                            ref={fullscreenSvgRef}
                            className="w-full h-full"
                            style={{ background: "var(--background)" }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
