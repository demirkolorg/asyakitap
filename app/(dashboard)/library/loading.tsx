import { Skeleton } from "@/components/ui/skeleton"
import { LibraryBookSkeleton, PageHeaderSkeleton } from "@/components/ui/skeletons"

export default function LibraryLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeaderSkeleton />

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Book Grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <LibraryBookSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}
