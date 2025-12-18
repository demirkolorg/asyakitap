import { getDashboardData } from "@/actions/dashboard"
import { getActiveChallenge } from "@/actions/challenge"
import { getReadingListsSummary } from "@/actions/reading-lists"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, BookCheck, BookMarked, Quote, FileText, Plus, Users, Pen, Map } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ChallengeWidget } from "@/components/challenge/challenge-widget"

export default async function DashboardPage() {
    const [data, challenge, readingLists] = await Promise.all([
        getDashboardData(),
        getActiveChallenge(),
        getReadingListsSummary()
    ])

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

            {/* Stats Grid - Compact Design */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {/* Toplam Kitap */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-blue-500/20">
                            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.totalBooks}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">kitap</p>
                        </div>
                    </div>
                </div>

                {/* Bitti */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-green-500/20">
                            <BookCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.completed}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">bitti</p>
                        </div>
                    </div>
                </div>

                {/* Yazar */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-violet-500/20">
                            <Users className="h-4 w-4 md:h-5 md:w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.uniqueAuthors}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">yazar</p>
                        </div>
                    </div>
                </div>

                {/* Alıntı */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-amber-500/20">
                            <Quote className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.totalQuotes}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">alıntı</p>
                        </div>
                    </div>
                </div>

                {/* Tortu */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-rose-500/20">
                            <FileText className="h-4 w-4 md:h-5 md:w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.totalTortu}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">tortu</p>
                        </div>
                    </div>
                </div>

                {/* İmza */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                            <Pen className="h-4 w-4 md:h-5 md:w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-lg md:text-2xl font-bold">{stats.totalImza}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">imza</p>
                        </div>
                    </div>
                </div>
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

            {/* Challenge Widget */}
            {challenge && <ChallengeWidget challenge={challenge} />}

            {/* Reading Lists */}
            {readingLists.length > 0 && (
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <Map className="h-4 w-4 md:h-5 md:w-5" />
                                    Okuma Listeleri
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">Tematik okuma yolculukları</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 md:h-8">
                                <Link href="/reading-lists">Tümünü Gör</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {readingLists.slice(0, 6).map((list) => (
                                <Link
                                    key={list.id}
                                    href={`/reading-lists/${list.slug}`}
                                    className="flex gap-3 p-3 rounded-xl border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                                >
                                    {/* Cover */}
                                    <div className="relative h-16 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                                        {list.coverUrl ? (
                                            <Image
                                                src={list.coverUrl}
                                                alt={list.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <Map className="h-5 w-5 text-primary/50" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                            {list.name}
                                        </h3>
                                        {list.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {list.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                                {list.levelCount} seviye
                                            </span>
                                            <span>{list.totalBooks} kitap</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
