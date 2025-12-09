import { Skeleton } from "@/components/ui/skeleton"
import { ReadingListCardSkeleton } from "@/components/ui/skeletons"

export default function ReadingListsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ReadingListCardSkeleton />
                <ReadingListCardSkeleton />
                <ReadingListCardSkeleton />
                <ReadingListCardSkeleton />
                <ReadingListCardSkeleton />
                <ReadingListCardSkeleton />
            </div>
        </div>
    )
}
