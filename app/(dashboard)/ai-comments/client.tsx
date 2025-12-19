"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Bot,
    BookOpen,
    ArrowRight,
    Search,
    FileText,
    Pen,
    Sparkles,
    BarChart3,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn, formatDate } from "@/lib/utils"
import type { AICommentsPageData } from "@/actions/ai-comments"

interface AICommentsClientProps {
    data: AICommentsPageData
}

const sourceConfig = {
    TORTU: {
        label: "Tortu",
        color: "bg-violet-500",
        lightColor: "text-violet-500",
        bgColor: "bg-violet-500/10",
        icon: FileText,
    },
    IMZA: {
        label: "İmza",
        color: "bg-emerald-500",
        lightColor: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        icon: Pen,
    },
    STATS: {
        label: "İstatistik",
        color: "bg-blue-500",
        lightColor: "text-blue-500",
        bgColor: "bg-blue-500/10",
        icon: BarChart3,
    }
}

export function AICommentsClient({ data }: AICommentsClientProps) {
    const { comments, stats } = data
    const [searchQuery, setSearchQuery] = useState("")
    const [filterSource, setFilterSource] = useState<"all" | "TORTU" | "IMZA" | "STATS">("all")

    // Filter comments
    const filteredComments = useMemo(() => {
        let result = comments

        if (filterSource !== "all") {
            result = result.filter(c => c.source === filterSource)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                c => (c.book?.title || "").toLowerCase().includes(query) ||
                    (c.book?.author?.name || "").toLowerCase().includes(query) ||
                    c.userContent.toLowerCase().includes(query) ||
                    c.aiComment.toLowerCase().includes(query)
            )
        }

        return result
    }, [comments, filterSource, searchQuery])

    // Strip HTML for preview
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">AI Yorumları</h1>
                <p className="text-muted-foreground">
                    Tortu ve İmza için AI analizlerin.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-border transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Bot className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Toplam Yorum</span>
                    <span className="text-3xl font-black z-10">{stats.total}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-violet-500">
                        <FileText className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">Tortu Yorumu</span>
                    <span className="text-3xl font-black text-violet-500 z-10">{stats.tortuCount}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                        <Pen className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">İmza Yorumu</span>
                    <span className="text-3xl font-black text-emerald-500 z-10">{stats.imzaCount}</span>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border/50 flex flex-col gap-1 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500">
                        <BarChart3 className="h-12 w-12" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium z-10">İstatistik Analizi</span>
                    <span className="text-3xl font-black text-blue-500 z-10">{stats.statsCount}</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 rounded-xl border border-border/50">
                {/* Search */}
                <div className="relative w-full lg:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Kitap, yazar veya içerik ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border/50 focus:border-primary"
                    />
                </div>

                {/* Source Filters */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setFilterSource("all")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filterSource === "all"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground hover:text-foreground"
                        )}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilterSource("TORTU")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                            filterSource === "TORTU"
                                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-violet-500/50 hover:text-violet-500"
                        )}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Tortu
                    </button>
                    <button
                        onClick={() => setFilterSource("IMZA")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                            filterSource === "IMZA"
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-emerald-500/50 hover:text-emerald-500"
                        )}
                    >
                        <Pen className="h-3.5 w-3.5" />
                        İmza
                    </button>
                    <button
                        onClick={() => setFilterSource("STATS")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                            filterSource === "STATS"
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-blue-500/50 hover:text-blue-500"
                        )}
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        İstatistik
                    </button>
                </div>
            </div>

            {/* Comments List */}
            {filteredComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-xl bg-muted/40">
                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-muted-foreground mb-2">Arama sonucu bulunamadı</p>
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Aramayı Temizle
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-muted-foreground mb-2">Henüz AI yorumu yok</p>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                                Kitap detay sayfasında Tortu veya İmza yazıp AI&apos;dan yorum istediğinde burada görünecek
                            </p>
                            <Button variant="outline" asChild>
                                <Link href="/library">Kitaplara Git</Link>
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredComments.map((comment) => {
                        const config = sourceConfig[comment.source]
                        const Icon = config.icon
                        const isStatsComment = comment.source === "STATS"

                        return (
                            <div
                                key={comment.id}
                                className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
                            >
                                <div className="flex">
                                    {/* Book Cover or Icon */}
                                    {!isStatsComment && comment.book ? (
                                        <Link href={`/book/${comment.book.id}`} className="flex-shrink-0">
                                            <div className="relative w-24 sm:w-28 aspect-[2/3] bg-muted">
                                                {comment.book.coverUrl ? (
                                                    <Image
                                                        src={comment.book.coverUrl.replace("http:", "https:")}
                                                        alt={comment.book.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex-shrink-0 w-24 sm:w-28 aspect-[2/3] bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                                            <BarChart3 className="h-12 w-12 text-blue-500" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="min-w-0">
                                                {isStatsComment ? (
                                                    <>
                                                        <p className="font-bold text-lg">Okuma Alışkanlıkları Analizi</p>
                                                        <p className="text-muted-foreground text-sm">
                                                            Genel istatistik değerlendirmesi
                                                        </p>
                                                    </>
                                                ) : comment.book ? (
                                                    <>
                                                        <Link
                                                            href={`/book/${comment.book.id}`}
                                                            className="font-bold text-lg hover:text-primary transition-colors line-clamp-1"
                                                        >
                                                            {comment.book.title}
                                                        </Link>
                                                        <p className="text-muted-foreground text-sm">
                                                            {comment.book.author?.name || "Bilinmiyor"}
                                                        </p>
                                                    </>
                                                ) : null}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 text-white",
                                                config.color
                                            )}>
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </span>
                                        </div>

                                        {/* User Content */}
                                        <div className="mb-3 p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-2 font-medium">
                                                {isStatsComment ? "İstatistikler:" : "Senin notun:"}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {stripHtml(comment.userContent)}
                                            </p>
                                        </div>

                                        {/* AI Comment */}
                                        <div className="mb-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3 text-primary" />
                                                <span className="font-medium">AI Yorumu:</span>
                                            </p>
                                            <p className="text-sm line-clamp-3">
                                                {comment.aiComment}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-muted-foreground">
                                                {formatDate(comment.createdAt, { format: "long" })}
                                            </div>
                                            {!isStatsComment && comment.book ? (
                                                <Link
                                                    href={`/book/${comment.book.id}`}
                                                    className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
                                                >
                                                    Kitaba Git
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            ) : (
                                                <Link
                                                    href="/stats"
                                                    className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium"
                                                >
                                                    İstatistiklere Git
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
