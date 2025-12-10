import { getSummariesPageData } from "@/actions/summaries"
import SummariesClient from "./client"

export default async function SummariesPage() {
    const data = await getSummariesPageData()

    return <SummariesClient
        booksWithTortu={data.booksWithTortu}
        totalBookCount={data.totalBookCount}
        booksWithoutTortu={data.booksWithoutTortu}
    />
}
