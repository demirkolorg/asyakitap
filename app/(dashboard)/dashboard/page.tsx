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
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Genel Bakış</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Okuma istatistiklerin ve son aktiviteler</p>
                </div>
                <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link href="/library/add">
                        <Plus className="mr-2 h-4 w-4" />
                        Kitap Ekle
                    </Link>
                </Button>
            </div>

            {/* Stats Grid - Mobile: 3x2 Grid, Desktop: 6 columns */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{stats.totalBooks}</span>
                    <span className="text-[10px] text-muted-foreground">kitap</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <BookCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold">{stats.completed}</span>
                    <span className="text-[10px] text-muted-foreground">bitti</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold">{stats.uniqueAuthors}</span>
                    <span className="text-[10px] text-muted-foreground">yazar</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <Quote className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-bold">{stats.totalQuotes}</span>
                    <span className="text-[10px] text-muted-foreground">alıntı</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold">{stats.totalTortu}</span>
                    <span className="text-[10px] text-muted-foreground">tortu</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg">
                    <Pen className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-bold">{stats.totalImza}</span>
                    <span className="text-[10px] text-muted-foreground">imza</span>
                </div>
            </div>

            {/* Desktop Stats Grid */}
            <div className="hidden md:grid gap-3 grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.totalBooks}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.toRead} bekliyor
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Bitti</CardTitle>
                        <BookCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.pagesRead.toLocaleString()} sayfa
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Yazar</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.uniqueAuthors}</div>
                        <p className="text-xs text-muted-foreground">
                            Farklı yazar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Alıntı</CardTitle>
                        <Quote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.totalQuotes}</div>
                        <p className="text-xs text-muted-foreground">
                            Kaydedildi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">Tortu</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.totalTortu}</div>
                        <p className="text-xs text-muted-foreground">
                            Kitap tortusu
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">İmza</CardTitle>
                        <Pen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.totalImza}</div>
                        <p className="text-xs text-muted-foreground">
                            Yazar imzası
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Currently Reading */}
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <BookMarked className="h-4 w-4 md:h-5 md:w-5" />
                        Şu An Okunan
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">Okumaya devam ettiğin kitaplar</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                    {currentlyReading.length === 0 ? (
                        <div className="text-center py-6 md:py-8 text-muted-foreground">
                            <p className="text-sm">Şu an okunan kitap yok</p>
                            <Button variant="outline" className="mt-4" size="sm" asChild>
                                <Link href="/library">Kitap Seç</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {currentlyReading.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex gap-3 p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="relative h-16 w-11 md:h-20 md:w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{book.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{book.author?.name || "Bilinmiyor"}</p>
                                        {book.pageCount && (
                                            <div className="mt-1.5 md:mt-2">
                                                <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mb-1">
                                                    <span>{book.currentPage} / {book.pageCount}</span>
                                                    <span>{Math.round((book.currentPage / book.pageCount) * 100)}%</span>
                                                </div>
                                                <div className="h-1 md:h-1.5 w-full bg-muted rounded-full overflow-hidden">
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
            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Recent Quotes */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <Quote className="h-4 w-4 md:h-5 md:w-5" />
                                Son Alıntılar
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 md:h-8">
                                <Link href="/quotes">Tümü</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        {recentQuotes.length === 0 ? (
                            <p className="text-center py-4 text-sm text-muted-foreground">Henüz alıntı yok</p>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {recentQuotes.map((quote) => (
                                    <div key={quote.id} className="border-l-2 border-primary/50 pl-3">
                                        <p className="text-xs md:text-sm italic line-clamp-2">"{quote.content}"</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                            {quote.bookTitle}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Summaries (Tortu) */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                Son Tortular
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 md:h-8">
                                <Link href="/summaries">Tümü</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        {booksWithTortu.length === 0 ? (
                            <p className="text-center py-4 text-sm text-muted-foreground">Henüz tortu yok</p>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {booksWithTortu.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <p className="font-medium text-xs md:text-sm truncate">{book.title}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground">{book.author?.name || "Bilinmiyor"}</p>
                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                            {book.tortu?.slice(0, 100)}...
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Imzalar */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <Pen className="h-4 w-4 md:h-5 md:w-5" />
                                Son İmzalar
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 md:h-8">
                                <Link href="/imzalar">Tümü</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        {booksWithImza.length === 0 ? (
                            <p className="text-center py-4 text-sm text-muted-foreground">Henüz imza yok</p>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {booksWithImza.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <p className="font-medium text-xs md:text-sm truncate">{book.title}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground">{book.author?.name || "Bilinmiyor"}</p>
                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                            {book.imza?.slice(0, 100)}...
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
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <BookCheck className="h-4 w-4 md:h-5 md:w-5" />
                            Son Tamamlananlar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                            {recentlyCompleted.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex-shrink-0 w-20 md:w-24 group"
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
                                    <p className="mt-1.5 text-[10px] md:text-xs font-medium truncate">{book.title}</p>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
