"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Button } from "@/components/ui/button"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Link as LinkIcon,
    CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface TortuEditorProps {
    initialContent?: string
    onChange: (content: string) => void
}

export default function TortuEditor({ initialContent, onChange }: TortuEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    HTMLAttributes: { class: "list-disc list-outside ml-4" },
                },
                orderedList: {
                    HTMLAttributes: { class: "list-decimal list-outside ml-4" },
                },
                blockquote: {
                    HTMLAttributes: { class: "border-l-4 border-primary/50 pl-4 italic text-muted-foreground" },
                },
                codeBlock: {
                    HTMLAttributes: { class: "bg-muted rounded-md p-4 font-mono text-sm" },
                },
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: "Tortu yazmaya başla... (Kitaptan aklında kalanlar, düşünceler, notlar)",
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-primary underline cursor-pointer" },
            }),
            Underline,
            TaskList.configure({
                HTMLAttributes: { class: "not-prose" },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: { class: "flex items-start gap-2" },
            }),
        ],
        content: initialContent || "",
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    "min-h-[350px] p-4 focus:outline-none",
                    "prose-headings:font-bold prose-headings:tracking-tight",
                    "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Update content when initialContent changes
    useEffect(() => {
        if (editor && initialContent && editor.getHTML() !== initialContent) {
            editor.commands.setContent(initialContent)
        }
    }, [editor, initialContent])

    if (!editor) {
        return <div className="h-[400px] w-full animate-pulse rounded-lg border bg-muted" />
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        children,
        title,
    }: {
        onClick: () => void
        isActive?: boolean
        children: React.ReactNode
        title: string
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn("h-8 w-8 p-0", isActive && "bg-muted text-primary")}
            title={title}
        >
            {children}
        </Button>
    )

    return (
        <div className="rounded-lg border bg-background">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b p-2">
                {/* Text Style */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Kalın"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="İtalik"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Altı Çizili"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Üstü Çizili"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    title="Kod"
                >
                    <Code className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-6 w-px bg-border" />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Başlık 1"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Başlık 2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Başlık 3"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-6 w-px bg-border" />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Madde Listesi"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Numaralı Liste"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    isActive={editor.isActive("taskList")}
                    title="Yapılacaklar"
                >
                    <CheckSquare className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-6 w-px bg-border" />

                {/* Quote */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Alıntı"
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>

                <div className="mx-1 h-6 w-px bg-border" />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Geri Al"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Yinele"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Bubble Menu (appears when text is selected) */}
            <BubbleMenu
                editor={editor}
                className="flex overflow-hidden rounded-md border bg-background shadow-lg"
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn("h-8 rounded-none", editor.isActive("bold") && "bg-muted")}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn("h-8 rounded-none", editor.isActive("italic") && "bg-muted")}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn("h-8 rounded-none", editor.isActive("underline") && "bg-muted")}
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn("h-8 rounded-none", editor.isActive("strike") && "bg-muted")}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>
            </BubbleMenu>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    )
}
