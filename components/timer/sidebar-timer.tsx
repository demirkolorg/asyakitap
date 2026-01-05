"use client"

import { useTimer } from "@/contexts/timer-context"
import { TimerDisplay } from "./timer-display"
import { Button } from "@/components/ui/button"
import { Play, Pause, Timer, BarChart3 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"

export function SidebarTimer() {
    const { state, startTimer, pauseTimer, resumeTimer, isActive } = useTimer()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Timer</SidebarGroupLabel>
            <SidebarGroupContent>
                <div className="px-2 py-2">
                    {/* Timer durumu */}
                    {isActive ? (
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Timer className={cn(
                                    "h-4 w-4",
                                    state.isRunning && !state.isPaused && "text-primary animate-pulse"
                                )} />
                                <TimerDisplay size="sm" />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={state.isPaused ? resumeTimer : pauseTimer}
                            >
                                {state.isPaused ? (
                                    <Play className="h-3 w-3" />
                                ) : (
                                    <Pause className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 mb-2"
                            onClick={() => startTimer()}
                        >
                            <Play className="h-3 w-3" />
                            Timer Başlat
                        </Button>
                    )}
                </div>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/timer" prefetch={false}>
                                <BarChart3 className="h-4 w-4" />
                                <span>İstatistikler</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
