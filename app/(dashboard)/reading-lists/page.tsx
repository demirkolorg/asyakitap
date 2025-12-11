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
            <div className="flex items-start justify-between gap-4 mb-4 lg:mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2 lg:gap-3">
                        <Map className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                        Okuma Listeleri
                    </h1>
                    <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">
                        Tematik okuma yol haritaları
                    </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/reading-lists/manage">
                        <Settings className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">Yönet</span>
                    </Link>
                </Button>
            </div>

            {/* Lists Grid */}
            {lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] lg:min-h-[400px] border border-dashed rounded-lg bg-muted/40 p-4">
                    <Map className="h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2 text-center">Henüz okuma listesi eklenmemiş</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/reading-lists/manage">
                            İlk listeyi oluştur
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-8 lg:mt-12 p-4 lg:p-6 bg-muted/30 rounded-xl">
                <h3 className="font-semibold mb-3 text-sm lg:text-base">Nasıl Çalışır?</h3>
                <div className="grid gap-3 lg:gap-4 sm:grid-cols-3 text-xs lg:text-sm text-muted-foreground">
                    <div className="flex gap-2 lg:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] lg:text-xs font-bold">1</span>
                        <p>Okuma listesi seç ve incele</p>
                    </div>
                    <div className="flex gap-2 lg:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] lg:text-xs font-bold">2</span>
                        <p>Kitabı kütüphanene ekle</p>
                    </div>
                    <div className="flex gap-2 lg:gap-3">
                        <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] lg:text-xs font-bold">3</span>
                        <p>İlerlemeni takip et</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
