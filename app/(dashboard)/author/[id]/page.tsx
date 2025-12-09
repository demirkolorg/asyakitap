import { notFound } from "next/navigation"
import { getAuthorById } from "@/actions/authors"
import { AuthorDetailClient } from "./client"

interface AuthorPageProps {
    params: Promise<{ id: string }>
}

export default async function AuthorPage({ params }: AuthorPageProps) {
    const { id } = await params
    const author = await getAuthorById(id)

    if (!author) {
        notFound()
    }

    return <AuthorDetailClient author={author} />
}
