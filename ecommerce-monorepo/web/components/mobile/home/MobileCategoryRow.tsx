'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import * as LucideIcons from 'lucide-react'
import { ChevronRight, Package, Folder } from 'lucide-react'
import { Category } from '@/app/[locale]/design-3/types'
import { useMobile } from '@/components/MobileProvider'

interface MobileCategoryRowProps {
  categories?: Category[]
  onSelectCategory?: (category: Category | string) => void
  className?: string
}

interface DefaultCategoryItem {
  id: string
  name: string
  slug: string
  zh: string
  ru: string
  emoji: string
  bg: string
}

const DEFAULT_CATEGORIES: DefaultCategoryItem[] = [
  {
    id: 'machinery',
    slug: 'machinery',
    name: 'Machinery',
    zh: '机械设备',
    ru: 'Станки и узлы',
    emoji: '⚙️',
    bg: 'from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-900/40 border-amber-200/80 dark:border-amber-800/60',
  },
  {
    id: 'electronics',
    slug: 'electronics',
    name: 'Electronics',
    zh: '数码电器',
    ru: 'Электроника',
    emoji: '💻',
    bg: 'from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/40 border-blue-200/80 dark:border-blue-800/60',
  },
  {
    id: 'kitchen',
    slug: 'kitchen',
    name: 'Kitchenware',
    zh: '厨具餐饮',
    ru: 'Посуда и кухня',
    emoji: '🍳',
    bg: 'from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/40 border-emerald-200/80 dark:border-emerald-800/60',
  },
  {
    id: 'hardware',
    slug: 'hardware',
    name: 'Hardware & Tools',
    zh: '五金工具',
    ru: 'Инструменты',
    emoji: '🛠️',
    bg: 'from-purple-50 to-violet-100 dark:from-purple-950/40 dark:to-violet-900/40 border-purple-200/80 dark:border-purple-800/60',
  },
  {
    id: 'supplies',
    slug: 'supplies',
    name: 'Raw Materials',
    zh: '工业耗材',
    ru: 'Материалы',
    emoji: '📦',
    bg: 'from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-900/40 border-orange-200/80 dark:border-orange-800/60',
  },
  {
    id: 'home-decor',
    slug: 'home-decor',
    name: 'Home & Living',
    zh: '家居百货',
    ru: 'Товары для дома',
    emoji: '🛋️',
    bg: 'from-rose-50 to-pink-100 dark:from-rose-950/40 dark:to-pink-900/40 border-rose-200/80 dark:border-rose-800/60',
  },
  {
    id: 'logistics',
    slug: 'logistics',
    name: 'Direct Shipping',
    zh: '专线拼箱',
    ru: 'Логистика',
    emoji: '🚚',
    bg: 'from-cyan-50 to-blue-100 dark:from-cyan-950/40 dark:to-blue-900/40 border-cyan-200/80 dark:border-cyan-800/60',
  },
]

function getCategoryEmoji(name: string, slug?: string): string {
  const text = `${name} ${slug || ''}`.toLowerCase()
  if (text.includes('machin') || text.includes('equip') || text.includes('机械')) return '⚙️'
  if (text.includes('electr') || text.includes('digital') || text.includes('数码') || text.includes('电子')) return '💻'
  if (text.includes('kitchen') || text.includes('cook') || text.includes('厨具') || text.includes('餐饮')) return '🍳'
  if (text.includes('hardw') || text.includes('tool') || text.includes('五金') || text.includes('工具')) return '🛠️'
  if (text.includes('supply') || text.includes('material') || text.includes('耗材') || text.includes('原料')) return '📦'
  if (text.includes('home') || text.includes('decor') || text.includes('furnit') || text.includes('家居')) return '🛋️'
  if (text.includes('apparel') || text.includes('cloth') || text.includes('wear') || text.includes('服装')) return '👕'
  if (text.includes('beauty') || text.includes('health') || text.includes('美妆') || text.includes('护肤')) return '💄'
  if (text.includes('auto') || text.includes('car') || text.includes('汽配') || text.includes('汽车')) return '🚗'
  if (text.includes('ship') || text.includes('logist') || text.includes('拼箱') || text.includes('物流')) return '🚚'
  return '🏷️'
}

function getLucideIcon(
  iconName?: string | null
): React.ComponentType<{ className?: string; strokeWidth?: number }> | null {
  if (!iconName) return null
  const trimmed = iconName.trim()
  if (!trimmed) return null

  // 1. Direct key match (e.g. "Shirt", "Tv", "Microwave", "CookingPot")
  if ((LucideIcons as any)[trimmed]) {
    return (LucideIcons as any)[trimmed]
  }

  // 2. PascalCase conversion (e.g. "cooking-pot" -> "CookingPot", "shirt" -> "Shirt")
  const pascalCase = trimmed
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
  if ((LucideIcons as any)[pascalCase]) {
    return (LucideIcons as any)[pascalCase]
  }

  // 3. Case-insensitive key lookup across all Lucide export keys
  const lowerClean = trimmed.toLowerCase().replace(/[-_ ]/g, '')
  const matchedKey = Object.keys(LucideIcons).find(
    (key) => key.toLowerCase() === lowerClean
  )
  if (matchedKey && (LucideIcons as any)[matchedKey]) {
    return (LucideIcons as any)[matchedKey]
  }

  return null
}

function renderCategoryVisual(cat: Category, imageUrl?: string | null) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={cat.name}
        className="w-full h-full object-cover rounded-full"
        loading="eager"
      />
    )
  }

  const rawIcon = cat.icon

  // 1. If cat.icon is a valid React element
  if (React.isValidElement(rawIcon)) {
    return rawIcon
  }

  // 2. If cat.icon is a React component function
  if (typeof rawIcon === 'function') {
    const IconComponent = rawIcon as React.ComponentType<{ className?: string; strokeWidth?: number }>
    return (
      <IconComponent
        className="w-10 h-10 text-[#00407a] dark:text-blue-400 transition-transform group-hover:scale-110"
        strokeWidth={1.8}
      />
    )
  }

  // 3. If cat.icon is a string (Lucide icon name or emoji)
  if (typeof rawIcon === 'string' && rawIcon.trim()) {
    const trimmed = rawIcon.trim()

    // 3a. Check if it resolves to a Lucide icon
    const LucideComponent = getLucideIcon(trimmed)
    if (LucideComponent) {
      return (
        <LucideComponent
          className="w-10 h-10 text-[#00407a] dark:text-blue-400 transition-transform group-hover:scale-110"
          strokeWidth={1.8}
        />
      )
    }

    // 3b. Check if it's an emoji (non-ASCII string)
    const isAsciiIdentifier = /^[A-Za-z0-9_-]+$/.test(trimmed)
    if (!isAsciiIdentifier) {
      return (
        <span className="text-3xl select-none" role="img" aria-label={cat.name}>
          {trimmed}
        </span>
      )
    }
  }

  // 4. Default emoji fallback from category name / slug
  const emoji = getCategoryEmoji(cat.name, cat.slug)
  return (
    <span className="text-3xl select-none" role="img" aria-label={cat.name}>
      {emoji}
    </span>
  )
}

export function MobileCategoryRow({
  categories: customCategories,
  onSelectCategory,
  className = '',
}: MobileCategoryRowProps) {
  const router = useRouter()
  const locale = useLocale()
  const { isStandalone } = useMobile()

  const handleCategoryClick = (catId: string, customCat?: Category) => {
    if (onSelectCategory) {
      onSelectCategory(customCat || catId)
    } else {
      router.push(`/${locale}/store?category=${encodeURIComponent(catId)}`)
    }
  }

  // Check if categories array was explicitly provided as empty
  const isEmptyState = Array.isArray(customCategories) && customCategories.length === 0

  if (isEmptyState) {
    console.info('[MobileCategoryRow] Categories array is empty. Populated from server/API.')
  }

  const sectionTitle =
    locale === 'zh'
      ? '商品分类'
      : locale === 'ru'
      ? 'Категории'
      : 'Categories'

  const seeAllText =
    locale === 'zh'
      ? '查看全部'
      : locale === 'ru'
      ? 'Все'
      : 'See all'

  return (
    <section
      data-testid="mobile-category-row"
      aria-label="Category Navigation"
      className={`py-3 ${className}`}
    >
      {/* 8. Section header: "Categories" + "See all" link on right */}
      <div className="flex items-center justify-between px-4 mb-2.5">
        <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
          {sectionTitle}
        </h2>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/store`)}
          className="min-h-[44px] px-2 flex items-center gap-0.5 text-xs font-bold text-[#00407a] dark:text-blue-400 active:opacity-70 transition-opacity touch-manipulation cursor-pointer"
        >
          <span>{seeAllText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Empty State when categories array is empty */}
      {isEmptyState ? (
        <div
          data-testid="category-empty-state"
          className="mx-4 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700 text-center"
        >
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {locale === 'zh'
              ? '暂无可用分类'
              : locale === 'ru'
              ? 'Категории пока не загружены'
              : 'No categories available right now'}
          </p>
        </div>
      ) : (
        /* 2. Layout Container: Horizontal scroll for standalone mode, standard responsive grid for browser mode */
        <div
          data-testid="category-items-container"
          className={
            isStandalone
              ? "flex items-start gap-3 overflow-x-auto px-4 py-1.5 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              : "grid grid-cols-4 gap-3 px-4 py-2"
          }
          style={isStandalone ? { WebkitOverflowScrolling: 'touch' } : undefined}
        >
          {customCategories && customCategories.length > 0
            ? customCategories.map((cat) => {
                const imageUrl = (cat as any).image || (cat as any).imageUrl || (cat as any).thumbnail

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.slug || cat.id, cat)}
                    data-testid={`category-card-${cat.id}`}
                    aria-label={cat.name}
                    className={`flex flex-col items-center gap-1.5 focus:outline-none group active:scale-95 transition-transform touch-manipulation cursor-pointer ${
                      isStandalone ? 'snap-start shrink-0 w-[88px] min-w-[88px]' : 'w-full'
                    }`}
                  >
                    {/* 3. Category card: 88×88px circle image + label below */}
                    <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-gray-200/90 dark:border-slate-700 shadow-2xs group-hover:border-[#00407a] transition-colors flex items-center justify-center relative">
                      {renderCategoryVisual(cat, imageUrl)}
                    </div>
                    <span className="text-xs font-medium text-gray-800 dark:text-slate-200 text-center line-clamp-2 leading-tight w-[88px] break-words">
                      {cat.name}
                    </span>
                  </button>
                )
              })
            : DEFAULT_CATEGORIES.map((cat) => {
                const label =
                  locale === 'zh' ? cat.zh : locale === 'ru' ? cat.ru : cat.name

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.slug)}
                    data-testid={`category-card-${cat.id}`}
                    aria-label={label}
                    className={`flex flex-col items-center gap-1.5 focus:outline-none group active:scale-95 transition-transform touch-manipulation cursor-pointer ${
                      isStandalone ? 'snap-start shrink-0 w-[88px] min-w-[88px]' : 'w-full'
                    }`}
                  >
                    {/* 3. Category card: 88×88px circle */}
                    <div
                      className={`w-[88px] h-[88px] rounded-full border bg-gradient-to-br flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${cat.bg}`}
                    >
                      <span className="text-3xl select-none" role="img" aria-label={label}>
                        {cat.emoji}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-800 dark:text-slate-200 text-center line-clamp-2 leading-tight w-[88px] break-words">
                      {label}
                    </span>
                  </button>
                )
              })}
        </div>
      )}
    </section>
  )
}
