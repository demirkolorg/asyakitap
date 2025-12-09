import { getBook } from "@/actions/library"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" // Need to install badge
import { Separator } from "@/components/ui/separator" // Need to install separator
// Assuming we might need client components for interactions, 
// I'll create a separate client component for the logic if needed, 
// or simpler, make this page async and use client components for the tab contents.

// Ideally: 
// - page.tsx (Server) -> fetches data
// - BookClient.tsx (Client) -> handles Tabs and interactions (Update status, Edit Tortu)
// Let's create BookDetailClient.tsx

import BookDetailClient from "./client"

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const book = await getBook(id)

    if (!book) {
        notFound()
    }

    return <BookDetailClient book={book} />
}
