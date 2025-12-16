import { getBooks } from "@/actions/library"
import { getAllReadingLists } from "@/actions/reading-lists"
import { getChallengeTimeline } from "@/actions/challenge"
import LibraryClient from "./client"

export default async function LibraryPage() {
    const [books, readingLists, challengeTimeline] = await Promise.all([
        getBooks(),
        getAllReadingLists(),
        getChallengeTimeline()
    ])

    return (
        <LibraryClient
            books={books}
            readingLists={readingLists}
            challengeTimeline={challengeTimeline}
        />
    )
}
