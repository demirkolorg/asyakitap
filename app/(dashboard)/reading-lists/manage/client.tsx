"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    Map,
    Plus,
    ArrowLeft,
    Edit,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Layers,
    BookOpen,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
    createReadingList,
    updateReadingList,
    deleteReadingList,
    createLevel,
    updateLevel,
    deleteLevel,
    createReadingListBook,
    updateReadingListBook,
    deleteReadingListBook,
    reorderLevels,
    reorderBooks,
    getReadingListForAdmin,
} from "@/actions/reading-lists"
import { cn } from "@/lib/utils"

// Types
interface ReadingListBook {
    id: string
    title: string
    author: string
    neden: string | null
    pageCount: number | null
    sortOrder: number
}

interface ReadingListLevel {
    id: string
    levelNumber: number
    name: string
    description: string | null
    books: ReadingListBook[]
}

interface ReadingList {
    id: string
    slug: string
    name: string
    description: string | null
    defaultShelfName: string | null
    levels: ReadingListLevel[]
    totalBooks: number
    levelCount: number
}

interface ManageClientProps {
    initialLists: ReadingList[]
}

// Sortable Book Item
function SortableBookItem({
    book,
    onEdit,
    onDelete,
}: {
    book: ReadingListBook
    onEdit: () => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: book.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 bg-background border rounded-lg",
                isDragging && "opacity-50 shadow-lg"
            )}
        >
            <button
                className="cursor-grab text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{book.title}</p>
                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

// Sortable Level Item
function SortableLevelItem({
    level,
    onEdit,
    onDelete,
    onAddBook,
    onEditBook,
    onDeleteBook,
    onReorderBooks,
}: {
    level: ReadingListLevel
    onEdit: () => void
    onDelete: () => void
    onAddBook: () => void
    onEditBook: (book: ReadingListBook) => void
    onDeleteBook: (bookId: string) => void
    onReorderBooks: (bookIds: string[]) => void
}) {
    const [expanded, setExpanded] = useState(true)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: level.id })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleBookDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = level.books.findIndex((b) => b.id === active.id)
            const newIndex = level.books.findIndex((b) => b.id === over.id)
            const newBooks = arrayMove(level.books, oldIndex, newIndex)
            onReorderBooks(newBooks.map((b) => b.id))
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "border rounded-xl overflow-hidden bg-card",
                isDragging && "opacity-50 shadow-lg"
            )}
        >
            <div className="flex items-center gap-3 p-4 bg-muted/30">
                <button
                    className="cursor-grab text-muted-foreground hover:text-foreground"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <div
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm"
                >
                    {level.levelNumber}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{level.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {level.books.length} kitap
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-3">
                    {level.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                            {level.description}
                        </p>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleBookDragEnd}
                    >
                        <SortableContext
                            items={level.books.map((b) => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {level.books.map((book) => (
                                    <SortableBookItem
                                        key={book.id}
                                        book={book}
                                        onEdit={() => onEditBook(book)}
                                        onDelete={() => onDeleteBook(book.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={onAddBook}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Kitap Ekle
                    </Button>
                </div>
            )}
        </div>
    )
}

export function ManageClient({ initialLists }: ManageClientProps) {
    const [lists, setLists] = useState(initialLists)
    const [selectedList, setSelectedList] = useState<ReadingList | null>(null)
    const [loading, setLoading] = useState(false)

    // Dialog states
    const [listDialogOpen, setListDialogOpen] = useState(false)
    const [levelDialogOpen, setLevelDialogOpen] = useState(false)
    const [bookDialogOpen, setBookDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    // Edit states
    const [editingList, setEditingList] = useState<ReadingList | null>(null)
    const [editingLevel, setEditingLevel] = useState<ReadingListLevel | null>(null)
    const [editingBook, setEditingBook] = useState<ReadingListBook | null>(null)
    const [editingLevelId, setEditingLevelId] = useState<string | null>(null)

    // Delete states
    const [deleteTarget, setDeleteTarget] = useState<{
        type: "list" | "level" | "book"
        id: string
        name: string
    } | null>(null)

    // Form states
    const [listForm, setListForm] = useState({ name: "", slug: "", description: "", defaultShelfName: "" })
    const [levelForm, setLevelForm] = useState({ name: "", description: "" })
    const [bookForm, setBookForm] = useState({
        title: "",
        author: "",
        neden: "",
        pageCount: "",
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Refresh selected list data
    const refreshSelectedList = async (listId: string) => {
        const data = await getReadingListForAdmin(listId)
        if (data) {
            const updatedList = {
                ...data,
                totalBooks: data.levels.reduce((acc: number, l: typeof data.levels[number]) => acc + l.books.length, 0),
                levelCount: data.levels.length,
            }
            setSelectedList(updatedList)
            setLists((prev) =>
                prev.map((l) => (l.id === listId ? updatedList : l))
            )
        }
    }

    // List handlers
    const openListDialog = (list?: ReadingList) => {
        if (list) {
            setEditingList(list)
            setListForm({
                name: list.name,
                slug: list.slug,
                description: list.description || "",
                defaultShelfName: list.defaultShelfName || "",
            })
        } else {
            setEditingList(null)
            setListForm({ name: "", slug: "", description: "", defaultShelfName: "" })
        }
        setListDialogOpen(true)
    }

    const handleListSubmit = async () => {
        setLoading(true)
        try {
            const submitData = {
                name: listForm.name,
                slug: listForm.slug,
                description: listForm.description || undefined,
                defaultShelfName: listForm.defaultShelfName || null,
            }
            if (editingList) {
                const res = await updateReadingList(editingList.id, submitData)
                if (res.success) {
                    toast.success("Liste güncellendi")
                    await refreshSelectedList(editingList.id)
                } else {
                    toast.error(res.error)
                }
            } else {
                const res = await createReadingList(submitData)
                if (res.success && res.list) {
                    toast.success("Liste oluşturuldu")
                    const newList = {
                        ...res.list,
                        levels: [],
                        totalBooks: 0,
                        levelCount: 0,
                    }
                    setLists((prev) => [...prev, newList])
                    setSelectedList(newList)
                } else {
                    toast.error(res.error)
                }
            }
            setListDialogOpen(false)
        } finally {
            setLoading(false)
        }
    }

    // Level handlers
    const openLevelDialog = (level?: ReadingListLevel) => {
        if (level) {
            setEditingLevel(level)
            setLevelForm({
                name: level.name,
                description: level.description || "",
            })
        } else {
            setEditingLevel(null)
            setLevelForm({ name: "", description: "" })
        }
        setLevelDialogOpen(true)
    }

    const handleLevelSubmit = async () => {
        if (!selectedList) return
        setLoading(true)
        try {
            if (editingLevel) {
                const res = await updateLevel(editingLevel.id, levelForm)
                if (res.success) {
                    toast.success("Seviye güncellendi")
                    await refreshSelectedList(selectedList.id)
                } else {
                    toast.error(res.error)
                }
            } else {
                const res = await createLevel({
                    readingListId: selectedList.id,
                    ...levelForm,
                })
                if (res.success) {
                    toast.success("Seviye eklendi")
                    await refreshSelectedList(selectedList.id)
                } else {
                    toast.error(res.error)
                }
            }
            setLevelDialogOpen(false)
        } finally {
            setLoading(false)
        }
    }

    // Book handlers
    const openBookDialog = (levelId: string, book?: ReadingListBook) => {
        setEditingLevelId(levelId)
        if (book) {
            setEditingBook(book)
            setBookForm({
                title: book.title,
                author: book.author,
                neden: book.neden || "",
                pageCount: book.pageCount?.toString() || "",
            })
        } else {
            setEditingBook(null)
            setBookForm({ title: "", author: "", neden: "", pageCount: "" })
        }
        setBookDialogOpen(true)
    }

    const handleBookSubmit = async () => {
        if (!selectedList || !editingLevelId) return
        setLoading(true)
        try {
            const data = {
                title: bookForm.title,
                author: bookForm.author,
                neden: bookForm.neden || undefined,
                pageCount: bookForm.pageCount ? parseInt(bookForm.pageCount) : undefined,
            }

            if (editingBook) {
                const res = await updateReadingListBook(editingBook.id, data)
                if (res.success) {
                    toast.success("Kitap güncellendi")
                    await refreshSelectedList(selectedList.id)
                } else {
                    toast.error(res.error)
                }
            } else {
                const res = await createReadingListBook({
                    levelId: editingLevelId,
                    ...data,
                })
                if (res.success) {
                    toast.success("Kitap eklendi")
                    await refreshSelectedList(selectedList.id)
                } else {
                    toast.error(res.error)
                }
            }
            setBookDialogOpen(false)
        } finally {
            setLoading(false)
        }
    }

    // Delete handlers
    const openDeleteDialog = (
        type: "list" | "level" | "book",
        id: string,
        name: string
    ) => {
        setDeleteTarget({ type, id, name })
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setLoading(true)
        try {
            let res
            if (deleteTarget.type === "list") {
                res = await deleteReadingList(deleteTarget.id)
                if (res.success) {
                    setLists((prev) => prev.filter((l) => l.id !== deleteTarget.id))
                    setSelectedList(null)
                    toast.success("Liste silindi")
                }
            } else if (deleteTarget.type === "level") {
                res = await deleteLevel(deleteTarget.id)
                if (res.success && selectedList) {
                    await refreshSelectedList(selectedList.id)
                    toast.success("Seviye silindi")
                }
            } else {
                res = await deleteReadingListBook(deleteTarget.id)
                if (res.success && selectedList) {
                    await refreshSelectedList(selectedList.id)
                    toast.success("Kitap silindi")
                }
            }
            if (!res?.success) {
                toast.error(res?.error || "Bir hata oluştu")
            }
            setDeleteDialogOpen(false)
        } finally {
            setLoading(false)
        }
    }

    // Reorder handlers
    const handleLevelDragEnd = async (event: DragEndEvent) => {
        if (!selectedList) return
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = selectedList.levels.findIndex((l) => l.id === active.id)
            const newIndex = selectedList.levels.findIndex((l) => l.id === over.id)
            const newLevels = arrayMove(selectedList.levels, oldIndex, newIndex)

            // Optimistic update
            setSelectedList({
                ...selectedList,
                levels: newLevels.map((l, i) => ({ ...l, levelNumber: i + 1 })),
            })

            const res = await reorderLevels(
                selectedList.id,
                newLevels.map((l) => l.id)
            )
            if (!res.success) {
                toast.error("Sıralama güncellenemedi")
                await refreshSelectedList(selectedList.id)
            }
        }
    }

    const handleBookReorder = async (levelId: string, bookIds: string[]) => {
        if (!selectedList) return

        // Optimistic update
        setSelectedList({
            ...selectedList,
            levels: selectedList.levels.map((level) =>
                level.id === levelId
                    ? {
                          ...level,
                          books: bookIds.map(
                              (id, i) =>
                                  level.books.find((b) => b.id === id) || level.books[i]
                          ).filter(Boolean) as ReadingListBook[],
                      }
                    : level
            ),
        })

        const res = await reorderBooks(levelId, bookIds)
        if (!res.success) {
            toast.error("Sıralama güncellenemedi")
            await refreshSelectedList(selectedList.id)
        }
    }

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href="/reading-lists"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Geri
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Map className="h-8 w-8 text-primary" />
                        Liste Yönetimi
                    </h1>
                </div>
                <Button onClick={() => openListDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Liste
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* List sidebar */}
                <div className="space-y-3">
                    <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Listeler
                    </h2>
                    {lists.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Henüz liste yok
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {lists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border transition-colors",
                                        selectedList?.id === list.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <p className="font-medium">{list.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Layers className="h-3 w-3" />
                                            {list.levelCount} seviye
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {list.totalBooks} kitap
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="min-h-[400px] border rounded-xl p-6">
                    {selectedList ? (
                        <div className="space-y-6">
                            {/* List header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedList.name}</h2>
                                    {selectedList.description && (
                                        <p className="text-muted-foreground mt-1">
                                            {selectedList.description}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Slug: /{selectedList.slug}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openListDialog(selectedList)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Düzenle
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            openDeleteDialog("list", selectedList.id, selectedList.name)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            {/* Levels */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Seviyeler</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openLevelDialog()}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Seviye Ekle
                                    </Button>
                                </div>

                                {selectedList.levels.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Henüz seviye eklenmemiş</p>
                                        <Button
                                            variant="link"
                                            onClick={() => openLevelDialog()}
                                        >
                                            İlk seviyeyi ekle
                                        </Button>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleLevelDragEnd}
                                    >
                                        <SortableContext
                                            items={selectedList.levels.map((l) => l.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-4">
                                                {selectedList.levels.map((level) => (
                                                    <SortableLevelItem
                                                        key={level.id}
                                                        level={level}
                                                        onEdit={() => openLevelDialog(level)}
                                                        onDelete={() =>
                                                            openDeleteDialog("level", level.id, level.name)
                                                        }
                                                        onAddBook={() => openBookDialog(level.id)}
                                                        onEditBook={(book) => openBookDialog(level.id, book)}
                                                        onDeleteBook={(bookId) => {
                                                            const book = level.books.find((b) => b.id === bookId)
                                                            if (book) {
                                                                openDeleteDialog("book", bookId, book.title)
                                                            }
                                                        }}
                                                        onReorderBooks={(bookIds) =>
                                                            handleBookReorder(level.id, bookIds)
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Map className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg">Düzenlemek için bir liste seçin</p>
                            <p className="text-sm">veya yeni liste oluşturun</p>
                        </div>
                    )}
                </div>
            </div>

            {/* List Dialog */}
            <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingList ? "Listeyi Düzenle" : "Yeni Liste Oluştur"}
                        </DialogTitle>
                        <DialogDescription>
                            Okuma listesi bilgilerini girin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">İsim</label>
                            <Input
                                value={listForm.name}
                                onChange={(e) => {
                                    setListForm({
                                        ...listForm,
                                        name: e.target.value,
                                        slug: editingList
                                            ? listForm.slug
                                            : generateSlug(e.target.value),
                                    })
                                }}
                                placeholder="Bilim Kurgu Yol Haritası"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Slug</label>
                            <Input
                                value={listForm.slug}
                                onChange={(e) =>
                                    setListForm({ ...listForm, slug: e.target.value })
                                }
                                placeholder="bilim-kurgu"
                            />
                            <p className="text-xs text-muted-foreground">
                                URL&apos;de görünecek: /reading-lists/{listForm.slug || "..."}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Açıklama</label>
                            <Textarea
                                value={listForm.description}
                                onChange={(e) =>
                                    setListForm({ ...listForm, description: e.target.value })
                                }
                                placeholder="Liste hakkında kısa açıklama..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Varsayılan Raf Adı</label>
                            <Input
                                value={listForm.defaultShelfName}
                                onChange={(e) =>
                                    setListForm({ ...listForm, defaultShelfName: e.target.value })
                                }
                                placeholder="Örn: Bilim Kurgu Okumaları Rafı"
                            />
                            <p className="text-xs text-muted-foreground">
                                Bu listeye kitap eklendiğinde otomatik oluşturulacak raf. Boş bırakılırsa raf ataması yapılmaz.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setListDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleListSubmit} disabled={loading || !listForm.name || !listForm.slug}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingList ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Level Dialog */}
            <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLevel ? "Seviyeyi Düzenle" : "Yeni Seviye Ekle"}
                        </DialogTitle>
                        <DialogDescription>
                            Seviye bilgilerini girin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">İsim</label>
                            <Input
                                value={levelForm.name}
                                onChange={(e) =>
                                    setLevelForm({ ...levelForm, name: e.target.value })
                                }
                                placeholder="Başlangıç"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
                            <Textarea
                                value={levelForm.description}
                                onChange={(e) =>
                                    setLevelForm({ ...levelForm, description: e.target.value })
                                }
                                placeholder="Bu seviyede..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLevelDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleLevelSubmit} disabled={loading || !levelForm.name}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingLevel ? "Güncelle" : "Ekle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Book Dialog */}
            <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingBook ? "Kitabı Düzenle" : "Yeni Kitap Ekle"}
                        </DialogTitle>
                        <DialogDescription>
                            Kitap bilgilerini girin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kitap Adı</label>
                            <Input
                                value={bookForm.title}
                                onChange={(e) =>
                                    setBookForm({ ...bookForm, title: e.target.value })
                                }
                                placeholder="Dune"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Yazar</label>
                            <Input
                                value={bookForm.author}
                                onChange={(e) =>
                                    setBookForm({ ...bookForm, author: e.target.value })
                                }
                                placeholder="Frank Herbert"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sayfa Sayısı (Opsiyonel)</label>
                            <Input
                                type="number"
                                value={bookForm.pageCount}
                                onChange={(e) =>
                                    setBookForm({ ...bookForm, pageCount: e.target.value })
                                }
                                placeholder="412"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Neden Bu Kitap?</label>
                            <Textarea
                                value={bookForm.neden}
                                onChange={(e) =>
                                    setBookForm({ ...bookForm, neden: e.target.value })
                                }
                                placeholder="Bu kitap türün temel taşıdır çünkü..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBookDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleBookSubmit}
                            disabled={loading || !bookForm.title || !bookForm.author}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingBook ? "Güncelle" : "Ekle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{deleteTarget?.name}&quot; silinecek.
                            {deleteTarget?.type === "list" &&
                                " Bu işlem tüm seviyeleri ve kitapları da silecektir."}
                            {deleteTarget?.type === "level" &&
                                " Bu işlem seviyedeki tüm kitapları da silecektir."}
                            Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
