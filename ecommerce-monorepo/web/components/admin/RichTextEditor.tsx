'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon
} from 'lucide-react'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[160px] p-3.5 text-gray-800 leading-relaxed',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('Enter Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50/70 p-1.5 text-gray-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('bold') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('italic') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('strike') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('bulletList') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Bullet List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('orderedList') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors ${editor.isActive('blockquote') ? 'bg-white text-blue-600 shadow-xs font-bold' : ''}`}
          title="Quote"
        >
          <Quote size={15} />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={addImage}
          disabled={disabled}
          className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-600"
          title="Add Image URL"
        >
          <ImageIcon size={15} />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-600 disabled:opacity-40"
          title="Undo"
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-600 disabled:opacity-40"
          title="Redo"
        >
          <Redo size={15} />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  )
}
