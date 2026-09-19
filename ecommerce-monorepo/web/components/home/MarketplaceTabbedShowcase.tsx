'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import { Container } from '@/components/ui/Container'
import ProductCard from '@/components/products/ProductCard'
import { ChevronRight, Flame, Zap, Sparkles, Factory } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function MarketplaceTabbedShowcase() {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<'bestseller' | 'deals' | 'new' | 'wholesale'>('bestseller')

  // Query tab endpoints
  const queryUrl = 
    activeTab === 'bestseller' ? `/api/products?featured=true&limit=8&locale=${locale}` :
    activeTab === 'deals' ? `/api/products?onSale=true&limit=8&locale=${locale}` :
    activeTab === 'new' ? `/api/products?limit=8&locale=${locale}` :
    `/api/products?wholesaleOnly=true&limit=8&locale=${locale}`

  const { data, isLoading } = useQuery({
    queryKey: ['tabbed-products', activeTab, locale],
    queryFn: () => api.get(queryUrl),
    staleTime: 3 * 60 * 1000,
  })

  const products = (data?.data || []).map((p: any) => ({
    ...p,
    image: p.thumbnail || p.images?.[0] || undefined,
    category: p.category?.name || p.category,
  }))

  const tabs = [
    {
      id: 'bestseller',
      label: locale === 'ru' ? 'Хиты продаж' : locale === 'zh' ? '热销爆款' : 'Best Sellers',
      icon: Flame,
      color: 'text-amber-500',
      badge: 'HOT',
    },
    {
      id: 'deals',
      label: locale === 'ru' ? 'Акции и скидки' : locale === 'zh' ? '特价促销' : 'Flash Deals',
      icon: Zap,
      color: 'text-red-500',
      badge: '%',
    },
    {
      id: 'new',
      label: locale === 'ru' ? 'Новинки' : locale === 'zh' ? '最新上市' : 'New Arrivals',
      icon: Sparkles,
      color: 'text-blue-500',
      badge: 'NEW',
    },
    {
      id: 'wholesale',
      label: locale === 'ru' ? 'Прямой Опт' : locale === 'zh' ? '工厂集采' : 'Factory B2B',
      icon: Factory,
      color: 'text-purple-500',
      badge: 'MOQ',
    },
  ]

  return (
    <section className="py-12 md:py-18 bg-gray-50/70 border-y border-gray-200/60">
      <Container maxWidth="2xl">
        {/* Header & Tabs Navigation Bar (5element / emall style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                {locale === 'ru' ? 'Витрина маркетплейса' : locale === 'zh' ? '严选好物推荐' : 'Marketplace Showcase'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1a3a5c] tracking-tight font-['Outfit',sans-serif]">
              {locale === 'ru' ? 'Популярные предложения' : locale === 'zh' ? '精选工业装备与工具' : 'Curated Industrial Hardware'}
            </h2>
          </div>

          {/* Segmented Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1a3a5c] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#c9a84c]' : tab.color}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-[#c9a84c] text-navy-950'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6"
          >
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            {locale === 'ru' ? 'Товары в данной секции обновляются...' : 'Products currently updating...'}
          </div>
        )}

        {/* View All Footer Link */}
        <div className="mt-10 text-center">
          <LocaleLink
            href={
              activeTab === 'wholesale' ? '/wholesale' :
              activeTab === 'deals' ? '/store?onSale=true' :
              activeTab === 'bestseller' ? '/store?featured=true' :
              '/store'
            }
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#1a3a5c] text-[#1a3a5c] hover:text-white border border-gray-200 hover:border-[#1a3a5c] font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <span>{locale === 'ru' ? 'Смотреть весь каталог' : locale === 'zh' ? '查看更多商品' : 'Explore Full Catalog'}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </LocaleLink>
        </div>
      </Container>
    </section>
  )
}
