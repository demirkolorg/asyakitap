import { getReadingListsSummary, getAllReadingLists } from "@/actions/reading-lists"
import { Map, BookOpen, ChevronRight, Layers } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ReadingListsClient } from "./client"

export default async function ReadingListsPage() {
    const [lists, allLists] = await Promise.all([
        getReadingListsSummary(),
        getAllReadingLists()
    ])

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header - Client Component for actions */}
            <ReadingListsClient lists={allLists} />

            {/* Lists Grid */}
            {lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
                    <Map className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Henüz okuma listesi eklenmemiş</p>
                    <p className="text-sm text-muted-foreground">Yukarıdaki &quot;Yeni Liste&quot; butonunu kullanarak başlayın</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {lists.map((list) => (
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

                                    {/* Action */}
                                    <div className="pt-3 border-t mt-auto">
                                        <div className="flex items-center justify-end">
                                            <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                                                Listeyi Gör
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
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
