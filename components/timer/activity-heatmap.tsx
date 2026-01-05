"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, eachDayOfInterval, startOfYear, endOfYear, getDay, subYears } from "date-fns"
import { tr } from "date-fns/locale"

interface ActivityHeatmapProps {
    activeDays: string[] // ISO date strings (YYYY-MM-DD)
    dailyData?: { [key: string]: number } // date -> seconds
    year?: number
    className?: string
}

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

function getIntensityLevel(seconds: number): number {
    if (seconds === 0) return 0
    if (seconds < 900) return 1      // < 15 dk
    if (seconds < 1800) return 2     // < 30 dk
    if (seconds < 3600) return 3     // < 1 saat
    return 4                          // >= 1 saat
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}s ${minutes}dk`
    return `${minutes}dk`
}

export function ActivityHeatmap({ activeDays, dailyData = {}, year, className }: ActivityHeatmapProps) {
    const targetYear = year || new Date().getFullYear()

    const { weeks, monthLabels } = useMemo(() => {
        const start = startOfYear(new Date(targetYear, 0, 1))
        const end = endOfYear(new Date(targetYear, 0, 1))
        const days = eachDayOfInterval({ start, end })

        // Günleri haftalara grupla
        const weeksArr: { date: Date; seconds: number }[][] = []
        let currentWeek: { date: Date; seconds: number }[] = []

        // İlk haftayı doldurmak için boş günler ekle
        const firstDayOfWeek = getDay(days[0])
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push({ date: new Date(0), seconds: -1 }) // placeholder
        }

        days.forEach((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const seconds = dailyData[dateStr] || 0

            currentWeek.push({ date: day, seconds })

            if (currentWeek.length === 7) {
                weeksArr.push(currentWeek)
                currentWeek = []
            }
        })

        // Son haftayı tamamla
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push({ date: new Date(0), seconds: -1 })
            }
            weeksArr.push(currentWeek)
        }

        // Ay etiketleri için pozisyonları hesapla
        const labels: { month: string; weekIndex: number }[] = []
        let currentMonth = -1

        weeksArr.forEach((week, weekIndex) => {
            const validDay = week.find(d => d.seconds >= 0)
            if (validDay) {
                const month = validDay.date.getMonth()
                if (month !== currentMonth) {
                    currentMonth = month
                    labels.push({ month: MONTHS[month], weekIndex })
                }
            }
        })

        return { weeks: weeksArr, monthLabels: labels }
    }, [targetYear, dailyData])

    const activeDaysSet = useMemo(() => new Set(activeDays), [activeDays])

    return (
        <div className={cn("overflow-x-auto", className)}>
            <div className="inline-flex flex-col gap-1">
                {/* Ay etiketleri */}
                <div className="flex ml-8 mb-1">
                    {monthLabels.map(({ month, weekIndex }, i) => (
                        <div
                            key={`${month}-${i}`}
                            className="text-[10px] text-muted-foreground"
                            style={{
                                position: "relative",
                                left: `${weekIndex * 12}px`,
                                marginRight: i < monthLabels.length - 1
                                    ? `${(monthLabels[i + 1].weekIndex - weekIndex - 1) * 12}px`
                                    : 0
                            }}
                        >
                            {month}
                        </div>
                    ))}
                </div>

                <div className="flex gap-1">
                    {/* Gün etiketleri */}
                    <div className="flex flex-col gap-[2px] mr-1">
                        {DAYS.map((day, i) => (
                            <div
                                key={day}
                                className="h-[10px] text-[9px] text-muted-foreground flex items-center"
                                style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    <TooltipProvider delayDuration={100}>
                        <div className="flex gap-[2px]">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                    {week.map((day, dayIndex) => {
                                        if (day.seconds < 0) {
                                            return (
                                                <div
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    className="w-[10px] h-[10px]"
                                                />
                                            )
                                        }

                                        const dateStr = format(day.date, "yyyy-MM-dd")
                                        const isActive = activeDaysSet.has(dateStr)
                                        const level = getIntensityLevel(day.seconds)

                                        return (
                                            <Tooltip key={`${weekIndex}-${dayIndex}`}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "w-[10px] h-[10px] rounded-[2px] transition-colors",
                                                            level === 0 && "bg-muted",
                                                            level === 1 && "bg-primary/20",
                                                            level === 2 && "bg-primary/40",
                                                            level === 3 && "bg-primary/60",
                                                            level === 4 && "bg-primary"
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="text-xs">
                                                    <div className="font-medium">
                                                        {format(day.date, "d MMMM yyyy", { locale: tr })}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {day.seconds > 0 ? formatDuration(day.seconds) : "Aktivite yok"}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </TooltipProvider>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>Az</span>
                    <div className="flex gap-[2px]">
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/20" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/40" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/60" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary" />
                    </div>
                    <span>Çok</span>
                </div>
            </div>
        </div>
    )
}
