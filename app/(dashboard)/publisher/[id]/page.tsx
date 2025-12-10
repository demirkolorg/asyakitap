import { notFound } from "next/navigation"
import { getPublisherById } from "@/actions/publisher"
import { PublisherDetailClient } from "./client"

interface PublisherPageProps {
    params: Promise<{ id: string }>
}

export default async function PublisherPage({ params }: PublisherPageProps) {
    const { id } = await params
    const publisher = await getPublisherById(id)

    if (!publisher) {
        notFound()
    }

    return <PublisherDetailClient publisher={publisher} />
}
