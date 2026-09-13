'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Plus, RefreshCw, ChevronRight, Edit, Eye, CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import Link from 'next/link'

interface CmsPageItem {
  id: string
  slug: string
  title: string
  content: string
  metaTitle: string | null
  isPublished: boolean
  updatedAt: string
}

export default function ContentPagesPage() {
  const { dict, locale } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<CmsPageItem[]>([])
  const [editingPage, setEditingPage] = useState<CmsPageItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content/pages')
      const json = await res.json()
      if (json.success && json.data) {
        setPages(json.data)
      }
    } catch (err) {
      console.error('Failed to load CMS pages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPage) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage),
      })
      const json = await res.json()
      if (json.success) {
        setEditingPage(null)
        fetchPages()
      } else {
        alert(json.error || 'Failed to save page')
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            CMS Content & Page Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage static policy pages, shipping guides, and B2B terms using the Rich Text WYSIWYG editor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPages} disabled={loading} className="rounded-xl gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setEditingPage({ id: '', slug: '', title: '', content: '<p>Write your content here...</p>', metaTitle: '', isPublished: true, updatedAt: '' })}
            className="rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={14} />
            Create Page
          </Button>
        </div>
      </div>

      {/* Pages Table */}
      <Card className="rounded-2xl border-gray-200/80 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {pages.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No CMS pages created yet.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Slug Route</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-gray-900">{p.title}</td>
                    <td className="py-3 px-4 font-mono text-blue-600">/{p.slug}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingPage(p)} className="rounded-xl text-[11px] h-7 px-2.5 text-blue-600">
                        <Edit size={12} className="mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* WYSIWYG Editor Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900">
              {editingPage.id ? 'Edit Page Content' : 'Create New CMS Page'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Page Title</label>
                  <input
                    type="text"
                    required
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Body Content (WYSIWYG)</label>
                <RichTextEditor
                  value={editingPage.content}
                  onChange={(val) => setEditingPage({ ...editingPage, content: val })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingPage(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? 'Saving...' : 'Save Page'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
