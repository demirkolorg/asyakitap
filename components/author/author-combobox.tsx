"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getAuthors } from "@/actions/authors"

type Author = {
    id: string
    name: string
    imageUrl: string | null
    _count: {
        books: number
    }
}

interface AuthorComboboxProps {
    value?: string
    onValueChange: (authorId: string) => void
    onAddNew?: () => void
}

export function AuthorCombobox({ value, onValueChange, onAddNew }: AuthorComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [authors, setAuthors] = React.useState<Author[]>([])
    const [search, setSearch] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const selectedAuthor = authors.find((author) => author.id === value)

    React.useEffect(() => {
        const fetchAuthors = async () => {
            setLoading(true)
            const result = await getAuthors(search || undefined)
            setAuthors(result)
            setLoading(false)
        }
        fetchAuthors()
    }, [search])

    // İlk yüklemede tüm yazarları getir
    React.useEffect(() => {
        const fetchInitialAuthors = async () => {
            const result = await getAuthors()
            setAuthors(result)
        }
        fetchInitialAuthors()
    }, [])

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="flex-1 justify-between"
                    >
                        {selectedAuthor ? (
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {selectedAuthor.name}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Yazar seçin...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Yazar ara..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            {loading ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Yükleniyor...
                                </div>
                            ) : authors.length === 0 ? (
                                <CommandEmpty>
                                    <div className="flex flex-col items-center gap-2">
                                        <p>Yazar bulunamadı.</p>
                                        {onAddNew && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setOpen(false)
                                                    onAddNew()
                                                }}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Yeni Yazar Ekle
                                            </Button>
                                        )}
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {authors.map((author) => (
                                        <CommandItem
                                            key={author.id}
                                            value={author.id}
                                            onSelect={() => {
                                                onValueChange(author.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === author.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{author.name}</span>
                                                {author._count.books > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {author._count.books} kitap
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {onAddNew && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onAddNew}
                    title="Yeni yazar ekle"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
