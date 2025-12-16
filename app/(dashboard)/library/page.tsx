import { getBooks } from "@/actions/library"
import LibraryClient from "./client"

export default async function LibraryPage() {
    const books = await getBooks()

    return <LibraryClient books={books} />
}
