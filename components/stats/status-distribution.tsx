"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusDistributionProps {
    completed: number
    reading: number
    toRead: number
    dnf: number
}

export function StatusDistribution({
    completed,
    reading,
    toRead,
    dnf
}: StatusDistributionProps) {
    const total = completed + reading + toRead + dnf
    if (total === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <PieChart className="h-5 w-5" />
                        Kitap Durumu Dağılımı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Henüz kitap eklenmemiş
                    </p>
                </CardContent>
            </Card>
        )
    }

    const segments = [
        { label: "Tamamlanan", value: completed, color: "bg-green-500", gradientColor: "#22c55e" },
        { label: "Okunan", value: reading, color: "bg-blue-500", gradientColor: "#3b82f6" },
        { label: "Okunacak", value: toRead, color: "bg-yellow-500", gradientColor: "#eab308" },
        { label: "Bırakılan", value: dnf, color: "bg-red-500", gradientColor: "#ef4444" },
    ]

    // Calculate percentages for conic gradient
    let cumulative = 0
    const gradientStops = segments.map(s => {
        const percentage = (s.value / total) * 100
        const start = cumulative
        cumulative += percentage
        return { ...s, start, end: cumulative, percentage }
    })

    // Build gradient string
    const gradientParts = gradientStops
        .filter(s => s.value > 0)
        .map(s => `${s.gradientColor} ${s.start}% ${s.end}%`)
        .join(', ')

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5" />
                    Kitap Durumu Dağılımı
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Donut chart using conic-gradient */}
                    <div
                        className="w-32 h-32 rounded-full relative flex-shrink-0"
                        style={{
                            background: `conic-gradient(${gradientParts})`
                        }}
                    >
                        <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold">{total}</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 flex-1">
                        {gradientStops.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={cn("w-3 h-3 rounded-sm flex-shrink-0", s.color)} />
                                <span className="flex-1">{s.label}</span>
                                <span className="text-muted-foreground">
                                    {s.value} ({Math.round(s.percentage)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
