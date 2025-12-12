import { getBooks, getBooksGroupedByReadingList } from "@/actions/library"
import LibraryClient from "./client"

export default async function LibraryPage() {
    const [books, groupedBooks] = await Promise.all([
        getBooks(),
        getBooksGroupedByReadingList()
    ])

    return <LibraryClient books={books} groupedBooks={groupedBooks} />
}
