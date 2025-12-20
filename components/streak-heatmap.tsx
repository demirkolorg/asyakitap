"use client"

import { cn } from "@/lib/utils"
import { Flame, Calendar, Trophy } from "lucide-react"
import type { HeatmapDay, StreakData } from "@/actions/stats"

interface StreakHeatmapProps {
    data: StreakData
}

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

// YYYY-MM-DD string'i parse et (timezone sorununu önlemek için)
function parseDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export function StreakHeatmap({ data }: StreakHeatmapProps) {
    const { currentStreak, longestStreak, totalActiveDays, heatmapData } = data

    // Haftalar halinde grupla (7 gün = 1 hafta, 52 hafta = 1 yıl)
    const weeks: HeatmapDay[][] = []
    let currentWeek: HeatmapDay[] = []

    // İlk günün haftanın hangi günü olduğunu bul
    const firstDateStr = heatmapData[0]?.date
    const firstDate = firstDateStr ? parseDateString(firstDateStr) : new Date()
    const firstDayOfWeek = (firstDate.getDay() + 6) % 7 // Pazartesi = 0

    // İlk haftayı boşluklarla doldur
    for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({ date: "", count: 0, level: 0 })
    }

    heatmapData.forEach((day) => {
        currentWeek.push(day)
        if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
        }
    })

    // Son haftayı ekle
    if (currentWeek.length > 0) {
        weeks.push(currentWeek)
    }

    // Ay etiketleri için hesaplama
    const monthLabels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
        const firstValidDay = week.find(d => d.date)
        if (firstValidDay) {
            const date = parseDateString(firstValidDay.date)
            const month = date.getMonth()
            if (month !== lastMonth) {
                monthLabels.push({ month: MONTHS_TR[month], weekIndex })
                lastMonth = month
            }
        }
    })

    return (
        <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Okuma Streak
                </h3>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-orange-500">{currentStreak}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Güncel Streak</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-500">{longestStreak}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">En Uzun</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-green-500">{totalActiveDays}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Aktif Gün</p>
                </div>
            </div>

            {/* Heatmap */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-[700px]">
                    {/* Month Labels */}
                    <div className="flex mb-1 ml-8 gap-[2px]">
                        {weeks.map((week, weekIndex) => {
                            const firstValidDay = week.find(d => d.date)
                            const showLabel = firstValidDay && monthLabels.find(l => l.weekIndex === weekIndex)
                            return (
                                <div key={weekIndex} className="w-[10px] text-[10px] text-muted-foreground">
                                    {showLabel ? monthLabels.find(l => l.weekIndex === weekIndex)?.month : ""}
                                </div>
                            )
                        })}
                    </div>

                    {/* Grid */}
                    <div className="flex gap-[2px]">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[2px] mr-1">
                            {DAYS_TR.map((day, i) => (
                                <div
                                    key={day}
                                    className={cn(
                                        "h-[10px] text-[9px] text-muted-foreground flex items-center",
                                        i % 2 === 1 && "opacity-0" // Her ikinci günü gizle (daha temiz görünüm)
                                    )}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Weeks */}
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[2px]">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={cn(
                                            "w-[10px] h-[10px] rounded-[2px] transition-colors",
                                            day.date === "" && "opacity-0",
                                            day.level === 0 && "bg-muted/50",
                                            day.level === 1 && "bg-green-200 dark:bg-green-900",
                                            day.level === 2 && "bg-green-400 dark:bg-green-700",
                                            day.level === 3 && "bg-green-500 dark:bg-green-500",
                                            day.level === 4 && "bg-green-600 dark:bg-green-400"
                                        )}
                                        title={day.date ? `${day.date}: ${day.count} aktivite` : ""}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
                        <span>Az</span>
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/50" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-green-200 dark:bg-green-900" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-green-400 dark:bg-green-700" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-green-500 dark:bg-green-500" />
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-green-600 dark:bg-green-400" />
                        <span>Çok</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
