"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileBarChart, X, ChevronLeft, ChevronRight, ExternalLink, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Book {
    id: string
    title: string
    coverUrl: string | null
    infographicUrl: string | null
    author: { name: string } | null
}

interface InfographicsClientProps {
    books: Book[]
}

export function InfographicsClient({ books }: InfographicsClientProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const selectedBook = selectedIndex !== null ? books[selectedIndex] : null

    const handlePrevious = () => {
        if (selectedIndex !== null && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1)
        }
    }

    const handleNext = () => {
        if (selectedIndex !== null && selectedIndex < books.length - 1) {
            setSelectedIndex(selectedIndex + 1)
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <FileBarChart className="h-7 w-7 text-primary" />
                        İnfografik Galerisi
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI tarafından üretilen kitap infografikleri
                    </p>
                </div>
                <div className="text-sm text-muted-foreground">
                    {books.length} infografik
                </div>
            </div>

            {/* Gallery Grid */}
            {books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Henüz infografik yok</h2>
                    <p className="text-muted-foreground max-w-md">
                        Kitap detay sayfalarından infografik URL&apos;leri ekleyerek koleksiyonunuzu oluşturmaya başlayın.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {books.map((book, index) => (
                        <button
                            key={book.id}
                            onClick={() => setSelectedIndex(index)}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary transition-all"
                        >
                            {book.infographicUrl && (
                                <img
                                    src={book.infographicUrl}
                                    alt={`${book.title} infografik`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white font-medium text-sm line-clamp-2">
                                        {book.title}
                                    </p>
                                    {book.author && (
                                        <p className="text-white/70 text-xs mt-1">
                                            {book.author.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
                <DialogContent className="max-w-5xl w-full p-0 gap-0 bg-black/95 border-none">
                    {selectedBook && (
                        <div className="relative">
                            {/* Close button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                                onClick={() => setSelectedIndex(null)}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            {/* Navigation buttons */}
                            {selectedIndex !== null && selectedIndex > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                                    onClick={handlePrevious}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </Button>
                            )}
                            {selectedIndex !== null && selectedIndex < books.length - 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                                    onClick={handleNext}
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </Button>
                            )}

                            {/* Image */}
                            <div className="flex items-center justify-center min-h-[60vh] max-h-[80vh] p-4">
                                {selectedBook.infographicUrl && (
                                    <img
                                        src={selectedBook.infographicUrl}
                                        alt={`${selectedBook.title} infografik`}
                                        className="max-w-full max-h-[75vh] object-contain"
                                    />
                                )}
                            </div>

                            {/* Info bar */}
                            <div className="flex items-center justify-between px-6 py-4 bg-black/50 border-t border-white/10">
                                <div>
                                    <h3 className="text-white font-medium">{selectedBook.title}</h3>
                                    {selectedBook.author && (
                                        <p className="text-white/60 text-sm">{selectedBook.author.name}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-white border-white/30 hover:bg-white/10"
                                        onClick={() => window.open(selectedBook.infographicUrl!, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Tam Boyut
                                    </Button>
                                    <Link href={`/book/${selectedBook.id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-white border-white/30 hover:bg-white/10"
                                        >
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Kitaba Git
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Counter */}
                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                                {selectedIndex !== null ? selectedIndex + 1 : 0} / {books.length}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
