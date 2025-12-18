import { getReadingListsSummary, getAllReadingLists } from "@/actions/reading-lists"
import { ReadingListsPageClient } from "./client"

export default async function ReadingListsPage() {
    const [lists, allLists] = await Promise.all([
        getReadingListsSummary(),
        getAllReadingLists()
    ])

    return <ReadingListsPageClient lists={lists} allLists={allLists} />
}
