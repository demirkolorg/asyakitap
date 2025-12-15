"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Bot,
    BookOpen,
    ArrowRight,
    Search,
    FileText,
    Pen,
    Calendar,
    Sparkles,
    MessageSquare,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { AICommentsPageData, AICommentWithBook } from "@/actions/ai-comments"

interface AICommentsClientProps {
    data: AICommentsPageData
}

const sourceConfig = {
    TORTU: {
        label: "Tortu",
        color: "bg-violet-500",
        textColor: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
        icon: FileText,
        description: "Kitaptan aklında kalanlar"
    },
    IMZA: {
        label: "İmza",
        color: "bg-emerald-500",
        textColor: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        icon: Pen,
        description: "Yazarın üslubu hakkında"
    }
}

export function AICommentsClient({ data }: AICommentsClientProps) {
    const { comments, stats } = data
    const [searchQuery, setSearchQuery] = useState("")
    const [filterSource, setFilterSource] = useState<"all" | "TORTU" | "IMZA">("all")

    // Filter comments
    const filteredComments = useMemo(() => {
        let result = comments

        if (filterSource !== "all") {
            result = result.filter(c => c.source === filterSource)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                c => c.book.title.toLowerCase().includes(query) ||
                    (c.book.author?.name || "").toLowerCase().includes(query) ||
                    c.userContent.toLowerCase().includes(query) ||
                    c.aiComment.toLowerCase().includes(query)
            )
        }

        return result
    }, [comments, filterSource, searchQuery])

    // Format date
    const formatDate = (date: Date) => {
        const d = new Date(date)
        return d.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Strip HTML for preview
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    AI Yorumları
                </h1>
                <p className="text-muted-foreground">
                    Tortu ve İmza için AI analizlerin
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Toplam Yorum
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card className={sourceConfig.TORTU.bgColor}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium flex items-center gap-2", sourceConfig.TORTU.textColor)}>
                            <FileText className="h-4 w-4" />
                            Tortu Yorumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tortuCount}</div>
                    </CardContent>
                </Card>

                <Card className={sourceConfig.IMZA.bgColor}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium flex items-center gap-2", sourceConfig.IMZA.textColor)}>
                            <Pen className="h-4 w-4" />
                            İmza Yorumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.imzaCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Source Filter */}
                <div className="flex gap-2">
                    <Button
                        variant={filterSource === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterSource("all")}
                    >
                        Tümü
                    </Button>
                    <Button
                        variant={filterSource === "TORTU" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterSource("TORTU")}
                        className={filterSource === "TORTU" ? "bg-violet-600 hover:bg-violet-700" : ""}
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Tortu
                    </Button>
                    <Button
                        variant={filterSource === "IMZA" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterSource("IMZA")}
                        className={filterSource === "IMZA" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                        <Pen className="h-4 w-4 mr-1" />
                        İmza
                    </Button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Kitap, yazar veya içerik ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Comments List */}
            {filteredComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/40">
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
                <div className="space-y-4">
                    {filteredComments.map((comment) => {
                        const config = sourceConfig[comment.source]
                        const Icon = config.icon

                        return (
                            <Card
                                key={comment.id}
                                className="group hover:border-primary/30 transition-colors overflow-hidden"
                            >
                                <div className="flex">
                                    {/* Book Cover */}
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

                                    {/* Content */}
                                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                                        {/* Header: Book Info + Source Badge */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/book/${comment.book.id}`}
                                                    className="font-semibold hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    {comment.book.title}
                                                </Link>
                                                <p className="text-muted-foreground text-sm">
                                                    {comment.book.author?.name || "Bilinmiyor"}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 text-white",
                                                config.color
                                            )}>
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </span>
                                        </div>

                                        {/* User Content Preview */}
                                        <div className="mb-3 p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <span className="font-medium">Senin notun:</span>
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {stripHtml(comment.userContent).slice(0, 200)}
                                                {comment.userContent.length > 200 && "..."}
                                            </p>
                                        </div>

                                        {/* AI Comment */}
                                        <div className="mb-3">
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                <span className="font-medium">AI Yorumu:</span>
                                            </p>
                                            <p className="text-sm line-clamp-3">
                                                {comment.aiComment.slice(0, 300)}
                                                {comment.aiComment.length > 300 && "..."}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(comment.createdAt)}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/book/${comment.book.id}`}>
                                                    Kitaba Git
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
