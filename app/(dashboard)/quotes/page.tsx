import { getAllQuotes } from "@/actions/quotes"
import { getBooks } from "@/actions/library"
import QuotesClient from "./client"

export default async function QuotesPage() {
    const [quotes, books] = await Promise.all([
        getAllQuotes(),
        getBooks()
    ])

    return <QuotesClient initialQuotes={quotes} books={books} />
}
