import { getBooksWithSummaries } from "@/actions/summaries"
import { getBooks } from "@/actions/library"
import SummariesClient from "./client"

export default async function SummariesPage() {
    const [booksWithTortu, allBooks] = await Promise.all([
        getBooksWithSummaries(),
        getBooks()
    ])

    return <SummariesClient booksWithTortu={booksWithTortu} allBooks={allBooks} />
}
