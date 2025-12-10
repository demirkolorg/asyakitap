import { getImzalarPageData } from "@/actions/library"
import ImzalarClient from "./client"

export default async function ImzalarPage() {
    const data = await getImzalarPageData()

    return <ImzalarClient
        booksWithImza={data.booksWithImza}
        totalBookCount={data.totalBookCount}
        booksWithoutImza={data.booksWithoutImza}
    />
}
