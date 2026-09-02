'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import { Container } from '@/components/ui/Container'
import ProductCard from '@/components/products/ProductCard'
import { ChevronRight, Clock, Flame } from 'lucide-react'
import { useLocale } from 'next-intl'

export function FlashDealsSection() {
  const locale = useLocale()
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'flash-deals', locale, 4],
    queryFn: () => api.get(`/api/products?onSale=true&limit=4&locale=${locale}`),
    staleTime: 2 * 60 * 1000,
  })

  const products = (data?.data || []).map((p: any) => ({
    ...p,
    image: p.thumbnail || p.images?.[0] || undefined,
    category: p.category?.name || p.category,
  }))

  const copyMap: Record<string, {
    badge: string
    endsIn: string
    title: string
    subtitle: string
    viewAll: string
  }> = {
    en: {
      badge: 'Limited Time Deals',
      endsIn: 'Ends in:',
      title: 'Industrial Clearance & Factory Promotions',
      subtitle: 'Save up to 40% on select industrial machinery, workshop power tools, and equipment hardware.',
      viewAll: 'View All Deals'
    },
    ru: {
      badge: 'Специальное предложение',
      endsIn: 'До конца акции:',
      title: 'Распродажа оборудования и заводские скидки',
      subtitle: 'Скидки до 40% на промышленное оборудование, электроинструмент и оснастку.',
      viewAll: 'Все акции и скидки'
    },
    zh: {
      badge: '限时秒杀特惠',
      endsIn: '距结束还剩:',
      title: '工业现货清仓与源头工厂促销',
      subtitle: '精选高精数控机床、车间专业电动工具及重型五金硬件，最高立省40%。',
      viewAll: '查看全部特惠'
    }
  }

  const copy = copyMap[locale] || copyMap.en

  if (isLoading || products.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-red-50/40 via-amber-50/20 to-transparent dark:from-red-950/10 dark:via-amber-950/5 dark:to-transparent overflow-hidden">
      <Container maxWidth="2xl">
        {/* Header with Countdown Timer */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-red-100 dark:border-white/10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                {copy.badge}
              </span>

              {/* Countdown Clock */}
              <div className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1e32] px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-red-500 mr-1" />
                <span>{copy.endsIn}</span>
                <span className="text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {copy.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              {copy.subtitle}
            </p>
          </div>

          <LocaleLink
            href="/products?onSale=true"
            className="inline-flex items-center text-sm font-bold text-red-600 hover:text-red-700 transition-colors group shrink-0"
          >
            <span>{copy.viewAll}</span>
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </LocaleLink>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
