'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import { ChevronLeft, ChevronRight, Flame, Package, Zap, Wrench, Hammer, Cpu, Flame as FlameIcon, Droplet, Shield, Package as PackageIcon, Gauge, Cpu as CpuIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

interface CategoryItem {
  id: string
  label: string
  image: string
  icon: any
  href: string
  highlighted?: 'deals' | 'wholesale'
  productCount?: number
  color?: string
}

const CATEGORIES_DATA: Record<string, CategoryItem[]> = {
  en: [
    {
      id: 'machinery',
      label: 'CNC & Machinery',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Cpu,
      href: '/products?category=machinery',
      productCount: 148,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'tools',
      label: 'Power Tools',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=tools',
      productCount: 235,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'hardware',
      label: 'Industrial Hardware',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Wrench,
      href: '/products?category=hardware',
      productCount: 312,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'electrical',
      label: 'Electrical & Motors',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=electrical',
      productCount: 94,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 'welding',
      label: 'Welding & Cutting',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Flame,
      href: '/products?category=welding',
      productCount: 76,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'hydraulics',
      label: 'Hydraulics & Pumps',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Droplet,
      href: '/products?category=hydraulics',
      productCount: 118,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'safety',
      label: 'Workplace Safety & PPE',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Shield,
      href: '/products?category=safety',
      productCount: 162,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'packaging',
      label: 'Packaging & Warehouse',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=400&q=80',
      icon: PackageIcon,
      href: '/products?category=packaging',
      productCount: 205,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'measuring',
      label: 'Precision Instruments',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Gauge,
      href: '/products?category=measuring',
      productCount: 88,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'electronics',
      label: 'Factory Automation',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400&q=80',
      icon: CpuIcon,
      href: '/products?category=automation',
      productCount: 140,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'deals',
      label: 'Hot Clearance Deals',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&h=400&q=80',
      icon: FlameIcon,
      href: '/products?onSale=true',
      highlighted: 'deals',
      productCount: 52,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'wholesale',
      label: 'Direct Factory Wholesale',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Package,
      href: '/wholesale',
      highlighted: 'wholesale',
      productCount: 420,
      color: 'text-[#0055A4] dark:text-blue-400',
    },
  ],
  ru: [
    {
      id: 'machinery',
      label: 'Станки и ЧПУ',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Cpu,
      href: '/products?category=machinery',
      productCount: 148,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'tools',
      label: 'Электроинструмент',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=tools',
      productCount: 235,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'hardware',
      label: 'Крепеж и метизы',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Wrench,
      href: '/products?category=hardware',
      productCount: 312,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'electrical',
      label: 'Электрика и моторы',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=electrical',
      productCount: 94,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 'welding',
      label: 'Сварка и резка',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Flame,
      href: '/products?category=welding',
      productCount: 76,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'hydraulics',
      label: 'Гидравлика и насосы',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Droplet,
      href: '/products?category=hydraulics',
      productCount: 118,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'safety',
      label: 'Спецодежда и СИЗ',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Shield,
      href: '/products?category=safety',
      productCount: 162,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'packaging',
      label: 'Склад и упаковка',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=400&q=80',
      icon: PackageIcon,
      href: '/products?category=packaging',
      productCount: 205,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'measuring',
      label: 'Измерительные приборы',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Gauge,
      href: '/products?category=measuring',
      productCount: 88,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'electronics',
      label: 'Автоматика и датчики',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400&q=80',
      icon: CpuIcon,
      href: '/products?category=automation',
      productCount: 140,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'deals',
      label: 'Ликвидация и скидки',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&h=400&q=80',
      icon: FlameIcon,
      href: '/products?onSale=true',
      highlighted: 'deals',
      productCount: 52,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'wholesale',
      label: 'Прямой опт B2B',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Package,
      href: '/wholesale',
      highlighted: 'wholesale',
      productCount: 420,
      color: 'text-[#0055A4] dark:text-blue-400',
    },
  ],
  zh: [
    {
      id: 'machinery',
      label: '数控机床与加工中心',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Cpu,
      href: '/products?category=machinery',
      productCount: 148,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'tools',
      label: '工业级专业电动工具',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=tools',
      productCount: 235,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'hardware',
      label: '精密五金与标准件',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Wrench,
      href: '/products?category=hardware',
      productCount: 312,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'electrical',
      label: '电机电控与工控电气',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Zap,
      href: '/products?category=electrical',
      productCount: 94,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 'welding',
      label: '焊接设备与激光切割',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Flame,
      href: '/products?category=welding',
      productCount: 76,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'hydraulics',
      label: '液压气动与泵阀流体',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Droplet,
      href: '/products?category=hydraulics',
      productCount: 118,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'safety',
      label: '劳保防护与安全应急',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Shield,
      href: '/products?category=safety',
      productCount: 162,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'packaging',
      label: '智能仓储与物流包装',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=400&q=80',
      icon: PackageIcon,
      href: '/products?category=packaging',
      productCount: 205,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'measuring',
      label: '高精检测与量具仪器',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Gauge,
      href: '/products?category=measuring',
      productCount: 88,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'electronics',
      label: '工业自动化与机器人',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400&q=80',
      icon: CpuIcon,
      href: '/products?category=automation',
      productCount: 140,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'deals',
      label: '限时清仓秒杀',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&h=400&q=80',
      icon: FlameIcon,
      href: '/products?onSale=true',
      highlighted: 'deals',
      productCount: 52,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'wholesale',
      label: '源头工厂集采批发',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&h=400&q=80',
      icon: Package,
      href: '/wholesale',
      highlighted: 'wholesale',
      productCount: 420,
      color: 'text-[#0055A4] dark:text-blue-400',
    },
  ],
}

export function ShopByCategory() {
  const locale = useLocale()
  const t = useTranslations('Home.category')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const categories = CATEGORIES_DATA[locale] || CATEGORIES_DATA.en

  const updateArrowVisibility = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 15)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15)
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 340
    const newScroll = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    scrollRef.current.scrollTo({ left: newScroll, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    element.addEventListener('scroll', updateArrowVisibility)
    window.addEventListener('resize', updateArrowVisibility)
    updateArrowVisibility()
    return () => {
      element.removeEventListener('scroll', updateArrowVisibility)
      window.removeEventListener('resize', updateArrowVisibility)
    }
  }, [updateArrowVisibility])

  return (
    <section className="bg-white dark:bg-[#070E1A] border-b border-slate-200/80 dark:border-slate-800 py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header with "View All" link */}
        <div className="flex items-center justify-between mb-5 sm:mb-7">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0055A4]/10 text-[#0055A4] dark:bg-[#0055A4]/25 dark:text-blue-300 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0055A4] animate-pulse" />
              {locale === 'ru' ? 'Каталог категорий' : locale === 'zh' ? '品类中心' : 'Category Hub'}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {locale === 'ru' ? 'Популярные категории' : locale === 'zh' ? '按品类选购工业品' : 'Shop by Category'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 max-w-2xl">
              {locale === 'ru'
                ? 'Прямой доступ к станкам, промышленному электроинструменту, гидравлике и оснастке'
                : locale === 'zh'
                ? '探索数控设备、重型机电、气动液压与车间工具源头工厂一手直供'
                : 'Explore our wide range of industrial equipment, CNC machinery, power tools, and hardware.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LocaleLink
              href="/store"
              className="px-4 py-2 bg-[#0055A4] hover:bg-[#003E7E] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors"
            >
              {locale === 'ru' ? 'Каталог' : locale === 'zh' ? '全部分类' : 'Catalog'}
            </LocaleLink>
            <LocaleLink
              href="/store"
              className="text-[#0055A4] hover:text-[#003E7E] dark:text-blue-400 text-xs sm:text-sm font-bold flex items-center gap-1 group transition-colors"
            >
              <span>{t('viewAll') || 'View All Categories'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </LocaleLink>
          </div>
        </div>

        {/* Horizontally Scrollable Category Strip */}
        <div className="relative group/strip">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-[#0B1524] shadow-xl border border-slate-200 dark:border-slate-700 rounded-full p-2 sm:p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0055A4] transition-all cursor-pointer hidden sm:flex items-center justify-center hover:scale-105"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Scrollable Cards Container (Option A: Vertical Image + Label Cards) */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => {
              const Icon = category.icon

              return (
                <LocaleLink
                  key={category.id}
                  href={category.href}
                  className={`group flex-shrink-0 w-28 sm:w-32 md:w-36 flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer select-none`}
                >
                  {/* Icon with no background box */}
                  <div className="relative mb-2 h-12 flex items-center justify-center">
                    <div className={`flex items-center justify-center transition-transform duration-300 group-hover:scale-125 ${category.color || 'text-slate-600 dark:text-slate-400'}`}>
                      <Icon className="w-12 h-12" />
                    </div>

                    {/* Highlight Badges */}
                    {category.highlighted === 'deals' && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded-full shadow-sm flex items-center justify-center w-5 h-5">
                        <Flame className="w-2.5 h-2.5" />
                      </span>
                    )}

                    {category.highlighted === 'wholesale' && (
                      <span className="absolute -top-1 -right-1 bg-[#0055A4] text-white text-[8px] font-black px-1 py-0.5 rounded-full shadow-sm flex items-center justify-center w-5 h-5">
                        <Package className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Category Title */}
                  <h3
                    className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug transition-colors text-center ${category.color || 'text-slate-800 dark:text-slate-200'} group-hover:opacity-80`}
                  >
                    {category.label}
                  </h3>

                  {/* Product count below label */}
                  {category.productCount && (
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {category.productCount}
                    </span>
                  )}
                </LocaleLink>
              )
            })}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-[#0B1524] shadow-xl border border-slate-200 dark:border-slate-700 rounded-full p-2 sm:p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0055A4] transition-all cursor-pointer hidden sm:flex items-center justify-center hover:scale-105"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
