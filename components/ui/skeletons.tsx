import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Stat Card Skeleton
export function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    )
}

// Book Card Skeleton (for reading lists, library grid)
export function BookCardSkeleton() {
    return (
        <div className="flex gap-4 p-3 rounded-lg border">
            <Skeleton className="h-20 w-14 flex-shrink-0 rounded" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="pt-2 space-y-1">
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
            </div>
        </div>
    )
}

// Book Cover Skeleton (for horizontal scroll)
export function BookCoverSkeleton() {
    return (
        <div className="flex-shrink-0 w-24">
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
            <Skeleton className="h-3 w-full mt-2" />
        </div>
    )
}

// Quote Skeleton
export function QuoteSkeleton() {
    return (
        <div className="border-l-2 border-muted pl-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

// Tortu/Imza Item Skeleton
export function ContentItemSkeleton() {
    return (
        <div className="p-3 rounded-lg border space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="pt-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>
        </div>
    )
}

// Author Card Skeleton
export function AuthorCardSkeleton() {
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-5" />
        </div>
    )
}

// Library Book Grid Item Skeleton
export function LibraryBookSkeleton() {
    return (
        <div className="group">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <div className="mt-2 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>
        </div>
    )
}

// Library Book List Item Skeleton
export function LibraryListItemSkeleton() {
    return (
        <div className="flex gap-4 p-4 rounded-lg border">
            <Skeleton className="h-24 w-16 flex-shrink-0 rounded" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    )
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-28" />
        </div>
    )
}

// Reading List Card Skeleton
export function ReadingListCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
        </Card>
    )
}

// Book Detail Skeleton
export function BookDetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex gap-6">
                <Skeleton className="h-64 w-44 flex-shrink-0 rounded-lg" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="flex gap-2 pt-4">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            </div>
            {/* Tabs */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    )
}
