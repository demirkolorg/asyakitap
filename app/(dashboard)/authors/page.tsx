import { getAuthorsWithBooks } from "@/actions/authors"
import { AuthorsClient } from "./client"

export default async function AuthorsPage() {
    const authors = await getAuthorsWithBooks()

    return <AuthorsClient authors={authors} />
}
