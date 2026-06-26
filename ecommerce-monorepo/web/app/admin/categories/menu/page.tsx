'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  level: number
  displayOrder: number
  menuOrder: number
  isActive: boolean
  showInMenu: boolean
  isFeatured: boolean
  parentId: string | null
  children: CategoryItem[]
  productCount: number
}

interface SortableCategoryItemProps {
  category: CategoryItem
  onEdit: (category: CategoryItem) => void
  onDelete: (id: string) => void
  onToggleMenu: (id: string, show: boolean) => void
  level?: number
  isOverlay?: boolean
}

function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  onToggleMenu,
  level = 0,
  isOverlay = false,
}: SortableCategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: category.id,
    data: {
      type: 'category',
      category,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasChildren = category.children && category.children.length > 0

  return (
    <>
      <div ref={setNodeRef} style={style} className="mb-1">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-[#1a3a5c] active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-[#1a3a5c]"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${
                  category.isActive ? 'text-gray-900' : 'text-gray-400 line-through'
                }`}
              >
                {category.name}
              </span>
              {!category.showInMenu && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                  Hidden
                </span>
              )}
              {category.isFeatured && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                  Featured
                </span>
              )}
              <span className="text-xs text-gray-400">
                ({category.productCount} products)
              </span>
            </div>
            {category.slug && (
              <span className="text-xs text-gray-400">/{category.slug}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Show/Hide in Menu */}
            <button
              onClick={() => onToggleMenu(category.id, !category.showInMenu)}
              className={`p-1.5 rounded hover:bg-gray-100 transition ${
                category.showInMenu ? 'text-blue-500' : 'text-gray-400'
              }`}
              title={category.showInMenu ? 'Hide from menu' : 'Show in menu'}
            >
              {category.showInMenu ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 rounded hover:bg-gray-100 transition text-gray-500 hover:text-[#1a3a5c]"
              title="Edit category"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(category.id)}
              className="p-1.5 rounded hover:bg-red-50 transition text-gray-500 hover:text-red-500"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {category.children.map((child) => (
              <SortableCategoryItem
                key={child.id}
                category={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleMenu={onToggleMenu}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function CategoryMenuManager() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchCategories = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/categories/tree')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      } else {
        setError(data.error || 'Failed to load categories')
      }
    } catch (err) {
      setError('Network error loading categories')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const flattenCategories = (
    items: CategoryItem[],
    parentId: string | null = null,
    level: number = 1
  ): any[] => {
    let result: any[] = []
    items.forEach((item, index) => {
      result.push({
        id: item.id,
        parentId,
        menuOrder: index,
        level,
      })
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenCategories(item.children, item.id, level + 1))
      }
    })
    return result
  }

  // Normalize menuOrder after reordering to ensure sequential values
  const normalizeMenuOrder = (items: CategoryItem[]): CategoryItem[] => {
    return items.map((item, index) => ({
      ...item,
      menuOrder: index,
      children: item.children ? normalizeMenuOrder(item.children) : []
    }))
  }

  const handleSaveOrder = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const flatData = flattenCategories(categories)
      const response = await fetch('/api/admin/categories/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: flatData }),
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Category order saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save order')
      }
    } catch (err) {
      setError('Network error saving order')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    // Helper to find a category and its parent in the tree
    const findCategoryAndParent = (
      items: CategoryItem[],
      id: string,
      parent: CategoryItem | null = null
    ): { category: CategoryItem; parent: CategoryItem | null; siblings: CategoryItem[] } | null => {
      for (const item of items) {
        if (item.id === id) {
          return { category: item, parent, siblings: items }
        }
        if (item.children && item.children.length > 0) {
          const found = findCategoryAndParent(item.children, id, item)
          if (found) return found
        }
      }
      return null
    }

    // Helper to reorder categories recursively
    const reorderCategories = (items: CategoryItem[]): CategoryItem[] => {
      const activeData = findCategoryAndParent(items, active.id as string)
      const overData = findCategoryAndParent(items, over.id as string)

      if (!activeData || !overData) return items

      // Check if both items are siblings (same parent)
      const activeSiblings = activeData.siblings
      const overSiblings = overData.siblings

      // If they're in the same list (siblings), reorder them
      if (activeSiblings === overSiblings) {
        const oldIndex = activeSiblings.findIndex((i) => i.id === active.id)
        const newIndex = activeSiblings.findIndex((i) => i.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(activeSiblings, oldIndex, newIndex)
          
          // If root level
          if (activeData.parent === null) {
            return reordered
          }
          
          // If nested, need to rebuild the tree
          const updateChildren = (items: CategoryItem[]): CategoryItem[] => {
            return items.map((item) => {
              if (item.id === activeData.parent?.id) {
                return { ...item, children: reordered }
              }
              if (item.children && item.children.length > 0) {
                return { ...item, children: updateChildren(item.children) }
              }
              return item
            })
          }
          return updateChildren(items)
        }
      }

      return items
    }

    const reordered = reorderCategories(categories)
    setCategories(normalizeMenuOrder(reordered))
  }

  const handleToggleMenu = async (id: string, show: boolean) => {
    // Optimistically update UI first
    const updateCategory = (items: CategoryItem[]): CategoryItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, showInMenu: show }
        }
        if (item.children) {
          return { ...item, children: updateCategory(item.children) }
        }
        return item
      })
    }
    
    // Update UI immediately
    setCategories(updateCategory(categories))

    // Then persist to database
    try {
      const categoryToUpdate = findCategoryById(categories, id)
      if (!categoryToUpdate) {
        setError('Category not found')
        return
      }

      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryToUpdate.name,
          slug: categoryToUpdate.slug,
          description: categoryToUpdate.description,
          image: categoryToUpdate.image,
          icon: categoryToUpdate.icon,
          parentId: categoryToUpdate.parentId,
          isActive: categoryToUpdate.isActive,
          showInMenu: show,
          isFeatured: categoryToUpdate.isFeatured,
        }),
      })

      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Failed to update category visibility')
        // Revert the change on error
        setCategories(updateCategory(categories))
      } else {
        setSuccess(`Category ${show ? 'shown in' : 'hidden from'} menu`)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError('Network error updating category')
      console.error(err)
      // Revert the change on error
      const revertCategory = (items: CategoryItem[]): CategoryItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, showInMenu: !show }
          }
          if (item.children) {
            return { ...item, children: revertCategory(item.children) }
          }
          return item
        })
      }
      setCategories(revertCategory(categories))
    }
  }

  // Helper function to find a category by ID
  const findCategoryById = (items: CategoryItem[], id: string): CategoryItem | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findCategoryById(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  const handleEdit = (category: CategoryItem) => {
    // For now, just alert - you can implement a modal here
    alert(`Edit functionality coming soon for: ${category.name}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Category deleted successfully')
        fetchCategories()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to delete category')
      }
    } catch (err) {
      setError('Network error deleting category')
      console.error(err)
    }
  }

  const handleAdd = () => {
    alert('Add category functionality coming soon!')
  }

  const getAllCategoryIds = (items: CategoryItem[]): string[] => {
    let ids: string[] = []
    items.forEach((item) => {
      ids.push(item.id)
      if (item.children) {
        ids = ids.concat(getAllCategoryIds(item.children))
      }
    })
    return ids
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">
            Category Menu Manager
          </h1>
          <p className="text-gray-500 mt-1">
            Drag and drop to reorder categories, create hierarchies, and control menu
            visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1a3a5c] rounded-lg hover:bg-[#2a5a8c] transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu Structure</h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag categories up/down to reorder. Use the eye icon to show/hide from
            menu.
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No categories found. Create your first category to start building your
                menu.
              </p>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1a3a5c] rounded-lg hover:bg-[#2a5a8c] transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={getAllCategoryIds(categories)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {categories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleMenu={handleToggleMenu}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Drag and drop to reorder. Changes are saved when you
            click "Save Changes". Up to 3 levels of nesting supported.
          </p>
        </div>
      </div>
    </div>
  )
}
