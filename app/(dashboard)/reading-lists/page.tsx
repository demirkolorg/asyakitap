import { getReadingListsWithProgress } from "@/actions/reading-lists"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Map, BookOpen, ChevronRight, Layers, CheckCircle2, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function ReadingListsPage() {
    const lists = await getReadingListsWithProgress()

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Map className="h-8 w-8 text-primary" />
                        Okuma Listeleri
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Tematik okuma yol haritaları ile okuma deneyimini zenginleştir
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/reading-lists/manage">
                        <Settings className="h-4 w-4 mr-2" />
                        Yönet
                    </Link>
                </Button>
            </div>

            {/* Lists Grid */}
            {lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma listesi eklenmemiş</p>
                    <Button asChild variant="outline">
                        <Link href="/reading-lists/manage">
                            İlk listeyi oluştur
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {lists.map((list) => {
                        const progressPercent = list.progress.total > 0
                            ? Math.round((list.progress.completed / list.progress.total) * 100)
                            : 0
                        const hasStarted = list.progress.added > 0

                        return (
                            <Link
                                key={list.id}
                                href={`/reading-lists/${list.slug}`}
                                className="group block"
                            >
                                <div className="relative flex flex-col rounded-xl border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all h-full">
                                    {/* Cover Image */}
                                    <div className="relative aspect-[16/9] overflow-hidden">
                                        {list.coverUrl ? (
                                            <Image
                                                src={list.coverUrl}
                                                alt={list.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <Map className="h-10 w-10 text-primary/40" />
                                            </div>
                                        )}
                                        {progressPercent === 100 && (
                                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                                Tamamlandı
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col">
                                        {/* Header */}
                                        <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                            {list.name}
                                        </h2>

                                        {/* Description */}
                                        {list.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                                                {list.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                            <span className="flex items-center gap-1">
                                                <Layers className="h-3.5 w-3.5" />
                                                {list.levelCount} seviye
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                {list.totalBooks} kitap
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div className="pt-3 border-t mt-auto">
                                            {hasStarted ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">İlerleme</span>
                                                        <span className="font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                            {list.progress.completed}/{list.totalBooks}
                                                        </span>
                                                    </div>
                                                    <Progress value={progressPercent} className="h-1.5" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        Henüz başlanmadı
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                                                        Keşfet
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-12 p-6 bg-muted/30 rounded-xl">
                <h3 className="font-semibold mb-2">Nasıl Çalışır?</h3>
                <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                        <p>Bir okuma listesi seç ve seviyeleri incele</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                        <p>Beğendiğin kitabı kütüphanene ekle</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                        <p>Okudukça ilerlemeni takip et</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
