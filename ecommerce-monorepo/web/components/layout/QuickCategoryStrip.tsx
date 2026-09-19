'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { ChevronLeft, ChevronRight, Sparkles, Flame, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface QuickCategoryItem {
  id: string
  label: string
  icon: string
  href: string
  highlighted?: 'deals' | 'wholesale'
}

interface QuickCategoryStripProps {
  categories?: QuickCategoryItem[]
}

const DEFAULT_CATEGORIES: Record<string, QuickCategoryItem[]> = {
  ru: [
    { id: 'deals', label: 'Акции и Скидки', icon: '🔥', href: '/store?onSale=true', highlighted: 'deals' },
    { id: 'wholesale', label: 'Прямой Опт', icon: '📦', href: '/wholesale', highlighted: 'wholesale' },
    { id: 'cnc', label: 'Станки с ЧПУ', icon: '⚙️', href: '/store?category=cnc-machinery' },
    { id: 'tools', label: 'Электроинструмент', icon: '🔌', href: '/store?category=power-tools' },
    { id: 'welding', label: 'Сварочное оборудование', icon: '⚡', href: '/store?category=welding-equipment' },
    { id: 'lasers', label: 'Лазерные резаки', icon: '🎯', href: '/store?category=laser-cutters' },
    { id: 'hardware', label: 'Крепеж и Оснастка', icon: '🔩', href: '/store?category=hardware' },
    { id: 'hydraulic', label: 'Гидравлика и Пневматика', icon: '🏗️', href: '/store?category=hydraulic-presses' },
    { id: 'measuring', label: 'Измерительные приборы', icon: '📏', href: '/store?category=measuring-instruments' },
    { id: 'safety', label: 'СИЗ и Безопасность', icon: '🦺', href: '/store?category=safety-gear' },
    { id: 'generators', label: 'Генераторы и Силовые узлы', icon: '🔋', href: '/store?category=generators' },
    { id: 'all', label: 'Все категории', icon: '📂', href: '/store' },
  ],
  en: [
    { id: 'deals', label: 'Flash Deals', icon: '🔥', href: '/store?onSale=true', highlighted: 'deals' },
    { id: 'wholesale', label: 'B2B Wholesale', icon: '📦', href: '/wholesale', highlighted: 'wholesale' },
    { id: 'cnc', label: 'CNC Machinery', icon: '⚙️', href: '/store?category=cnc-machinery' },
    { id: 'tools', label: 'Power Tools', icon: '🔌', href: '/store?category=power-tools' },
    { id: 'welding', label: 'Welding Gear', icon: '⚡', href: '/store?category=welding-equipment' },
    { id: 'lasers', label: 'Laser Cutters', icon: '🎯', href: '/store?category=laser-cutters' },
    { id: 'hardware', label: 'Hardware & Fittings', icon: '🔩', href: '/store?category=hardware' },
    { id: 'hydraulic', label: 'Hydraulics & Presses', icon: '🏗️', href: '/store?category=hydraulic-presses' },
    { id: 'measuring', label: 'Measuring Systems', icon: '📏', href: '/store?category=measuring-instruments' },
    { id: 'safety', label: 'Safety & PPE', icon: '🦺', href: '/store?category=safety-gear' },
    { id: 'generators', label: 'Generators & Power', icon: '🔋', href: '/store?category=generators' },
    { id: 'all', label: 'All Categories', icon: '📂', href: '/store' },
  ],
  zh: [
    { id: 'deals', label: '限时秒杀特惠', icon: '🔥', href: '/store?onSale=true', highlighted: 'deals' },
    { id: 'wholesale', label: '工厂大宗集采', icon: '📦', href: '/wholesale', highlighted: 'wholesale' },
    { id: 'cnc', label: '高精数控机床', icon: '⚙️', href: '/store?category=cnc-machinery' },
    { id: 'tools', label: '专业电动工具', icon: '🔌', href: '/store?category=power-tools' },
    { id: 'welding', label: '工业焊接装备', icon: '⚡', href: '/store?category=welding-equipment' },
    { id: 'lasers', label: '光纤激光切割', icon: '🎯', href: '/store?category=laser-cutters' },
    { id: 'hardware', label: '五金紧固配件', icon: '🔩', href: '/store?category=hardware' },
    { id: 'hydraulic', label: '液压与气动装备', icon: '🏗️', href: '/store?category=hydraulic-presses' },
    { id: 'measuring', label: '精密量仪测绘', icon: '📏', href: '/store?category=measuring-instruments' },
    { id: 'safety', label: '劳保与安全防护', icon: '🦺', href: '/store?category=safety-gear' },
    { id: 'generators', label: '发电机与动力机组', icon: '🔋', href: '/store?category=generators' },
    { id: 'all', label: '全部分类', icon: '📂', href: '/store' },
  ]
}

export function QuickCategoryStrip({ categories: customCategories }: QuickCategoryStripProps) {
  const locale = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // Fetch live top-level categories from database if available
  const { data: apiCategories } = useQuery({
    queryKey: ['quick-strip-categories', locale],
    queryFn: () => api.get(`/api/categories?parent=null&limit=12&locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  // Build merged category list
  const categories: QuickCategoryItem[] = (() => {
    if (customCategories && customCategories.length > 0) return customCategories

    const fallback = DEFAULT_CATEGORIES[locale] || DEFAULT_CATEGORIES.en
    const liveList = apiCategories?.data

    if (!liveList || !Array.isArray(liveList) || liveList.length === 0) {
      return fallback
    }

    // Prepend highlighted Deal and Wholesale links (emall/5element style)
    const highlightedDeals: QuickCategoryItem = {
      id: 'deals',
      label: locale === 'ru' ? 'Акции' : locale === 'zh' ? '特惠' : 'Deals',
      icon: '🔥',
      href: '/products?onSale=true',
      highlighted: 'deals',
    }

    const highlightedWholesale: QuickCategoryItem = {
      id: 'wholesale',
      label: locale === 'ru' ? 'Прямой Опт' : locale === 'zh' ? '大宗集采' : 'Wholesale',
      icon: '📦',
      href: '/wholesale',
      highlighted: 'wholesale',
    }

    const liveItems: QuickCategoryItem[] = liveList.slice(0, 10).map((cat: any) => ({
      id: cat.id || cat.slug,
      label: cat.name,
      icon: '🏷️',
      href: `/store?category=${cat.slug}`,
    }))

    const viewAllItem: QuickCategoryItem = {
      id: 'all',
      label: locale === 'ru' ? 'Все категории' : locale === 'zh' ? '全部分类' : 'All Categories',
      icon: '📂',
      href: '/store',
    }

    return [highlightedDeals, highlightedWholesale, ...liveItems, viewAllItem]
  })()

  // Arrow visibility calculation
  const updateArrowVisibility = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 15)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15)
  }, [])

  // Smooth scroll handler (by 240px per click)
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 240
    const newScroll = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    scrollRef.current.scrollTo({ left: newScroll, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    element.addEventListener('scroll', updateArrowVisibility, { passive: true })
    window.addEventListener('resize', updateArrowVisibility)
    updateArrowVisibility()

    return () => {
      element.removeEventListener('scroll', updateArrowVisibility)
      window.removeEventListener('resize', updateArrowVisibility)
    }
  }, [updateArrowVisibility, categories])

  return (
    <nav
      role="navigation"
      aria-label={locale === 'ru' ? 'Категории товаров' : 'Product Categories'}
      className="relative bg-white dark:bg-[#070D18] border-b border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] select-none z-30"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative flex items-center">
        {/* Left Scroll Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label={locale === 'ru' ? 'Прокрутить влево' : 'Scroll left'}
          className={`absolute left-2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
            showLeftArrow ? 'hidden sm:flex opacity-100' : 'hidden opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2.5 px-2 sm:px-6 w-full scroll-smooth"
          tabIndex={0}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categories.map((cat) => {
            const isDeals = cat.highlighted === 'deals'
            const isWholesale = cat.highlighted === 'wholesale'

            let pillClasses = 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200/90 dark:hover:bg-slate-700 border-transparent'
            
            if (isDeals) {
              pillClasses = 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border-red-200 dark:border-red-900/60 hover:bg-red-100/80 shadow-xs animate-pulse-subtle'
            } else if (isWholesale) {
              pillClasses = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/80 shadow-xs'
            }

            return (
              <LocaleLink
                key={cat.id}
                href={cat.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055A4] active:scale-95 ${pillClasses}`}
              >
                <span className="text-sm leading-none flex items-center justify-center">
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </LocaleLink>
            )
          })}
        </div>

        {/* Right Scroll Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label={locale === 'ru' ? 'Прокрутить вправо' : 'Scroll right'}
          className={`absolute right-2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
            showRightArrow ? 'hidden sm:flex opacity-100' : 'hidden opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
