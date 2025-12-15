import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-12" />
            </CardContent>
        </Card>
    )
}

function CommentCardSkeleton() {
    return (
        <Card>
            <div className="flex">
                {/* Cover */}
                <Skeleton className="w-24 sm:w-28 aspect-[2/3] rounded-none" />

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>

                    {/* User content */}
                    <div className="p-3 rounded-lg bg-muted/50">
                        <Skeleton className="h-3 w-16 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                    </div>

                    {/* AI comment */}
                    <div>
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full mt-1" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default function AICommentsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                </div>
                <Skeleton className="h-10 w-full sm:w-72" />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                <CommentCardSkeleton />
                <CommentCardSkeleton />
                <CommentCardSkeleton />
            </div>
        </div>
    )
}
