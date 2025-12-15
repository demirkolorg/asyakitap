"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyChartProps {
    data: {
        monthName: string
        booksCompleted: number
        pagesRead: number
    }[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
    const maxBooks = Math.max(...data.map(d => d.booksCompleted), 1)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Aylık Okuma Grafiği
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-1 sm:gap-2 h-48">
                    {data.map((month, i) => {
                        const heightPercent = (month.booksCompleted / maxBooks) * 100
                        return (
                            <div
                                key={i}
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
