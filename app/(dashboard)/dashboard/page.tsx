import { getDashboardData } from "@/actions/dashboard"
import { getActiveChallenge } from "@/actions/challenge"
import { getReadingListsSummary } from "@/actions/reading-lists"
import { getDashboardTimerStats } from "@/actions/timer-stats"
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
    CheckCircle2,
    Clock,
    Edit,
    Timer,
    Flame,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { calculateReadingGoal, formatRemainingDays } from "@/lib/reading-goal"
import { QuickActions } from "./quick-actions"

export default async function DashboardPage() {
    const [data, challenge, readingLists, timerStats] = await Promise.all([
        getDashboardData(),
        getActiveChallenge(),
        getReadingListsSummary(),
        getDashboardTimerStats()
    ])

    if (!data) {
        return <div>Yükleniyor...</div>
    }

    const { currentlyReading, recentlyCompleted, recentQuotes, booksWithTortu, booksWithImza, stats } = data

    // İlk okunan kitabı featured olarak göster
    const featuredBook = currentlyReading[0]
    const otherReadingBooks = currentlyReading.slice(1)

    // Featured kitap için okuma hedefi hesapla
    const featuredGoalInfo = featuredBook ? calculateReadingGoal({
        pageCount: featuredBook.pageCount,
        currentPage: featuredBook.currentPage,
        startDate: featuredBook.startDate,
        readingGoalDays: featuredBook.readingGoalDays,
    }) : null

    // Challenge progress hesaplama - bu ay
    const currentMonthProgress = challenge?.currentMonth ? (() => {
        const allBooks = [...challenge.currentMonth.mainBooks, ...challenge.currentMonth.bonusBooks]
        const totalPages = allBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0)
        const completedBooks = allBooks.filter(b => b.bookStatus === "COMPLETED")
        const readPages = completedBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0)
        const remainingPages = totalPages - readPages

        // Ayın kalan günü hesapla
        const now = new Date()
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const remainingDays = Math.max(1, lastDay - now.getDate() + 1) // bugün dahil
        const dailyTarget = remainingPages > 0 ? Math.ceil(remainingPages / remainingDays) : 0

        return {
            percentage: challenge.currentMonth.mainTotalCount > 0
                ? Math.round((challenge.currentMonth.mainCompletedCount / challenge.currentMonth.mainTotalCount) * 100)
                : 0,
            mainCompleted: challenge.currentMonth.mainCompletedCount,
            mainTotal: challenge.currentMonth.mainTotalCount,
            bonusCompleted: challenge.currentMonth.bonusBooks.filter(b => b.bookStatus === "COMPLETED").length,
            bonusTotal: challenge.currentMonth.bonusBooks.length,
            // İstatistikler
            totalBooks: allBooks.length,
            totalPages,
            readPages,
            remainingPages,
            remainingDays,
            dailyTarget
        }
    })() : null

    // Challenge progress hesaplama - gelecek ay
    const nextMonthProgress = challenge?.nextMonth ? (() => {
        const allBooks = [...challenge.nextMonth.mainBooks, ...challenge.nextMonth.bonusBooks]
        const totalPages = allBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0)

        // Gelecek ayın gün sayısı
        const now = new Date()
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const daysInMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate()
        const dailyTarget = totalPages > 0 ? Math.ceil(totalPages / daysInMonth) : 0

        return {
            percentage: challenge.nextMonth.mainTotalCount > 0
                ? Math.round((challenge.nextMonth.mainCompletedCount / challenge.nextMonth.mainTotalCount) * 100)
                : 0,
            mainCompleted: challenge.nextMonth.mainCompletedCount,
            mainTotal: challenge.nextMonth.mainTotalCount,
            bonusCompleted: challenge.nextMonth.bonusBooks.filter(b => b.bookStatus === "COMPLETED").length,
            bonusTotal: challenge.nextMonth.bonusBooks.length,
            // İstatistikler
            totalBooks: allBooks.length,
            totalPages,
            daysInMonth,
            dailyTarget
        }
    })() : null

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Stats Ribbon - Compact on mobile */}
            <section className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
                {/* Toplam Kitap */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Kitap</p>
                        <BookOpen className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.totalBooks}</p>
                </div>

                {/* Bitti */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Bitti</p>
                        <CheckCircle2 className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.completed}</p>
                </div>

                {/* Yazar */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Yazar</p>
                        <Users className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.uniqueAuthors}</p>
                </div>

                {/* Alıntı */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Alıntı</p>
                        <Quote className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.totalQuotes}</p>
                </div>

                {/* Tortu */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Tortu</p>
                        <FileText className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.totalTortu}</p>
                </div>

                {/* İmza */}
                <div className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-32 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center md:items-start">
                        <p className="text-muted-foreground text-[10px] md:text-sm font-medium">İmza</p>
                        <Pen className="h-3 w-3 md:h-5 md:w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg md:text-3xl font-bold tracking-tight">{stats.totalImza}</p>
                </div>
            </section>

            {/* Timer Stats Mini Widget */}
            {timerStats && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <Link href="/timer" className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-24 hover:border-primary/30 transition-colors group">
                        <div className="flex justify-between items-center md:items-start">
                            <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Bugün</p>
                            <Timer className="h-3 w-3 md:h-4 md:w-4 text-primary/50 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-base md:text-2xl font-bold tracking-tight">
                            {timerStats.today.totalSeconds > 0
                                ? `${Math.floor(timerStats.today.totalSeconds / 60)}dk`
                                : "0dk"}
                        </p>
                    </Link>

                    <Link href="/timer" className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-24 hover:border-primary/30 transition-colors group">
                        <div className="flex justify-between items-center md:items-start">
                            <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Bu Hafta</p>
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary/50 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-base md:text-2xl font-bold tracking-tight">
                            {timerStats.week.totalSeconds >= 3600
                                ? `${Math.floor(timerStats.week.totalSeconds / 3600)}s ${Math.floor((timerStats.week.totalSeconds % 3600) / 60)}dk`
                                : `${Math.floor(timerStats.week.totalSeconds / 60)}dk`}
                        </p>
                    </Link>

                    <Link href="/timer" className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-24 hover:border-primary/30 transition-colors group">
                        <div className="flex justify-between items-center md:items-start">
                            <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Bu Ay</p>
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary/50 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-base md:text-2xl font-bold tracking-tight">
                            {timerStats.month.totalSeconds >= 3600
                                ? `${Math.floor(timerStats.month.totalSeconds / 3600)}s ${Math.floor((timerStats.month.totalSeconds % 3600) / 60)}dk`
                                : `${Math.floor(timerStats.month.totalSeconds / 60)}dk`}
                        </p>
                    </Link>

                    <Link href="/timer" className="bg-card rounded-lg md:rounded-xl p-2.5 md:p-5 border border-border/50 flex flex-col justify-between h-16 md:h-24 hover:border-primary/30 transition-colors group">
                        <div className="flex justify-between items-center md:items-start">
                            <p className="text-muted-foreground text-[10px] md:text-sm font-medium">Seri</p>
                            <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-500 group-hover:text-orange-400 transition-colors" />
                        </div>
                        <p className="text-base md:text-2xl font-bold tracking-tight">
                            {timerStats.streak?.current || 0} gün
                        </p>
                    </Link>
                </section>
            )}

            {/* Main Split Section: Currently Reading + Reading Goals */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Currently Reading (2/3 width) */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                    <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-primary" />
                        Şu An Okunan
                    </h2>

                    {featuredBook ? (
                        <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-6 border border-border/50 shadow-sm">
                            {/* Mobile: Horizontal layout / Desktop: Same */}
                            <div className="flex gap-3 md:gap-6">
                                {/* Book Cover */}
                                <Link href={`/book/${featuredBook.id}`} className="w-20 md:w-40 shrink-0">
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
                                        {featuredBook.coverUrl ? (
                                            <Image
                                                src={featuredBook.coverUrl.replace("http:", "https:")}
                                                alt={featuredBook.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <BookOpen className="h-8 md:h-12 w-8 md:w-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Right Side - Title, Author, Status */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    {/* Status Badge & Menu */}
                                    <div className="flex justify-between items-start mb-1 md:mb-2">
                                        <span className="bg-primary/20 text-primary text-[9px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded uppercase tracking-wider">
                                            Okunuyor
                                        </span>
                                        <Link href={`/book/${featuredBook.id}`} className="text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal className="h-4 md:h-5 w-4 md:w-5" />
                                        </Link>
                                    </div>

                                    {/* Title */}
                                    <Link href={`/book/${featuredBook.id}`}>
                                        <h3 className="text-sm md:text-2xl lg:text-3xl font-bold leading-tight mb-0.5 md:mb-1 hover:text-primary transition-colors line-clamp-2">
                                            {featuredBook.title}
                                        </h3>
                                    </Link>

                                    {/* Author */}
                                    <p className="text-muted-foreground text-xs md:text-lg mb-2 md:mb-4">
                                        {featuredBook.author?.name || "Bilinmiyor"}
                                    </p>

                                    {/* Mobile: Compact Progress */}
                                    {featuredBook.pageCount && (
                                        <div className="md:hidden mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            featuredGoalInfo?.statusColor === 'green' && "bg-green-500",
                                                            featuredGoalInfo?.statusColor === 'yellow' && "bg-yellow-500",
                                                            featuredGoalInfo?.statusColor === 'red' && "bg-red-500",
                                                            !featuredGoalInfo && "bg-primary"
                                                        )}
                                                        style={{ width: `${Math.min(100, (featuredBook.currentPage / featuredBook.pageCount) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    featuredGoalInfo?.statusColor === 'green' && "text-green-500",
                                                    featuredGoalInfo?.statusColor === 'yellow' && "text-yellow-500",
                                                    featuredGoalInfo?.statusColor === 'red' && "text-red-500",
                                                    !featuredGoalInfo && "text-primary"
                                                )}>
                                                    %{Math.round((featuredBook.currentPage / featuredBook.pageCount) * 100)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Desktop Only: Quote */}
                                    {recentQuotes.find(q => q.bookTitle === featuredBook.title) && (
                                        <div className="hidden md:block p-4 bg-muted/50 rounded-lg mb-4 border border-border/50">
                                            <p className="text-muted-foreground italic text-sm leading-relaxed">
                                                "{recentQuotes.find(q => q.bookTitle === featuredBook.title)?.content.slice(0, 150)}..."
                                            </p>
                                        </div>
                                    )}

                                    {/* Desktop Only: Reading Goal Info */}
                                    {featuredGoalInfo && (
                                        <div className="hidden md:flex flex-wrap gap-3 mb-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                featuredGoalInfo.statusColor === 'green' && "bg-green-500/10 text-green-600 dark:text-green-400",
                                                featuredGoalInfo.statusColor === 'yellow' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                                featuredGoalInfo.statusColor === 'red' && "bg-red-500/10 text-red-600 dark:text-red-400",
                                            )}>
                                                <Target className="h-3.5 w-3.5" />
                                                {featuredGoalInfo.statusMessage}
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatRemainingDays(featuredGoalInfo.remainingDays)}
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                Günde {featuredGoalInfo.currentDailyTarget} sayfa
                                            </div>
                                        </div>
                                    )}

                                    {/* Desktop Only: Full Progress */}
                                    {featuredBook.pageCount && (
                                        <div className="hidden md:flex flex-col gap-2 mt-auto">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm text-muted-foreground">İlerleme</span>
                                                <span className={cn(
                                                    "text-2xl font-bold",
                                                    featuredGoalInfo?.statusColor === 'green' && "text-green-500",
                                                    featuredGoalInfo?.statusColor === 'yellow' && "text-yellow-500",
                                                    featuredGoalInfo?.statusColor === 'red' && "text-red-500",
                                                    !featuredGoalInfo && "text-primary"
                                                )}>
                                                    {Math.round((featuredBook.currentPage / featuredBook.pageCount) * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        featuredGoalInfo?.statusColor === 'green' && "bg-green-500",
                                                        featuredGoalInfo?.statusColor === 'yellow' && "bg-yellow-500",
                                                        featuredGoalInfo?.statusColor === 'red' && "bg-red-500",
                                                        !featuredGoalInfo && "bg-primary"
                                                    )}
                                                    style={{ width: `${Math.min(100, (featuredBook.currentPage / featuredBook.pageCount) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>Sayfa {featuredBook.currentPage}</span>
                                                <span>Sayfa {featuredBook.pageCount}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile: Goal Info Chips */}
                            {featuredGoalInfo && (
                                <div className="flex md:hidden flex-wrap gap-1.5 mt-3">
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                        featuredGoalInfo.statusColor === 'green' && "bg-green-500/10 text-green-600 dark:text-green-400",
                                        featuredGoalInfo.statusColor === 'yellow' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                        featuredGoalInfo.statusColor === 'red' && "bg-red-500/10 text-red-600 dark:text-red-400",
                                    )}>
                                        <Target className="h-3 w-3" />
                                        {featuredGoalInfo.statusMessage}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatRemainingDays(featuredGoalInfo.remainingDays)}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons - Both Mobile & Desktop */}
                            {featuredBook.pageCount && (
                                <QuickActions
                                    book={{
                                        id: featuredBook.id,
                                        title: featuredBook.title,
                                        currentPage: featuredBook.currentPage,
                                        pageCount: featuredBook.pageCount
                                    }}
                                />
                            )}
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
                        Aylık Hedefler
                    </h2>

                    {(challenge?.currentMonth || challenge?.nextMonth) ? (
                        <div className="flex flex-col gap-4 h-full">
                            {/* Bu Ay Hedefi */}
                            {challenge.currentMonth && currentMonthProgress && (
                                <div className="bg-card rounded-2xl p-4 md:p-5 border border-border/50 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{challenge.currentMonth.themeIcon}</span>
                                            <div>
                                                <span className="font-semibold text-sm md:text-base block">{challenge.currentMonth.monthName}</span>
                                                <span className="text-[10px] md:text-xs text-muted-foreground">{challenge.currentMonth.theme}</span>
                                            </div>
                                        </div>
                                        <span className="bg-primary/20 text-primary text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
                                            Bu Ay
                                        </span>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-lg md:text-xl font-bold text-primary">{currentMonthProgress.totalBooks}</p>
                                            <p className="text-[9px] text-muted-foreground">Kitap</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg md:text-xl font-bold">{currentMonthProgress.totalPages}</p>
                                            <p className="text-[9px] text-muted-foreground">Sayfa</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg md:text-xl font-bold text-orange-500">{currentMonthProgress.remainingDays}</p>
                                            <p className="text-[9px] text-muted-foreground">Kalan Gün</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg md:text-xl font-bold text-blue-500">{currentMonthProgress.dailyTarget}</p>
                                            <p className="text-[9px] text-muted-foreground">Sayfa/Gün</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">{currentMonthProgress.readPages}/{currentMonthProgress.totalPages} sayfa</span>
                                            <span className="font-bold text-primary">{currentMonthProgress.percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${currentMonthProgress.percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                            <span>{currentMonthProgress.mainCompleted}/{currentMonthProgress.mainTotal} Ana Kitap</span>
                                            {currentMonthProgress.bonusTotal > 0 && (
                                                <span className="text-yellow-500">+{currentMonthProgress.bonusCompleted}/{currentMonthProgress.bonusTotal} Bonus</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Book List */}
                                    <div className="flex flex-col gap-1.5 mb-3">
                                        {challenge.currentMonth.mainBooks.slice(0, 4).map((book) => {
                                            const isCompleted = book.bookStatus === "COMPLETED"
                                            const isReading = book.bookStatus === "READING"
                                            return (
                                                <Link
                                                    key={book.id}
                                                    href={`/book/${book.bookId}`}
                                                    className={cn(
                                                        "flex items-center gap-2 p-1.5 rounded-lg transition-colors group",
                                                        isCompleted ? "bg-green-500/10" : "hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className="relative w-7 h-10 rounded overflow-hidden bg-muted shrink-0">
                                                        {book.coverUrl ? (
                                                            <Image
                                                                src={book.coverUrl.replace("http:", "https:")}
                                                                alt={book.title}
                                                                width={28}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        {isCompleted && (
                                                            <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-xs font-medium truncate group-hover:text-primary transition-colors",
                                                            isCompleted && "text-green-600 dark:text-green-400"
                                                        )}>
                                                            {book.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                                                    </div>
                                                    {isReading && (
                                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                                                            Okunuyor
                                                        </span>
                                                    )}
                                                </Link>
                                            )
                                        })}
                                        {challenge.currentMonth.mainBooks.length > 4 && (
                                            <p className="text-[10px] text-muted-foreground text-center">
                                                +{challenge.currentMonth.mainBooks.length - 4} kitap daha
                                            </p>
                                        )}
                                    </div>

                                    <Link
                                        href="/challenges"
                                        className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors text-xs flex items-center justify-center gap-2"
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        Detaylar
                                    </Link>
                                </div>
                            )}

                            {/* Gelecek Ay Hedefi */}
                            {challenge.nextMonth && nextMonthProgress && (
                                <div className="bg-card rounded-2xl p-4 md:p-5 border border-border/50 border-dashed flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl opacity-60">{challenge.nextMonth.themeIcon}</span>
                                            <div>
                                                <span className="font-semibold text-sm md:text-base block text-muted-foreground">{challenge.nextMonth.monthName}</span>
                                                <span className="text-[10px] md:text-xs text-muted-foreground/70">{challenge.nextMonth.theme}</span>
                                            </div>
                                        </div>
                                        <span className="bg-muted text-muted-foreground text-[10px] md:text-xs font-medium px-2 py-1 rounded-full">
                                            Gelecek Ay
                                        </span>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-muted/20 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-base md:text-lg font-bold text-muted-foreground">{nextMonthProgress.totalBooks}</p>
                                            <p className="text-[9px] text-muted-foreground/70">Kitap</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base md:text-lg font-bold text-muted-foreground">{nextMonthProgress.totalPages}</p>
                                            <p className="text-[9px] text-muted-foreground/70">Sayfa</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base md:text-lg font-bold text-muted-foreground">{nextMonthProgress.daysInMonth}</p>
                                            <p className="text-[9px] text-muted-foreground/70">Gün</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base md:text-lg font-bold text-muted-foreground">{nextMonthProgress.dailyTarget}</p>
                                            <p className="text-[9px] text-muted-foreground/70">Sayfa/Gün</p>
                                        </div>
                                    </div>

                                    {/* Book List Preview */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{nextMonthProgress.mainTotal} Ana Kitap</span>
                                            {nextMonthProgress.bonusTotal > 0 && (
                                                <span>+{nextMonthProgress.bonusTotal} Bonus</span>
                                            )}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {challenge.nextMonth.mainBooks.slice(0, 4).map((book, i) => (
                                                <div
                                                    key={book.id}
                                                    className="w-8 h-12 rounded border-2 border-background bg-muted overflow-hidden"
                                                    style={{ zIndex: 4 - i }}
                                                >
                                                    {book.coverUrl ? (
                                                        <Image
                                                            src={book.coverUrl.replace("http:", "https:")}
                                                            alt={book.title}
                                                            width={32}
                                                            height={48}
                                                            className="w-full h-full object-cover opacity-70"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {challenge.nextMonth.mainBooks.length > 4 && (
                                                <div className="w-8 h-12 rounded border-2 border-background bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                                                    +{challenge.nextMonth.mainBooks.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl p-6 border border-border/50 h-full flex flex-col items-center justify-center text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">Bu ay için okuma hedefi yok</p>
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
