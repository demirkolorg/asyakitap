"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
    BookOpen,
    User,
    Map,
    Quote,
    Search,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { globalSearch, type GroupedSearchResults } from "@/actions/search"
import { useDebounce } from "@/lib/hooks/use-debounce"

export function GlobalSearch() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<GroupedSearchResults>({
        books: [],
        authors: [],
        readingLists: [],
        quotes: [],
    })

    const debouncedQuery = useDebounce(query, 300)

    // Keyboard shortcut: Ctrl+K
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // Search when query changes
    React.useEffect(() => {
        async function search() {
            if (debouncedQuery.length < 2) {
                setResults({ books: [], authors: [], readingLists: [], quotes: [] })
                return
            }

            setLoading(true)
            const searchResults = await globalSearch(debouncedQuery)
            setResults(searchResults)
            setLoading(false)
        }

        search()
    }, [debouncedQuery])

    // Reset on close
    React.useEffect(() => {
        if (!open) {
            setQuery("")
            setResults({ books: [], authors: [], readingLists: [], quotes: [] })
        }
    }, [open])

    const handleSelect = (href: string) => {
        setOpen(false)
        router.push(href)
    }

    const hasResults =
        results.books.length > 0 ||
        results.authors.length > 0 ||
        results.readingLists.length > 0 ||
        results.quotes.length > 0

    const showEmpty = debouncedQuery.length >= 2 && !loading && !hasResults

    return (
        <>
            {/* Search Trigger Button */}
            <Button
                variant="outline"
                className="relative h-9 w-full max-w-sm justify-start bg-muted/40 text-sm text-muted-foreground hover:bg-muted/60 sm:pr-12"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-flex">Ara...</span>
                <span className="inline-flex sm:hidden">Ara</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">Ctrl</span>K
                </kbd>
            </Button>

            {/* Command Dialog */}
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title="Ara"
                description="Kitap, yazar, liste veya alıntı ara..."
                shouldFilter={false}
            >
                <CommandInput
                    placeholder="Ara..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Empty State */}
                    {showEmpty && (
                        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                    )}

                    {/* Initial State */}
                    {!loading && debouncedQuery.length < 2 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Aramak için en az 2 karakter girin.
                        </div>
                    )}

                    {/* Results */}
                    {!loading && hasResults && (
                        <>
                            {/* Books */}
                            {results.books.length > 0 && (
                                <CommandGroup heading="Kitaplar">
                                    {results.books.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`book-${item.id}-${item.title}`}
                                            onSelect={() => handleSelect(item.href)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                {item.imageUrl ? (
                                                    <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-10 w-7 items-center justify-center rounded bg-muted">
                                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.title}
                                                    </p>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Authors */}
                            {results.authors.length > 0 && (
                                <CommandGroup heading="Yazarlar">
                                    {results.authors.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`author-${item.id}-${item.title}`}
                                            onSelect={() => handleSelect(item.href)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                {item.imageUrl ? (
                                                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.title}
                                                    </p>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Reading Lists */}
                            {results.readingLists.length > 0 && (
                                <CommandGroup heading="Okuma Listeleri">
                                    {results.readingLists.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`list-${item.id}-${item.title}`}
                                            onSelect={() => handleSelect(item.href)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                                    <Map className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.title}
                                                    </p>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Quotes */}
                            {results.quotes.length > 0 && (
                                <CommandGroup heading="Alıntılar">
                                    {results.quotes.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`quote-${item.id}-${item.title}`}
                                            onSelect={() => handleSelect(item.href)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                                    <Quote className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.title}
                                                    </p>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
