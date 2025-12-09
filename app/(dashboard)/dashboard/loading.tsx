import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    StatCardSkeleton,
    BookCardSkeleton,
    QuoteSkeleton,
    ContentItemSkeleton,
    BookCoverSkeleton,
    PageHeaderSkeleton,
} from "@/components/ui/skeletons"

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeaderSkeleton />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Currently Reading */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <BookCardSkeleton />
                        <BookCardSkeleton />
                        <BookCardSkeleton />
                    </div>
                </CardContent>
            </Card>

            {/* Three Column Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Quotes */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <QuoteSkeleton />
                        <QuoteSkeleton />
                        <QuoteSkeleton />
                    </CardContent>
                </Card>

                {/* Recent Tortu */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ContentItemSkeleton />
                        <ContentItemSkeleton />
                        <ContentItemSkeleton />
                    </CardContent>
                </Card>

                {/* Recent Imza */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ContentItemSkeleton />
                        <ContentItemSkeleton />
                        <ContentItemSkeleton />
                    </CardContent>
                </Card>
            </div>

            {/* Recently Completed */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-36" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        <BookCoverSkeleton />
                        <BookCoverSkeleton />
                        <BookCoverSkeleton />
                        <BookCoverSkeleton />
                        <BookCoverSkeleton />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
