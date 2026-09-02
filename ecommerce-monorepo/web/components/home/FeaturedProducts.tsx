'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import ProductCard from '@/components/products/ProductCard'
import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function FeaturedProducts() {
  const t = useTranslations('Home.featured')
  const locale = useLocale()
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured', 8, locale],
    queryFn: () => api.get(`/api/products?featured=true&limit=8&locale=${locale}`),
    staleTime: 2 * 60 * 1000,
  })

  const products = (data?.data || []).map((p: any) => ({
    ...p,
    image: p.thumbnail || p.images?.[0] || undefined,
    category: p.category?.name || p.category,
  }))

  if (isLoading) {
    return (
      <Container maxWidth="2xl" className="py-8 md:py-12">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Container maxWidth="2xl" className="py-10 md:py-16 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-gray-100 gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <span>⭐</span> {locale === 'zh' ? '官方精选' : locale === 'ru' ? 'Рекомендуемое' : 'Handpicked Selection'}
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1a3a5c]">
            {t('title')}
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1 max-w-xl">
            {t('subtitle')}
          </p>
        </div>
        <LocaleLink
          href="/products?featured=true"
          className="group inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-[#1a3a5c] text-sm text-[#1a3a5c] hover:text-white rounded-full transition-all duration-300 font-semibold self-start sm:self-auto border border-gray-200 hover:border-[#1a3a5c] shadow-sm hover:shadow-md"
        >
          {t('viewAll')}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </LocaleLink>
      </motion.div>

      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.06
            }
          }
        }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6"
      >
        {products.map((product: any) => (
          <motion.div
            key={product.id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
            }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </Container>
  )
}
