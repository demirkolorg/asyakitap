import { getChallengeTimeline, getAllChallenges } from "@/actions/challenge"
import { ChallengesPageClient } from "./page-client"

export default async function ChallengesPage() {
    const [timeline, allChallenges] = await Promise.all([
        getChallengeTimeline(),
        getAllChallenges()
    ])

    return <ChallengesPageClient timeline={timeline} allChallenges={allChallenges} />
}
