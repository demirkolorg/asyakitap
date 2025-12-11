import { getDashboardData } from "@/actions/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, BookCheck, BookMarked, Quote, FileText, TrendingUp, Plus, Users, Pen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function DashboardPage() {
    const data = await getDashboardData()

    if (!data) {
        return <div>Yükleniyor...</div>
    }

    const { currentlyReading, recentlyCompleted, recentQuotes, booksWithTortu, booksWithImza, stats } = data

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Genel Bakış</h1>
                    <p className="text-sm lg:text-base text-muted-foreground">Okuma istatistiklerin</p>
                </div>
                <Button asChild size="sm" className="lg:size-default">
                    <Link href="/library/add">
                        <Plus className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">Kitap Ekle</span>
                    </Link>
                </Button>
            </div>

            {/* Stats Grid - Horizontal scroll on mobile */}
            <div className="grid gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">Toplam Kitap</CardTitle>
                        <BookOpen className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.totalBooks}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            {stats.toRead} okunacak
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">Tamamlanan</CardTitle>
                        <BookCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.completed}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            {stats.pagesRead.toLocaleString()} sayfa
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">Yazarlar</CardTitle>
                        <Users className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.uniqueAuthors}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            Farklı yazar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">Alıntılar</CardTitle>
                        <Quote className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.totalQuotes}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            Kaydedilen
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">Tortular</CardTitle>
                        <FileText className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.totalTortu}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            Kitap tortusu
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-1 lg:pb-2 space-y-0 p-3 lg:p-6">
                        <CardTitle className="text-xs lg:text-sm font-medium">İmzalar</CardTitle>
                        <Pen className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                        <div className="text-xl lg:text-2xl font-bold">{stats.totalImza}</div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">
                            Yazar imzası
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Currently Reading */}
            <Card>
                <CardHeader className="p-4 lg:p-6">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                        <BookMarked className="h-4 w-4 lg:h-5 lg:w-5" />
                        Şu An Okunan
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">Okumaya devam ettiğin kitaplar</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 lg:p-6 lg:pt-0">
                    {currentlyReading.length === 0 ? (
                        <div className="text-center py-6 lg:py-8 text-muted-foreground">
                            <p className="text-sm">Şu an okunan kitap yok</p>
                            <Button variant="outline" className="mt-3" size="sm" asChild>
                                <Link href="/library">Kitap Seç</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {currentlyReading.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex gap-3 p-2 lg:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="relative h-16 w-11 lg:h-20 lg:w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                                                Kapak
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{book.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{book.author?.name || "Bilinmiyor"}</p>
                                        {book.pageCount && (
                                            <div className="mt-1.5 lg:mt-2">
                                                <div className="flex justify-between text-[10px] lg:text-xs text-muted-foreground mb-1">
                                                    <span>{book.currentPage} / {book.pageCount}</span>
                                                    <span>{Math.round((book.currentPage / book.pageCount) * 100)}%</span>
                                                </div>
                                                <div className="h-1 lg:h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${Math.min(100, (book.currentPage / book.pageCount) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Three Column Layout - Stack on mobile */}
            <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent Quotes */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Quote className="h-5 w-5" />
                                Son Alıntılar
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/quotes">Tümünü Gör</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentQuotes.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">Henüz alıntı yok</p>
                        ) : (
                            <div className="space-y-4">
                                {recentQuotes.map((quote) => (
                                    <div key={quote.id} className="border-l-2 border-primary/50 pl-4">
                                        <p className="text-sm italic line-clamp-2">"{quote.content}"</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {quote.bookTitle} - {quote.bookAuthor}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Summaries (Tortu) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Son Tortular
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/summaries">Tümünü Gör</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {booksWithTortu.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">Henüz tortu yazılmamış</p>
                        ) : (
                            <div className="space-y-4">
                                {booksWithTortu.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <p className="font-medium text-sm">{book.title}</p>
                                        <p className="text-xs text-muted-foreground">{book.author?.name || "Bilinmiyor"}</p>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {book.tortu?.slice(0, 150)}...
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Imzalar */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Pen className="h-5 w-5" />
                                Son İmzalar
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/imzalar">Tümünü Gör</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {booksWithImza.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">Henüz imza yazılmamış</p>
                        ) : (
                            <div className="space-y-4">
                                {booksWithImza.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <p className="font-medium text-sm">{book.title}</p>
                                        <p className="text-xs text-muted-foreground">{book.author?.name || "Bilinmiyor"}</p>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {book.imza?.slice(0, 150)}...
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recently Completed */}
            {recentlyCompleted.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookCheck className="h-5 w-5" />
                            Son Tamamlananlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {recentlyCompleted.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex-shrink-0 w-24 group"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted group-hover:ring-2 ring-primary transition-all">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                                {book.title}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs font-medium truncate">{book.title}</p>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
