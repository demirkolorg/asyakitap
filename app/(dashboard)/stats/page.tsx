import { getFullStats } from "@/actions/stats"
import { StatsClient } from "./client"
import { redirect } from "next/navigation"

export const metadata = {
    title: "İstatistikler | AsyaKitap",
    description: "Okuma istatistiklerin ve analizler"
}

export default async function StatsPage() {
    const stats = await getFullStats()

    if (!stats) {
        redirect("/")
    }

    return <StatsClient stats={stats} />
}
