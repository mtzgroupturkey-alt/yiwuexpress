'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import { toast } from '@/components/ui/use-toast'
import { GripVertical, Pencil, Trash2, Plus, Eye, EyeOff, Save, Image as ImageIcon, Link2, Copy, Loader2, AlignLeft, AlignCenter, AlignRight, LayoutGrid, Layers, ExternalLink, Sparkles } from 'lucide-react'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string
  mobileImageUrl: string | null
  productImageUrl: string | null
  badgeText: string | null
  badgeColor: string | null
  ctaText: string
  ctaLink: string
  secondaryCtaText: string | null
  secondaryCtaLink: string | null
  overlayColor: string | null
  textColor: string | null
  alignment: string
  displayOrder: number
  isActive: boolean
  slideDuration: number
  motionType: string
  createdAt: string
  updatedAt: string
  translations?: Array<{
    locale: string
    title: string
    subtitle: string | null
    description: string | null
    badgeText: string | null
    ctaText: string
    secondaryCtaText: string | null
  }>
}

interface TranslationRow {
  title: string
  subtitle: string
  description: string
  badgeText: string
  ctaText: string
  secondaryCtaText: string
}

const TRANSLATABLE_LOCALES = ['en', 'ru', 'zh']

function emptyTranslation(): TranslationRow {
  return {
    title: '',
    subtitle: '',
    description: '',
    badgeText: '',
    ctaText: '',
    secondaryCtaText: ''
  }
}

// Build the `translations` payload. Always include the legacy (English) values
// as the `en` row so the fallback chain stays intact, then layer any extra
// locales the admin filled in.
function buildHeroTranslationsPayload(
  base: TranslationRow,
  legacy: { title: string; subtitle: string; description: string; badgeText: string; ctaText: string; secondaryCtaText: string },
  overrides: Record<string, TranslationRow>
): Array<TranslationRow & { locale: string }> {
  const rows: Array<TranslationRow & { locale: string }> = []
  const seen = new Set<string>()

  // en is derived from the legacy content fields
  rows.push({ locale: 'en', ...legacy })
  seen.add('en')

  for (const locale of TRANSLATABLE_LOCALES) {
    if (locale === 'en' || seen.has(locale)) continue
    const o = overrides[locale]
    if (!o) continue
    const hasContent = o.title || o.subtitle || o.description || o.badgeText || o.ctaText || o.secondaryCtaText
    if (!hasContent) continue
    rows.push({ locale, ...o })
    seen.add(locale)
  }

  return rows
}

interface SortableSlideItemProps {
  slide: HeroSlide
  onEdit: (slide: HeroSlide) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  isFirst: boolean
  isLast: boolean
  isDuplicating?: boolean
}

function SortableSlideItem({ slide, onEdit, onDelete, onDuplicate, onToggleActive, isFirst, isLast, isDuplicating = false }: SortableSlideItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        isDragging ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 bg-white'
      } ${isDuplicating ? 'opacity-50' : ''}`}>
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab hover:text-[#1a3a5c]">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Slide Preview */}
        <div className="w-24 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0 relative">
          {slide.imageUrl ? (
            <Image 
              src={slide.imageUrl} 
              alt={slide.title} 
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Slide Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold ${slide.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
              {slide.title}
            </span>
            {!slide.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
            {slide.motionType === 'side_top' ? (
              <Badge className="text-xs bg-emerald-600 text-white font-medium hover:bg-emerald-700">
                Right Side: Top Card
              </Badge>
            ) : slide.motionType === 'side_bottom' ? (
              <Badge className="text-xs bg-blue-600 text-white font-medium hover:bg-blue-700">
                Right Side: Bottom Card
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-slate-600 border-slate-300">
                Main Slider
              </Badge>
            )}
            {slide.badgeText && (
              <Badge className="text-xs font-bold text-slate-950" style={{ backgroundColor: slide.badgeColor || '#F5A602' }}>
                {slide.badgeText}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate max-w-md mt-0.5">
            {slide.subtitle || slide.description || 'No description'}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
            <span>Order: {slide.displayOrder + 1}</span>
            <span>Duration: {slide.slideDuration}s</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Link2 className="w-3 h-3" />
              {slide.ctaText} &rarr; <span className="font-mono text-[11px] text-blue-600">{slide.ctaLink}</span>
            </span>
            <span className="flex items-center gap-1">
              {slide.alignment === 'left' && <AlignLeft className="w-3 h-3" />}
              {slide.alignment === 'center' && <AlignCenter className="w-3 h-3" />}
              {slide.alignment === 'right' && <AlignRight className="w-3 h-3" />}
              {slide.alignment || 'left'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleActive(slide.id, !slide.isActive)}
            className={`p-1.5 rounded hover:bg-gray-100 transition ${
              slide.isActive ? 'text-green-500' : 'text-gray-400'
            }`}
            title={slide.isActive ? 'Deactivate slide' : 'Activate slide'}
          >
            {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(slide)}
            className="p-1.5 rounded hover:bg-gray-100 transition text-gray-500 hover:text-[#1a3a5c]"
            title="Edit slide"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(slide.id)}
            disabled={isDuplicating}
            className="p-1.5 rounded hover:bg-gray-100 transition text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate slide"
          >
            {isDuplicating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(slide.id)}
            className="p-1.5 rounded hover:bg-red-50 transition text-gray-500 hover:text-red-500"
            title="Delete slide"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HeroSliderSettingsPage() {
  const { dict, locale } = useAdminLocale()
  const queryClient = useQueryClient()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [defaultPlacement, setDefaultPlacement] = useState<string>('slide')
  const [filterType, setFilterType] = useState<'all' | 'main' | 'side'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Fetch slides with credentials
  const { data: slidesData, isLoading } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch('/api/admin/settings/hero-slider', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  useEffect(() => {
    if (slidesData?.data) {
      setSlides(slidesData.data)
    }
  }, [slidesData])

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: { slides: { id: string; displayOrder: number }[] }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch('/api/admin/settings/hero-slider/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
      toast({ title: 'Slide order updated successfully' })
      setIsSaving(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(`/api/admin/settings/hero-slider/${id}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to delete')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
      toast({ title: 'Slide deleted' })
    },
  })

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(`/api/admin/settings/hero-slider/${id}/duplicate`, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to duplicate')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
      toast({ 
        title: 'Slide duplicated successfully',
        description: 'The new slide has been created. Edit it to make changes.'
      })
      setDuplicatingId(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to duplicate slide',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
      setDuplicatingId(null)
    },
  })

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = slides.findIndex((s) => s.id === active.id)
    const newIndex = slides.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newSlides = [...slides]
    const [movedItem] = newSlides.splice(oldIndex, 1)
    newSlides.splice(newIndex, 0, movedItem)

    const updatedSlides = newSlides.map((item, index) => ({
      ...item,
      displayOrder: index,
    }))

    setSlides(updatedSlides)
  }, [slides])

  const handleSaveOrder = () => {
    setIsSaving(true)
    const orderData = slides.map((slide, index) => ({
      id: slide.id,
      displayOrder: index,
    }))
    updateOrderMutation.mutate({ slides: orderData })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    const slide = slides.find((s) => s.id === id)
    if (!slide) return

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(`/api/admin/settings/hero-slider/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ ...slide, isActive: active }),
      })

      if (!response.ok) throw new Error('Failed to update')

      const updatedSlides = slides.map((s) =>
        s.id === id ? { ...s, isActive: active } : s
      )
      setSlides(updatedSlides)
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
    } catch (error) {
      alert('Failed to toggle slide status')
    }
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setDefaultPlacement(slide.motionType || 'slide')
    setIsDialogOpen(true)
  }

  const handleAdd = (placement: string = 'slide') => {
    setEditingSlide(null)
    setDefaultPlacement(placement)
    setIsDialogOpen(true)
  }

  const handleDuplicate = (id: string) => {
    const slide = slides.find((s) => s.id === id)
    if (!slide) return

    if (confirm(`Duplicate "${slide.title}"?`)) {
      setDuplicatingId(id)
      duplicateMutation.mutate(id)
    }
  }

  // Filtered slides
  const displayedSlides = slides.filter((slide) => {
    if (filterType === 'main') return slide.motionType !== 'side_top' && slide.motionType !== 'side_bottom'
    if (filterType === 'side') return slide.motionType === 'side_top' || slide.motionType === 'side_bottom'
    return true
  })

  // Summary counts
  const mainSlides = slides.filter((s) => s.motionType !== 'side_top' && s.motionType !== 'side_bottom')
  const sideTopSlide = slides.find((s) => s.motionType === 'side_top')
  const sideBottomSlide = slides.find((s) => s.motionType === 'side_bottom')

  return (
    <Container maxWidth="2xl" className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">{dict.settings.heroSlider}</h1>
          <p className="text-gray-500">Manage rotating hero slider and right-side promotional cards</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => handleAdd('slide')} className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Slide
          </Button>
          <Button onClick={() => handleAdd('side_top')} variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
            <Plus className="w-4 h-4 mr-1.5" />
            Top Card
          </Button>
          <Button onClick={() => handleAdd('side_bottom')} variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50">
            <Plus className="w-4 h-4 mr-1.5" />
            Bottom Card
          </Button>
          <Button onClick={handleSaveOrder} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? dict.common.loading : dict.common.save}
          </Button>
        </div>
      </div>

      {/* Storefront Hero Layout Visual Architecture */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            Storefront Hero Banner Layout Structure
          </span>
          <span className="text-[11px] text-slate-400">Synchronized with Design-3 Storefront</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Hero Slider preview box */}
          <div className="md:col-span-8 p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Main Hero Slider (8 Columns)
              </span>
              <Badge variant="outline" className="text-slate-300 border-slate-600 text-[10px]">
                {mainSlides.filter(s => s.isActive).length} active / {mainSlides.length} total
              </Badge>
            </div>
            <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-medium">
              {mainSlides[0]?.title || 'Rise Ceramic Nonstick Bakeware'}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
              <span>Auto-rotates with crossfade animation</span>
              <button
                type="button"
                onClick={() => handleAdd('slide')}
                className="text-amber-400 hover:underline font-semibold"
              >
                + Add Slide
              </button>
            </div>
          </div>

          {/* Right Column preview boxes */}
          <div className="md:col-span-4 flex flex-col gap-2.5">
            {/* Top Card */}
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase">Top Feature Card</span>
                <span className="text-[10px] text-emerald-300">
                  {sideTopSlide?.isActive ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-1 mt-0.5 font-medium">
                {sideTopSlide?.title || 'Kitchenware & Table Sets'}
              </p>
            </div>

            {/* Bottom Card */}
            <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 uppercase">Bottom Feature Card</span>
                <span className="text-[10px] text-blue-300">
                  {sideBottomSlide?.isActive ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-1 mt-0.5 font-medium">
                {sideBottomSlide?.title || 'Robotic Vacuums & Air Purifiers'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Elements ({slides.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('main')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'main'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Main Slider ({mainSlides.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('side')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'side'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Right Side Cards ({slides.length - mainSlides.length})
        </button>
      </div>

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Elements</CardTitle>
          <CardDescription>Drag and drop to reorder elements. Use the eye icon to show/hide elements on storefront.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedSlides.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading slides...</div>
                ) : displayedSlides.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No elements found</p>
                    <p className="text-sm">Add your first slide or banner</p>
                    <Button onClick={() => handleAdd('slide')} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Element
                    </Button>
                  </div>
                ) : (
                  displayedSlides.map((slide, index) => (
                    <SortableSlideItem
                      key={slide.id}
                      slide={slide}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onToggleActive={handleToggleActive}
                      isFirst={index === 0}
                      isLast={index === displayedSlides.length - 1}
                      isDuplicating={duplicatingId === slide.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {slides.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Total elements: {slides.length} • Active: {slides.filter(s => s.isActive).length} • Main Slider: {mainSlides.length} • Side Cards: {slides.length - mainSlides.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <SlideFormDialog
        open={isDialogOpen}
        initialData={editingSlide}
        defaultMotionType={defaultPlacement}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingSlide(null)
        }}
        onSuccess={() => {
          setIsDialogOpen(false)
          setEditingSlide(null)
          queryClient.invalidateQueries({ queryKey: ['hero-slides'] })
        }}
      />
    </Container>
  )
}

// Slide Form Dialog Component
interface SlideFormDialogProps {
  open: boolean
  initialData: HeroSlide | null
  defaultMotionType?: string
  onClose: () => void
  onSuccess: () => void
}

function SlideFormDialog({ open, initialData, defaultMotionType = 'slide', onClose, onSuccess }: SlideFormDialogProps) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mobileImageUrl, setMobileImageUrl] = useState('')
  const [productImageUrl, setProductImageUrl] = useState('')
  const [badgeText, setBadgeText] = useState('')
  const [badgeColor, setBadgeColor] = useState('#F5A602')
  const [ctaText, setCtaText] = useState('SHOP NOW')
  const [ctaLink, setCtaLink] = useState('/store')
  const [secondaryCtaText, setSecondaryCtaText] = useState('')
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('')
  const [overlayColor, setOverlayColor] = useState('linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.25) 100%)')
  const [textColor, setTextColor] = useState('#ffffff')
  const [alignment, setAlignment] = useState('left')
  const [slideDuration, setSlideDuration] = useState(5)
  const [motionType, setMotionType] = useState('slide')
  const [isActive, setIsActive] = useState(true)
  const [translations, setTranslations] = useState<Record<string, TranslationRow>>({})

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setSubtitle(initialData.subtitle || '')
      setDescription(initialData.description || '')
      setImageUrl(initialData.imageUrl)
      setMobileImageUrl(initialData.mobileImageUrl || '')
      setProductImageUrl(initialData.productImageUrl || '')
      setBadgeText(initialData.badgeText || '')
      setBadgeColor(initialData.badgeColor || '#F5A602')
      setCtaText(initialData.ctaText)
      setCtaLink(initialData.ctaLink)
      setSecondaryCtaText(initialData.secondaryCtaText || '')
      setSecondaryCtaLink(initialData.secondaryCtaLink || '')
      setOverlayColor(initialData.overlayColor || 'linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.25) 100%)')
      setTextColor(initialData.textColor || '#ffffff')
      setAlignment(initialData.alignment || 'left')
      setSlideDuration(initialData.slideDuration)
      setMotionType(initialData.motionType || 'slide')
      setIsActive(initialData.isActive)
      const initialTranslations: Record<string, TranslationRow> = {}
      for (const t of initialData.translations ?? []) {
        initialTranslations[t.locale] = {
          title: t.title ?? '',
          subtitle: t.subtitle ?? '',
          description: t.description ?? '',
          badgeText: t.badgeText ?? '',
          ctaText: t.ctaText ?? '',
          secondaryCtaText: t.secondaryCtaText ?? '',
        }
      }
      setTranslations(initialTranslations)
    } else {
      // Reset form
      setTitle('')
      setSubtitle('')
      setDescription('')
      setImageUrl('')
      setMobileImageUrl('')
      setProductImageUrl('')
      setBadgeText('')
      setBadgeColor('#F5A602')
      setCtaText('SHOP NOW')
      setCtaLink('/store')
      setSecondaryCtaText('')
      setSecondaryCtaLink('')
      setOverlayColor('linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.25) 100%)')
      setTextColor('#ffffff')
      setAlignment('left')
      setSlideDuration(5)
      setMotionType(defaultMotionType || 'slide')
      setIsActive(true)
      setTranslations({})
    }
  }, [initialData, open, defaultMotionType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !imageUrl || !ctaText || !ctaLink) {
      alert('Please fill in all required fields')
      return
    }

    const data = {
      title,
      subtitle: subtitle || null,
      description: description || null,
      imageUrl,
      mobileImageUrl: mobileImageUrl || null,
      productImageUrl: productImageUrl || null,
      badgeText: badgeText || null,
      badgeColor: badgeColor || null,
      ctaText,
      ctaLink,
      secondaryCtaText: secondaryCtaText || null,
      secondaryCtaLink: secondaryCtaLink || null,
      overlayColor: overlayColor || null,
      textColor: textColor || null,
      alignment: alignment || 'left',
      slideDuration,
      motionType,
      isActive,
      translations: buildHeroTranslationsPayload(
        emptyTranslation(),
        {
          title,
          subtitle,
          description,
          badgeText,
          ctaText,
          secondaryCtaText,
        },
        translations
      ),
    }

    try {
      const url = initialData
        ? `/api/admin/settings/hero-slider/${initialData.id}`
        : '/api/admin/settings/hero-slider'
      const method = initialData ? 'PUT' : 'POST'

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({ title: initialData ? 'Slide updated' : 'Slide created' })
      onSuccess()
    } catch (error) {
      alert('Failed to save slide')
    }
  }

  const { dict } = useAdminLocale()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? dict.settings.editSlide : dict.settings.addSlide}</DialogTitle>
          <DialogDescription>
            Configure the slide content, images, and call-to-action buttons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">{dict.products.basicInfo}</TabsTrigger>
              <TabsTrigger value="media">{dict.products.mediaGallery}</TabsTrigger>
              <TabsTrigger value="layout">{dict.settings.textButtonAlignment}</TabsTrigger>
              <TabsTrigger value="settings">{dict.settings.general}</TabsTrigger>
              <TabsTrigger value="translations">{dict.products.translations}</TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4">
              {/* Banner Placement Selector */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">Banner Placement Slot *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select where this banner appears in the storefront Hero section:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMotionType('slide')}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      motionType !== 'side_top' && motionType !== 'side_bottom'
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/5 ring-2 ring-[#1a3a5c]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Main Hero Slider
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Left rotating slider (8 cols, primary)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMotionType('side_top')}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      motionType === 'side_top'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Right Side: Top Card
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Upper promo card (Kitchen / Home)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMotionType('side_bottom')}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      motionType === 'side_bottom'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-blue-800 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      Right Side: Bottom Card
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Lower promo card (Smart Living)</p>
                  </button>
                </div>
              </div>

              <div>
                <Label>{dict.settings.slideTitle} *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rise Ceramic Nonstick Bakeware"
                  required
                />
              </div>
              <div>
                <Label>{dict.settings.slideSubtitle}</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., Weeknight wins start with"
                />
              </div>
              <div>
                <Label>{dict.settings.slideDescription}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="From bubbling enchiladas to golden bakes..."
                  rows={3}
                />
              </div>
              <div>
                <Label>{dict.settings.badgeText}</Label>
                <Input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g., NEW, SALE, BEST SELLER"
                />
              </div>
              <div>
                <Label>{dict.settings.badgeColor}</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    type="text"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    placeholder="#F5A602"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
                  {[
                    { label: 'Amber', color: '#F5A602' },
                    { label: 'Gold', color: '#c9a84c' },
                    { label: 'Emerald', color: '#059669' },
                    { label: 'Blue', color: '#2563eb' },
                    { label: 'Red', color: '#dc2626' },
                    { label: 'Purple', color: '#7c3aed' },
                    { label: 'Dark Slate', color: '#0f172a' },
                  ].map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setBadgeColor(p.color)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-gray-200 hover:border-gray-400 bg-white"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-[11px] text-gray-700">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="space-y-4">
              <div>
                <Label>{dict.settings.backgroundImage} *</Label>
                <div className="mt-2">
                  <ImageUpload value={imageUrl} onChange={setImageUrl} folder="hero" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: 1920x800px, max 2MB</p>
              </div>

              <div>
                <Label>Studio Contrast Overlay Gradient</Label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Protects readability of headlines over bright photos:
                </p>
                <Input
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  placeholder="linear-gradient(...) or rgba(...)"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Studio Navy (Recommended)', value: 'linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.25) 100%)' },
                    { label: 'Charcoal Luxury', value: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.70) 50%, rgba(15, 23, 42, 0.20) 100%)' },
                    { label: 'Espresso Dark', value: 'linear-gradient(90deg, rgba(24, 18, 12, 0.94) 0%, rgba(45, 30, 20, 0.75) 48%, rgba(20, 15, 10, 0.25) 100%)' },
                    { label: 'Emerald Glow', value: 'linear-gradient(90deg, rgba(2, 44, 34, 0.94) 0%, rgba(6, 78, 59, 0.75) 48%, rgba(4, 47, 46, 0.20) 100%)' },
                    { label: 'Royal Indigo', value: 'linear-gradient(90deg, rgba(15, 23, 80, 0.94) 0%, rgba(30, 27, 75, 0.75) 48%, rgba(30, 27, 75, 0.20) 100%)' },
                    { label: 'Classic Tint', value: 'rgba(26,58,92,0.6)' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setOverlayColor(preset.value)}
                      className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                        overlayColor === preset.value
                          ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white font-semibold'
                          : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{dict.settings.productImage}</Label>
                <div className="mt-2">
                  <ImageUpload value={productImageUrl} onChange={setProductImageUrl} folder="hero/products" />
                </div>
              </div>
            </TabsContent>

            {/* LAYOUT TAB - NEW ALIGNMENT OPTIONS */}
            <TabsContent value="layout" className="space-y-4">
              <div>
                <Label>Text & Button Alignment</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose how the text and buttons should be aligned on this slide
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Left Alignment */}
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg text-center transition ${
                      alignment === 'left'
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAlignment('left')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlignLeft className={`w-6 h-6 ${
                        alignment === 'left' ? 'text-[#1a3a5c]' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        alignment === 'left' ? 'text-[#1a3a5c]' : 'text-gray-600'
                      }`}>
                        Left
                      </span>
                      <div className="flex flex-col items-start w-full gap-1 p-2 bg-gray-100 rounded">
                        <div className="w-3/4 h-2 bg-gray-400 rounded" />
                        <div className="w-1/2 h-2 bg-gray-400 rounded" />
                        <div className="flex gap-2 mt-1">
                          <div className="w-12 h-2 bg-[#c9a84c] rounded" />
                          <div className="w-10 h-2 bg-gray-400 rounded" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Center Alignment */}
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg text-center transition ${
                      alignment === 'center'
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAlignment('center')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlignCenter className={`w-6 h-6 ${
                        alignment === 'center' ? 'text-[#1a3a5c]' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        alignment === 'center' ? 'text-[#1a3a5c]' : 'text-gray-600'
                      }`}>
                        Center
                      </span>
                      <div className="flex flex-col items-center w-full gap-1 p-2 bg-gray-100 rounded">
                        <div className="w-3/4 h-2 bg-gray-400 rounded" />
                        <div className="w-1/2 h-2 bg-gray-400 rounded" />
                        <div className="flex gap-2 mt-1">
                          <div className="w-12 h-2 bg-[#c9a84c] rounded" />
                          <div className="w-10 h-2 bg-gray-400 rounded" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Right Alignment */}
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg text-center transition ${
                      alignment === 'right'
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAlignment('right')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlignRight className={`w-6 h-6 ${
                        alignment === 'right' ? 'text-[#1a3a5c]' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        alignment === 'right' ? 'text-[#1a3a5c]' : 'text-gray-600'
                      }`}>
                        Right
                      </span>
                      <div className="flex flex-col items-end w-full gap-1 p-2 bg-gray-100 rounded">
                        <div className="w-3/4 h-2 bg-gray-400 rounded" />
                        <div className="w-1/2 h-2 bg-gray-400 rounded" />
                        <div className="flex gap-2 mt-1">
                          <div className="w-12 h-2 bg-[#c9a84c] rounded" />
                          <div className="w-10 h-2 bg-gray-400 rounded" />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Preview of selected alignment */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <div className={`flex flex-col gap-2 ${
                    alignment === 'left' ? 'items-start text-left' :
                    alignment === 'center' ? 'items-center text-center' :
                    'items-end text-right'
                  }`}>
                    <div className="text-sm font-bold text-[#1a3a5c]">Sample Title</div>
                    <div className="text-sm text-gray-500">Sample description text</div>
                    <div className="flex gap-2">
                      <div className="px-4 py-1 text-xs text-white bg-[#c9a84c] rounded">Button</div>
                      <div className="px-4 py-1 text-xs text-gray-500 border rounded">Secondary</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label>{dict.settings.primaryCtaText}</Label>
                <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="SHOP NOW" />
              </div>
              <div>
                <Label>{dict.settings.primaryCtaLink}</Label>
                <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/store" />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[11px] text-gray-400 self-center">Shortcuts:</span>
                  {[
                    { label: 'Store Catalog', url: '/store' },
                    { label: 'Flash Deals', url: '/#flash-deals-section' },
                    { label: 'Kitchenware', url: '/store?department=kitchen' },
                    { label: 'Electronics', url: '/store?department=electronics' },
                    { label: 'All Products', url: '/store' },
                  ].map((s) => (
                    <button
                      key={s.url}
                      type="button"
                      onClick={() => setCtaLink(s.url)}
                      className="px-2 py-0.5 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{dict.settings.secondaryCtaText} ({dict.common.viewDetails})</Label>
                <Input
                  value={secondaryCtaText}
                  onChange={(e) => setSecondaryCtaText(e.target.value)}
                  placeholder="e.g., View Flash Drops"
                />
              </div>
              <div>
                <Label>{dict.settings.secondaryCtaLink} ({dict.common.viewDetails})</Label>
                <Input
                  value={secondaryCtaLink}
                  onChange={(e) => setSecondaryCtaLink(e.target.value)}
                  placeholder="/#flash-deals-section"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[11px] text-gray-400 self-center">Shortcuts:</span>
                  {[
                    { label: 'Flash Drops', url: '/#flash-deals-section' },
                    { label: 'Store Catalog', url: '/store' },
                    { label: 'About Us', url: '/about' },
                  ].map((s) => (
                    <button
                      key={s.url}
                      type="button"
                      onClick={() => setSecondaryCtaLink(s.url)}
                      className="px-2 py-0.5 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{dict.settings.slideDuration}</Label>
                <Input
                  type="number"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(Number(e.target.value))}
                  min={2}
                  max={15}
                />
                <p className="text-xs text-gray-500 mt-1">How long this slide should display before auto-advancing (seconds)</p>
              </div>
              <div>
                <Label>Placement / Transition Mode</Label>
                <select
                  value={motionType}
                  onChange={(e) => setMotionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="slide">Main Slider - Horizontal Slide</option>
                  <option value="fade">Main Slider - Fade</option>
                  <option value="zoom">Main Slider - Zoom</option>
                  <option value="flip">Main Slider - Flip (3D)</option>
                  <option value="side_top">Right Column - Top Promotional Card</option>
                  <option value="side_bottom">Right Column - Bottom Promotional Card</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose slot and animation style</p>
              </div>
              <div className="flex items-center justify-between">
                <Label>{dict.common.active}</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </TabsContent>

            {/* TRANSLATIONS TAB */}
            <TabsContent value="translations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  The default language is English (synced from the Content & Settings tabs). Add
                  Russian and Chinese translations below. Leave a field blank to fall back to English.
                </div>
                <AutoTranslateButton
                  allFields={{
                    en: {
                      title: title,
                      subtitle: subtitle,
                      description: description,
                      badgeText: badgeText,
                      ctaText: ctaText,
                      secondaryCtaText: secondaryCtaText,
                    },
                    ru: {
                      title: translations.ru?.title || '',
                      subtitle: translations.ru?.subtitle || '',
                      description: translations.ru?.description || '',
                      badgeText: translations.ru?.badgeText || '',
                      ctaText: translations.ru?.ctaText || '',
                      secondaryCtaText: translations.ru?.secondaryCtaText || '',
                    },
                    zh: {
                      title: translations.zh?.title || '',
                      subtitle: translations.zh?.subtitle || '',
                      description: translations.zh?.description || '',
                      badgeText: translations.zh?.badgeText || '',
                      ctaText: translations.zh?.ctaText || '',
                      secondaryCtaText: translations.zh?.secondaryCtaText || '',
                    },
                  }}
                  onTranslated={(result) => {
                    if (result.en) {
                      if (result.en.title) setTitle(result.en.title)
                      if (result.en.subtitle) setSubtitle(result.en.subtitle)
                      if (result.en.description) setDescription(result.en.description)
                      if (result.en.badgeText) setBadgeText(result.en.badgeText)
                      if (result.en.ctaText) setCtaText(result.en.ctaText)
                      if (result.en.secondaryCtaText) setSecondaryCtaText(result.en.secondaryCtaText)
                    }
                    setTranslations((prev) => {
                      const next = { ...prev }
                      for (const locale of Object.keys(result)) {
                        if (locale === 'ru' || locale === 'zh') {
                          next[locale] = { ...emptyTranslation(), ...next[locale], ...result[locale] }
                        }
                      }
                      return next
                    })
                  }}
                />
              </div>
              {TRANSLATABLE_LOCALES.filter((l) => l !== 'en').map((locale) => {
                const row = translations[locale] ?? emptyTranslation()
                const update = (patch: Partial<TranslationRow>) =>
                  setTranslations((prev) => ({ ...prev, [locale]: { ...row, ...patch } }))
                return (
                  <Card key={locale}>
                    <CardHeader>
                      <CardTitle className="text-base uppercase">{locale}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={row.title}
                          onChange={(e) => update({ title: e.target.value })}
                          placeholder={title || 'Translation for title'}
                        />
                      </div>
                      <div>
                        <Label>Subtitle</Label>
                        <Input
                          value={row.subtitle}
                          onChange={(e) => update({ subtitle: e.target.value })}
                          placeholder={subtitle || 'Translation for subtitle'}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={row.description}
                          onChange={(e) => update({ description: e.target.value })}
                          placeholder={description || 'Translation for description'}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Badge Text</Label>
                        <Input
                          value={row.badgeText}
                          onChange={(e) => update({ badgeText: e.target.value })}
                          placeholder={badgeText || 'Translation for badge text'}
                        />
                      </div>
                      <div>
                        <Label>Primary CTA Text</Label>
                        <Input
                          value={row.ctaText}
                          onChange={(e) => update({ ctaText: e.target.value })}
                          placeholder={ctaText || 'Translation for CTA text'}
                        />
                      </div>
                      <div>
                        <Label>Secondary CTA Text</Label>
                        <Input
                          value={row.secondaryCtaText}
                          onChange={(e) => update({ secondaryCtaText: e.target.value })}
                          placeholder={secondaryCtaText || 'Translation for secondary CTA'}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          </Tabs>

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-950 rounded-xl text-white relative overflow-hidden border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Storefront Preview
              </span>
              <Badge className="text-[10px] uppercase font-bold" variant="outline">
                {motionType === 'side_top' ? 'Right Side Top Card' : motionType === 'side_bottom' ? 'Right Side Bottom Card' : 'Main Hero Slide'}
              </Badge>
            </div>

            <div 
              className="relative rounded-lg overflow-hidden min-h-[140px] p-4 flex flex-col justify-between"
              style={{
                background: overlayColor && overlayColor.includes('gradient')
                  ? overlayColor
                  : (overlayColor || 'linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(15, 23, 42, 0.25) 100%)')
              }}
            >
              {imageUrl && (
                <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-40" />
              )}
              <div>
                {badgeText && (
                  <span
                    className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-slate-950 mb-2 shadow-sm"
                    style={{ backgroundColor: badgeColor || '#F5A602' }}
                  >
                    {badgeText}
                  </span>
                )}
                <h4 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow">
                  {title || 'Headline / Title'}
                </h4>
                {subtitle && (
                  <div className="text-xs text-amber-300 font-bold mt-0.5 drop-shadow">
                    {subtitle}
                  </div>
                )}
                {description && (
                  <p className="text-xs text-slate-200 line-clamp-2 mt-1 drop-shadow-sm">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-[#F5A602] text-slate-950 font-black text-xs rounded shadow">
                  {ctaText || 'SHOP NOW'}
                </span>
                {secondaryCtaText && (
                  <span className="px-3 py-1 bg-white/20 text-white font-semibold text-xs rounded border border-white/30 backdrop-blur-sm">
                    {secondaryCtaText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
              {dict.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
