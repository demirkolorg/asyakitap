"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react"
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
import { getPublishers } from "@/actions/publisher"

type Publisher = {
    id: string
    name: string
    imageUrl: string | null
    website: string | null
    _count: {
        books: number
    }
}

interface PublisherComboboxProps {
    value?: string
    onValueChange: (publisherId: string) => void
    onAddNew?: () => void
}

export function PublisherCombobox({ value, onValueChange, onAddNew }: PublisherComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [publishers, setPublishers] = React.useState<Publisher[]>([])
    const [search, setSearch] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const selectedPublisher = publishers.find((publisher) => publisher.id === value)

    React.useEffect(() => {
        const fetchPublishers = async () => {
            setLoading(true)
            const result = await getPublishers(search || undefined)
            setPublishers(result)
            setLoading(false)
        }
        fetchPublishers()
    }, [search])

    // İlk yüklemede tüm yayınevlerini getir
    React.useEffect(() => {
        const fetchInitialPublishers = async () => {
            const result = await getPublishers()
            setPublishers(result)
        }
        fetchInitialPublishers()
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
                        {selectedPublisher ? (
                            <span className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {selectedPublisher.name}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Yayınevi seçin...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Yayınevi ara..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            {loading ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Yükleniyor...
                                </div>
                            ) : publishers.length === 0 ? (
                                <CommandEmpty>
                                    <div className="flex flex-col items-center gap-2">
                                        <p>Yayınevi bulunamadı.</p>
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
                                                Yeni Yayınevi Ekle
                                            </Button>
                                        )}
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {publishers.map((publisher) => (
                                        <CommandItem
                                            key={publisher.id}
                                            value={publisher.id}
                                            onSelect={() => {
                                                onValueChange(publisher.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === publisher.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{publisher.name}</span>
                                                {publisher._count.books > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {publisher._count.books} kitap
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
                    title="Yeni yayınevi ekle"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
