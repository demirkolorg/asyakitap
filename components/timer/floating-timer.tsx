"use client"

import { useState } from "react"
import { useTimer } from "@/contexts/timer-context"
import { TimerDisplay } from "./timer-display"
import { TimerControls } from "./timer-controls"
import { ActivitySelector, ActivityBadge } from "./activity-selector"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Timer, ChevronUp, ChevronDown, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"

export function FloatingTimer() {
    const { state, isActive, saveSession, resetTimer } = useTimer()
    const [isExpanded, setIsExpanded] = useState(false)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [saveNotes, setSaveNotes] = useState("")
    const [pageStart, setPageStart] = useState("")
    const [pageEnd, setPageEnd] = useState("")

    // Eğer timer aktif değilse gösterme
    if (!isActive && !state.isRunning) {
        return null
    }

    const handleSaveClick = () => {
        setShowSaveDialog(true)
    }

    const handleSaveConfirm = async () => {
        const pagesRead = pageStart && pageEnd ?
            Math.max(0, parseInt(pageEnd) - parseInt(pageStart)) : undefined

        const success = await saveSession({
            notes: saveNotes || undefined,
            pageStart: pageStart ? parseInt(pageStart) : undefined,
            pageEnd: pageEnd ? parseInt(pageEnd) : undefined,
            pagesRead,
        })

        if (success) {
            setShowSaveDialog(false)
            setSaveNotes("")
            setPageStart("")
            setPageEnd("")
        }
    }

    const handleDiscard = () => {
        resetTimer()
    }

    return (
        <>
            <div className={cn(
                "fixed bottom-4 right-4 z-50",
                "bg-background border rounded-lg shadow-lg",
                "transition-all duration-200",
                isExpanded ? "w-72" : "w-auto"
            )}>
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    {/* Header - her zaman görünür */}
                    <div className="flex items-center justify-between p-3 gap-3">
                        <div className="flex items-center gap-2">
                            <Timer className={cn(
                                "h-4 w-4",
                                state.isRunning && !state.isPaused && "text-primary animate-pulse"
                            )} />
                            <TimerDisplay size="sm" />
                        </div>

                        <div className="flex items-center gap-1">
                            {!isExpanded && (
                                <TimerControls size="sm" showSave={false} />
                            )}
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>

                    {/* Expanded content */}
                    <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-3 border-t pt-3">
                            {/* Aktivite tipi */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Aktivite</Label>
                                <ActivitySelector size="sm" disabled={state.isRunning} />
                            </div>

                            {/* Kitap bilgisi */}
                            {state.bookTitle && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Kitap: </span>
                                    <span className="font-medium">{state.bookTitle}</span>
                                </div>
                            )}

                            {/* Kontroller */}
                            <TimerControls showSave={false} />

                            {/* Kaydet/Sil butonları */}
                            {!state.isRunning && state.seconds > 0 && (
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDiscard}
                                        className="flex-1"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Vazgeç
                                    </Button>
                                    {state.seconds >= 60 && (
                                        <Button
                                            size="sm"
                                            onClick={handleSaveClick}
                                            className="flex-1"
                                        >
                                            <Save className="h-3 w-3 mr-1" />
                                            Kaydet
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Oturumu Kaydet</DialogTitle>
                        <DialogDescription>
                            {state.activityType === "READING" && state.bookTitle
                                ? `${state.bookTitle} için okuma oturumu`
                                : "Aktivite oturumunu kaydet"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Sayfa bilgileri (sadece okuma için) */}
                        {state.activityType === "READING" && state.bookId && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Başlangıç Sayfa</Label>
                                    <Input
                                        type="number"
                                        placeholder="Örn: 50"
                                        value={pageStart}
                                        onChange={(e) => setPageStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Bitiş Sayfa</Label>
                                    <Input
                                        type="number"
                                        placeholder="Örn: 75"
                                        value={pageEnd}
                                        onChange={(e) => setPageEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notlar */}
                        <div className="space-y-1">
                            <Label className="text-xs">Notlar (opsiyonel)</Label>
                            <Textarea
                                placeholder="Bu oturum hakkında notlar..."
                                value={saveNotes}
                                onChange={(e) => setSaveNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveConfirm}>
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
