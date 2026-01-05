"use client"

import { useTimer } from "@/contexts/timer-context"
import { cn } from "@/lib/utils"

interface TimerDisplayProps {
    size?: "sm" | "md" | "lg"
    showLabel?: boolean
    className?: string
}

export function TimerDisplay({ size = "md", showLabel = false, className }: TimerDisplayProps) {
    const { state, formatTime } = useTimer()

    const sizeClasses = {
        sm: "text-lg font-medium",
        md: "text-2xl font-semibold",
        lg: "text-4xl font-bold",
    }

    return (
        <div className={cn("flex flex-col items-center", className)}>
            {showLabel && state.isRunning && (
                <span className="text-xs text-muted-foreground mb-1">
                    {state.isPaused ? "Duraklatıldı" : "Çalışıyor"}
                </span>
            )}
            <span
                className={cn(
                    sizeClasses[size],
                    "tabular-nums font-mono",
                    state.isRunning && !state.isPaused && "text-primary",
                    state.isPaused && "text-yellow-500",
                    !state.isRunning && state.seconds > 0 && "text-muted-foreground"
                )}
            >
                {formatTime(state.seconds)}
            </span>
        </div>
    )
}
