import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Trophy } from "lucide-react"
import Link from "next/link"

interface Publisher {
    id: string
    name: string
    bookCount: number
    completedCount: number
}

interface TopPublishersTableProps {
    publishers: Publisher[]
}

export function TopPublishersTable({ publishers }: TopPublishersTableProps) {
    if (publishers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-5 w-5" />
                        En Çok Okunan Yayınevleri
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz yayınevi verisi yok
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5" />
                    En Çok Okunan Yayınevleri
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {publishers.slice(0, 5).map((publisher, index) => (
                        <Link
                            key={publisher.id}
                            href={`/publisher/${publisher.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <span className="text-sm font-medium text-muted-foreground w-5 flex-shrink-0">
                                {index === 0 ? (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    `${index + 1}.`
                                )}
                            </span>
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{publisher.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {publisher.completedCount} kitap okudum
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                {publisher.bookCount} kitap
                            </span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
