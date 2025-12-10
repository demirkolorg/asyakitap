import { getBooks } from "@/actions/library"
import { getShelves } from "@/actions/shelf"
import LibraryClient from "./client"

export default async function LibraryPage() {
    const [books, shelves] = await Promise.all([
        getBooks(),
        getShelves()
    ])

    return <LibraryClient books={books} shelves={shelves} />
}
