import { RecommendationsClient } from "./client"

export const metadata = {
    title: "Kitap Önerileri | AsyaKitap",
    description: "AI destekli kişiselleştirilmiş kitap önerileri"
}

export default function RecommendationsPage() {
    return <RecommendationsClient />
}
