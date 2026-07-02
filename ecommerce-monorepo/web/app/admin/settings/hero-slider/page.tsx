'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from '@/components/ui/use-toast'
import { GripVertical, Pencil, Trash2, Plus, Eye, EyeOff, Save, Image as ImageIcon, Link2, Copy, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

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
        <div className="w-24 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Slide Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${slide.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
              {slide.title}
            </span>
            {!slide.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
            {slide.badgeText && (
              <Badge className="text-xs" style={{ backgroundColor: slide.badgeColor || '#c9a84c' }}>
                {slide.badgeText}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate max-w-md">
            {slide.subtitle || slide.description || 'No description'}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            <span>Order: {slide.displayOrder + 1}</span>
            <span>Duration: {slide.slideDuration}s</span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {slide.ctaText}
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

export default function HeroSliderSettings() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Fetch slides
  const { data: slidesData, isLoading } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch('/api/admin/settings/hero-slider', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
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
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingSlide(null)
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

  return (
    <Container maxWidth="2xl" className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Hero Slider Settings</h1>
          <p className="text-gray-500">Manage the main hero slides displayed on your homepage</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
            <Plus className="w-4 h-4 mr-2" />
            Add Slide
          </Button>
          <Button onClick={handleSaveOrder} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Order'}
          </Button>
        </div>
      </div>

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Slides</CardTitle>
          <CardDescription>Drag and drop to reorder slides. Use the eye icon to show/hide slides.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading slides...</div>
                ) : slides.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No slides yet</p>
                    <p className="text-sm">Add your first slide to start the hero slider</p>
                    <Button onClick={handleAdd} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Slide
                    </Button>
                  </div>
                ) : (
                  slides.map((slide, index) => (
                    <SortableSlideItem
                      key={slide.id}
                      slide={slide}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onToggleActive={handleToggleActive}
                      isFirst={index === 0}
                      isLast={index === slides.length - 1}
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
                Total slides: {slides.length} • Active: {slides.filter(s => s.isActive).length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <SlideFormDialog
        open={isDialogOpen}
        initialData={editingSlide}
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
  onClose: () => void
  onSuccess: () => void
}

function SlideFormDialog({ open, initialData, onClose, onSuccess }: SlideFormDialogProps) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mobileImageUrl, setMobileImageUrl] = useState('')
  const [productImageUrl, setProductImageUrl] = useState('')
  const [badgeText, setBadgeText] = useState('')
  const [badgeColor, setBadgeColor] = useState('#c9a84c')
  const [ctaText, setCtaText] = useState('SHOP NOW')
  const [ctaLink, setCtaLink] = useState('/products')
  const [secondaryCtaText, setSecondaryCtaText] = useState('')
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('')
  const [overlayColor, setOverlayColor] = useState('rgba(26,58,92,0.6)')
  const [textColor, setTextColor] = useState('#ffffff')
  const [alignment, setAlignment] = useState('left')
  const [slideDuration, setSlideDuration] = useState(5)
  const [motionType, setMotionType] = useState('slide')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setSubtitle(initialData.subtitle || '')
      setDescription(initialData.description || '')
      setImageUrl(initialData.imageUrl)
      setMobileImageUrl(initialData.mobileImageUrl || '')
      setProductImageUrl(initialData.productImageUrl || '')
      setBadgeText(initialData.badgeText || '')
      setBadgeColor(initialData.badgeColor || '#c9a84c')
      setCtaText(initialData.ctaText)
      setCtaLink(initialData.ctaLink)
      setSecondaryCtaText(initialData.secondaryCtaText || '')
      setSecondaryCtaLink(initialData.secondaryCtaLink || '')
      setOverlayColor(initialData.overlayColor || 'rgba(26,58,92,0.6)')
      setTextColor(initialData.textColor || '#ffffff')
      setAlignment(initialData.alignment || 'left')
      setSlideDuration(initialData.slideDuration)
      setMotionType(initialData.motionType || 'slide')
      setIsActive(initialData.isActive)
    } else {
      // Reset form
      setTitle('')
      setSubtitle('')
      setDescription('')
      setImageUrl('')
      setMobileImageUrl('')
      setProductImageUrl('')
      setBadgeText('')
      setBadgeColor('#c9a84c')
      setCtaText('SHOP NOW')
      setCtaLink('/products')
      setSecondaryCtaText('')
      setSecondaryCtaLink('')
      setOverlayColor('rgba(26,58,92,0.6)')
      setTextColor('#ffffff')
      setAlignment('left')
      setSlideDuration(5)
      setMotionType('slide')
      setIsActive(true)
    }
  }, [initialData, open])

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
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({ title: initialData ? 'Slide updated' : 'Slide created' })
      onSuccess()
    } catch (error) {
      alert('Failed to save slide')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
          <DialogDescription>
            Configure the slide content, images, and call-to-action buttons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media & Design</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label>Slide Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Rise Ceramic Nonstick Bakeware"
                  required
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., Weeknight wins start with"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="From bubbling enchiladas to golden bakes..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g., NEW, SALE, BEST SELLER"
                />
              </div>
              <div>
                <Label>Badge Color</Label>
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
                    placeholder="#c9a84c"
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="space-y-4">
              <div>
                <Label>Background Image (Desktop) *</Label>
                <div className="mt-2">
                  <ImageUpload value={imageUrl} onChange={setImageUrl} folder="hero" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: 1920x800px, max 2MB</p>
              </div>
              <div>
                <Label>Product Image (Right Side) - Optional</Label>
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
                <Label>Primary CTA Text</Label>
                <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="SHOP NOW" />
              </div>
              <div>
                <Label>Primary CTA Link</Label>
                <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/products" />
              </div>
              <div>
                <Label>Secondary CTA Text (Optional)</Label>
                <Input
                  value={secondaryCtaText}
                  onChange={(e) => setSecondaryCtaText(e.target.value)}
                  placeholder="e.g., Learn More"
                />
              </div>
              <div>
                <Label>Secondary CTA Link (Optional)</Label>
                <Input
                  value={secondaryCtaLink}
                  onChange={(e) => setSecondaryCtaLink(e.target.value)}
                  placeholder="/about"
                />
              </div>
              <div>
                <Label>Slide Duration (seconds)</Label>
                <Input
                  type="number"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(Number(e.target.value))}
                  min={2}
                  max={15}
                />
                <p className="text-xs text-gray-500 mt-1">How long this slide should display before auto-advancing</p>
              </div>
              <div>
                <Label>Motion Type</Label>
                <select
                  value={motionType}
                  onChange={(e) => setMotionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                >
                  <option value="slide">Slide (Horizontal)</option>
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom In/Out</option>
                  <option value="flip">Flip (3D)</option>
                  <option value="rotate">Rotate</option>
                  <option value="scale">Scale</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose the animation style for this slide transition</p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
              {initialData ? 'Update' : 'Create'} Slide
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
