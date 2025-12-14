import { getChallengeDetails } from "@/actions/challenge"
import { ChallengePageClient } from "./client"
import { redirect } from "next/navigation"

export default async function ChallengePage({
    params
}: {
    params: Promise<{ year: string }>
}) {
    const { year } = await params
    const yearNum = parseInt(year)

    if (isNaN(yearNum)) {
        redirect("/challenges")
    }

    const challenge = await getChallengeDetails(yearNum)

    if (!challenge) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">{yearNum} yılı için challenge bulunamadı.</p>
            </div>
        )
    }

    return <ChallengePageClient challenge={challenge} />
}
