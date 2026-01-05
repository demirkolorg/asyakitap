"use client"

import { useTimer } from "@/contexts/timer-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, RotateCcw, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimerControlsProps {
    size?: "sm" | "default" | "lg"
    showSave?: boolean
    onSave?: () => void
    className?: string
}

export function TimerControls({ size = "default", showSave = true, onSave, className }: TimerControlsProps) {
    const { state, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer, saveSession } = useTimer()

    const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"
    const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"

    const handleSave = async () => {
        const success = await saveSession()
        if (success && onSave) {
            onSave()
        }
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Başlat / Duraklat / Devam Et */}
            {!state.isRunning ? (
                <Button
                    size={buttonSize}
                    onClick={() => startTimer()}
                    className="gap-1"
                >
                    <Play className={iconSize} />
                    {size !== "sm" && <span>Başlat</span>}
                </Button>
            ) : state.isPaused ? (
                <Button
                    size={buttonSize}
                    onClick={resumeTimer}
                    variant="outline"
                    className="gap-1"
                >
                    <Play className={iconSize} />
                    {size !== "sm" && <span>Devam</span>}
                </Button>
            ) : (
                <Button
                    size={buttonSize}
                    onClick={pauseTimer}
                    variant="outline"
                    className="gap-1"
                >
                    <Pause className={iconSize} />
                    {size !== "sm" && <span>Duraklat</span>}
                </Button>
            )}

            {/* Durdur */}
            {state.isRunning && (
                <Button
                    size={buttonSize}
                    variant="destructive"
                    onClick={stopTimer}
                    className="gap-1"
                >
                    <Square className={iconSize} />
                    {size !== "sm" && <span>Durdur</span>}
                </Button>
            )}

            {/* Sıfırla (çalışmıyorken ve süre varsa) */}
            {!state.isRunning && state.seconds > 0 && (
                <Button
                    size={buttonSize}
                    variant="ghost"
                    onClick={resetTimer}
                    className="gap-1"
                >
                    <RotateCcw className={iconSize} />
                    {size !== "sm" && <span>Sıfırla</span>}
                </Button>
            )}

            {/* Kaydet (çalışmıyorken ve süre varsa) */}
            {showSave && !state.isRunning && state.seconds >= 60 && (
                <Button
                    size={buttonSize}
                    variant="default"
                    onClick={handleSave}
                    className="gap-1"
                >
                    <Save className={iconSize} />
                    {size !== "sm" && <span>Kaydet</span>}
                </Button>
            )}
        </div>
    )
}
