'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Edit, Trash2, FolderTree, ChevronRight, Folder, Star } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
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
  _count: {
    products: number
    children: number
  }
}

export default function AdminCategoriesPage() {
  const router = useRouter()
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

  // Helper function to calculate category depth and sort by hierarchy
  const getCategoryHierarchy = () => {
    // Build a map of categories with their depths
    const categoriesWithDepth = categories.map(cat => {
      let depth = 0
      let currentCat = cat
      const path: string[] = [cat.name]
      
      // Calculate depth by traversing up the parent chain
      while (currentCat.parentId) {
        depth++
        const parent = categories.find(c => c.id === currentCat.parentId)
        if (parent) {
          path.unshift(parent.name)
          currentCat = parent
        } else {
          break
        }
        if (depth > 20) break // Safety limit
      }
      
      return {
        ...cat,
        depth,
        path: path.join(' > ')
      }
    })

    // Sort by path to maintain hierarchy
    return categoriesWithDepth.sort((a, b) => a.path.localeCompare(b.path))
  }

  const hierarchicalCategories = getCategoryHierarchy()

  // Expand all categories
  const handleExpandAll = () => {
    const allCategoryIds = new Set(categories.map(c => c.id))
    setExpandedCategories(allCategoryIds)
  }

  // Collapse all categories
  const handleCollapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Toggle single category
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

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !editingCategory) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setValue('slug', slug)
    }
  }, [name, editingCategory, setValue])

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

      console.log('[Admin Categories] Fetched categories:', data)

      if (data.success) {
        console.log('[Admin Categories] Number of categories:', data.data?.length)
        // Log showInMenu status for each category
        data.data?.forEach((cat: Category) => {
          console.log(`[Admin Categories] ${cat.name}: showInMenu=${cat.showInMenu}`)
        })
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
      
      // Find all categories that match the search
      const matchingCategories = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower)
      )
      
      // Get all parent IDs of matching categories to show the path
      const parentIds = new Set<string>()
      matchingCategories.forEach(cat => {
        let currentCat = cat
        while (currentCat.parentId) {
          parentIds.add(currentCat.parentId)
          currentCat = filtered.find(c => c.id === currentCat.parentId) || currentCat
        }
      })
      
      // Include both matching categories and their parents
      filtered = filtered.filter(cat => 
        matchingCategories.some(m => m.id === cat.id) || 
        parentIds.has(cat.id)
      )
      
      // Auto-expand all categories when searching to show results
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

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setShowForm(false)
    setCategoryImage('')
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
      const categoryData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: categoryImage || null,
        icon: data.icon || null,
        parentId: data.parentId || null,
        isActive: data.isActive,
        isFeatured: data.isFeatured || false,
        showInMenu: data.showInMenu !== false
      }

      console.log('[Admin Form] Submitting category data:', JSON.stringify(categoryData, null, 2))
      console.log('[Admin Form] showInMenu value:', data.showInMenu)
      console.log('[Admin Form] Checkbox raw value:', data.showInMenu)

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      console.log('[Admin Form] Request URL:', url)
      console.log('[Admin Form] Request method:', method)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      const result = await response.json()
      
      console.log('[Admin Form] Response:', JSON.stringify(result, null, 2))

      if (result.success) {
        alert(editingCategory ? 'Category updated!' : 'Category created!')
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
        alert('Category deleted!')
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

  // Get root categories (no parent)
  const rootCategories = filteredCategories.filter(c => !c.parentId)

  // Recursive component to render category tree
  const CategoryTree = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const children = filteredCategories.filter(c => c.parentId === category.id)
    const isExpanded = expandedCategories.has(category.id)
    
    return (
      <div>
        <div
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
            level > 0 ? 'ml-6' : ''
          }`}
          style={{ 
            marginLeft: level > 0 ? `${level * 24}px` : '0',
            borderLeft: level > 0 ? '2px solid #e5e7eb' : 'none',
            paddingLeft: level > 0 ? '12px' : '12px'
          }}
        >
          {/* Expand/Collapse button for categories with children */}
          {children.length > 0 ? (
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRight 
                size={16} 
                className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <div className="w-5 h-5 flex-shrink-0" />
          )}
          
          {/* Category Image Thumbnail (Circular) */}
          {category.image ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 shadow-sm">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Folder size={18} className="text-blue-500 flex-shrink-0 ml-2" />
          )}
          
          <div className="flex-1 min-w-0 ml-3">
            <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
            <p className="text-sm text-gray-500 truncate">{category.slug}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="text-xs">
              {category._count.products} products
            </Badge>
            {category._count.children > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category._count.children} subs
              </Badge>
            )}
            {category.showInMenu && (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                In Menu
              </Badge>
            )}
            {category.isFeatured && (
              <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge variant={category.isActive ? 'success' : 'secondary'} className="text-xs">
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
              onClick={() => handleDelete(category.id, category.name)}
              disabled={deleting === category.id}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Render children recursively */}
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => (
              <CategoryTree key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize products with categories and subcategories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {categories.length}
            </div>
            <p className="text-sm text-gray-600">Total Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {rootCategories.length}
            </div>
            <p className="text-sm text-gray-600">Parent Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {categories.filter(c => c.parentId).length}
            </div>
            <p className="text-sm text-gray-600">Subcategories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {categories.reduce((sum, c) => sum + c._count.products, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {search && (
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Tree */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5" />
                  Category Tree
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleExpandAll}
                    className="text-xs"
                  >
                    Expand All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCollapseAll}
                    className="text-xs"
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : rootCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No categories yet</p>
                  <p className="text-sm mt-1">Click "Add Category" to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rootCategories.map(category => (
                    <CategoryTree key={category.id} category={category} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input id="slug" {...register('slug')} />
                    {errors.slug && (
                      <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>

                  {/* Category Image Upload */}
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
                    <p className="text-xs text-gray-500 mt-1">
                      This image will appear in the "Shop by Category" section on the homepage.
                      Recommended: 400×400px square image.
                    </p>
                  </div>

                  {/* Icon (Optional) */}
                  <div>
                    <Label htmlFor="icon">Icon (Optional)</Label>
                    <Input 
                      id="icon" 
                      {...register('icon')}
                      placeholder="e.g., utensils, cookpot, oven"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used as fallback if no image is set</p>
                  </div>

                  <div>
                    <Label htmlFor="parentId">Parent Category</Label>
                    <select
                      id="parentId"
                      {...register('parentId')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-[#1a3a5c]"
                    >
                      <option value="">None (Root Category)</option>
                      {hierarchicalCategories
                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                        .map(cat => {
                          // Create visual indentation based on depth
                          const indent = '\u00A0\u00A0\u00A0'.repeat(cat.depth) // 3 non-breaking spaces per level
                          const arrow = cat.depth > 0 ? '└─ ' : ''
                          
                          return (
                            <option key={cat.id} value={cat.id}>
                              {indent}{arrow}{cat.name}
                            </option>
                          )
                        })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select parent to create subcategory (supports unlimited levels)
                    </p>
                  </div>

                  {/* Settings */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-base">Settings</Label>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" {...register('showInMenu')} className="w-4 h-4" />
                        <span className="text-sm font-medium">Show in Menu</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" {...register('isFeatured')} className="w-4 h-4" />
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Featured on Homepage
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6 mt-1">
                        Featured categories appear in the "Shop by Category" section
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
