import { Skeleton } from "@/components/ui/skeleton"
import { AuthorCardSkeleton } from "@/components/ui/skeletons"

export default function AuthorsLoading() {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="border-b pb-6 mb-6">
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </div>

            {/* Search */}
            <div className="mb-8">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>

            {/* Author Groups */}
            <div className="space-y-8">
                {["A", "B", "C"].map((letter) => (
                    <div key={letter}>
                        {/* Letter Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="h-8 w-8" />
                            <div className="flex-1 h-px bg-border" />
                            <Skeleton className="h-4 w-16" />
                        </div>

                        {/* Authors */}
                        <div className="space-y-1">
                            <AuthorCardSkeleton />
                            <AuthorCardSkeleton />
                            <AuthorCardSkeleton />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
