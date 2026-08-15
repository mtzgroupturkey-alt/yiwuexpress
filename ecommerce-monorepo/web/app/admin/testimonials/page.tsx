'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Trash2, Star, MessageSquareQuote, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'

interface TestimonialTranslationRow {
  quote: string
  role: string
  company: string
}

interface Testimonial {
  id: string
  name: string
  company: string
  role: string
  quote: string
  rating: number
  avatar?: string
  image?: string
  isFeatured: boolean
  createdAt: string
  translations?: Array<{
    locale: string
    quote: string
    role: string | null
    company: string | null
  }>
}

const TESTIMONIAL_LOCALES = ['ru', 'zh']

function emptyTestimonialTranslation(): TestimonialTranslationRow {
  return { quote: '', role: '', company: '' }
}

export default function AdminTestimonialsPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editForm, setEditForm] = useState<{
    quote: string
    role: string
    company: string
    translations: Record<string, TestimonialTranslationRow>
  }>({ quote: '', role: '', company: '', translations: {} })
  const [editSaving, setEditSaving] = useState(false)

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/testimonials')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data.success) {
        setTestimonials(data.data)
      } else {
        setTestimonials(data) // depending on API response format
      }
    } catch (err) {
      setError('Failed to load testimonials')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const handleToggleFeatured = async (id: string) => {
    setActioningId(id)
    const testimonial = testimonials.find(t => t.id === id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !testimonial?.isFeatured })
      })
      if (res.ok) {
        setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isFeatured: !t.isFeatured } : t))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActioningId(null)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    const translationMap: Record<string, TestimonialTranslationRow> = {}
    for (const t of testimonial.translations ?? []) {
      translationMap[t.locale] = {
        quote: t.quote ?? '',
        role: t.role ?? '',
        company: t.company ?? '',
      }
    }
    setEditingTestimonial(testimonial)
    setEditForm({
      quote: testimonial.quote,
      role: testimonial.role,
      company: testimonial.company,
      translations: translationMap,
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTestimonial) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/testimonials/${editingTestimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: editForm.quote,
          role: editForm.role,
          company: editForm.company,
          translations: TESTIMONIAL_LOCALES
            .map((locale) => {
              const t = editForm.translations[locale]
              if (!t || !t.quote) return null
              return { locale, quote: t.quote, role: t.role, company: t.company }
            })
            .filter(Boolean),
        })
      })
      if (res.ok) {
        setEditingTestimonial(null)
        fetchTestimonials()
      } else {
        alert('Failed to update testimonial')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareQuote className="w-8 h-8 text-primary-600" />
            Testimonials Moderation
          </h1>
          <p className="text-gray-500 mt-1">Manage and feature customer testimonials</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-500 mt-4">Loading testimonials...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : testimonials.length === 0 ? (
        <Card className="text-center py-12 border border-dashed border-gray-300">
          <CardContent>
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Testimonials Found</h3>
            <p className="text-gray-500">There are no testimonials available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className={`overflow-hidden border transition-shadow hover:shadow-md ${testimonial.isFeatured ? 'border-primary-300 bg-primary-50/10' : 'border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {testimonial.avatar ? (
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">{testimonial.name}</span>
                        {testimonial.isFeatured && (
                          <Badge className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 md:text-right">
                    {testimonial.createdAt && formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{testimonial.quote}"</p>

                {testimonial.image && (
                  <div className="mb-4">
                    <Image 
                      src={testimonial.image} 
                      alt="Testimonial attachment" 
                      width={200} 
                      height={150} 
                      className="rounded-md object-cover border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => handleToggleFeatured(testimonial.id)}
                    disabled={actioningId === testimonial.id}
                    variant={testimonial.isFeatured ? "outline" : "default"}
                    className={`gap-1 text-xs font-bold ${!testimonial.isFeatured ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'text-primary-700 border-primary-200 hover:bg-primary-50'}`}
                  >
                    <Check className="w-4 h-4" />
                    {testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                   <Button
                    onClick={() => handleEdit(testimonial)}
                    variant="outline"
                    className="border-primary-200 text-primary-700 hover:bg-primary-50 font-bold gap-1 text-xs"
                  >
                    <MessageSquareQuote className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(testimonial.id)}
                    disabled={actioningId === testimonial.id}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold gap-1 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Testimonial</h2>
            <p className="text-sm text-gray-500 mb-6">{editingTestimonial.name}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quote (English)</label>
                <textarea
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editForm.quote}
                  onChange={(e) => setEditForm(prev => ({ ...prev, quote: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.company}
                    onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Translations (Russian / Chinese)</h3>
                  <AutoTranslateButton
                    enFields={{
                      quote: editForm.quote,
                      role: editForm.role,
                      company: editForm.company,
                    }}
                    onTranslated={(result) => {
                      setEditForm(prev => {
                        const translations = { ...prev.translations }
                        for (const locale of Object.keys(result)) {
                          translations[locale] = { ...emptyTestimonialTranslation(), ...translations[locale], ...result[locale] }
                        }
                        return { ...prev, translations }
                      })
                    }}
                  />
                </div>
                {TESTIMONIAL_LOCALES.map((locale) => {
                  const t = editForm.translations[locale] ?? emptyTestimonialTranslation()
                  const update = (patch: Partial<TestimonialTranslationRow>) =>
                    setEditForm(prev => ({
                      ...prev,
                      translations: { ...prev.translations, [locale]: { ...t, ...patch } }
                    }))
                  return (
                    <div key={locale} className="mb-4 space-y-2 rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase text-gray-500">{locale}</div>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Translated quote"
                        value={t.quote}
                        onChange={(e) => update({ quote: e.target.value })}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Translated role"
                          value={t.role}
                          onChange={(e) => update({ role: e.target.value })}
                        />
                        <input
                          type="text"
                          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Translated company"
                          value={t.company}
                          onChange={(e) => update({ company: e.target.value })}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
                >
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
