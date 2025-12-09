"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    User,
    Search,
    BookOpen,
    PenLine,
    Plus,
    ChevronRight,
} from "lucide-react"

interface AuthorWithStats {
    id: string
    name: string
    imageUrl: string | null
    bio: string | null
    _count: {
        books: number
    }
    booksWithImza: number
}

interface AuthorsClientProps {
    authors: AuthorWithStats[]
}

export function AuthorsClient({ authors }: AuthorsClientProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredAuthors = useMemo(() => {
        if (!searchQuery) return authors
        const query = searchQuery.toLowerCase()
        return authors.filter(a => a.name.toLowerCase().includes(query))
    }, [authors, searchQuery])

    const stats = useMemo(() => ({
        totalAuthors: authors.length,
        totalBooks: authors.reduce((sum, a) => sum + a._count.books, 0),
        totalImza: authors.reduce((sum, a) => sum + a.booksWithImza, 0),
    }), [authors])

    // Sort authors alphabetically
    const sortedAuthors = useMemo(() => {
        return [...filteredAuthors].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }, [filteredAuthors])

    // Group authors by first letter
    const groupedAuthors = useMemo(() => {
        const groups: Record<string, AuthorWithStats[]> = {}
        sortedAuthors.forEach(author => {
            const firstLetter = author.name.charAt(0).toUpperCase()
            if (!groups[firstLetter]) {
                groups[firstLetter] = []
            }
            groups[firstLetter].push(author)
        })
        return groups
    }, [sortedAuthors])

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="border-b pb-6 mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Yazarlarım
                </h1>
                <p className="text-muted-foreground text-sm">
                    {stats.totalAuthors} yazar · {stats.totalBooks} kitap · {stats.totalImza} imza
                </p>
            </div>

            {/* Search */}
            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Yazar ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-sm bg-muted/30 border-muted"
                />
            </div>

            {/* Authors List */}
            {filteredAuthors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-muted-foreground mb-4">"{searchQuery}" için sonuç bulunamadı</p>
                            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                                Aramayı Temizle
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-medium mb-2">Henüz yazar yok</p>
                            <p className="text-muted-foreground mb-4 text-sm">
                                Kitap ekleyerek yazarları otomatik oluşturabilirsiniz
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
                    {Object.entries(groupedAuthors).map(([letter, letterAuthors]) => (
                        <div key={letter}>
                            {/* Letter Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl font-bold text-primary">{letter}</span>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">{letterAuthors.length} yazar</span>
                            </div>

                            {/* Authors in this letter group */}
                            <div className="space-y-1">
                                {letterAuthors.map((author) => (
                                    <Link
                                        key={author.id}
                                        href={`/author/${author.id}`}
                                        className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Author Photo */}
                                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background">
                                            {author.imageUrl ? (
                                                <Image
                                                    src={author.imageUrl}
                                                    alt={author.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                                    <User className="h-7 w-7 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Author Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {author.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {author._count.books} kitap
                                                </span>
                                                {author.booksWithImza > 0 && (
                                                    <span className="flex items-center gap-1.5">
                                                        <PenLine className="h-3.5 w-3.5" />
                                                        {author.booksWithImza} imza
                                                    </span>
                                                )}
                                            </div>
                                            {author.bio && (
                                                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                                                    {author.bio}
                                                </p>
                                            )}
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
