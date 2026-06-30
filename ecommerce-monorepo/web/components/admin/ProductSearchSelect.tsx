'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Check, X, ChevronDown } from 'lucide-react'

interface ProductSearchSelectProps {
  products: any[]
  onSelect: (product: any) => void
  onClose: () => void
  selectedIds: string[]
}

export function ProductSearchSelect({
  products,
  onSelect,
  onClose,
  selectedIds,
}: ProductSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
        setCategorySearch('')
      }
    }

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCategoryDropdownOpen])

  // Build category hierarchy (parent → child)
  const categoryHierarchy = useMemo(() => {
    const uniqueCategories = new Map()
    
    // Collect all unique categories with their full data
    products.forEach(p => {
      if (p.category) {
        uniqueCategories.set(p.category.id, p.category)
      }
    })

    const categories = Array.from(uniqueCategories.values())
    
    // Sort by parent-child relationship and name
    const parentCategories = categories.filter(c => !c.parentId)
    const childCategories = categories.filter(c => c.parentId)
    
    const result: any[] = []
    
    // Add parent categories
    parentCategories
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(parent => {
        result.push({ ...parent, isParent: true })
        
        // Add children of this parent
        childCategories
          .filter(child => child.parentId === parent.id)
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(child => {
            result.push({ ...child, isChild: true, parentName: parent.name })
          })
      })
    
    // Add orphan children (categories with parentId but parent not in list)
    childCategories
      .filter(child => !parentCategories.find(p => p.id === child.parentId))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(child => {
        result.push({ ...child, isChild: false })
      })
    
    return result
  }, [products])

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categoryHierarchy
    
    const searchLower = categorySearch.toLowerCase()
    return categoryHierarchy.filter(cat => 
      cat.name.toLowerCase().includes(searchLower) ||
      (cat.parentName && cat.parentName.toLowerCase().includes(searchLower))
    )
  }, [categoryHierarchy, categorySearch])

  // Get selected category name
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'All Categories'
    const category = categoryHierarchy.find(c => c.id === selectedCategoryId)
    if (!category) return 'All Categories'
    return category.isChild ? `↳ ${category.name}` : category.name
  }, [selectedCategoryId, categoryHierarchy])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategoryId || product.category?.id === selectedCategoryId
    const notSelected = !selectedIds.includes(product.id)
    return matchesSearch && matchesCategory && notSelected
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        
        {/* Searchable Category Dropdown */}
        <div className="relative min-w-[220px]" ref={categoryDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-left flex items-center justify-between hover:bg-gray-50"
          >
            <span className="truncate">{selectedCategoryName}</span>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
          </button>
          
          {isCategoryDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* Category Search Input */}
              <div className="p-2 border-b sticky top-0 bg-white">
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Category List */}
              <div className="max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('')
                    setIsCategoryDropdownOpen(false)
                    setCategorySearch('')
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  {!selectedCategoryId && <Check className="w-4 h-4 text-blue-600" />}
                  <span className={!selectedCategoryId ? 'font-medium' : ''}>All Categories</span>
                </button>
                
                {filteredCategories.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    No categories found
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id)
                        setIsCategoryDropdownOpen(false)
                        setCategorySearch('')
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      {selectedCategoryId === cat.id && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span 
                        className={`${selectedCategoryId === cat.id ? 'font-medium' : ''} ${cat.isChild ? 'pl-4' : ''}`}
                      >
                        {cat.isChild ? `↳ ${cat.name}` : cat.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No products found matching your search' : 'All products have been added'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => onSelect(product)}
              >
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku || 'N/A'} • {product.category?.name || 'Uncategorized'}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <div className="font-medium">${product.price?.toFixed(2) || '0.00'}</div>
                  <div className="text-sm text-gray-500">Stock: {product.stock || 0}</div>
                  {product.costPrice && (
                    <div className="text-xs text-gray-400">Cost: ${product.costPrice.toFixed(2)}</div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1a3a5c]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(product)
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {filteredProducts.length} products available
        </span>
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>
    </div>
  )
}
