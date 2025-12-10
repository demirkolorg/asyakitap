import { getPublishersWithBooks } from "@/actions/publisher"
import { PublishersClient } from "./client"

export default async function PublishersPage() {
    const publishers = await getPublishersWithBooks()

    return <PublishersClient publishers={publishers} />
}
