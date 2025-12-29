import { getAllReadingLists } from "@/actions/reading-lists"
import { ByLevelClient } from "./client"

export default async function ByLevelPage() {
    const allLists = await getAllReadingLists()

    return <ByLevelClient lists={allLists} />
}
