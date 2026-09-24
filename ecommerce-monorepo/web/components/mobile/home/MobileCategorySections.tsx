'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Category, Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface CategoryWithProducts {
  category: Category
  products: Product[]
}

export interface MobileCategorySectionsProps {
  categories?: Category[]
  categorySections?: CategoryWithProducts[]
  allProducts?: Product[]
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onNavigateView?: (view: any, params?: any) => void
  className?: string
}

export function MobileCategorySections({
  categories = [],
  categorySections: initialSections,
  allProducts = [],
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onNavigateView,
  className = '',
}: MobileCategorySectionsProps) {
  const router = useRouter()
  const locale = useLocale()
  const [sections, setSections] = useState<CategoryWithProducts[]>(initialSections || [])
  const [loading, setLoading] = useState<boolean>(!initialSections)

  useEffect(() => {
    if (initialSections && initialSections.length > 0) {
      setSections(initialSections)
      setLoading(false)
      return
    }

    // 1. If allProducts are already available in parent, partition locally first
    if (allProducts && allProducts.length > 0 && categories && categories.length > 0) {
      const topCats = categories.slice(0, 3)
      const mappedSections: CategoryWithProducts[] = []

      for (const cat of topCats) {
        const catSlug = (cat.slug || cat.id || '').toLowerCase()
        const catName = (cat.name || '').toLowerCase()

        const matching = allProducts.filter((p) => {
          const pDept = (p.department || '').toLowerCase()
          const pCat = (p.category || '').toLowerCase()
          const pDeptSlug = (p.departmentSlug || '').toLowerCase()
          const pCatSlug = (p.categorySlug || '').toLowerCase()

          return (
            pCatSlug === catSlug ||
            pDeptSlug === catSlug ||
            pCat.includes(catName) ||
            pDept.includes(catName)
          )
        })

        if (matching.length > 0) {
          mappedSections.push({
            category: cat,
            products: matching.slice(0, 8),
          })
        }
      }

      if (mappedSections.length > 0) {
        setSections(mappedSections)
        setLoading(false)
        return
      }
    }

    // 2. Otherwise fetch top categories from API
    let isMounted = true
    const fetchCategoryRows = async () => {
      try {
        setLoading(true)
        const targetCats = categories.slice(0, 3)
        if (targetCats.length === 0) return

        const results = await Promise.all(
          targetCats.map(async (cat) => {
            const slug = cat.slug || cat.id
            const res = await fetch(`/api/products/category/${encodeURIComponent(slug)}?limit=6&locale=${locale}`)
            if (!res.ok) return null
            const json = await res.json()
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              return {
                category: cat,
                products: json.data.map(mapDbProductToDesign3),
              }
            }
            return null
          })
        )

        if (isMounted) {
          const validSections = results.filter(Boolean) as CategoryWithProducts[]
          setSections(validSections)
        }
      } catch (err) {
        console.error('Error loading category sections in PWA:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (categories.length > 0) {
      fetchCategoryRows()
    }
    return () => {
      isMounted = false
    }
  }, [initialSections, allProducts, categories, locale])

  if (!loading && sections.length === 0) {
    return null
  }

  const handleCategoryViewAll = (cat: Category) => {
    const slug = cat.slug || cat.id
    if (onNavigateView) {
      onNavigateView('shop', { category: slug })
    } else {
      router.push(`/${locale}/store?category=${encodeURIComponent(slug)}`)
    }
  }

  return (
    <div
      data-testid="mobile-category-sections"
      className={`space-y-3 ${className}`}
    >
      {sections.map(({ category, products }) => (
        <section
          key={category.id || category.slug}
          aria-label={category.name}
          className="py-1"
        >
          <MobileSectionHeader
            title={category.name}
            subtitle={
              category.description ||
              (locale === 'zh'
                ? `精选 ${category.name} 热门好物`
                : locale === 'ru'
                ? `Популярные товары в категории ${category.name}`
                : `Top picks in ${category.name}`)
            }
            onViewAll={() => handleCategoryViewAll(category)}
          />
          <MobileProductRow
            products={products}
            isLoading={loading}
            onAddToCart={onAddToCart}
            onSelectProduct={onSelectProduct}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        </section>
      ))}
    </div>
  )
}
