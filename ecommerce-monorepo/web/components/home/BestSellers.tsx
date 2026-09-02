'use client'

import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import { Container } from '@/components/ui/Container'
import ProductCard from '@/components/products/ProductCard'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { useLocale } from 'next-intl'

export function BestSellers() {
  const locale = useLocale()

  const copyMap: Record<string, {
    badge: string
    title: string
    subtitle: string
    viewAll: string
  }> = {
    en: {
      badge: 'Popular Demand',
      title: 'Best Sellers',
      subtitle: 'Our most popular industrial products loved by international procurement buyers.',
      viewAll: 'View All'
    },
    ru: {
      badge: 'Хиты продаж',
      title: 'Лидеры продаж',
      subtitle: 'Самое востребованное промышленное оборудование и инструмент среди покупателей.',
      viewAll: 'Смотреть все'
    },
    zh: {
      badge: '热销推荐',
      title: '热销畅销榜',
      subtitle: '全球工程采购商复购最多、好评率最高的热销机械与专业工具装备。',
      viewAll: '查看全部'
    }
  }

  const copy = copyMap[locale] || copyMap.en

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'best-sellers', 8, locale],
    queryFn: () => api.get(`/api/products?sort=popular&limit=8&locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const products = (data?.data || []).map((p: any) => ({
    ...p,
    image: p.thumbnail || p.images?.[0] || undefined,
    category: p.category?.name || p.category,
  }))

  if (isLoading || products.length === 0) {
    return null
  }

  return (
    <Container maxWidth="2xl" className="py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{copy.badge}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a5c] dark:text-gray-100">
            {copy.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            {copy.subtitle}
          </p>
        </div>

        <LocaleLink
          href="/products?sort=popular"
          className="group inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#0d1e32] hover:bg-[#1a3a5c] text-sm text-[#1a3a5c] dark:text-[#c9a84c] hover:text-white rounded-full transition-all duration-300 font-semibold self-start sm:self-auto border border-gray-200 dark:border-white/10 hover:border-[#1a3a5c] shadow-sm hover:shadow-md"
        >
          <span>{copy.viewAll}</span>
          <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </LocaleLink>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  )
}
