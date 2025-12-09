import { getBooksWithImza } from "@/actions/library"
import ImzalarClient from "./client"

export default async function ImzalarPage() {
    const { booksWithImza, allBooks } = await getBooksWithImza()

    return <ImzalarClient booksWithImza={booksWithImza} allBooks={allBooks} />
}
