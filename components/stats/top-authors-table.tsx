import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Author {
    id: string
    name: string
    imageUrl: string | null
    bookCount: number
    completedCount: number
    totalPages: number
}

interface TopAuthorsTableProps {
    authors: Author[]
}

export function TopAuthorsTable({ authors }: TopAuthorsTableProps) {
    if (authors.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5" />
                        En Çok Okunan Yazarlar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz yazar verisi yok
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" />
                    En Çok Okunan Yazarlar
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {authors.slice(0, 5).map((author, index) => (
                        <Link
                            key={author.id}
                            href={`/author/${author.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <span className="text-sm font-medium text-muted-foreground w-5 flex-shrink-0">
                                {index === 0 ? (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    `${index + 1}.`
                                )}
                            </span>
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={author.imageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                    {author.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{author.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {author.completedCount} kitap okudum
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                {author.totalPages.toLocaleString()} sayfa
                            </span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
