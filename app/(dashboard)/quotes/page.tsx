import { getQuotesPageData } from "@/actions/quotes"
import QuotesClient from "./client"

export default async function QuotesPage() {
    const data = await getQuotesPageData()

    return <QuotesClient initialQuotes={data.quotes} books={data.books} />
}
