'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
  productCount?: number
}

export function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCategories = async () => {
    try {
      console.log('[CategoryMenu] Fetching categories from API...')
      const response = await fetch('/api/categories?includeChildren=true')
      console.log('[CategoryMenu] Response status:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[CategoryMenu] Raw API data:', data)
        
        // API returns { success: true, data: [...] } not { success: true, categories: [...] }
        const allCategories = data.data || data.categories || []
        console.log('[CategoryMenu] All categories count:', allCategories.length)
        
        // Only show parent categories (no parentId) that are active and showInMenu
        const parentCategories = allCategories
          .filter((cat: any) => {
            const isParent = !cat.parentId
            const isActive = cat.isActive !== false // Default to true if undefined
            const showInMenu = cat.showInMenu !== false // Default to true if undefined
            console.log(`[CategoryMenu] ${cat.name}: isParent=${isParent}, isActive=${isActive}, showInMenu=${showInMenu}`)
            return isParent && isActive && showInMenu
          })
          .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
        
        console.log('[CategoryMenu] Filtered parent categories:', parentCategories.length)
        
        // Map to include children and grandchildren, sorted by menuOrder
        const categoriesWithChildren = parentCategories.map((cat: any) => {
          const children = allCategories
            .filter((child: any) => child.parentId === cat.id && child.isActive !== false && child.showInMenu !== false)
            .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
            .map((child: any) => {
              // Get level 3 subcategories (grandchildren)
              const grandchildren = allCategories
                .filter((grandchild: any) => grandchild.parentId === child.id && grandchild.isActive !== false && grandchild.showInMenu !== false)
                .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
                .map((grandchild: any) => ({
                  id: grandchild.id,
                  name: grandchild.name,
                  slug: grandchild.slug,
                  productCount: grandchild._count?.products || 0
                }))

              return {
                id: child.id,
                name: child.name,
                slug: child.slug,
                productCount: child._count?.products || 0,
                children: grandchildren
              }
            })
          
          return {
            id: cat.id,
            name: cat.name.toUpperCase(),
            slug: cat.slug,
            children
          }
        })
        
        setCategories(categoriesWithChildren)
        console.log('[CategoryMenu] Final categories set:', categoriesWithChildren.length)
        console.log('[CategoryMenu] Categories with children:', categoriesWithChildren.map(c => ({
          name: c.name,
          childrenCount: c.children?.length || 0,
          children: c.children?.map(ch => ch.name)
        })))
      } else {
        console.error('[CategoryMenu] API response not ok:', response.status, response.statusText)
        // Load static fallback categories
        loadFallbackCategories()
      }
    } catch (error) {
      console.error('[CategoryMenu] Failed to fetch categories:', error)
      // Load static fallback categories
      loadFallbackCategories()
    } finally {
      setLoading(false)
    }
  }

  const loadFallbackCategories = () => {
    console.log('[CategoryMenu] Loading fallback static categories')
    setCategories([
      { id: '1', name: 'ALL', slug: 'all', children: [] },
      { id: '2', name: 'COOKWARE', slug: 'cookware', children: [] },
      { id: '3', name: 'BAKEWARE', slug: 'bakeware', children: [] },
      { id: '4', name: 'UTENSILS', slug: 'utensils', children: [] },
      { id: '5', name: 'APPLIANCES', slug: 'appliances', children: [] },
      { id: '6', name: 'TABLEWARE', slug: 'tableware', children: [] },
    ])
  }

  if (loading) {
    return (
      <div className="bg-[#1a3a5c] text-white">
        <Container>
          <nav className="flex items-center space-x-8 h-12">
            <div className="animate-pulse flex space-x-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 w-24 bg-white/20 rounded"></div>
              ))}
            </div>
          </nav>
        </Container>
      </div>
    )
  }

  // Don't render at all if no categories - FOR DEBUGGING, SHOW EMPTY BAR
  if (categories.length === 0) {
    return (
      <div className="bg-[#1a3a5c] text-white">
        <Container>
          <nav className="flex items-center justify-center space-x-8 h-12">
            <span className="text-white/70 text-sm">Loading categories...</span>
          </nav>
        </Container>
      </div>
    )
  }

  return (
    <div className="bg-[#1a3a5c] text-white">
      <Container>
        <div className="relative">
          <nav className="flex items-center space-x-8 h-12 overflow-x-auto lg:overflow-visible no-scrollbar">
            {categories.map((category) => {
              const hasGrandchildren = category.children?.some(
                (child) => child.children && child.children.length > 0
              )

              return (
                <div key={category.id} className="relative h-full flex items-center">
                {category.children && category.children.length > 0 ? (
                  /* Category with children - show as button that opens dropdown */
                  <button
                    data-category-button
                    className="text-white/90 hover:text-white font-medium text-sm whitespace-nowrap border-b-2 border-transparent hover:border-[#c9a84c] transition-colors h-full flex items-center gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log(`[CategoryMenu] Clicked ${category.name}, has ${category.children?.length} children`)
                      console.log(`[CategoryMenu] Current activeCategory: ${activeCategory}`)
                      console.log(`[CategoryMenu] Category ID: ${category.id}`)
                      const newActiveCategory = activeCategory === category.id ? null : category.id
                      console.log(`[CategoryMenu] Setting activeCategory to: ${newActiveCategory}`)
                      setActiveCategory(newActiveCategory)
                    }}
                  >
                    {category.name}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                ) : (
                  /* Category without children - normal link */
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-white/90 hover:text-white font-medium text-sm whitespace-nowrap border-b-2 border-transparent hover:border-[#c9a84c] transition-colors h-full flex items-center"
                    onClick={() => setActiveCategory(null)}
                  >
                    {category.name}
                  </Link>
                )}

                {/* Sub-category dropdown */}
                {category.children && category.children.length > 0 && (
                  <>
                    {(() => {
                      console.log(`[CategoryMenu] Rendering dropdown for ${category.name}, active: ${activeCategory === category.id}, activeCategory: ${activeCategory}, category.id: ${category.id}, children: ${category.children.length}`)
                      return null
                    })()}
                    {hasGrandchildren ? (
                      /* Mega Menu Style for Multi-Level Categories */
                      <div 
                        className={`absolute left-0 top-full mt-0 bg-white shadow-xl rounded-b-lg p-6 w-[650px] z-[9999] transition-all duration-200 ${
                          activeCategory === category.id ? 'block' : 'hidden'
                        }`}
                        style={{
                          display: activeCategory === category.id ? 'grid' : 'none',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '1.5rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {category.children.map((sub) => (
                          <div key={sub.id} className="space-y-2">
                            <Link
                              href={`/products?category=${sub.slug}`}
                              className="font-bold text-sm text-[#1a3a5c] hover:text-[#c9a84c] transition-colors block border-b border-gray-100 pb-1 uppercase tracking-wider"
                              onClick={() => setActiveCategory(null)}
                            >
                              {sub.name}
                            </Link>
                            {sub.children && sub.children.length > 0 && (
                              <ul className="space-y-1.5">
                                {sub.children.map((grandchild) => (
                                  <li key={grandchild.id}>
                                    <Link
                                      href={`/products?category=${grandchild.slug}`}
                                      className="text-xs text-gray-500 hover:text-[#1a3a5c] hover:translate-x-1 block transition-all"
                                      onClick={() => setActiveCategory(null)}
                                    >
                                      {grandchild.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Simple Dropdown for Single-Level Categories */
                      <div 
                        className={`absolute left-0 top-full mt-0 bg-white shadow-lg rounded-b-lg p-4 min-w-[220px] transition-all duration-200 z-[9999] ${
                          activeCategory === category.id ? 'block' : 'hidden'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ul className="space-y-2">
                          {category.children.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/products?category=${sub.slug}`}
                                className="text-sm text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 block py-2 px-3 rounded transition-colors"
                                onClick={() => setActiveCategory(null)}
                              >
                                {sub.name}
                                {sub.productCount && sub.productCount > 0 && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({sub.productCount})
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </nav>
        </div>
      </Container>
    </div>
  )
}
