import { getBook } from "@/actions/library"
import { notFound } from "next/navigation"
import BookDetailClient from "./client"

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const book = await getBook(id)

    if (!book) {
        notFound()
    }

    return <BookDetailClient book={book} />
}
