import { getReadingListWithProgress } from "@/actions/reading-lists"
import { notFound } from "next/navigation"
import ReadingListClient from "./client"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ReadingListPage({ params }: PageProps) {
    const { slug } = await params
    const list = await getReadingListWithProgress(slug)

    if (!list) {
        notFound()
    }

    return <ReadingListClient list={list} />
}
