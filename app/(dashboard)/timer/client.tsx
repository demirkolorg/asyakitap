"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ActivityType } from "@prisma/client"
import { ActivityBadge, ActivityIcon } from "@/components/timer"
import { useTimer } from "@/contexts/timer-context"
import {
    Timer,
    Play,
    Clock,
    Calendar,
    Flame,
    TrendingUp,
    BookOpen,
    BarChart3,
    Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { deleteTimerSession } from "@/actions/timer"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

// ==========================================
// Types
// ==========================================

interface DashboardStats {
    today: { totalSeconds: number; sessionCount: number }
    week: { totalSeconds: number; sessionCount: number }
    month: { totalSeconds: number; sessionCount: number }
    streak: { current: number; longest: number } | null
}

interface WeeklyStats {
    totalSeconds: number
    sessionCount: number
    dailyData: { [key: string]: number }
    startOfWeek: Date
}

interface MonthlyStats {
    totalSeconds: number
    sessionCount: number
    dailyData: { [key: string]: number }
    month: number
    year: number
}

interface ActivityBreakdown {
    breakdown: {
        activityType: ActivityType
        totalSeconds: number
        sessionCount: number
    }[]
    totalSeconds: number
}

interface BookTimeStat {
    book: {
        id: string
        title: string
        coverUrl: string | null
        author: { name: string } | null
    } | null | undefined
    totalSeconds: number
    sessionCount: number
}

interface StreakData {
    currentStreak: number
    longestStreak: number
    totalActiveDays: number
    activeDays: string[]
}

interface Session {
    id: string
    activityType: ActivityType
    title: string | null
    startTime: Date
    endTime: Date | null
    durationSeconds: number
    book: {
        id: string
        title: string
        coverUrl: string | null
        author: { name: string } | null
    } | null
}

interface TimerStatsClientProps {
    dashboardStats: DashboardStats | null
    weeklyStats: WeeklyStats | null
    monthlyStats: MonthlyStats | null
    activityBreakdown: ActivityBreakdown | null
    bookTimeStats: BookTimeStat[]
    streakData: StreakData | null
    recentSessions: Session[]
}

// ==========================================
// Helpers
// ==========================================

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}s ${minutes}dk`
    }
    return `${minutes}dk`
}

function formatDurationLong(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0 && minutes > 0) {
        return `${hours} saat ${minutes} dakika`
    } else if (hours > 0) {
        return `${hours} saat`
    }
    return `${minutes} dakika`
}

const activityLabels: Record<ActivityType, string> = {
    READING: "Okuma",
    STUDYING: "Çalışma",
    RESEARCH: "Araştırma",
    NOTE_TAKING: "Not Alma",
    LISTENING: "Dinleme",
    OTHER: "Diğer",
}

const activityColors: Record<ActivityType, string> = {
    READING: "bg-blue-500",
    STUDYING: "bg-purple-500",
    RESEARCH: "bg-green-500",
    NOTE_TAKING: "bg-yellow-500",
    LISTENING: "bg-pink-500",
    OTHER: "bg-gray-500",
}

// ==========================================
// Components
// ==========================================

export function TimerStatsClient({
    dashboardStats,
    weeklyStats,
    monthlyStats,
    activityBreakdown,
    bookTimeStats,
    streakData,
    recentSessions,
}: TimerStatsClientProps) {
    const router = useRouter()
    const { startTimer } = useTimer()
    const [activeTab, setActiveTab] = useState("overview")

    const handleDeleteSession = async (id: string) => {
        const result = await deleteTimerSession(id)
        if (result.success) {
            toast.success("Oturum silindi")
            router.refresh()
        } else {
            toast.error(result.error || "Silme başarısız")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Timer İstatistikleri</h1>
                    <p className="text-muted-foreground">Okuma ve çalışma sürelerinizi takip edin</p>
                </div>
                <Button onClick={() => startTimer()} className="gap-2">
                    <Play className="h-4 w-4" />
                    Timer Başlat
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bugün</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(dashboardStats?.today.totalSeconds || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardStats?.today.sessionCount || 0} oturum
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(dashboardStats?.week.totalSeconds || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardStats?.week.sessionCount || 0} oturum
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(dashboardStats?.month.totalSeconds || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardStats?.month.sessionCount || 0} oturum
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Seri</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {streakData?.currentStreak || 0} gün
                        </div>
                        <p className="text-xs text-muted-foreground">
                            En uzun: {streakData?.longestStreak || 0} gün
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="history">Geçmiş</TabsTrigger>
                    <TabsTrigger value="books">Kitaplar</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Haftalık Dağılım */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Haftalık Dağılım</CardTitle>
                                <CardDescription>Günlere göre aktivite süresi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {weeklyStats && Object.keys(weeklyStats.dailyData).length > 0 ? (
                                    <div className="space-y-2">
                                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => {
                                            const seconds = weeklyStats.dailyData[day] || 0
                                            const maxSeconds = Math.max(...Object.values(weeklyStats.dailyData), 1)
                                            const percentage = (seconds / maxSeconds) * 100

                                            return (
                                                <div key={day} className="flex items-center gap-2">
                                                    <span className="w-8 text-xs text-muted-foreground">{day}</span>
                                                    <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-16 text-xs text-right">
                                                        {seconds > 0 ? formatDuration(seconds) : '-'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Bu hafta henüz aktivite yok
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Aktivite Dağılımı */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Aktivite Dağılımı</CardTitle>
                                <CardDescription>Aktivite türlerine göre süre</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityBreakdown && activityBreakdown.breakdown.length > 0 ? (
                                    <div className="space-y-3">
                                        {activityBreakdown.breakdown.map((item) => {
                                            const percentage = activityBreakdown.totalSeconds > 0
                                                ? (item.totalSeconds / activityBreakdown.totalSeconds) * 100
                                                : 0

                                            return (
                                                <div key={item.activityType} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <ActivityIcon type={item.activityType} className="h-4 w-4" />
                                                            <span>{activityLabels[item.activityType]}</span>
                                                        </div>
                                                        <span className="text-muted-foreground">
                                                            {formatDuration(item.totalSeconds)}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${activityColors[item.activityType]} transition-all`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Henüz aktivite yok
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Son Oturumlar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {recentSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ActivityIcon type={session.activityType} className="h-5 w-5" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {session.title || activityLabels[session.activityType]}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {formatDuration(session.durationSeconds)}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(session.startTime), {
                                                            addSuffix: true,
                                                            locale: tr,
                                                        })}
                                                        {session.book && (
                                                            <span className="ml-2">
                                                                • {session.book.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteSession(session.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Henüz oturum kaydı yok
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="books" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Kitap Bazlı Süreler</CardTitle>
                            <CardDescription>En çok zaman harcadığınız kitaplar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookTimeStats.length > 0 ? (
                                <div className="space-y-3">
                                    {bookTimeStats.map((stat, index) => (
                                        stat.book && (
                                            <div
                                                key={stat.book.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                                            >
                                                <span className="text-lg font-bold text-muted-foreground w-6">
                                                    {index + 1}
                                                </span>
                                                <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                    {stat.book.coverUrl ? (
                                                        <Image
                                                            src={stat.book.coverUrl.replace('http:', 'https:')}
                                                            alt={stat.book.title}
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
                                                    <p className="font-medium truncate">{stat.book.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {stat.book.author?.name || "Bilinmiyor"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatDuration(stat.totalSeconds)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {stat.sessionCount} oturum
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Henüz kitap bazlı kayıt yok
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
