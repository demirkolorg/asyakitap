import { getReadingLists } from "@/actions/reading-lists"
import { ManageClient } from "./client"

export default async function ManageReadingListsPage() {
    const lists = await getReadingLists()
    return <ManageClient initialLists={lists} />
}
