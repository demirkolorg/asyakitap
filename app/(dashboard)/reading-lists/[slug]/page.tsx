import { getReadingListWithProgress } from "@/actions/reading-lists"
import { getBooks } from "@/actions/library"
import { notFound } from "next/navigation"
import ReadingListClient from "./client"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ReadingListPage({ params }: PageProps) {
    const { slug } = await params

    // Paralel olarak hem okuma listesini hem kullanıcı kitaplarını çek
    const [list, userBooks] = await Promise.all([
        getReadingListWithProgress(slug),
        getBooks()
    ])

    if (!list) {
        notFound()
    }

    return <ReadingListClient list={list} userBooks={userBooks} />
}
