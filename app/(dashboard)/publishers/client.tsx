"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Building2,
    Search,
    BookOpen,
    Plus,
    ChevronRight,
    ExternalLink,
} from "lucide-react"

interface PublisherWithStats {
    id: string
    name: string
    imageUrl: string | null
    website: string | null
    _count: {
        books: number
    }
}

interface PublishersClientProps {
    publishers: PublisherWithStats[]
}

export function PublishersClient({ publishers }: PublishersClientProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredPublishers = useMemo(() => {
        if (!searchQuery) return publishers
        const query = searchQuery.toLowerCase()
        return publishers.filter(p => p.name.toLowerCase().includes(query))
    }, [publishers, searchQuery])

    const stats = useMemo(() => ({
        totalPublishers: publishers.length,
        totalBooks: publishers.reduce((sum, p) => sum + p._count.books, 0),
    }), [publishers])

    // Sort publishers alphabetically
    const sortedPublishers = useMemo(() => {
        return [...filteredPublishers].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }, [filteredPublishers])

    // Group publishers by first letter
    const groupedPublishers = useMemo(() => {
        const groups: Record<string, PublisherWithStats[]> = {}
        sortedPublishers.forEach(publisher => {
            const firstLetter = publisher.name.charAt(0).toUpperCase()
            if (!groups[firstLetter]) {
                groups[firstLetter] = []
            }
            groups[firstLetter].push(publisher)
        })
        return groups
    }, [sortedPublishers])

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="border-b pb-6 mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Yayınevlerim
                </h1>
                <p className="text-muted-foreground text-sm">
                    {stats.totalPublishers} yayınevi · {stats.totalBooks} kitap
                </p>
            </div>

            {/* Search */}
            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Yayınevi ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-sm bg-muted/30 border-muted"
                />
            </div>

            {/* Publishers List */}
            {filteredPublishers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-muted-foreground mb-4">&quot;{searchQuery}&quot; için sonuç bulunamadı</p>
                            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                                Aramayı Temizle
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-medium mb-2">Henüz yayınevi yok</p>
                            <p className="text-muted-foreground mb-4 text-sm">
                                Kitap eklerken yayınevi bilgisi girerek oluşturabilirsiniz
                            </p>
                            <Button asChild size="sm">
                                <Link href="/library/add">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Kitap Ekle
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedPublishers).map(([letter, letterPublishers]) => (
                        <div key={letter}>
                            {/* Letter Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl font-bold text-primary">{letter}</span>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">{letterPublishers.length} yayınevi</span>
                            </div>

                            {/* Publishers in this letter group */}
                            <div className="space-y-1">
                                {letterPublishers.map((publisher) => (
                                    <Link
                                        key={publisher.id}
                                        href={`/publisher/${publisher.id}`}
                                        className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Publisher Logo */}
                                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-background">
                                            {publisher.imageUrl ? (
                                                <Image
                                                    src={publisher.imageUrl}
                                                    alt={publisher.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                                    <Building2 className="h-7 w-7 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Publisher Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {publisher.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {publisher._count.books} kitap
                                                </span>
                                                {publisher.website && (
                                                    <span className="flex items-center gap-1.5">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Web sitesi
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
