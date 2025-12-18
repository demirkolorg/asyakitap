import { getDashboardData } from "@/actions/dashboard"
import { getActiveChallenge } from "@/actions/challenge"
import { getReadingListsSummary } from "@/actions/reading-lists"
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
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between p-3 md:p-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-yellow-500/20">
                            <BookMarked className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h2 className="font-semibold text-sm md:text-base">Şu An Okunan</h2>
                    </div>
                </div>
                <div className="p-3 md:p-4">
                    {currentlyReading.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            <p className="text-xs md:text-sm">Şu an okunan kitap yok</p>
                            <Button variant="outline" className="mt-3" size="sm" asChild>
                                <Link href="/library">Kitap Seç</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {currentlyReading.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="relative h-14 w-10 md:h-16 md:w-11 flex-shrink-0 overflow-hidden rounded bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs md:text-sm truncate group-hover:text-primary transition-colors">{book.title}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{book.author?.name || "Bilinmiyor"}</p>
                                        {book.pageCount && (
                                            <div className="mt-1.5">
                                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-500"
                                                        style={{ width: `${Math.min(100, (book.currentPage / book.pageCount) * 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                                                    {Math.round((book.currentPage / book.pageCount) * 100)}%
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Challenge Widget */}
            {challenge && <ChallengeWidget challenge={challenge} />}

            {/* Reading Lists */}
            {readingLists.length > 0 && (
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                                <Map className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="font-semibold text-sm md:text-base">Okuma Listeleri</h2>
                        </div>
                        <Link href="/reading-lists" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Tümü →
                        </Link>
                    </div>
                    <div className="p-3 md:p-4">
                        <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {readingLists.slice(0, 6).map((list) => (
                                <Link
                                    key={list.id}
                                    href={`/reading-lists/${list.slug}`}
                                    className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="relative h-12 w-9 md:h-14 md:w-10 flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-indigo-500/20 to-indigo-600/5">
                                        {list.coverUrl ? (
                                            <Image
                                                src={list.coverUrl}
                                                alt={list.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <Map className="h-4 w-4 text-indigo-500/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-xs md:text-sm truncate group-hover:text-primary transition-colors">
                                            {list.name}
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                                            {list.levelCount} seviye · {list.totalBooks} kitap
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Three Column Layout - Stack on mobile */}
            <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Recent Quotes */}
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-amber-500/20">
                                <Quote className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="font-semibold text-sm md:text-base">Alıntılar</h2>
                        </div>
                        <Link href="/quotes" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Tümü →
                        </Link>
                    </div>
                    <div className="p-3 md:p-4">
                        {recentQuotes.length === 0 ? (
                            <p className="text-center py-3 text-xs text-muted-foreground">Henüz alıntı yok</p>
                        ) : (
                            <div className="space-y-2.5">
                                {recentQuotes.map((quote) => (
                                    <div key={quote.id} className="border-l-2 border-amber-500/50 pl-2.5">
                                        <p className="text-[11px] md:text-xs italic line-clamp-2">"{quote.content}"</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{quote.bookTitle}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Summaries (Tortu) */}
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-rose-500/20">
                                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h2 className="font-semibold text-sm md:text-base">Tortular</h2>
                        </div>
                        <Link href="/summaries" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Tümü →
                        </Link>
                    </div>
                    <div className="p-3 md:p-4">
                        {booksWithTortu.length === 0 ? (
                            <p className="text-center py-3 text-xs text-muted-foreground">Henüz tortu yok</p>
                        ) : (
                            <div className="space-y-2">
                                {booksWithTortu.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                    >
                                        <p className="font-medium text-xs truncate group-hover:text-primary transition-colors">{book.title}</p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                                            {book.tortu?.slice(0, 80)}...
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Imzalar */}
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                                <Pen className="h-3.5 w-3.5 md:h-4 md:w-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="font-semibold text-sm md:text-base">İmzalar</h2>
                        </div>
                        <Link href="/imzalar" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Tümü →
                        </Link>
                    </div>
                    <div className="p-3 md:p-4">
                        {booksWithImza.length === 0 ? (
                            <p className="text-center py-3 text-xs text-muted-foreground">Henüz imza yok</p>
                        ) : (
                            <div className="space-y-2">
                                {booksWithImza.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/book/${book.id}`}
                                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                    >
                                        <p className="font-medium text-xs truncate group-hover:text-primary transition-colors">{book.title}</p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                                            {book.imza?.slice(0, 80)}...
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recently Completed */}
            {recentlyCompleted.length > 0 && (
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-green-500/20">
                                <BookCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="font-semibold text-sm md:text-base">Son Tamamlananlar</h2>
                        </div>
                    </div>
                    <div className="p-3 md:p-4">
                        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-1 -mx-3 px-3 md:mx-0 md:px-0">
                            {recentlyCompleted.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="flex-shrink-0 w-16 md:w-20 group"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-muted group-hover:ring-2 ring-green-500 transition-all">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground p-1 text-center">
                                                {book.title}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[9px] md:text-[10px] font-medium truncate group-hover:text-primary transition-colors">{book.title}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
