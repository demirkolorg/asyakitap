import { getDashboardData } from "@/actions/dashboard"
import { getActiveChallenge } from "@/actions/challenge"
import { getReadingListsSummary } from "@/actions/reading-lists"
import { Button } from "@/components/ui/button"
import {
    BookOpen,
    BookCheck,
    BookMarked,
    Quote,
    FileText,
    Plus,
    Users,
    Pen,
    Map,
    Target,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Star,
    Edit,
    CheckCircle2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

    // İlk okunan kitabı featured olarak göster
    const featuredBook = currentlyReading[0]
    const otherReadingBooks = currentlyReading.slice(1)

    // Challenge progress hesaplama
    const challengeProgress = challenge ? {
        percentage: challenge.currentMonth.mainTotalCount > 0
            ? Math.round((challenge.currentMonth.mainCompletedCount / challenge.currentMonth.mainTotalCount) * 100)
            : 0,
        mainCompleted: challenge.currentMonth.mainCompletedCount,
        mainTotal: challenge.currentMonth.mainTotalCount,
        bonusCompleted: challenge.currentMonth.bonusBooks.filter(b => b.bookStatus === "COMPLETED").length,
        bonusTotal: challenge.currentMonth.bonusBooks.length
    } : null

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Stats Ribbon */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {/* Toplam Kitap */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">Toplam Kitap</p>
                        <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.totalBooks}</p>
                </div>

                {/* Bitti */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">Bitti</p>
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.completed}</p>
                </div>

                {/* Yazar */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">Yazar</p>
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.uniqueAuthors}</p>
                </div>

                {/* Alıntı */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">Alıntı</p>
                        <Quote className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.totalQuotes}</p>
                </div>

                {/* Tortu */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">Tortu</p>
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.totalTortu}</p>
                </div>

                {/* İmza */}
                <div className="bg-card rounded-xl p-4 md:p-5 border border-border/50 flex flex-col justify-between h-28 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <p className="text-muted-foreground text-xs md:text-sm font-medium">İmza</p>
                        <Pen className="h-4 w-4 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight">{stats.totalImza}</p>
                </div>
            </section>

            {/* Main Split Section: Currently Reading + Reading Goals */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Currently Reading (2/3 width) */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                    <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-primary" />
                        Şu An Okunan
                    </h2>

                    {featuredBook ? (
                        <div className="bg-card rounded-2xl p-4 md:p-6 border border-border/50 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6">
                            {/* Book Cover */}
                            <Link href={`/book/${featuredBook.id}`} className="w-full md:w-44 shrink-0">
                                <div className="relative aspect-[2/3] md:aspect-auto md:h-full rounded-lg overflow-hidden bg-muted shadow-lg">
                                    {featuredBook.coverUrl ? (
                                        <Image
                                            src={featuredBook.coverUrl.replace("http:", "https:")}
                                            alt={featuredBook.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Details */}
                            <div className="flex flex-col justify-between flex-1 py-1">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-primary/20 text-primary text-[10px] md:text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            Okunuyor
                                        </span>
                                        <Link href={`/book/${featuredBook.id}`} className="text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Link>
                                    </div>
                                    <Link href={`/book/${featuredBook.id}`}>
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight mb-1 hover:text-primary transition-colors">
                                            {featuredBook.title}
                                        </h3>
                                    </Link>
                                    <p className="text-muted-foreground text-base md:text-lg mb-4 md:mb-6">
                                        {featuredBook.author?.name || "Bilinmiyor"}
                                    </p>

                                    {/* Last Quote from this book */}
                                    {recentQuotes.find(q => q.bookTitle === featuredBook.title) && (
                                        <div className="p-3 md:p-4 bg-muted/50 rounded-lg mb-4 md:mb-6 border border-border/50">
                                            <p className="text-muted-foreground italic text-xs md:text-sm leading-relaxed">
                                                "{recentQuotes.find(q => q.bookTitle === featuredBook.title)?.content.slice(0, 150)}..."
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress */}
                                {featuredBook.pageCount && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs md:text-sm text-muted-foreground">İlerleme</span>
                                            <span className="text-xl md:text-2xl font-bold text-primary">
                                                {Math.round((featuredBook.currentPage / featuredBook.pageCount) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 md:h-3 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (featuredBook.currentPage / featuredBook.pageCount) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mt-1">
                                            <span>Sayfa {featuredBook.currentPage}</span>
                                            <span>Sayfa {featuredBook.pageCount}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
                            <BookMarked className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">Şu an okunan kitap yok</p>
                            <Button asChild>
                                <Link href="/library">Kitap Seç</Link>
                            </Button>
                        </div>
                    )}

                    {/* Other reading books (if any) */}
                    {otherReadingBooks.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {otherReadingBooks.slice(0, 3).map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="bg-card rounded-xl p-3 border border-border/50 hover:border-primary/30 transition-all flex gap-3 group"
                                >
                                    <div className="relative h-16 w-11 flex-shrink-0 rounded overflow-hidden bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs truncate group-hover:text-primary transition-colors">
                                            {book.title}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            {book.author?.name}
                                        </p>
                                        {book.pageCount && (
                                            <div className="mt-2">
                                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${Math.min(100, (book.currentPage / book.pageCount) * 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-muted-foreground mt-0.5">
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

                {/* Reading Goals Widget (1/3 width) */}
                <div className="xl:col-span-1 flex flex-col gap-4">
                    <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Okuma Hedefi
                    </h2>

                    {challenge && challengeProgress ? (
                        <div className="bg-card rounded-2xl p-4 md:p-6 border border-border/50 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-semibold text-base md:text-lg">{challenge.year} Hedefi</span>
                                <span className="text-muted-foreground text-xs md:text-sm">
                                    {challenge.currentMonth.monthName}
                                </span>
                            </div>

                            {/* Circular Progress */}
                            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-muted"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * challengeProgress.percentage) / 100}
                                            strokeLinecap="round"
                                            className="text-primary transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg md:text-xl font-bold">{challengeProgress.percentage}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl md:text-3xl font-bold">
                                        {challengeProgress.mainCompleted}
                                        <span className="text-muted-foreground text-lg md:text-xl font-normal">
                                            /{challengeProgress.mainTotal}
                                        </span>
                                    </span>
                                    <span className="text-xs md:text-sm text-muted-foreground">Kitap Tamamlandı</span>
                                </div>
                            </div>

                            {/* Progress Bars */}
                            <div className="flex flex-col gap-4 flex-1">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-xs md:text-sm">
                                        <span className="font-medium">Ana Hedefler</span>
                                        <span className="text-primary font-bold">
                                            {challengeProgress.mainCompleted}/{challengeProgress.mainTotal}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${challengeProgress.mainTotal > 0 ? (challengeProgress.mainCompleted / challengeProgress.mainTotal) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {challengeProgress.bonusTotal > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-xs md:text-sm">
                                            <span className="font-medium">Bonus Kitaplar</span>
                                            <span className="text-yellow-500 font-bold">
                                                {challengeProgress.bonusCompleted}/{challengeProgress.bonusTotal}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-500 rounded-full transition-all"
                                                style={{ width: `${(challengeProgress.bonusCompleted / challengeProgress.bonusTotal) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link
                                href={`/challenges/${challenge.year}`}
                                className="mt-auto w-full py-2.5 md:py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors text-xs md:text-sm flex items-center justify-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Hedefi Düzenle
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl p-6 border border-border/50 h-full flex flex-col items-center justify-center text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">Henüz okuma hedefi yok</p>
                            <Button asChild variant="outline">
                                <Link href="/challenges">Hedef Oluştur</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Lower Grid Section: Reading Lists, Quotes, Activities */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Reading Lists */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg md:text-xl">Okuma Listeleri</h2>
                        <Link href="/reading-lists" className="text-primary text-xs md:text-sm font-medium hover:underline">
                            Tümü
                        </Link>
                    </div>
                    <div className="flex flex-col gap-3">
                        {readingLists.length === 0 ? (
                            <div className="bg-card p-6 rounded-xl border border-border/50 text-center">
                                <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Henüz okuma listesi yok</p>
                            </div>
                        ) : (
                            readingLists.slice(0, 3).map((list) => (
                                <Link
                                    key={list.id}
                                    href={`/reading-lists/${list.slug}`}
                                    className="bg-card p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all flex gap-4 group cursor-pointer"
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                        {list.coverUrl ? (
                                            <Image
                                                src={list.coverUrl}
                                                alt={list.name}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Map className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                                            {list.name}
                                        </h4>
                                        <div className="flex gap-2 text-[10px] md:text-xs text-muted-foreground mt-1">
                                            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                                {list.levelCount} seviye
                                            </span>
                                            <span>{list.totalBooks} Kitap</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Quotes */}
                <div className="flex flex-col gap-4">
                    <h2 className="font-bold text-lg md:text-xl">Son Alıntılar</h2>
                    <div className="flex flex-col gap-3">
                        {recentQuotes.length === 0 ? (
                            <div className="bg-card p-6 rounded-xl border border-border/50 text-center">
                                <Quote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Henüz alıntı yok</p>
                            </div>
                        ) : (
                            recentQuotes.slice(0, 2).map((quote) => (
                                <div
                                    key={quote.id}
                                    className="bg-card p-4 rounded-xl border border-border/50 relative"
                                >
                                    <Quote className="absolute top-4 right-4 h-6 w-6 md:h-8 md:w-8 text-primary/20" />
                                    <p className="text-muted-foreground text-xs md:text-sm italic mb-3 pr-6 line-clamp-3">
                                        "{quote.content}"
                                    </p>
                                    <p className="text-primary text-[10px] md:text-xs font-semibold text-right">
                                        - {quote.bookTitle}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activities (Tortu & Imza) */}
                <div className="flex flex-col gap-4">
                    <h2 className="font-bold text-lg md:text-xl">Son Aktiviteler</h2>
                    <div className="flex flex-col gap-3 h-full">
                        {/* Son Tortu */}
                        {booksWithTortu.length > 0 ? (
                            <Link
                                href={`/book/${booksWithTortu[0].id}`}
                                className="bg-card p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all flex flex-col gap-2 group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Son Tortu
                                    </span>
                                    <div className="flex text-yellow-500">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="h-3 w-3 fill-current" />
                                        ))}
                                    </div>
                                </div>
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                                    {booksWithTortu[0].title}
                                </h4>
                                <p className="text-muted-foreground text-[10px] md:text-xs line-clamp-2">
                                    {booksWithTortu[0].tortu?.slice(0, 100)}...
                                </p>
                            </Link>
                        ) : (
                            <div className="bg-card p-4 rounded-xl border border-border/50 text-center">
                                <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                <p className="text-[10px] md:text-xs text-muted-foreground">Henüz tortu yok</p>
                            </div>
                        )}

                        {/* Son İmza */}
                        {booksWithImza.length > 0 ? (
                            <Link
                                href={`/book/${booksWithImza[0].id}`}
                                className="bg-card p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all flex items-center gap-4 flex-1 group"
                            >
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                                    {booksWithImza[0].coverUrl ? (
                                        <Image
                                            src={booksWithImza[0].coverUrl.replace("http:", "https:")}
                                            alt={booksWithImza[0].title}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Pen className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                        Son İmza
                                    </span>
                                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                                        {booksWithImza[0].title}
                                    </h4>
                                    <p className="text-primary text-[10px] md:text-xs mt-1">
                                        {booksWithImza[0].author?.name}
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <div className="bg-card p-4 rounded-xl border border-border/50 text-center flex-1 flex flex-col items-center justify-center">
                                <Pen className="h-6 w-6 text-muted-foreground mb-2" />
                                <p className="text-[10px] md:text-xs text-muted-foreground">Henüz imza yok</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Recently Completed */}
            <section className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                        <BookCheck className="h-5 w-5 text-primary" />
                        Son Tamamlananlar
                    </h2>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {recentlyCompleted.length === 0 ? (
                        <div className="col-span-full bg-card p-8 rounded-xl border border-border/50 text-center">
                            <BookCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Henüz tamamlanan kitap yok</p>
                        </div>
                    ) : (
                        <>
                            {recentlyCompleted.slice(0, 5).map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/book/${book.id}`}
                                    className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-muted">
                                        {book.coverUrl ? (
                                            <Image
                                                src={book.coverUrl.replace("http:", "https:")}
                                                alt={book.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center p-2 text-center">
                                                <span className="text-xs text-muted-foreground">{book.title}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <p className="text-white font-bold text-xs md:text-sm truncate">{book.title}</p>
                                        <p className="text-white/70 text-[10px] md:text-xs truncate">{book.author?.name}</p>
                                    </div>
                                </Link>
                            ))}

                            {/* Add Book Card */}
                            <Link
                                href="/library/add"
                                className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer bg-card border border-border/50 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                            >
                                <Plus className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2" />
                                <p className="text-muted-foreground text-xs md:text-sm font-medium">Kitap Ekle</p>
                            </Link>
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}
