import { RepairLinksClient } from "./client"

export const metadata = {
    title: "Bağlantıları Onar | Ayarlar",
    description: "Kitap bağlantılarını onar"
}

export default function RepairLinksPage() {
    return (
        <div className="container max-w-4xl py-6 md:py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Bağlantıları Onar</h1>
                    <p className="text-muted-foreground mt-2">
                        Kitaplarınız ile okuma listeleri ve challenge'lar arasındaki
                        kopuk bağlantıları otomatik olarak bulup onarın.
                    </p>
                </div>

                <RepairLinksClient />
            </div>
        </div>
    )
}
