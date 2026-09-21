'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Wrench,
  Cpu,
  Coffee,
  Sparkles,
  Package,
  Layers,
  Flame,
  Truck,
  Building,
  Home,
  ChevronRight,
} from 'lucide-react'
import { Category } from '@/app/[locale]/design-3/types'

interface MobileCategoryRowProps {
  categories?: Category[]
  onSelectCategory?: (category: Category | string) => void
  className?: string
}

interface DefaultCategoryItem {
  id: string
  name: string
  zh: string
  ru: string
  icon: React.ReactNode
  color: string
}

const DEFAULT_CATEGORIES: DefaultCategoryItem[] = [
  {
    id: 'machinery',
    name: 'Machinery',
    zh: '机械设备',
    ru: 'Станки и узлы',
    icon: <Wrench className="w-5 h-5" />,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    zh: '数码电器',
    ru: 'Электроника',
    icon: <Cpu className="w-5 h-5" />,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'kitchen',
    name: 'Kitchenware',
    zh: '厨具餐饮',
    ru: 'Посуда и кухня',
    icon: <Coffee className="w-5 h-5" />,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'hardware',
    name: 'Hardware & Tools',
    zh: '五金工具',
    ru: 'Инструменты',
    icon: <Layers className="w-5 h-5" />,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    id: 'supplies',
    name: 'Raw Materials',
    zh: '工业耗材',
    ru: 'Материалы',
    icon: <Package className="w-5 h-5" />,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
  {
    id: 'home-decor',
    name: 'Home & Living',
    zh: '家居百货',
    ru: 'Товары для дома',
    icon: <Home className="w-5 h-5" />,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    id: 'logistics',
    name: 'Direct Shipping',
    zh: '专线拼箱',
    ru: 'Логистика',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
]

export function MobileCategoryRow({
  categories: customCategories,
  onSelectCategory,
  className = '',
}: MobileCategoryRowProps) {
  const router = useRouter()
  const locale = useLocale()

  const handleCategoryClick = (catId: string, customCat?: Category) => {
    if (onSelectCategory) {
      onSelectCategory(customCat || catId)
    } else {
      router.push(`/${locale}/store?category=${encodeURIComponent(catId)}`)
    }
  }

  return (
    <section
      data-testid="mobile-category-row"
      aria-label="Category Navigation"
      className={`py-3 ${className}`}
    >
      <div className="flex items-center justify-between px-4 mb-2.5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {locale === 'zh'
            ? '热门行业分类'
            : locale === 'ru'
            ? 'Популярные категории'
            : 'Browse Categories'}
        </h3>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/store`)}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-0.5 active:opacity-75"
        >
          <span>{locale === 'zh' ? '全部分类' : locale === 'ru' ? 'Все' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scroll with Touch Snap */}
      <div className="flex items-start gap-3 overflow-x-auto no-scrollbar px-4 py-1 scroll-smooth snap-x snap-mandatory">
        {customCategories && customCategories.length > 0
          ? customCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.slug || cat.id, cat)}
                className="snap-start shrink-0 flex flex-col items-center gap-1.5 w-[76px] focus:outline-none group active:scale-95 transition-transform touch-manipulation"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-2xs group-hover:border-primary-500 transition-colors">
                  {cat.icon ? (
                    <span className="text-xl">{cat.icon}</span>
                  ) : (
                    <Package className="w-6 h-6" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300 text-center line-clamp-2 leading-tight w-full">
                  {cat.name}
                </span>
              </button>
            ))
          : DEFAULT_CATEGORIES.map((cat) => {
              const label =
                locale === 'zh' ? cat.zh : locale === 'ru' ? cat.ru : cat.name
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className="snap-start shrink-0 flex flex-col items-center gap-1.5 w-[76px] focus:outline-none group active:scale-95 transition-transform touch-manipulation"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${cat.color}`}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300 text-center line-clamp-2 leading-tight w-full">
                    {label}
                  </span>
                </button>
              )
            })}
      </div>
    </section>
  )
}
