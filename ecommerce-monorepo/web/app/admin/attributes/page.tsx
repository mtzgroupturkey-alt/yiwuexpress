'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FolderTree,
  Folder,
  FolderOpen,
  Layers,
  Tag,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Info,
  Palette,
  Hash,
  AlignLeft,
  FileText,
  Calendar,
  CheckSquare,
  ListFilter,
  RefreshCw,
  LayoutGrid,
  LayoutList,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Filter,
  ArrowUpRight
} from 'lucide-react'
import { AttributeForm } from '@/components/admin/AttributeForm'
import { useAdminLocale } from '../contexts/AdminLocaleContext'
import { localizeCategory, localizeAttribute } from '@/lib/utils/localize'

export default function AttributeManager() {
  const { dict, locale } = useAdminLocale()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  // Category search & filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryFilterMode, setCategoryFilterMode] = useState<'all' | 'configured'>('all')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())

  // Attributes search & filter states within selected category
  const [attributeSearch, setAttributeSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'inherited'>('all')

  const queryClient = useQueryClient()

  // Fetch all categories with their attributes count
  const {
    data: categories,
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', 'with-attributes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/categories?includeAttributes=true')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  // Fetch attributes for a specific category
  const {
    data: categoryAttributes,
    isLoading: isLoadingAttributes,
    isFetching: isFetchingAttributes,
    refetch: refetchAttributes,
  } = useQuery({
    queryKey: ['category-attributes', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return { data: [], category: null }
      const res = await fetch(`/api/admin/categories/${selectedCategoryId}/attributes`)
      if (!res.ok) throw new Error('Failed to fetch attributes')
      return res.json()
    },
    enabled: !!selectedCategoryId,
  })

  // Delete attribute mutation
  const deleteAttribute = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete attribute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
      queryClient.invalidateQueries({ queryKey: ['categories', 'with-attributes'] })
      toast.success(dict.common?.deleteSuccess || 'Attribute deleted successfully')
    },
    onError: () => {
      toast.error(dict.common?.errorOccurred || 'Failed to delete attribute')
    },
  })

  // Toggle attribute visibility
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const res = await fetch(`/api/admin/attributes/${id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: visible }),
      })
      if (!res.ok) throw new Error('Failed to toggle visibility')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
      toast.success('Visibility updated')
    },
    onError: () => {
      toast.error('Failed to update visibility')
    },
  })

  const handleEdit = (attribute: any) => {
    setEditingAttribute(attribute)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm(dict.attributes?.deleteConfirm || 'Are you sure you want to delete this attribute?')) {
      deleteAttribute.mutate(id)
    }
  }

  const handleDialogClose = (success?: boolean) => {
    setIsDialogOpen(false)
    setEditingAttribute(null)
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['category-attributes'] })
      queryClient.invalidateQueries({ queryKey: ['categories', 'with-attributes'] })
    }
  }

  // Toggle category collapse in tree
  const toggleCategoryExpand = (categoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const expandAllCategories = () => {
    const parentIds = (categories?.data || [])
      .filter((c: any) => !c.parentId)
      .map((c: any) => c.id)
    setExpandedCategoryIds(new Set(parentIds))
  }

  const collapseAllCategories = () => {
    setExpandedCategoryIds(new Set())
  }

  // Category Tree Data & Search Filtering
  const categoryTreeData = useMemo(() => {
    const all = categories?.data || []
    const parents = all.filter((c: any) => !c.parentId)
    const children = all.filter((c: any) => c.parentId)

    // Build hierarchy
    const tree = parents.map((parent: any) => {
      const subCategories = children.filter((c: any) => c.parentId === parent.id)
      return {
        ...parent,
        subCategories,
        totalAttrCount: (parent._count?.attributes || 0) +
          subCategories.reduce((acc: number, sub: any) => acc + (sub._count?.attributes || 0), 0),
      }
    })

    return { all, parents, children, tree }
  }, [categories?.data])

  // Filtered Tree based on search & filter mode
  const filteredCategoryTree = useMemo(() => {
    const q = categorySearch.trim().toLowerCase()
    
    return categoryTreeData.tree.filter((parent: any) => {
      const parentName = localizeCategory(parent, locale).name.toLowerCase()
      const parentMatches = !q || parentName.includes(q)
      
      const matchingChildren = parent.subCategories.filter((child: any) => {
        const childName = localizeCategory(child, locale).name.toLowerCase()
        return !q || childName.includes(q)
      })

      const hasMatchingChild = matchingChildren.length > 0

      // If configured filter active: must have attributes
      if (categoryFilterMode === 'configured') {
        const parentHasAttrs = (parent._count?.attributes || 0) > 0
        const childHasAttrs = parent.subCategories.some((c: any) => (c._count?.attributes || 0) > 0)
        if (!parentHasAttrs && !childHasAttrs) return false
      }

      return parentMatches || hasMatchingChild
    })
  }, [categoryTreeData.tree, categorySearch, categoryFilterMode, locale])

  // Global KPI Metrics
  const metrics = useMemo(() => {
    const all = categoryTreeData.all
    const totalCategories = all.length
    const configuredCategories = all.filter((c: any) => (c._count?.attributes || 0) > 0).length
    
    let totalDirectAttributes = 0
    all.forEach((c: any) => {
      totalDirectAttributes += (c._count?.attributes || 0)
    })

    const selectedCategoryObj = all.find((c: any) => c.id === selectedCategoryId)
    const currentCategoryAttributes = categoryAttributes?.data || []
    const filterableCount = currentCategoryAttributes.filter((a: any) => a.isFilterable).length
    const variantCount = currentCategoryAttributes.filter((a: any) => a.isVariant).length

    return {
      totalCategories,
      configuredCategories,
      coveragePercent: totalCategories > 0 ? Math.round((configuredCategories / totalCategories) * 100) : 0,
      totalDirectAttributes,
      selectedCategoryObj,
      filterableCount,
      variantCount,
    }
  }, [categoryTreeData.all, selectedCategoryId, categoryAttributes?.data])

  // Selected Category Breadcrumb & Parent lookup
  const selectedCategoryMeta = useMemo(() => {
    if (!selectedCategoryId) return null
    const cat = categoryTreeData.all.find((c: any) => c.id === selectedCategoryId)
    if (!cat) return null

    let parentCat = null
    if (cat.parentId) {
      parentCat = categoryTreeData.all.find((c: any) => c.id === cat.parentId)
    }

    return {
      current: cat,
      parent: parentCat,
      hasParent: !!cat.parentId,
      name: localizeCategory(cat, locale).name,
      parentName: parentCat ? localizeCategory(parentCat, locale).name : null,
    }
  }, [selectedCategoryId, categoryTreeData.all, locale])

  // Filter attributes in current category
  const filteredAttributes = useMemo(() => {
    let list = categoryAttributes?.data || []

    // Search filter
    if (attributeSearch.trim()) {
      const q = attributeSearch.trim().toLowerCase()
      list = list.filter((attr: any) => {
        const localizedName = (attr.translations ? localizeAttribute(attr, locale).name : attr.name).toLowerCase()
        const rawName = (attr.name || '').toLowerCase()
        const slug = (attr.slug || '').toLowerCase()
        return localizedName.includes(q) || rawName.includes(q) || slug.includes(q)
      })
    }

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter((attr: any) => attr.type === typeFilter)
    }

    // Source filter (direct vs inherited)
    if (sourceFilter === 'direct') {
      list = list.filter((attr: any) => !attr.isInherited)
    } else if (sourceFilter === 'inherited') {
      list = list.filter((attr: any) => attr.isInherited)
    }

    return list
  }, [categoryAttributes?.data, attributeSearch, typeFilter, sourceFilter, locale])

  // Direct vs Inherited counts in current category
  const attributeStats = useMemo(() => {
    const list = categoryAttributes?.data || []
    const direct = list.filter((a: any) => !a.isInherited).length
    const inherited = list.filter((a: any) => a.isInherited).length
    return { total: list.length, direct, inherited }
  }, [categoryAttributes?.data])

  // Icon and badge styling for attribute types
  const getAttributeTypeMeta = (type: string) => {
    switch (type) {
      case 'SELECT':
        return {
          icon: ListFilter,
          label: dict.attributes?.types?.SELECT || 'Select',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10',
          iconClass: 'text-amber-600',
        }
      case 'MULTISELECT':
        return {
          icon: Layers,
          label: dict.attributes?.types?.MULTISELECT || 'Multi Select',
          badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/10',
          iconClass: 'text-orange-600',
        }
      case 'COLOR':
      case 'COLOR_MULTI':
        return {
          icon: Palette,
          label: type === 'COLOR' ? (dict.attributes?.types?.COLOR || 'Color Picker') : (dict.attributes?.types?.COLOR_MULTI || 'Multi Color'),
          badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 ring-1 ring-pink-500/10',
          iconClass: 'text-pink-600',
        }
      case 'NUMBER':
        return {
          icon: Hash,
          label: dict.attributes?.types?.NUMBER || 'Number',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
          iconClass: 'text-emerald-600',
        }
      case 'TEXT':
        return {
          icon: AlignLeft,
          label: dict.attributes?.types?.TEXT || 'Text',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10',
          iconClass: 'text-blue-600',
        }
      case 'TEXTAREA':
        return {
          icon: FileText,
          label: dict.attributes?.types?.TEXTAREA || 'Text Area',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/10',
          iconClass: 'text-indigo-600',
        }
      case 'CHECKBOX':
        return {
          icon: CheckSquare,
          label: dict.attributes?.types?.CHECKBOX || 'Checkbox',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-500/10',
          iconClass: 'text-slate-600',
        }
      case 'DATE':
        return {
          icon: Calendar,
          label: dict.attributes?.types?.DATE || 'Date',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10',
          iconClass: 'text-rose-600',
        }
      default:
        return {
          icon: Tag,
          label: type,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          iconClass: 'text-slate-600',
        }
    }
  }

  // Render options preview pills for select / color attributes
  const renderOptionsPreview = (attr: any) => {
    if (attr.type === 'COLOR' || attr.type === 'COLOR_MULTI') {
      const colors = Array.isArray(attr.colorOptions) ? attr.colorOptions : []
      if (!colors.length) return null
      return (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {colors.slice(0, 5).map((c: any, i: number) => (
            <span
              key={i}
              className="inline-block w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
              style={{ backgroundColor: c.value || '#000' }}
              title={c.label || c.value}
            />
          ))}
          {colors.length > 5 && (
            <span className="text-[11px] text-slate-500 font-medium">+{colors.length - 5}</span>
          )}
        </div>
      )
    }

    if (attr.type === 'SELECT' || attr.type === 'MULTISELECT') {
      const opts = Array.isArray(attr.options) ? attr.options : []
      if (!opts.length) return null
      return (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {opts.slice(0, 3).map((opt: any, i: number) => {
            const label = typeof opt === 'object' && opt !== null ? opt.label || opt.value : String(opt)
            return (
              <span
                key={i}
                className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-slate-100/80 text-slate-700 border border-slate-200/60 max-w-[140px] truncate"
                title={label}
              >
                {label}
              </span>
            )
          })}
          {opts.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              +{opts.length - 3}
            </span>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Top Header & Action Controls ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
            <span>Admin</span>
            <span>/</span>
            <span>Catalog</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Specifications & Attributes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] flex items-center justify-center text-white shadow-sm ring-4 ring-blue-50">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {dict.attributes?.title || 'Category Specification Attributes'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {dict.attributes?.subtitle || 'Configure specifications, dropdown options, and storefront faceted filters by category'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCategories()
              if (selectedCategoryId) refetchAttributes()
              toast.success('Data refreshed')
            }}
            className="h-10 text-slate-700 hover:text-slate-900 border-slate-200 bg-white shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingCategories || isFetchingAttributes ? 'animate-spin' : ''}`} />
            {dict.common?.refresh || 'Refresh'}
          </Button>

          <Button
            onClick={() => {
              setEditingAttribute(null)
              setIsDialogOpen(true)
            }}
            disabled={!selectedCategoryId}
            className="h-10 bg-[#1a3a5c] hover:bg-[#254f7d] text-white shadow-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {dict.attributes?.addAttribute || 'Add Attribute'}
          </Button>
        </div>
      </div>

      {/* ── KPI Metrics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Category Coverage */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Category Coverage</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {metrics.configuredCategories} <span className="text-sm font-normal text-slate-400">/ {metrics.totalCategories}</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metrics.coveragePercent}% categories configured</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Attributes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Catalog Attributes</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {metrics.totalDirectAttributes}
            </div>
            <div className="text-xs text-slate-500 mt-1">Direct specification rules</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Category Specs */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Selected Category</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {selectedCategoryId ? attributeStats.total : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedCategoryId
                ? `${attributeStats.direct} direct • ${attributeStats.inherited} inherited`
                : 'Select category below'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Filterable Facets */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filterable Facets</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {selectedCategoryId ? metrics.filterableCount : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedCategoryId ? `${metrics.variantCount} variant attributes` : 'Active in sidebar filters'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
            <Filter className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Category Tree Navigator (4 cols) ───────────────── */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#1a3a5c]" />
                  <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {dict.categories?.title || 'Category Tree'}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs bg-white text-slate-700 border-slate-200">
                  {filteredCategoryTree.length} parent categories
                </Badge>
              </div>

              {/* Search Category */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="pl-9 pr-8 h-9 text-xs bg-white border-slate-200 rounded-lg"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View filters & expand toggles */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                  <button
                    onClick={() => setCategoryFilterMode('all')}
                    className={`px-2 py-1 rounded-md transition-all text-xs font-medium ${
                      categoryFilterMode === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilterMode('configured')}
                    className={`px-2 py-1 rounded-md transition-all text-xs font-medium ${
                      categoryFilterMode === 'configured'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Configured Only
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <button
                    onClick={expandAllCategories}
                    className="hover:text-slate-800 text-[11px] underline underline-offset-2"
                  >
                    Expand All
                  </button>
                  <span>•</span>
                  <button
                    onClick={collapseAllCategories}
                    className="hover:text-slate-800 text-[11px] underline underline-offset-2"
                  >
                    Collapse
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2 max-h-[680px] overflow-y-auto space-y-1 divide-y divide-slate-50">
              {isLoadingCategories ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#1a3a5c]" />
                  <span>Loading category tree...</span>
                </div>
              ) : filteredCategoryTree.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <p>No matching categories found</p>
                  {categorySearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategorySearch('')}
                      className="mt-2 text-xs text-[#1a3a5c]"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                filteredCategoryTree.map((parent: any) => {
                  const isSelected = selectedCategoryId === parent.id
                  const isExpanded = expandedCategoryIds.has(parent.id) || !!categorySearch
                  const subCategories = parent.subCategories || []
                  const hasChildren = subCategories.length > 0
                  const directAttrCount = parent._count?.attributes || 0

                  return (
                    <div key={parent.id} className="pt-1 first:pt-0">
                      {/* Parent Category Row */}
                      <div
                        onClick={() => setSelectedCategoryId(parent.id)}
                        className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300/50 text-[#1a3a5c]'
                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Collapse Chevron */}
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={(e) => toggleCategoryExpand(parent.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-5 shrink-0" />
                          )}

                          {/* Folder Icon */}
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                            }`}
                          >
                            {isExpanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                          </div>

                          <span className={`text-xs truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                            {localizeCategory(parent, locale).name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {directAttrCount > 0 ? (
                            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-1.5 py-0">
                              {directAttrCount} {directAttrCount === 1 ? 'spec' : 'specs'}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400 px-1">0</span>
                          )}

                          {hasChildren && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {subCategories.length} sub
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subcategories (Children) */}
                      {hasChildren && isExpanded && (
                        <div className="ml-5 pl-2 my-1 border-l-2 border-slate-100 space-y-0.5">
                          {subCategories.map((child: any) => {
                            const isChildSelected = selectedCategoryId === child.id
                            const childAttrCount = child._count?.attributes || 0

                            return (
                              <div
                                key={child.id}
                                onClick={() => setSelectedCategoryId(child.id)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isChildSelected
                                    ? 'bg-sky-50/90 border-sky-300 ring-1 ring-sky-300/50 text-[#1a3a5c] font-semibold'
                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Tag className={`w-3 h-3 shrink-0 ${isChildSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                                  <span className="text-xs truncate">
                                    {localizeCategory(child, locale).name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {childAttrCount > 0 ? (
                                    <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0">
                                      {childAttrCount}
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 px-1">0</span>
                                  )}

                                  {directAttrCount > 0 && (
                                    <span
                                      className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded"
                                      title={`Inherits ${directAttrCount} attributes from ${localizeCategory(parent, locale).name}`}
                                    >
                                      +{directAttrCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Attributes Workspace (8 cols) ─────────────────── */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {!selectedCategoryId ? (
            /* Empty State: No category chosen yet */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#1a3a5c] shadow-xs mb-4 ring-8 ring-slate-100">
                <FolderTree className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {dict.attributes?.selectCategory || 'Select a Category'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 mb-6 leading-relaxed">
                {dict.attributes?.selectCategoryHelp ||
                  'Select any category from the left panel to inspect, add, or configure its specification attributes, options, and storefront filters.'}
              </p>

              {/* Quick Jump Suggestions */}
              {categoryTreeData.parents.length > 0 && (
                <div className="w-full max-w-lg">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Top Product Categories
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryTreeData.parents.slice(0, 6).map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#1a3a5c] hover:bg-slate-50 transition-all text-left text-xs font-semibold text-slate-700 hover:text-slate-900 group shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="w-3.5 h-3.5 text-[#1a3a5c] shrink-0" />
                          <span className="truncate">{localizeCategory(cat, locale).name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1a3a5c] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Category Context Banner */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    {selectedCategoryMeta?.parentName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                        <span>{selectedCategoryMeta.parentName}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-slate-600 font-semibold">{selectedCategoryMeta.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedCategoryMeta?.name}
                      </h2>
                      <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 font-mono">
                        {selectedCategoryMeta?.current.slug}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setEditingAttribute(null)
                      setIsDialogOpen(true)
                    }}
                    className="bg-[#1a3a5c] hover:bg-[#254f7d] text-white shadow-xs font-medium text-xs h-9"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    {dict.attributes?.addAttribute || 'Add Attribute'}
                  </Button>
                </div>

                {/* Inherited Cascade Callout */}
                {attributeStats.inherited > 0 && selectedCategoryMeta?.parent && (
                  <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-sky-100 rounded-lg text-sky-700 shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-900">
                          Inherits {attributeStats.inherited} Specifications from {selectedCategoryMeta.parentName}
                        </h4>
                        <p className="text-[11px] text-sky-700 mt-0.5 leading-relaxed">
                          Parent category attributes automatically apply to products here to ensure catalog consistency.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategoryId(selectedCategoryMeta.parent!.id)}
                      className="shrink-0 bg-white hover:bg-sky-50 border-sky-300 text-sky-800 text-xs h-8 font-medium shadow-2xs"
                    >
                      Manage in {selectedCategoryMeta.parentName}
                      <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Button>
                  </div>
                )}

                {/* Search, Filter & View Mode Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={attributeSearch}
                        onChange={(e) => setAttributeSearch(e.target.value)}
                        placeholder="Search specifications by name..."
                        className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg"
                      />
                      {attributeSearch && (
                        <button
                          onClick={() => setAttributeSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
                    >
                      <option value="all">All Types</option>
                      <option value="SELECT">Select (Dropdown)</option>
                      <option value="MULTISELECT">Multi Select</option>
                      <option value="COLOR">Color</option>
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="CHECKBOX">Checkbox</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Source Tab (All / Direct / Inherited) */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setSourceFilter('all')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          sourceFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({attributeStats.total})
                      </button>
                      <button
                        onClick={() => setSourceFilter('direct')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          sourceFilter === 'direct'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Direct ({attributeStats.direct})
                      </button>
                      {attributeStats.inherited > 0 && (
                        <button
                          onClick={() => setSourceFilter('inherited')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            sourceFilter === 'inherited'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Inherited ({attributeStats.inherited})
                        </button>
                      )}
                    </div>

                    {/* View Switcher (Table / Grid) */}
                    <div className="flex items-center border border-slate-200 bg-white p-0.5 rounded-lg">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${
                          viewMode === 'table' ? 'bg-slate-100 text-[#1a3a5c]' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Table View"
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-md transition-all ${
                          viewMode === 'cards' ? 'bg-slate-100 text-[#1a3a5c]' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Cards View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attributes Content: Table or Cards */}
              <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {isLoadingAttributes ? (
                    <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#1a3a5c]" />
                      <span>{dict.attributes?.loadingAttributes || 'Loading attributes...'}</span>
                    </div>
                  ) : filteredAttributes.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3">
                        <SlidersHorizontal className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {attributeSearch || typeFilter !== 'all' || sourceFilter !== 'all'
                          ? 'No matching attributes found'
                          : dict.attributes?.noAttributes || 'No attributes defined for this category'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        {attributeSearch || typeFilter !== 'all' || sourceFilter !== 'all'
                          ? 'Try adjusting your search query or filter tags to reveal more attributes.'
                          : 'Define product specifications, dimensions, material types, or filter options for this category.'}
                      </p>

                      {attributeSearch || typeFilter !== 'all' || sourceFilter !== 'all' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAttributeSearch('')
                            setTypeFilter('all')
                            setSourceFilter('all')
                          }}
                          className="text-xs text-slate-700 border-slate-200"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setEditingAttribute(null)
                            setIsDialogOpen(true)
                          }}
                          className="bg-[#1a3a5c] hover:bg-[#254f7d] text-white text-xs h-9 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          {dict.attributes?.addFirstAttribute || 'Add First Attribute'}
                        </Button>
                      )}
                    </div>
                  ) : viewMode === 'table' ? (
                    /* ── Table View ────────────────────────────────────────── */
                    <Table>
                      <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[38%] text-xs font-bold uppercase tracking-wider text-slate-600">
                            {dict.attributes?.attributeName || 'Specification Attribute'}
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            {dict.attributes?.attributeType || 'Type'}
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Configuration & Rules
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            {dict.attributes?.visible || 'Visible'}
                          </TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-600 min-w-[170px]">
                            {dict.common?.actions || 'Actions'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {filteredAttributes.map((attr: any) => {
                          const typeMeta = getAttributeTypeMeta(attr.type)
                          const TypeIcon = typeMeta.icon
                          const localizedName = attr.translations
                            ? localizeAttribute(attr, locale).name
                            : attr.name

                          return (
                            <TableRow
                              key={attr.id}
                              className={`transition-colors ${
                                attr.isInherited
                                  ? 'bg-slate-50/40 hover:bg-slate-50/80'
                                  : 'hover:bg-blue-50/30'
                              }`}
                            >
                              {/* Specification Name & Options */}
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-900">
                                      {localizedName}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {attr.slug}
                                    </span>
                                    {attr.isInherited && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                      >
                                        Inherited from {attr.inheritedFrom}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Helper text or preview */}
                                  {attr.helperText && (
                                    <p className="text-[11px] text-slate-400 italic">
                                      {attr.helperText}
                                    </p>
                                  )}

                                  {/* Render options / swatches preview */}
                                  {renderOptionsPreview(attr)}
                                </div>
                              </TableCell>

                              {/* Attribute Type */}
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${typeMeta.badgeClass}`}
                                >
                                  <TypeIcon className={`w-3.5 h-3.5 ${typeMeta.iconClass}`} />
                                  <span>{typeMeta.label}</span>
                                </Badge>
                              </TableCell>

                              {/* Rules & Badges */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {attr.isRequired ? (
                                    <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">
                                      Required
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">Optional</span>
                                  )}

                                  {attr.isFilterable && (
                                    <Badge className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                      Filter
                                    </Badge>
                                  )}

                                  {attr.isVariant && (
                                    <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                      Variant
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* Visibility Toggle */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={attr.isVisible}
                                    onCheckedChange={() =>
                                      toggleVisibility.mutate({
                                        id: attr.id,
                                        visible: !attr.isVisible,
                                      })
                                    }
                                    disabled={attr.isInherited}
                                  />
                                  <span className="text-xs text-slate-500">
                                    {attr.isVisible ? 'Live' : 'Hidden'}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="py-3 text-right">
                                {!attr.isInherited ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(attr)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 shadow-2xs transition-all group cursor-pointer"
                                      title="Edit attribute"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-colors" />
                                      <span>{dict.common?.edit || 'Edit'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(attr.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 shadow-2xs transition-all group cursor-pointer"
                                      title="Delete attribute"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600 group-hover:text-white transition-colors" />
                                      <span>{dict.common?.delete || 'Delete'}</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    {dict.attributes?.readOnly || 'Inherited (Read-only)'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    /* ── Cards View ─────────────────────────────────────────── */
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredAttributes.map((attr: any) => {
                        const typeMeta = getAttributeTypeMeta(attr.type)
                        const TypeIcon = typeMeta.icon
                        const localizedName = attr.translations
                          ? localizeAttribute(attr, locale).name
                          : attr.name

                        return (
                          <div
                            key={attr.id}
                            className={`p-4 rounded-xl border transition-all space-y-3 ${
                              attr.isInherited
                                ? 'bg-slate-50/60 border-slate-200'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {localizedName}
                                  </h4>
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {attr.slug}
                                  </span>
                                </div>
                                {attr.isInherited && (
                                  <span className="text-[10px] text-blue-600 font-medium">
                                    Inherited from {attr.inheritedFrom}
                                  </span>
                                )}
                              </div>

                              <Badge
                                variant="outline"
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium shrink-0 ${typeMeta.badgeClass}`}
                              >
                                <TypeIcon className={`w-3 h-3 ${typeMeta.iconClass}`} />
                                <span>{typeMeta.label}</span>
                              </Badge>
                            </div>

                            {/* Options preview */}
                            <div>{renderOptionsPreview(attr)}</div>

                            {/* Configuration Chips & Switch Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              <div className="flex items-center gap-1.5">
                                {attr.isRequired ? (
                                  <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">
                                    Required
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Optional</span>
                                )}
                                {attr.isFilterable && (
                                  <Badge className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                    Filter
                                  </Badge>
                                )}
                                {attr.isVariant && (
                                  <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                    Variant
                                  </Badge>
                                )}
                              </div>

                              {!attr.isInherited ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(attr)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 shadow-2xs transition-all group cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3 text-blue-600 group-hover:text-white transition-colors" />
                                    <span>{dict.common?.edit || 'Edit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(attr.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 shadow-2xs transition-all group cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600 group-hover:text-white transition-colors" />
                                    <span>{dict.common?.delete || 'Delete'}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  {dict.attributes?.readOnly || 'Read-only'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Attribute Form Dialog ─────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={() => handleDialogClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
          <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {editingAttribute
                    ? dict.attributes?.editAttribute || 'Edit Specification Attribute'
                    : dict.attributes?.addAttribute || 'Add New Specification Attribute'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {selectedCategoryMeta?.name
                    ? `Assigning specification to ${selectedCategoryMeta.name}`
                    : dict.attributes?.subtitle || 'Configure attribute settings and translations'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <AttributeForm
              initialData={editingAttribute}
              categoryId={selectedCategoryId}
              onSuccess={() => handleDialogClose(true)}
              onCancel={() => handleDialogClose()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
