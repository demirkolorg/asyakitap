import { getBooksWithInfographics } from "@/actions/library"
import { InfographicsClient } from "./client"

export default async function InfographicsPage() {
    const books = await getBooksWithInfographics()

    return <InfographicsClient books={books} />
}
