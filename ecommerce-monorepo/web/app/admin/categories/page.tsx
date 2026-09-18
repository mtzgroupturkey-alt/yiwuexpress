'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Search, Plus, Edit, Trash2, FolderTree, ChevronRight,
  Folder, Star, Layers, Package, CornerDownRight,
  X, Sparkles, FolderPlus, GripVertical, ChevronUp, ChevronDown,
  Eye, EyeOff, LayoutGrid, ArrowUpDown, Home, CheckCircle2,
  SlidersHorizontal, Check, RefreshCw, Save
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { CategoryIconPicker, DynamicCategoryIcon } from '@/components/admin/CategoryIconPicker'
import { localizeCategory } from '@/lib/utils/localize'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import {
  ProductTranslationForm,
  validateTranslations,
  type TranslationPayload,
  type TranslationLocale
} from '@/components/admin/ProductTranslationForm'

const categorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  showInMenu: z.boolean()
})

type CategoryForm = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  isActive: boolean
  isFeatured: boolean
  showInMenu: boolean
  menuOrder?: number
  displayOrder?: number
  parentId?: string
  level?: number
  parent?: { name: string }
  children?: Category[]
  translations?: { locale: string; name: string; description: string | null }[]
  _count: {
    products: number
    children: number
  }
}

function CategoryAvatar({
  src,
  icon,
  name,
  size = 'md'
}: {
  src?: string | null
  icon?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hasError, setHasError] = useState(false)
  const dim = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className={`${dim} rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs relative`}>
      {!hasError && src ? (
        <>
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
          {icon && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center shadow-xs border border-white">
              <DynamicCategoryIcon name={icon} className="w-2.5 h-2.5" />
            </div>
          )}
        </>
      ) : icon ? (
        <div className="w-full h-full bg-gradient-to-br from-[#1a3a5c]/15 to-[#2563eb]/10 flex items-center justify-center text-[#1a3a5c]">
          <DynamicCategoryIcon name={icon} className={iconSize} fallback={Folder} />
        </div>
      ) : (
        <Folder size={size === 'lg' ? 22 : 18} className="text-[#1a3a5c]/70" />
      )}
    </div>
  )
}

function SortableMenuItemRow({
  category,
  index,
  totalItems,
  onMove,
  onToggleMenu,
  onEdit,
  onHtml5Drop,
}: {
  category: Category
  index: number
  totalItems: number
  onMove: (id: string, direction: 'up' | 'down') => void
  onToggleMenu: (id: string, current: boolean) => void
  onEdit: (cat: Category) => void
  onHtml5Drop?: (sourceId: string, targetId: string) => void
}) {
  const [isHtml5DragOver, setIsHtml5DragOver] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  const isInMenu = category.showInMenu !== false

  return (
    <div
      ref={setNodeRef}
      style={style}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', category.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!isHtml5DragOver) setIsHtml5DragOver(true)
      }}
      onDragLeave={() => setIsHtml5DragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsHtml5DragOver(false)
        const sourceId = e.dataTransfer.getData('text/plain')
        if (sourceId && sourceId !== category.id && onHtml5Drop) {
          onHtml5Drop(sourceId, category.id)
        }
      }}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
        isDragging
          ? 'border-blue-500 shadow-2xl bg-blue-50/80 ring-2 ring-blue-400/50'
          : isHtml5DragOver
          ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-400'
          : isInMenu
          ? 'bg-white border-gray-100 hover:border-blue-200 shadow-2xs hover:shadow-sm'
          : 'bg-slate-50/80 border-slate-200/80 opacity-75'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Item Information: Drag Handle, Rank, Avatar, Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-grab active:cursor-grabbing shrink-0 transition-colors border border-transparent hover:border-blue-200 select-none touch-none flex items-center justify-center"
            title="Click and drag to reorder top menu"
          >
            <GripVertical size={20} />
          </div>

          {/* Position Rank */}
          <div className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 border ${
            isInMenu
              ? 'bg-[#1a3a5c]/10 text-[#1a3a5c] border-[#1a3a5c]/20'
              : 'bg-slate-200 text-slate-500 border-slate-300'
          }`}>
            #{index + 1}
          </div>

          {/* Avatar / Icon */}
          <CategoryAvatar
            src={category.image}
            icon={category.icon}
            name={category.name}
            size="sm"
          />

          {/* Name and Slug */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-sm truncate ${isInMenu ? 'text-gray-900' : 'text-gray-500'}`}>
                {category.name}
              </h4>
              {!isInMenu && (
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono truncate">/{category.slug}</p>
          </div>
        </div>

        {/* Action Controls: Large Up/Down Buttons, Menu Toggle, Edit */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Move Up / Down Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onMove(category.id, 'up')
              }}
              disabled={index === 0}
              title="Move Up in Top Menu"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onMove(category.id, 'down')
              }}
              disabled={index === totalItems - 1}
              title="Move Down in Top Menu"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Menu Toggle */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu(category.id, isInMenu)
            }}
            title={isInMenu ? "Visible in Top Menu (Click to hide)" : "Hidden from Top Menu (Click to show)"}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
              isInMenu
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
            }`}
          >
            {isInMenu ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} />}
            <span>{isInMenu ? 'In Menu' : 'Hidden'}</span>
          </button>

          {/* Edit button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(category)
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer active:scale-95 border border-transparent hover:border-emerald-200"
            title="Edit Category"
          >
            <Edit size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableHomeGridRow({
  category,
  index,
  totalItems,
  onMove,
  onToggleFeatured,
  onEdit,
  onHtml5Drop,
}: {
  category: Category
  index: number
  totalItems: number
  onMove: (id: string, direction: 'up' | 'down') => void
  onToggleFeatured: (id: string, current: boolean) => void
  onEdit: (cat: Category) => void
  onHtml5Drop?: (sourceId: string, targetId: string) => void
}) {
  const [isHtml5DragOver, setIsHtml5DragOver] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', category.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!isHtml5DragOver) setIsHtml5DragOver(true)
      }}
      onDragLeave={() => setIsHtml5DragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsHtml5DragOver(false)
        const sourceId = e.dataTransfer.getData('text/plain')
        if (sourceId && sourceId !== category.id && onHtml5Drop) {
          onHtml5Drop(sourceId, category.id)
        }
      }}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
        isDragging
          ? 'border-amber-500 shadow-2xl bg-amber-50/80 ring-2 ring-amber-400/50'
          : isHtml5DragOver
          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400'
          : 'bg-white border-gray-100 hover:border-amber-200 shadow-2xs hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Item Information */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className="p-2 rounded-xl text-gray-400 hover:text-amber-700 hover:bg-amber-50 cursor-grab active:cursor-grabbing shrink-0 transition-colors border border-transparent hover:border-amber-200 select-none touch-none flex items-center justify-center"
            title="Click and drag to reorder in homepage grid"
          >
            <GripVertical size={20} />
          </div>

          {/* Position Rank */}
          <div className="w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 border bg-amber-50 text-amber-800 border-amber-200">
            #{index + 1}
          </div>

          {/* Avatar / Icon */}
          <CategoryAvatar
            src={category.image}
            icon={category.icon}
            name={category.name}
            size="sm"
          />

          {/* Name and Slug */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-gray-900 truncate">
                {category.name}
              </h4>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                Hero Grid
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono truncate">/{category.slug}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Move Up / Down Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onMove(category.id, 'up')
              }}
              disabled={index === 0}
              title="Move Up in Homepage Grid"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-amber-600 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onMove(category.id, 'down')
              }}
              disabled={index === totalItems - 1}
              title="Move Down in Homepage Grid"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-amber-600 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer active:scale-95 shadow-2xs"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Remove from Home Grid Toggle */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFeatured(category.id, true)
            }}
            title="Remove from Homepage Hero Grid"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
          >
            <Star size={13} className="fill-amber-500 text-amber-500" />
            <span>On Homepage</span>
          </button>

          {/* Edit button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(category)
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer active:scale-95 border border-transparent hover:border-emerald-200"
            title="Edit Category"
          >
            <Edit size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategoriesPage() {
  const { locale, dict, t } = useAdminLocale()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryImage, setCategoryImage] = useState('')
  const [activeTab, setActiveTab] = useState<'tree' | 'menuOrder' | 'homeGrid'>('tree')
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSaveStatus, setOrderSaveStatus] = useState<string | null>(null)
  const [toastNotification, setToastNotification] = useState<string | null>(null)
  const [translations, setTranslations] = useState<TranslationPayload>({
    en: { name: '', description: '' },
    ru: { name: '', description: '' },
    zh: { name: '', description: '' }
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      showInMenu: true
    }
  })

  const getCategoryHierarchy = () => {
    const categoriesWithDepth = categories.map(cat => {
      let depth = 0
      let currentCat = cat
      const path: string[] = [cat.name]
      
      while (currentCat.parentId) {
        depth++
        const parent = categories.find(c => c.id === currentCat.parentId)
        if (parent) {
          path.unshift(parent.name)
          currentCat = parent
        } else {
          break
        }
        if (depth > 20) break
      }
      
      return {
        ...cat,
        depth,
        path: path.join(' > ')
      }
    })

    return categoriesWithDepth.sort((a, b) => a.path.localeCompare(b.path))
  }

  const hierarchicalCategories = getCategoryHierarchy()

  const handleExpandAll = () => {
    const allCategoryIds = new Set(categories.map(c => c.id))
    setExpandedCategories(allCategoryIds)
  }

  const handleCollapseAll = () => {
    setExpandedCategories(new Set())
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const name = watch('name')

  useEffect(() => {
    const baseName = translations.en?.name || name
    if (baseName && !editingCategory) {
      const slug = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setValue('slug', slug)
    }
  }, [translations, name, editingCategory, setValue])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    if (!search) return categories
    const searchLower = search.toLowerCase()
    const matchingCategories = categories.filter(cat =>
      cat.name.toLowerCase().includes(searchLower) ||
      cat.slug.toLowerCase().includes(searchLower)
    )

    const parentIds = new Set<string>()
    matchingCategories.forEach(cat => {
      let currentCat = cat
      while (currentCat.parentId) {
        parentIds.add(currentCat.parentId)
        currentCat = categories.find(c => c.id === currentCat.parentId) || currentCat
      }
    })

    return categories.filter(cat => 
      matchingCategories.some(m => m.id === cat.id) || 
      parentIds.has(cat.id)
    )
  }, [categories, search])

  // Automatically expand matches when searching
  useEffect(() => {
    if (search) {
      const allIds = new Set(filteredCategories.map(c => c.id))
      setExpandedCategories(allIds)
    }
  }, [search, filteredCategories])

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryImage(category.image || '')
    const seed: TranslationPayload = {
      en: { name: '', description: '' },
      ru: { name: '', description: '' },
      zh: { name: '', description: '' }
    }
    const locales: TranslationLocale[] = ['en', 'ru', 'zh']
    for (const locale of locales) {
      const existing = category.translations?.find(t => t.locale === locale)
      if (existing) {
        seed[locale] = { name: existing.name, description: existing.description || '' }
      } else if (locale === 'en') {
        seed.en = { name: category.name || '', description: category.description || '' }
      }
    }
    setTranslations(seed)
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
      isFeatured: category.isFeatured || false,
      showInMenu: category.showInMenu !== false
    })
    setShowForm(true)
  }

  const handleAddSubcategory = (parentId: string) => {
    handleCancelEdit()
    setValue('parentId', parentId)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setShowForm(false)
    setCategoryImage('')
    setTranslations({
      en: { name: '', description: '' },
      ru: { name: '', description: '' },
      zh: { name: '', description: '' }
    })
    reset({
      name: '',
      slug: '',
      description: '',
      image: '',
      icon: '',
      parentId: '',
      isActive: true,
      isFeatured: false,
      showInMenu: true
    })
  }

  const onSubmit = async (data: CategoryForm) => {
    setSubmitting(true)
    try {
      const enName = translations.en?.name?.trim()
      if (!enName) {
        alert(dict.categories.englishNameRequired)
        setSubmitting(false)
        return
      }
      const validation = validateTranslations(translations)
      if (!validation.valid) {
        alert(validation.error)
        setSubmitting(false)
        return
      }

      const enTranslation = translations.en
      const locales: TranslationLocale[] = ['en', 'ru', 'zh']
      const categoryData = {
        name: enTranslation?.name || data.name,
        slug: data.slug,
        description: enTranslation?.description || data.description || null,
        image: categoryImage || null,
        icon: data.icon || null,
        parentId: data.parentId || null,
        isActive: data.isActive,
        isFeatured: data.isFeatured || false,
        showInMenu: data.showInMenu !== false,
        translations: locales.map(locale => ({
          locale,
          name: translations[locale].name,
          description: translations[locale].description || null
        }))
      }

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      const result = await response.json()

      if (result.success) {
        handleCancelEdit()
        fetchCategories()
      } else {
        alert(result.error || dict.categories.categorySaveFailed)
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert(dict.categories.categorySaveFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(dict.categories.deleteCategoryConfirm.replace('{name}', name))) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        fetchCategories()
      } else {
        alert(result.error || dict.categories.categoryDeleteFailed)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(dict.categories.categoryDeleteFailed)
    } finally {
      setDeleting(null)
    }
  }

  const showToast = (message: string) => {
    setToastNotification(message)
    setTimeout(() => {
      setToastNotification(null)
    }, 3500)
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Root categories sorted by menuOrder
  const menuCategories = useMemo(() => {
    const roots = categories.filter(c => !c.parentId)
    return [...roots].sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
  }, [categories])

  // Featured categories for home grid sorted by displayOrder
  const homeGridCategories = useMemo(() => {
    const featured = categories.filter(c => c.isFeatured)
    return [...featured].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }, [categories])

  const handleHtml5MenuDrop = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    const oldIndex = menuCategories.findIndex(item => item.id === sourceId)
    const newIndex = menuCategories.findIndex(item => item.id === targetId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(menuCategories, oldIndex, newIndex)
    const updatedCategories = categories.map(cat => {
      const foundIdx = reordered.findIndex(r => r.id === cat.id)
      if (foundIdx !== -1) {
        return { ...cat, menuOrder: foundIdx }
      }
      return cat
    })
    setCategories(updatedCategories)
    await saveMenuOrderToServer(reordered)
  }

  const handleHtml5HomeDrop = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    const oldIndex = homeGridCategories.findIndex(item => item.id === sourceId)
    const newIndex = homeGridCategories.findIndex(item => item.id === targetId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(homeGridCategories, oldIndex, newIndex)
    const updatedCategories = categories.map(cat => {
      const foundIdx = reordered.findIndex(r => r.id === cat.id)
      if (foundIdx !== -1) {
        return { ...cat, displayOrder: foundIdx }
      }
      return cat
    })
    setCategories(updatedCategories)
    await saveHeroGridOrderToServer(reordered)
  }

  const handleToggleShowInMenu = async (categoryId: string, currentValue: boolean) => {
    const newValue = !currentValue
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, showInMenu: newValue } : cat))
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInMenu: newValue })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Top menu visibility: ${newValue ? 'Visible' : 'Hidden'}`)
      } else {
        setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, showInMenu: currentValue } : cat))
        alert(data.error || 'Failed to update menu visibility')
      }
    } catch (err) {
      setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, showInMenu: currentValue } : cat))
      console.error(err)
      alert('Network error updating menu visibility')
    }
  }

  const handleToggleIsFeatured = async (categoryId: string, currentValue: boolean) => {
    const newValue = !currentValue
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, isFeatured: newValue } : cat))
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newValue })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Homepage grid visibility: ${newValue ? 'Added to Grid' : 'Removed from Grid'}`)
      } else {
        setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, isFeatured: currentValue } : cat))
        alert(data.error || 'Failed to update homepage visibility')
      }
    } catch (err) {
      setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, isFeatured: currentValue } : cat))
      console.error(err)
      alert('Network error updating homepage visibility')
    }
  }

  const saveMenuOrderToServer = async (items: Category[]) => {
    setSavingOrder(true)
    setOrderSaveStatus('Saving...')
    try {
      const payload = items.map((item, index) => ({
        id: item.id,
        menuOrder: index
      }))
      const res = await fetch('/api/admin/categories/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payload, type: 'menu' })
      })
      const data = await res.json()
      if (data.success) {
        setOrderSaveStatus('✓ Saved')
        showToast('Top menu order updated successfully!')
        setTimeout(() => setOrderSaveStatus(null), 3000)
      } else {
        setOrderSaveStatus('Failed')
        alert(data.error || 'Failed to save menu order')
      }
    } catch (err) {
      console.error(err)
      setOrderSaveStatus('Failed')
    } finally {
      setSavingOrder(false)
    }
  }

  const handleDragEndMenu = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = menuCategories.findIndex(item => item.id === active.id)
    const newIndex = menuCategories.findIndex(item => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(menuCategories, oldIndex, newIndex)
    const updatedCategories = categories.map(cat => {
      const foundIdx = reordered.findIndex(r => r.id === cat.id)
      if (foundIdx !== -1) {
        return { ...cat, menuOrder: foundIdx }
      }
      return cat
    })
    setCategories(updatedCategories)
    await saveMenuOrderToServer(reordered)
  }

  const handleMoveMenuCategory = (id: string, direction: 'up' | 'down') => {
    const currentIndex = menuCategories.findIndex(item => item.id === id)
    if (currentIndex === -1) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= menuCategories.length) return

    const reordered = arrayMove(menuCategories, currentIndex, targetIndex)
    const orderMap = new Map<string, number>()
    reordered.forEach((item, idx) => {
      orderMap.set(item.id, idx)
    })

    // Instant synchronous UI update - 0ms lag
    setCategories(prev =>
      prev.map(cat => {
        if (orderMap.has(cat.id)) {
          return { ...cat, menuOrder: orderMap.get(cat.id)! }
        }
        return cat
      })
    )

    // Background server save
    saveMenuOrderToServer(reordered)
  }

  const saveHeroGridOrderToServer = async (items: Category[]) => {
    setSavingOrder(true)
    setOrderSaveStatus('Saving...')
    try {
      const payload = items.map((item, index) => ({
        id: item.id,
        displayOrder: index
      }))
      const res = await fetch('/api/admin/categories/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payload, type: 'display' })
      })
      const data = await res.json()
      if (data.success) {
        setOrderSaveStatus('✓ Saved')
        showToast('Homepage hero grid order updated!')
        setTimeout(() => setOrderSaveStatus(null), 3000)
      } else {
        setOrderSaveStatus('Failed')
        alert(data.error || 'Failed to save hero grid order')
      }
    } catch (err) {
      console.error(err)
      setOrderSaveStatus('Failed')
    } finally {
      setSavingOrder(false)
    }
  }

  const handleDragEndHomeGrid = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = homeGridCategories.findIndex(item => item.id === active.id)
    const newIndex = homeGridCategories.findIndex(item => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(homeGridCategories, oldIndex, newIndex)
    const orderMap = new Map<string, number>()
    reordered.forEach((item, idx) => {
      orderMap.set(item.id, idx)
    })

    setCategories(prev =>
      prev.map(cat => {
        if (orderMap.has(cat.id)) {
          return { ...cat, displayOrder: orderMap.get(cat.id)! }
        }
        return cat
      })
    )
    await saveHeroGridOrderToServer(reordered)
  }

  const handleMoveHomeGridCategory = (id: string, direction: 'up' | 'down') => {
    const currentIndex = homeGridCategories.findIndex(item => item.id === id)
    if (currentIndex === -1) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= homeGridCategories.length) return

    const reordered = arrayMove(homeGridCategories, currentIndex, targetIndex)
    const orderMap = new Map<string, number>()
    reordered.forEach((item, idx) => {
      orderMap.set(item.id, idx)
    })

    // Instant synchronous UI update - 0ms lag
    setCategories(prev =>
      prev.map(cat => {
        if (orderMap.has(cat.id)) {
          return { ...cat, displayOrder: orderMap.get(cat.id)! }
        }
        return cat
      })
    )

    // Background server save
    saveHeroGridOrderToServer(reordered)
  }

  // Root categories sorted by menuOrder with deterministic tie breaker
  const rootCategories = useMemo(() => {
    const roots = filteredCategories.filter(c => !c.parentId)
    return [...roots].sort((a, b) => {
      const orderA = a.menuOrder ?? 0
      const orderB = b.menuOrder ?? 0
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }, [filteredCategories])
  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)
  const totalSubcategories = categories.filter(c => c.parentId).length

  const CategoryTreeNode = ({
    category,
    level = 0,
    rootIndex,
    totalRoots
  }: {
    category: Category
    level?: number
    rootIndex?: number
    totalRoots?: number
  }) => {
    const children = filteredCategories.filter(c => c.parentId === category.id)
    const isExpanded = expandedCategories.has(category.id)
    
    return (
      <div className="group/node">
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 my-1.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-gray-100 hover:border-blue-200/60 shadow-2xs hover:shadow-sm transition-all duration-200 ${
            level > 0 ? 'relative' : ''
          }`}
          style={{ 
            marginLeft: level > 0 ? `${Math.min(level * 20, 48)}px` : '0',
          }}
        >
          {/* Main Info: Toggle Chevron, Avatar, Name, Badges */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {children.length > 0 ? (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => toggleCategory(category.id)}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 transition-colors shrink-0"
                title={isExpanded ? dict.categories.collapseAll : dict.categories.expandAll}
              >
                <ChevronRight 
                  size={16} 
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#1a3a5c]' : ''}`}
                />
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center shrink-0 text-gray-300">
                {level > 0 && <CornerDownRight size={14} />}
              </div>
            )}
            
            <CategoryAvatar 
              src={category.image} 
              icon={category.icon}
              name={category.translations ? localizeCategory(category, locale).name : category.name} 
              size="md" 
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {category.translations ? localizeCategory(category, locale).name : category.name}
                </h3>
                {category.icon && (
                  <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                    <DynamicCategoryIcon name={category.icon} className="w-3 h-3 text-[#1a3a5c]" />
                    <span>{category.icon}</span>
                  </span>
                )}
                {category.isFeatured && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Star size={10} className="fill-amber-500 text-amber-500" />
                    {dict.products.featured}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono truncate mt-0.5">/{category.slug}</p>
            </div>
          </div>

          {/* Action Row: Mobile Responsive with Quick Move, Toggles and Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Quick Menu Order Up / Down for Root Categories */}
              {level === 0 && (
                <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveMenuCategory(category.id, 'up')
                    }}
                    disabled={rootIndex === 0}
                    title="Move Up in Menu Order"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-25 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveMenuCategory(category.id, 'down')
                    }}
                    disabled={rootIndex !== undefined && totalRoots !== undefined && rootIndex >= totalRoots - 1}
                    title="Move Down in Menu Order"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-25 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                level === 0 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : level === 1
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {level === 0 ? dict.categories.parentBadge : dict.categories.childBadge.replace('{level}', String(level + 1))}
              </span>

              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                {category._count?.products || 0} {dict.products.title.toLowerCase()}
              </span>

              {children.length > 0 && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
                  {children.length} {dict.categories.subcategories.toLowerCase()}
                </span>
              )}

              {/* Top Menu Interactive Toggle */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleShowInMenu(category.id, category.showInMenu !== false)
                }}
                title={category.showInMenu !== false ? "Visible in Top Menu (Click to hide)" : "Hidden from Top Menu (Click to show)"}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                  category.showInMenu !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600 opacity-60'
                }`}
              >
                {category.showInMenu !== false ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} />}
                <span>Menu</span>
                {category.showInMenu !== false && category.menuOrder !== undefined && level === 0 && (
                  <span className="text-[9px] text-emerald-800 bg-emerald-100/80 px-1 rounded">#{category.menuOrder + 1}</span>
                )}
              </button>

              {/* Home Grid (After Hero) Interactive Toggle */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleIsFeatured(category.id, Boolean(category.isFeatured))
                }}
                title={category.isFeatured ? "Showing on Homepage Grid (Click to remove)" : "Hidden from Homepage Grid (Click to add)"}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                  category.isFeatured
                    ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600 opacity-60'
                }`}
              >
                <Star size={12} className={category.isFeatured ? "fill-amber-500 text-amber-500" : ""} />
                <span>Home Grid</span>
              </button>
            </div>

            {/* Actions: Add Subcategory, Edit, Delete */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleAddSubcategory(category.id)}
                title={dict.categories.addCategory}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors active:scale-95"
              >
                <FolderPlus size={16} />
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleEdit(category)}
                title={dict.common.edit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors active:scale-95"
              >
                <Edit size={16} />
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleDelete(category.id, category.name)}
                disabled={deleting === category.id}
                title={dict.common.delete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 active:scale-95"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="border-l-2 border-slate-200 ml-4 pl-2 space-y-1">
            {children.map(child => (
              <CategoryTreeNode key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{dict.categories.title}</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {categories.length} {dict.common.total.toLowerCase()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {dict.categories.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => {
              if (showForm && !editingCategory) {
                setShowForm(false)
              } else {
                handleCancelEdit()
                setShowForm(true)
              }
            }}
            className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white shadow-md shadow-blue-900/10 rounded-xl px-4 py-2.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
          >
            {showForm && !editingCategory ? <X size={15} /> : <Plus size={15} />}
            <span>{showForm && !editingCategory ? dict.common.close : dict.categories.addCategory}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderTree size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.categories.title}</p>
            <p className="text-lg font-black text-gray-900">{categories.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.categories.parentCategory}</p>
            <p className="text-lg font-black text-emerald-600">{rootCategories.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CornerDownRight size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.categories.subcategories}</p>
            <p className="text-lg font-black text-purple-600">{totalSubcategories}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{dict.products.title}</p>
            <p className="text-lg font-black text-amber-600">{totalProducts}</p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: Tree, Top Menu Ordering, Homepage Hero Grid */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-[#1a3a5c] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FolderTree size={15} />
            <span>Category Tree</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'tree' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menuOrder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'menuOrder'
                ? 'bg-[#1a3a5c] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowUpDown size={15} className={activeTab === 'menuOrder' ? 'text-amber-400' : 'text-blue-600'} />
            <span>Top Menu Ordering (Drag & Drop)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'menuOrder' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
            }`}>
              {menuCategories.filter(c => c.showInMenu !== false).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('homeGrid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'homeGrid'
                ? 'bg-[#1a3a5c] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Home size={15} className={activeTab === 'homeGrid' ? 'text-amber-400' : 'text-amber-600'} />
            <span>Homepage Hero Grid</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'homeGrid' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
            }`}>
              {homeGridCategories.length}
            </span>
          </button>
        </div>

        {orderSaveStatus && (
          <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{orderSaveStatus}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          {activeTab === 'tree' ? (
            <>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex-1 w-full relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={dict.common.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleExpandAll}
                    className="rounded-xl text-xs font-semibold h-10 px-3"
                  >
                    {dict.categories.expandAll}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCollapseAll}
                    className="rounded-xl text-xs font-semibold h-10 px-3"
                  >
                    {dict.categories.collapseAll}
                  </Button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FolderTree size={16} className="text-[#1a3a5c]" />
                    {dict.categories.taxonomyHierarchy}
                  </h2>
                  <span className="text-xs text-gray-400 font-medium">
                    {dict.categories.rootLevelsAndBranches
                      .replace('{root}', String(rootCategories.length))
                      .replace('{branches}', String(totalSubcategories))}
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
                    <p className="text-xs font-medium text-gray-500 mt-3">{dict.categories.loadingCategoryTree}</p>
                  </div>
                ) : rootCategories.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <FolderTree size={28} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{dict.categories.noCategoriesFound}</h3>
                    <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                      {search ? dict.categories.noCategoriesSearchMatch : dict.categories.noCategoriesEmptyState}
                    </p>
                    <Button onClick={() => setShowForm(true)} className="bg-[#1a3a5c] text-white text-xs font-bold rounded-xl">
                      <Plus size={14} className="mr-1" />
                      {dict.categories.addFirstCategory}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rootCategories.map((category, idx) => (
                      <CategoryTreeNode
                        key={category.id}
                        category={category}
                        rootIndex={idx}
                        totalRoots={rootCategories.length}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'menuOrder' ? (
            <div className="space-y-4">
              {/* Storefront Top Menu Preview Ribbon */}
              <div className="bg-gradient-to-r from-slate-900 via-[#1a3a5c] to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                      Live Top Menu Preview (Storefront Navigation Ribbon)
                    </span>
                  </div>
                  <span className="text-[11px] bg-white/10 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-white/10">
                    {menuCategories.filter(c => c.showInMenu !== false).length} Active in Menu
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-2.5 overflow-x-auto no-scrollbar flex items-center gap-2 border border-slate-200 shadow-inner">
                  <div className="px-3 py-1.5 bg-[#00407a] text-white rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-2xs">
                    <LayoutGrid className="w-3 h-3 text-amber-400" />
                    Catalog
                  </div>
                  <div className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    All Products
                  </div>
                  {menuCategories.filter(c => c.showInMenu !== false).length === 0 ? (
                    <span className="text-xs text-slate-400 italic px-3 py-1">No categories active in menu. Enable toggle below.</span>
                  ) : (
                    menuCategories
                      .filter(c => c.showInMenu !== false)
                      .map((cat, idx) => (
                        <div
                          key={cat.id}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 border border-slate-200 transition-colors"
                        >
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-mono font-bold">#{idx + 1}</span>
                          <span className="font-bold">{cat.name}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Menu Ordering Card */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <ArrowUpDown size={16} className="text-blue-600" />
                      Top Menu Categories Order
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Drag and drop using the grip icon or click arrows to arrange categories in the storefront menu.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveMenuOrderToServer(menuCategories)}
                      disabled={savingOrder}
                      className="bg-[#1a3a5c] hover:bg-[#152e4a] text-white text-xs font-bold rounded-xl h-9 px-3.5 flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>{savingOrder ? 'Saving...' : 'Save Order'}</span>
                    </Button>
                  </div>
                </div>

                {menuCategories.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium">
                    No top-level categories available. Create top-level categories to configure the top menu.
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndMenu}>
                    <SortableContext items={menuCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {menuCategories.map((category, index) => (
                          <SortableMenuItemRow
                            key={category.id}
                            category={category}
                            index={index}
                            totalItems={menuCategories.length}
                            onMove={handleMoveMenuCategory}
                            onToggleMenu={handleToggleShowInMenu}
                            onEdit={handleEdit}
                            onHtml5Drop={handleHtml5MenuDrop}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Homepage Hero Grid Live Preview */}
              <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-amber-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider text-amber-200 uppercase flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-amber-400" />
                      Live Homepage Hero Grid Preview (After Hero Banner)
                    </span>
                  </div>
                  <span className="text-[11px] bg-white/10 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-white/10">
                    {homeGridCategories.length} Categories on Homepage
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 overflow-x-auto no-scrollbar flex items-center gap-4 border border-slate-200 shadow-inner">
                  {homeGridCategories.length === 0 ? (
                    <span className="text-xs text-slate-500 italic py-2">
                      No categories explicitly selected for the hero grid. The homepage will display top root departments.
                    </span>
                  ) : (
                    homeGridCategories.map((cat, idx) => (
                      <div key={cat.id} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[75px] text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center relative shadow-2xs overflow-hidden">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          ) : cat.icon ? (
                            <DynamicCategoryIcon name={cat.icon} className="w-5 h-5 text-[#1a3a5c]" fallback={Folder} />
                          ) : (
                            <Folder size={18} className="text-[#1a3a5c]" />
                          )}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                            {idx + 1}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 line-clamp-1 max-w-[85px]">{cat.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Homepage Grid Ordering Card */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Star size={16} className="fill-amber-500 text-amber-500" />
                      Homepage Hero Grid Ordering
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      These categories appear right under the hero slider in the "Shop by Category" section.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveHeroGridOrderToServer(homeGridCategories)}
                      disabled={savingOrder}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-3.5 flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>{savingOrder ? 'Saving...' : 'Save Grid Order'}</span>
                    </Button>
                  </div>
                </div>

                {/* Quick Category Add to Hero Grid */}
                <div className="flex items-center gap-3 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                  <Star size={16} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 shrink-0">Add to Homepage Grid:</span>
                  <select
                    className="text-xs bg-white border border-amber-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none flex-1 max-w-sm cursor-pointer"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleToggleIsFeatured(e.target.value, false)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="" disabled>Select category to display on homepage...</option>
                    {categories.filter(c => !c.isFeatured).map(c => (
                      <option key={c.id} value={c.id}>{c.name} (/{c.slug})</option>
                    ))}
                  </select>
                </div>

                {homeGridCategories.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium">
                    No categories are currently marked for the homepage hero grid. Use the dropdown above or click "Home Grid" on any category in the Tree tab.
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndHomeGrid}>
                    <SortableContext items={homeGridCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {homeGridCategories.map((category, index) => (
                          <SortableHomeGridRow
                            key={category.id}
                            category={category}
                            index={index}
                            totalItems={homeGridCategories.length}
                            onMove={handleMoveHomeGridCategory}
                            onToggleFeatured={handleToggleIsFeatured}
                            onEdit={handleEdit}
                            onHtml5Drop={handleHtml5HomeDrop}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="lg:col-span-1 sticky top-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {editingCategory ? dict.categories.editCategory : dict.categories.newCategory}
                </h2>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <ProductTranslationForm
                initialValues={translations}
                onChange={setTranslations}
              />

              <div>
                <Label htmlFor="slug" className="text-xs font-semibold text-gray-700">{dict.categories.slugLabel}</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="mt-1 h-9 text-xs rounded-xl"
                  placeholder={dict.categories.slugPlaceholder}
                />
                {errors.slug && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.slug.message}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">{dict.categories.slugHelper}</p>
              </div>

              <div>
                <Label htmlFor="parentId" className="text-xs font-semibold text-gray-700">{dict.categories.parentCategory}</Label>
                <select
                  id="parentId"
                  {...register('parentId')}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-[#1a3a5c] bg-gray-50/50"
                >
                  <option value="">{dict.categories.topLevelRoot}</option>
                  {hierarchicalCategories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(cat => {
                      const indent = '\u00A0\u00A0\u00A0'.repeat(cat.depth)
                      const arrow = cat.depth > 0 ? '└─ ' : ''
                      return (
                        <option key={cat.id} value={cat.id}>
                          {indent}{arrow}{cat.name}
                        </option>
                      )
                    })}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  {dict.categories.parentHelper}
                </p>
              </div>

              <div>
                <ImageUpload
                  value={categoryImage}
                  onChange={(url) => {
                    setCategoryImage(url)
                    setValue('image', url)
                  }}
                  folder="categories"
                  label={dict.categories.categoryPhoto}
                />
              </div>

              <div>
                <CategoryIconPicker
                  value={watch('icon')}
                  onChange={(iconName) => {
                    setValue('icon', iconName, { shouldValidate: true, shouldDirty: true })
                  }}
                  label={dict.categories.iconLabel}
                  helperText={dict.categories.iconPlaceholder}
                />
              </div>

              {/* Live Preview Card */}
              {(categoryImage || watch('icon')) && (
                <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-100/80 rounded-2xl shadow-2xs">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Live Category Badge Preview</p>
                  <div className="flex items-center gap-3">
                    <CategoryAvatar 
                      src={categoryImage} 
                      icon={watch('icon')} 
                      name={translations.en?.name || 'Preview'} 
                      size="lg" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {translations.en?.name || translations.ru?.name || translations.zh?.name || 'Category Name'}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono truncate">
                        {watch('slug') ? `/${watch('slug')}` : '/category-slug'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {categoryImage && (
                          <span className="inline-flex items-center text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                            Photo Set
                          </span>
                        )}
                        {watch('icon') && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold">
                            <DynamicCategoryIcon name={watch('icon')!} className="w-3 h-3 text-[#1a3a5c]" />
                            {watch('icon')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{dict.categories.activeStatus}</p>
                    <p className="text-[11px] text-gray-400">{dict.categories.activeStatusHelper}</p>
                  </div>
                  <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded text-[#1a3a5c]" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{dict.categories.showInNavMenu}</p>
                    <p className="text-[11px] text-gray-400">{dict.categories.showInNavMenuHelper}</p>
                  </div>
                  <input type="checkbox" {...register('showInMenu')} className="w-4 h-4 rounded text-[#1a3a5c]" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      {dict.categories.featuredHomepage}
                    </p>
                    <p className="text-[11px] text-gray-400">{dict.categories.featuredHomepageHelper}</p>
                  </div>
                  <input type="checkbox" {...register('isFeatured')} className="w-4 h-4 rounded text-amber-500" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white text-xs font-bold rounded-xl py-2.5"
                >
                  {submitting ? dict.common.saving : editingCategory ? dict.categories.updateCategory : dict.categories.createCategory}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="rounded-xl text-xs font-semibold"
                >
                  {dict.common.cancel}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastNotification}</span>
        </div>
      )}
    </div>
  )
}
