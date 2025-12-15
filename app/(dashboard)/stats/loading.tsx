import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
            </CardContent>
        </Card>
    )
}

export default function StatsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Monthly Chart */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48">
                        {Array(12).fill(0).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <Skeleton
                                    className="w-full rounded-t-sm"
                                    style={{ height: `${Math.random() * 60 + 20}%` }}
                                />
                                <Skeleton className="h-3 w-6" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Two Column */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-48" />
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="space-y-2 flex-1">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-3 rounded-sm" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Three Column */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {Array(3).fill(0).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-16" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
