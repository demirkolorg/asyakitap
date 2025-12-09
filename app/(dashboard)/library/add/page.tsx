import { Suspense } from "react"
import { AddBookForm } from "./client"

export default function AddBookPage() {
    return (
        <Suspense fallback={<div className="max-w-2xl mx-auto space-y-8 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-96 bg-muted rounded-lg" />
        </div>}>
            <AddBookForm />
        </Suspense>
    )
}
