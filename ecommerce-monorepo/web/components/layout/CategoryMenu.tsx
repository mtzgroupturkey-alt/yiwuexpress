'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchCategories()
    
    const handleOutsideClick = () => {
      setActiveCategory(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeChildren=true')
      if (response.ok) {
        const data = await response.json()
        
        // Only show parent categories (no parentId) that are active and showInMenu
        const parentCategories = data.categories
          ?.filter((cat: any) => {
            const isParent = !cat.parentId
            const isActive = cat.isActive
            const showInMenu = cat.showInMenu !== false
            return isParent && isActive && showInMenu
          })
          .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0)) || []
        
        // Map to include children and grandchildren, sorted by menuOrder
        const categoriesWithChildren = parentCategories.map((cat: any) => {
          const children = data.categories
            ?.filter((child: any) => child.parentId === cat.id && child.isActive && (child.showInMenu !== false))
            .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
            .map((child: any) => {
              // Get level 3 subcategories (grandchildren)
              const grandchildren = data.categories
                ?.filter((grandchild: any) => grandchild.parentId === child.id && grandchild.isActive && (grandchild.showInMenu !== false))
                .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
                .map((grandchild: any) => ({
                  id: grandchild.id,
                  name: grandchild.name,
                  slug: grandchild.slug,
                  productCount: grandchild._count?.products || 0
                })) || []

              return {
                id: child.id,
                name: child.name,
                slug: child.slug,
                productCount: child._count?.products || 0,
                children: grandchildren
              }
            }) || []
          
          return {
            id: cat.id,
            name: cat.name.toUpperCase(),
            slug: cat.slug,
            children
          }
        })
        
        setCategories(categoriesWithChildren)
      } else {
        console.error('API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="bg-[#1a3a5c] text-white">
      <Container>
        <nav className="flex items-center space-x-8 h-12">
          {categories.map((category) => {
            const hasGrandchildren = category.children?.some(
              (child) => child.children && child.children.length > 0
            )

            return (
              <div key={category.id} className="relative group h-full flex items-center">
                {category.children && category.children.length > 0 ? (
                  /* Category with children - show as button that opens dropdown */
                  <button
                    className="text-white/90 hover:text-white font-medium text-sm whitespace-nowrap border-b-2 border-transparent hover:border-[#c9a84c] transition-colors h-full flex items-center gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveCategory(activeCategory === category.id ? null : category.id)
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
                    {hasGrandchildren ? (
                      /* Mega Menu Style for Multi-Level Categories */
                      <div 
                        className={`absolute left-0 top-full bg-white shadow-xl border border-gray-100 rounded-b-lg p-6 w-[650px] transition-all duration-200 z-50 grid grid-cols-3 gap-6 ${
                          activeCategory === category.id
                            ? 'opacity-100 visible'
                            : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}
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
                        className={`absolute left-0 top-full bg-white shadow-lg rounded-b-lg p-4 min-w-[220px] transition-all duration-200 z-50 ${
                          activeCategory === category.id
                            ? 'opacity-100 visible'
                            : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
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
      </Container>
    </div>
  )
}
