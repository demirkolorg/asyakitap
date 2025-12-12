"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface ReadingListBook {
    id: string
    title: string
    author: string
    neden: string | null
    pageCount: number | null
}

interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
}

interface ReadingList {
    id: string
    slug: string
    name: string
    description: string | null
    levels: ReadingListLevel[]
}

interface CopyAllListsButtonProps {
    lists: ReadingList[]
}

export function CopyAllListsButton({ lists }: CopyAllListsButtonProps) {
    const handleCopyAllAsJson = () => {
        const jsonData = lists.map(list => ({
            list: {
                name: list.name,
                slug: list.slug,
                description: list.description
            },
            levels: list.levels.map(level => ({
                levelNumber: level.levelNumber,
                name: level.name,
                description: level.description,
                books: level.books.map(book => ({
                    title: book.title,
                    author: book.author,
                    neden: book.neden,
                    pageCount: book.pageCount
                }))
            }))
        }))

        navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
            .then(() => toast.success("Tüm listeler JSON olarak kopyalandı"))
            .catch(() => toast.error("Kopyalama başarısız"))
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllAsJson}
            className="gap-2"
        >
            <Copy className="h-4 w-4" />
            Tümünü Kopyala
        </Button>
    )
}
