'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  level?: number
  children?: Category[]
}

interface CategoryDropdownProps {
  categories: Category[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  clearable?: boolean
  showPath?: boolean
  showLevelIndicator?: boolean
}

export function CategoryDropdown({
  categories,
  value,
  onChange,
  placeholder = 'Select a category',
  searchPlaceholder = 'Search categories...',
  className,
  disabled = false,
  required = false,
  clearable = true,
  showPath = true,
  showLevelIndicator = true,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Build hierarchical tree structure
  const categoryTree = useMemo(() => {
    if (!categories || categories.length === 0) return []
    return buildCategoryTree(categories)
  }, [categories])

  // Find category by ID
  const selectedCategory = useMemo(() => {
    if (!value) return null
    return findCategoryById(categoryTree, value)
  }, [categoryTree, value])

  // Get category path (parents)
  const getCategoryPath = (category: Category): string => {
    const path: string[] = []
    let current: Category | null = category
    while (current) {
      path.unshift(current.name)
      current = findParent(categoryTree, current.id) || null
    }
    return path.join(' > ')
  }

  // Build hierarchical display name
  const getDisplayName = (category: Category): string => {
    if (showPath) {
      return getCategoryPath(category)
    }
    return category.name
  }

  // Filter categories with search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categoryTree)
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const filtered = filterCategoriesRecursive(categoryTree, term)
    setFilteredCategories(filtered)
  }, [searchTerm, categoryTree])

  // Debug: Log categories
  useEffect(() => {
    console.log('CategoryDropdown - categories:', categories)
    console.log('CategoryDropdown - categoryTree:', categoryTree)
    console.log('CategoryDropdown - value:', value)
  }, [categories, categoryTree, value])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSelect = (category: Category) => {
    onChange(category.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchTerm('')
      }
    }
  }

  // Count total categories
  const totalCategories = useMemo(() => {
    return countCategories(filteredCategories)
  }, [filteredCategories])

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Dropdown Trigger */}
      <div
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white cursor-pointer transition-colors',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          isOpen && 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]/20',
          !isOpen && 'hover:border-gray-400',
          required && !value && 'border-red-300'
        )}
        onClick={handleToggle}
      >
        <span className={cn(
          'truncate',
          !selectedCategory && 'text-gray-400'
        )}>
          {selectedCategory ? getDisplayName(selectedCategory) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {clearable && selectedCategory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="p-0.5 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No categories found
              </div>
            ) : (
              <CategoryTree
                categories={filteredCategories}
                selectedId={value || null}
                onSelect={handleSelect}
                showLevelIndicator={showLevelIndicator}
                searchTerm={searchTerm}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>{totalCategories} {totalCategories === 1 ? 'category' : 'categories'}</span>
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#1a3a5c] hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: Build category tree structure
function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // Second pass: build tree
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(category)
      } else {
        rootCategories.push(category)
      }
    } else {
      rootCategories.push(category)
    }
  })

  return rootCategories
}

// Helper: Find category by ID in nested tree
function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

// Helper: Find parent of a category
function findParent(categories: Category[], childId: string): Category | null {
  for (const cat of categories) {
    if (cat.children) {
      if (cat.children.some(c => c.id === childId)) return cat
      const found = findParent(cat.children, childId)
      if (found) return found
    }
  }
  return null
}

// Helper: Filter categories recursively
function filterCategoriesRecursive(categories: Category[], term: string): Category[] {
  const result: Category[] = []

  for (const cat of categories) {
    const matches = cat.name.toLowerCase().includes(term)
    const filteredChildren = cat.children ? filterCategoriesRecursive(cat.children, term) : []

    if (matches || filteredChildren.length > 0) {
      result.push({
        ...cat,
        children: filteredChildren
      })
    }
  }

  return result
}

// Helper: Count total categories
function countCategories(categories: Category[]): number {
  let count = 0
  for (const cat of categories) {
    count++
    if (cat.children && cat.children.length > 0) {
      count += countCategories(cat.children)
    }
  }
  return count
}

// Category Tree Renderer
interface CategoryTreeProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (category: Category) => void
  showLevelIndicator: boolean
  searchTerm: string
}

function CategoryTree({ categories, selectedId, onSelect, showLevelIndicator, searchTerm }: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Auto-expand all categories on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const allIds = new Set<string>()
      const collectIds = (cats: Category[]) => {
        cats.forEach(cat => {
          if (cat.children && cat.children.length > 0) {
            allIds.add(cat.id)
            collectIds(cat.children)
          }
        })
      }
      collectIds(categories)
      setExpandedIds(allIds)
    } else {
      // Auto-expand selected category's parents
      if (selectedId) {
        const expandParents = (cats: Category[], targetId: string, parents: Set<string> = new Set()): Set<string> => {
          for (const cat of cats) {
            if (cat.id === targetId) {
              return parents
            }
            if (cat.children && cat.children.length > 0) {
              const childParents = new Set(parents)
              childParents.add(cat.id)
              const result = expandParents(cat.children, targetId, childParents)
              if (result.size > 0) {
                return result
              }
            }
          }
          return new Set()
        }
        const parentIds = expandParents(categories, selectedId)
        setExpandedIds(parentIds)
      }
    }
  }, [searchTerm, categories, selectedId])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderTree = (items: Category[], level: number = 0): React.ReactNode => {
    return items.map((category) => {
      const hasChildren = category.children && category.children.length > 0
      const isSelected = selectedId === category.id
      const isExpanded = expandedIds.has(category.id)
      const indent = level * 16

      return (
        <div key={category.id}>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors group',
              isSelected && 'bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/15'
            )}
            style={{ paddingLeft: `${indent + 8}px` }}
            onClick={() => onSelect(category)}
          >
            {/* Expand/Collapse for categories with children */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(category.id)
                }}
                className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-5 flex-shrink-0" />
            )}

            {/* Category Name */}
            <span className={cn(
              'text-sm flex-1 truncate',
              isSelected && 'font-medium text-[#1a3a5c]',
              !isSelected && 'text-gray-700'
            )}>
              {category.name}
            </span>

            {/* Level Badge */}
            {showLevelIndicator && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                L{level + 1}
              </span>
            )}

            {/* Checkmark for selected */}
            {isSelected && (
              <Check className="w-4 h-4 text-[#1a3a5c] flex-shrink-0" />
            )}
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div>
              {renderTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return <>{renderTree(categories)}</>
}
