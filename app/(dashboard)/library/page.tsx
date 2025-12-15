import { getBooks, getBooksGroupedByReadingList, getBooksGroupedByChallenge } from "@/actions/library"
import LibraryClient from "./client"

export default async function LibraryPage() {
    const [books, groupedBooks, challengeData] = await Promise.all([
        getBooks(),
        getBooksGroupedByReadingList(),
        getBooksGroupedByChallenge()
    ])

    return <LibraryClient books={books} groupedBooks={groupedBooks} challengeData={challengeData} />
}
