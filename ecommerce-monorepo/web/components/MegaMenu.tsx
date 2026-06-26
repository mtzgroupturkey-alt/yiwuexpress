'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, ChefHat, UtensilsCrossed, Coffee, Soup, Wine, Refrigerator, TrendingUp, Star, Folder } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  image?: string | null
  icon?: string | null
  showInMenu: boolean
  parentId?: string | null
  children?: Category[]
  _count?: {
    products: number
  }
}

export default function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      console.log('[MegaMenu] Fetching categories...')
      const response = await fetch('/api/categories?active=true')
      const data = await response.json()
      
      console.log('[MegaMenu] API Response:', data)
      
      if (data.success && data.data) {
        console.log('[MegaMenu] Total categories:', data.data.length)
        
        // Filter only categories that should show in menu
        const menuCategories = data.data.filter((cat: any) => {
          const shouldShow = cat.showInMenu === true
          console.log(`[MegaMenu] ${cat.name}: showInMenu=${cat.showInMenu}, shouldShow=${shouldShow}`)
          return shouldShow
        })
        
        console.log('[MegaMenu] Filtered menu categories:', menuCategories.length)
        
        // Organize into parent-child structure
        const parentCategories = menuCategories.filter((cat: any) => !cat.parentId)
        const childCategories = menuCategories.filter((cat: any) => cat.parentId)
        
        console.log('[MegaMenu] Parent categories:', parentCategories.length)
        console.log('[MegaMenu] Child categories:', childCategories.length)
        
        // Attach children to parents
        const categoriesWithChildren = parentCategories.map((parent: Category) => ({
          ...parent,
          children: childCategories.filter((child: any) => child.parentId === parent.id)
        }))
        
        console.log('[MegaMenu] Final categories:', categoriesWithChildren)
        
        setCategories(categoriesWithChildren)
      } else {
        console.error('[MegaMenu] No data received or API error')
      }
    } catch (error) {
      console.error('[MegaMenu] Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  if (loading) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium">
          <span>Shop</span>
          <ChevronDown className="w-4 h-4 animate-pulse" />
        </button>
      </div>
    )
  }

  // Show menu even if no categories (for debugging)
  console.log('[MegaMenu] Render - categories count:', categories.length)

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 font-medium hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50"
      >
        <span>Shop</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[90vw] max-w-5xl bg-white rounded-lg shadow-2xl border border-gray-100 z-[100]"
          onMouseLeave={() => {
            setIsOpen(false)
            setActiveCategory(null)
          }}
        >>
          <div className="flex">
            {/* Categories Sidebar */}
            <div className="w-64 bg-gray-50 rounded-l-lg p-4 border-r border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Categories
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => {
                  const isActive = activeCategory === category.id
                  
                  return (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      onMouseEnter={() => handleMouseEnter(category.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {category.image ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <Folder className="w-5 h-5" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/products?featured=true"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors mb-2"
                >
                  <Star className="w-4 h-4" />
                  Featured Products
                </Link>
                <Link
                  href="/products?sort=popular"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Best Sellers
                </Link>
              </div>
            </div>

            {/* Sub-Categories Content */}
            <div className="flex-1 p-6">
              {activeCategory ? (
                (() => {
                  const category = categories.find(c => c.id === activeCategory)
                  if (!category) return null

                  const hasChildren = category.children && category.children.length > 0

                  return (
                    <div>
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {category.name}
                        </h3>
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                        >
                          View All →
                        </Link>
                      </div>

                      {hasChildren ? (
                        <div className="grid grid-cols-3 gap-4">
                          {category.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/products?category=${sub.slug}`}
                              className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                {sub.image ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : null}
                                <span className="text-gray-700 group-hover:text-primary-600 font-medium">
                                  {sub.name}
                                </span>
                              </div>
                              {sub._count && sub._count.products > 0 && (
                                <span className="text-xs text-gray-400 group-hover:text-gray-600">
                                  {sub._count.products}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                          <div className="text-center">
                            <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No subcategories available</p>
                            <Link
                              href={`/products?category=${category.slug}`}
                              className="text-primary-600 font-medium hover:text-primary-700 mt-2 inline-block"
                            >
                              View Products →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Hover over a category to see subcategories</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
