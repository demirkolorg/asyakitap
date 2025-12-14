import { getChallengeTimeline } from "@/actions/challenge"
import { ChallengeTimelineClient } from "./timeline-client"

export default async function ChallengesPage() {
    const timeline = await getChallengeTimeline()

    if (!timeline) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Okuma hedefi bulunamadı.</p>
            </div>
        )
    }

    return <ChallengeTimelineClient timeline={timeline} />
}
