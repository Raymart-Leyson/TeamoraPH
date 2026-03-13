"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RichTextEditorProps {
    name: string;
    defaultValue?: string;
    disabled?: boolean;
    placeholder?: string;
    minHeight?: string;
}

function ToolbarButton({
    onClick,
    active,
    disabled,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            className={cn(
                "p-1.5 rounded text-sm transition-colors",
                active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    name,
    defaultValue = "",
    disabled = false,
    placeholder = "Write here...",
    minHeight = "200px",
}: RichTextEditorProps) {
    const [html, setHtml] = useState(defaultValue);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content: defaultValue,
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            setHtml(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "outline-none prose prose-sm max-w-none",
                    "[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5",
                    "[&>p]:my-1 [&>h1]:text-2xl [&>h2]:text-xl",
                    "text-foreground"
                ),
                style: `min-height: ${minHeight}; padding: 12px;`,
                "data-placeholder": placeholder,
            },
        },
    });

    return (
        <div className={cn("border rounded-md overflow-hidden", disabled && "opacity-60")}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b px-2 py-1.5 bg-muted/30">
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    active={editor?.isActive("bold")}
                    disabled={disabled}
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    active={editor?.isActive("italic")}
                    disabled={disabled}
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    active={editor?.isActive("bulletList")}
                    disabled={disabled}
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    active={editor?.isActive("orderedList")}
                    disabled={disabled}
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                    active={editor?.isActive({ textAlign: "left" })}
                    disabled={disabled}
                >
                    <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                    active={editor?.isActive({ textAlign: "center" })}
                    disabled={disabled}
                >
                    <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                    active={editor?.isActive({ textAlign: "right" })}
                    disabled={disabled}
                >
                    <AlignRight className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />

            {/* Hidden input to submit HTML value with the form */}
            <input type="hidden" name={name} value={html} />
        </div>
    );
}
