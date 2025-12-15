import { getBook, getLinkedChallengeBookWithDetails } from "@/actions/library"
import { notFound } from "next/navigation"
import BookDetailClient from "./client"

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [book, challengeInfo] = await Promise.all([
        getBook(id),
        getLinkedChallengeBookWithDetails(id)
    ])

    if (!book) {
        notFound()
    }

    return <BookDetailClient book={book} challengeInfo={challengeInfo} />
}
