'use client'

import { useState, useEffect } from 'react'
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
  X, Sparkles, FolderPlus
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'
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
  parentId?: string
  parent?: { name: string }
  children?: Category[]
  translations?: { locale: string; name: string; description: string | null }[]
  _count: {
    products: number
    children: number
  }
}

function CategoryAvatar({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [hasError, setHasError] = useState(false)
  const dim = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <div className={`${dim} rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs`}>
      {!hasError && src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <Folder size={size === 'lg' ? 22 : 18} className="text-[#1a3a5c]/70" />
      )}
    </div>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryImage, setCategoryImage] = useState('')
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

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [categories, search])

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

  const filterCategories = () => {
    let filtered = [...categories]

    if (search) {
      const searchLower = search.toLowerCase()
      const matchingCategories = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower)
      )
      
      const parentIds = new Set<string>()
      matchingCategories.forEach(cat => {
        let currentCat = cat
        while (currentCat.parentId) {
          parentIds.add(currentCat.parentId)
          currentCat = filtered.find(c => c.id === currentCat.parentId) || currentCat
        }
      })
      
      filtered = filtered.filter(cat => 
        matchingCategories.some(m => m.id === cat.id) || 
        parentIds.has(cat.id)
      )
      
      if (search) {
        const allIds = new Set(filtered.map(c => c.id))
        setExpandedCategories(allIds)
      }
    }

    setFilteredCategories(filtered)
  }

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
        alert('English name is required')
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
        alert(result.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) {
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
        alert(result.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  const rootCategories = filteredCategories.filter(c => !c.parentId)
  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)
  const totalSubcategories = categories.filter(c => c.parentId).length

  const CategoryTreeNode = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const children = filteredCategories.filter(c => c.parentId === category.id)
    const isExpanded = expandedCategories.has(category.id)
    
    return (
      <div className="group/node">
        <div
          className={`flex items-center gap-3 p-3.5 my-1.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-gray-100 hover:border-blue-200/60 shadow-2xs hover:shadow-sm transition-all duration-200 ${
            level > 0 ? 'relative' : ''
          }`}
          style={{ 
            marginLeft: level > 0 ? `${level * 28}px` : '0',
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 transition-colors shrink-0"
              title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
            >
              <ChevronRight 
                size={16} 
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#1a3a5c]' : ''}`}
              />
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center shrink-0 text-gray-300">
              {level > 0 && <CornerDownRight size={14} />}
            </div>
          )}
          
          <CategoryAvatar src={category.image} name={category.name} size="md" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm truncate">{category.name}</h3>
              {category.isFeatured && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  Featured
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono truncate mt-0.5">/{category.slug}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
              {category._count?.products || 0} products
            </span>
            {children.length > 0 && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
                {children.length} subcategories
              </span>
            )}
            {category.showInMenu && (
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                In Menu
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              category.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => handleAddSubcategory(category.id)}
              title="Add Subcategory"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <FolderPlus size={15} />
            </button>
            <button
              onClick={() => handleEdit(category)}
              title="Edit category"
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Edit size={15} />
            </button>
            <button
              onClick={() => handleDelete(category.id, category.name)}
              disabled={deleting === category.id}
              title="Delete category"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
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
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Category Architecture</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {categories.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Build and manage hierarchical taxonomy, multilingual names, homepage featured tags, and navigation menu settings.
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
            <span>{showForm && !editingCategory ? 'Close Form' : 'Add New Category'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderTree size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Categories</p>
            <p className="text-lg font-black text-gray-900">{categories.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Root Categories</p>
            <p className="text-lg font-black text-emerald-600">{rootCategories.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CornerDownRight size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Subcategories</p>
            <p className="text-lg font-black text-purple-600">{totalSubcategories}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Assigned Products</p>
            <p className="text-lg font-black text-amber-600">{totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories by name or slug..."
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
                Expand All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCollapseAll}
                className="rounded-xl text-xs font-semibold h-10 px-3"
              >
                Collapse All
              </Button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FolderTree size={16} className="text-[#1a3a5c]" />
                Taxonomy Hierarchy
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {rootCategories.length} root levels · {totalSubcategories} branches
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
                <p className="text-xs font-medium text-gray-500 mt-3">Loading category tree...</p>
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-100">
                  <FolderTree size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No categories found</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                  {search ? 'No categories matched your search term.' : 'Get started by creating your first product category.'}
                </p>
                <Button onClick={() => setShowForm(true)} className="bg-[#1a3a5c] text-white text-xs font-bold rounded-xl">
                  <Plus size={14} className="mr-1" />
                  Add First Category
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {rootCategories.map(category => (
                  <CategoryTreeNode key={category.id} category={category} />
                ))}
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="lg:col-span-1 sticky top-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'New Category'}
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
                <Label htmlFor="slug" className="text-xs font-semibold text-gray-700">URL Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="mt-1 h-9 text-xs rounded-xl"
                  placeholder="e.g., kitchenware-appliances"
                />
                {errors.slug && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.slug.message}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Auto-generated from canonical English title</p>
              </div>

              <div>
                <Label htmlFor="parentId" className="text-xs font-semibold text-gray-700">Parent Category</Label>
                <select
                  id="parentId"
                  {...register('parentId')}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-[#1a3a5c] bg-gray-50/50"
                >
                  <option value="">None (Top-Level Root Category)</option>
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
                  Nest category under a parent for hierarchical tree browsing
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
                  label="Category Photo"
                />
              </div>

              <div>
                <Label htmlFor="icon" className="text-xs font-semibold text-gray-700">Icon Key (Optional)</Label>
                <Input 
                  id="icon" 
                  {...register('icon')}
                  placeholder="e.g., utensils, truck, box, ship"
                  className="mt-1 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Active Status</p>
                    <p className="text-[11px] text-gray-400">Visible across storefront & API</p>
                  </div>
                  <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded text-[#1a3a5c]" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800">Show in Navigation Menu</p>
                    <p className="text-[11px] text-gray-400">Display in top header menu flyouts</p>
                  </div>
                  <input type="checkbox" {...register('showInMenu')} className="w-4 h-4 rounded text-[#1a3a5c]" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      Featured on Homepage
                    </p>
                    <p className="text-[11px] text-gray-400">Highlight in "Shop by Category" showcase</p>
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
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
