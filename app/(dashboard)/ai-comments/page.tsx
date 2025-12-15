import { getAICommentsPageData, migrateExistingAIComments } from "@/actions/ai-comments"
import { AICommentsClient } from "./client"
import { redirect } from "next/navigation"

export const metadata = {
    title: "AI Yorumları | AsyaKitap",
    description: "Tortu ve İmza için AI analizlerin"
}

export default async function AICommentsPage() {
    // Önce mevcut verileri migrate et (bir kez çalışır, varsa skip eder)
    await migrateExistingAIComments()

    const data = await getAICommentsPageData()

    if (!data) {
        redirect("/")
    }

    return <AICommentsClient data={data} />
}
