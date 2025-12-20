import { getFullStats, getStreakData } from "@/actions/stats"
import { StatsClient } from "./client"
import { redirect } from "next/navigation"
import { StreakHeatmap } from "@/components/streak-heatmap"

export const metadata = {
    title: "İstatistikler | AsyaKitap",
    description: "Okuma istatistiklerin ve analizler"
}

export default async function StatsPage() {
    const [stats, streakData] = await Promise.all([
        getFullStats(),
        getStreakData()
    ])

    if (!stats) {
        redirect("/")
    }

    return (
        <div className="space-y-6">
            {/* Streak Heatmap */}
            {streakData && <StreakHeatmap data={streakData} />}

            {/* Existing Stats */}
            <StatsClient stats={stats} />
        </div>
    )
}
