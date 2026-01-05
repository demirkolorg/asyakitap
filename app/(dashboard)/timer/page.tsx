import {
    getDashboardTimerStats,
    getWeeklyStats,
    getMonthlyStats,
    getActivityBreakdown,
    getBookTimeStats,
    getStreakData,
    getYearlyDailyData,
    getWeeklyTrend,
    getGoalProgress,
    getTimerGoals
} from "@/actions/timer-stats"
import { getTimerSessions } from "@/actions/timer"
import { TimerStatsClient } from "./client"

export default async function TimerPage() {
    const [
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
        timerGoals
    ] = await Promise.all([
        getDashboardTimerStats(),
        getWeeklyStats(),
        getMonthlyStats(),
        getActivityBreakdown(),
        getBookTimeStats(5),
        getStreakData(),
        getTimerSessions({ limit: 10 }),
        getYearlyDailyData(),
        getWeeklyTrend(),
        getGoalProgress(),
        getTimerGoals()
    ])

    return (
        <TimerStatsClient
            dashboardStats={dashboardStats}
            weeklyStats={weeklyStats}
            monthlyStats={monthlyStats}
            activityBreakdown={activityBreakdown}
            bookTimeStats={bookTimeStats}
            streakData={streakData}
            recentSessions={recentSessions}
            yearlyData={yearlyData}
            weeklyTrend={weeklyTrend}
            goalProgress={goalProgress}
            timerGoals={timerGoals}
        />
    )
}
