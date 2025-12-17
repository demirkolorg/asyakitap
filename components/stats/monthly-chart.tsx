"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyChartProps {
    data: {
        monthName: string
        year: number
        booksCompleted: number
        pagesRead: number
    }[]
}

const MONTHS_TO_SHOW = 12

export function MonthlyChart({ data }: MonthlyChartProps) {
    // Varsayılan olarak en son 12 ayı göster (data'nın sonundan başla)
    const [startIndex, setStartIndex] = useState(() => Math.max(0, data.length - MONTHS_TO_SHOW))

    // Görüntülenecek aylar
    const visibleData = useMemo(() => {
        return data.slice(startIndex, startIndex + MONTHS_TO_SHOW)
    }, [data, startIndex])

    // Navigasyon durumları
    const canGoBack = startIndex > 0
    const canGoForward = startIndex + MONTHS_TO_SHOW < data.length

    // Görüntülenen dönem aralığı
    const periodText = useMemo(() => {
        if (visibleData.length === 0) return ""
        const first = visibleData[0]
        const last = visibleData[visibleData.length - 1]
        if (first.year === last.year) {
            return `${first.monthName} - ${last.monthName} ${first.year}`
        }
        return `${first.monthName} ${first.year} - ${last.monthName} ${last.year}`
    }, [visibleData])

    const handleBack = () => {
        setStartIndex(prev => Math.max(0, prev - MONTHS_TO_SHOW))
    }

    const handleForward = () => {
        setStartIndex(prev => Math.min(data.length - MONTHS_TO_SHOW, prev + MONTHS_TO_SHOW))
    }

    const maxBooks = Math.max(...visibleData.map(d => d.booksCompleted), 1)

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-5 w-5" />
                        Aylık Okuma Grafiği
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleBack}
                            disabled={!canGoBack}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleForward}
                            disabled={!canGoForward}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">{periodText}</p>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-1 sm:gap-2 h-48">
                    {visibleData.map((month, i) => {
                        const heightPercent = (month.booksCompleted / maxBooks) * 100
                        return (
                            <div
                                key={`${month.year}-${month.monthName}`}
                                className="flex-1 flex flex-col items-center gap-1 group"
                            >
                                {/* Tooltip on hover */}
                                <div className="relative">
                                    <div
                                        className={cn(
                                            "w-full min-w-[20px] max-w-[40px] rounded-t-sm transition-all duration-300",
                                            month.booksCompleted > 0
                                                ? "bg-primary hover:bg-primary/80"
                                                : "bg-muted"
                                        )}
                                        style={{
                                            height: `${Math.max(heightPercent, month.booksCompleted > 0 ? 8 : 2)}%`,
                                            minHeight: month.booksCompleted > 0 ? '8px' : '2px'
                                        }}
                                    />
                                    {/* Hover tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        <p className="text-xs font-medium">{month.booksCompleted} kitap</p>
                                        <p className="text-xs text-muted-foreground">{month.pagesRead.toLocaleString()} sayfa</p>
                                        <p className="text-xs text-muted-foreground">{month.monthName} {month.year}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground truncate w-full text-center">
                                    {month.monthName.slice(0, 3)}
                                </span>
                                <span className="text-xs sm:text-sm font-medium">
                                    {month.booksCompleted}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
