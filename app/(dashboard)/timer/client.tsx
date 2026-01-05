"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ActivityType } from "@prisma/client"
import { ActivityIcon, ActivityHeatmap } from "@/components/timer"
import { useTimer } from "@/contexts/timer-context"
import {
    Timer,
    Play,
    Clock,
    Calendar,
    Flame,
    BookOpen,
    BarChart3,
    Trash2,
    Target,
    Settings,
    TrendingUp,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { tr } from "date-fns/locale"
import { deleteTimerSession } from "@/actions/timer"
import { updateTimerGoals } from "@/actions/timer-stats"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts"

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

interface YearlyData {
    dailyData: { [key: string]: number }
    activeDays: string[]
    year: number
    totalDays: number
    totalSeconds: number
}

interface WeeklyTrendItem {
    week: string
    seconds: number
    sessions: number
}

interface GoalProgress {
    daily: { goal: number; current: number; percentage: number; remaining: number }
    weekly: { goal: number; current: number; percentage: number; remaining: number }
}

interface TimerGoals {
    id: string
    dailyGoalMinutes: number
    weeklyGoalMinutes: number
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
    yearlyData: YearlyData | null
    weeklyTrend: WeeklyTrendItem[] | null
    goalProgress: GoalProgress | null
    timerGoals: TimerGoals | null
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

const activityLabels: Record<ActivityType, string> = {
    READING: "Okuma",
    STUDYING: "Çalışma",
    RESEARCH: "Araştırma",
    NOTE_TAKING: "Not Alma",
    LISTENING: "Dinleme",
    OTHER: "Diğer",
}

const activityColors: Record<ActivityType, string> = {
    READING: "#3b82f6",
    STUDYING: "#8b5cf6",
    RESEARCH: "#22c55e",
    NOTE_TAKING: "#eab308",
    LISTENING: "#ec4899",
    OTHER: "#6b7280",
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
    yearlyData,
    weeklyTrend,
    goalProgress,
    timerGoals,
}: TimerStatsClientProps) {
    const router = useRouter()
    const { startTimer } = useTimer()
    const [activeTab, setActiveTab] = useState("overview")
    const [showGoalDialog, setShowGoalDialog] = useState(false)
    const [dailyGoal, setDailyGoal] = useState(timerGoals?.dailyGoalMinutes?.toString() || "30")
    const [weeklyGoal, setWeeklyGoal] = useState(timerGoals?.weeklyGoalMinutes?.toString() || "300")
    const [isSavingGoals, setIsSavingGoals] = useState(false)

    const handleDeleteSession = async (id: string) => {
        const result = await deleteTimerSession(id)
        if (result.success) {
            toast.success("Oturum silindi")
            router.refresh()
        } else {
            toast.error(result.error || "Silme başarısız")
        }
    }

    const handleSaveGoals = async () => {
        setIsSavingGoals(true)
        const result = await updateTimerGoals({
            dailyGoalMinutes: parseInt(dailyGoal) || 30,
            weeklyGoalMinutes: parseInt(weeklyGoal) || 300,
        })

        if (result.success) {
            toast.success("Hedefler güncellendi")
            setShowGoalDialog(false)
            router.refresh()
        } else {
            toast.error(result.error || "Güncelleme başarısız")
        }
        setIsSavingGoals(false)
    }

    // Weekly trend chart data
    const trendChartData = weeklyTrend?.map(item => ({
        name: format(new Date(item.week), "d MMM", { locale: tr }),
        dakika: Math.round(item.seconds / 60),
        oturum: item.sessions,
    })) || []

    // Activity pie chart data
    const pieChartData = activityBreakdown?.breakdown.map(item => ({
        name: activityLabels[item.activityType],
        value: Math.round(item.totalSeconds / 60),
        color: activityColors[item.activityType],
    })) || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Timer İstatistikleri</h1>
                    <p className="text-muted-foreground">Okuma ve çalışma sürelerinizi takip edin</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Target className="h-4 w-4" />
                                Hedef Ayarla
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Süre Hedefleri</DialogTitle>
                                <DialogDescription>
                                    Günlük ve haftalık okuma/çalışma hedeflerinizi belirleyin
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Günlük Hedef (dakika)</Label>
                                    <Input
                                        type="number"
                                        value={dailyGoal}
                                        onChange={(e) => setDailyGoal(e.target.value)}
                                        min={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Haftalık Hedef (dakika)</Label>
                                    <Input
                                        type="number"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        min={1}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                                    İptal
                                </Button>
                                <Button onClick={handleSaveGoals} disabled={isSavingGoals}>
                                    {isSavingGoals ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={() => startTimer()} className="gap-2">
                        <Play className="h-4 w-4" />
                        Timer Başlat
                    </Button>
                </div>
            </div>

            {/* Goal Progress */}
            {goalProgress && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Günlük Hedef</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>{goalProgress.daily.current} / {goalProgress.daily.goal} dk</span>
                                    <span className="font-medium">{goalProgress.daily.percentage}%</span>
                                </div>
                                <Progress value={goalProgress.daily.percentage} className="h-2" />
                                {goalProgress.daily.remaining > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Hedefe {goalProgress.daily.remaining} dakika kaldı
                                    </p>
                                )}
                                {goalProgress.daily.percentage >= 100 && (
                                    <p className="text-xs text-green-500 font-medium">
                                        Günlük hedef tamamlandı!
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Haftalık Hedef</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>{goalProgress.weekly.current} / {goalProgress.weekly.goal} dk</span>
                                    <span className="font-medium">{goalProgress.weekly.percentage}%</span>
                                </div>
                                <Progress value={goalProgress.weekly.percentage} className="h-2" />
                                {goalProgress.weekly.remaining > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Hedefe {Math.floor(goalProgress.weekly.remaining / 60)}s {goalProgress.weekly.remaining % 60}dk kaldı
                                    </p>
                                )}
                                {goalProgress.weekly.percentage >= 100 && (
                                    <p className="text-xs text-green-500 font-medium">
                                        Haftalık hedef tamamlandı!
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                    <TabsTrigger value="heatmap">Aktivite Haritası</TabsTrigger>
                    <TabsTrigger value="history">Geçmiş</TabsTrigger>
                    <TabsTrigger value="books">Kitaplar</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Weekly Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Haftalık Trend</CardTitle>
                                <CardDescription>Son 12 haftanın aktivite grafiği</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {trendChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <AreaChart data={trendChartData}>
                                            <defs>
                                                <linearGradient id="colorDakika" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis hide />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                    fontSize: "12px"
                                                }}
                                                formatter={(value) => [`${value} dk`, "Süre"]}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="dakika"
                                                stroke="hsl(var(--primary))"
                                                fillOpacity={1}
                                                fill="url(#colorDakika)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Henüz yeterli veri yok
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Activity Distribution Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Aktivite Dağılımı</CardTitle>
                                <CardDescription>Aktivite türlerine göre süre</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pieChartData.length > 0 ? (
                                    <div className="flex items-center gap-4">
                                        <ResponsiveContainer width={120} height={120}>
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={50}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2">
                                            {pieChartData.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <span className="text-muted-foreground">{item.value} dk</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Henüz aktivite yok
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Weekly Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Bu Haftanın Dağılımı</CardTitle>
                            <CardDescription>Günlere göre aktivite süresi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {weeklyStats && Object.keys(weeklyStats.dailyData).length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => ({
                                            name: day,
                                            dakika: Math.round((weeklyStats.dailyData[day] || 0) / 60)
                                        }))}
                                    >
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <YAxis hide />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                fontSize: "12px"
                                            }}
                                            formatter={(value) => [`${value} dk`, "Süre"]}
                                        />
                                        <Bar dataKey="dakika" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Bu hafta henüz aktivite yok
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="heatmap" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{yearlyData?.year || new Date().getFullYear()} Aktivite Haritası</CardTitle>
                            <CardDescription>
                                {yearlyData?.totalDays || 0} gün aktif • Toplam {formatDuration(yearlyData?.totalSeconds || 0)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityHeatmap
                                activeDays={yearlyData?.activeDays || []}
                                dailyData={yearlyData?.dailyData || {}}
                                year={yearlyData?.year}
                            />
                        </CardContent>
                    </Card>
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
