'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import Image from 'next/image'
import { ChevronRight, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  productCount: number
  isFeatured: boolean
}

interface CategoryGridProps {
  variant?: 'featured' | 'parent'
}

export function CategoryGrid({ variant = 'featured' }: CategoryGridProps) {
  const t = useTranslations('Home.category')
  const locale = useLocale()
  const queryParams = variant === 'parent'
    ? `parent=null&featured=true&locale=${locale}`
    : `featured=true&limit=8&locale=${locale}`

  const { data, isLoading } = useQuery({
    queryKey: ['categories', variant],
    queryFn: () => api.get(`/api/categories?${queryParams}`),
  })

  const categories: Category[] = data?.data || []

  const sectionTitle = variant === 'parent'
    ? t('parentTitle')
    : t('featuredTitle')

  const sectionSubtitle = variant === 'parent'
    ? t('parentSubtitle')
    : t('featuredSubtitle')

  if (isLoading) {
    return (
      <section className="py-12 bg-[#F8FAFC] dark:bg-[#060D17]">
        <Container maxWidth="2xl">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 bg-white dark:bg-[#0B1524] rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Skeleton className="w-full aspect-square rounded-xl mb-3" />
                <Skeleton className="h-4 w-3/4 mx-auto rounded" />
                <Skeleton className="h-3 w-1/2 mx-auto mt-2 rounded" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-10 md:py-14 bg-[#F8FAFC] dark:bg-[#060D17] overflow-hidden">
      <Container maxWidth="2xl">
        {/* Header - CIS Marketplace Headline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0055A4]/10 text-[#0055A4] dark:bg-[#0055A4]/25 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#0055A4] animate-ping" />
              {locale === 'zh' ? '热门商品分类' : locale === 'ru' ? 'Категории товаров' : 'Popular Categories'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {sectionTitle}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              {sectionSubtitle}
            </p>
          </div>

          <LocaleLink
            href="/store"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0055A4] hover:text-[#003E7E] dark:text-blue-400 group flex-shrink-0 transition-colors"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </LocaleLink>
        </div>

        {/* CIS Card Grid (emall.by / 5element.by tile style) */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } }
              }}
            >
              <LocaleLink
                href={`/products?category=${category.slug}`}
                className="group relative flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B1524] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,85,164,0.12)] hover:border-[#0055A4]/40 dark:hover:border-[#0055A4]/50 transition-all duration-300 hover:-translate-y-1 block h-full overflow-hidden"
              >
                {/* Arrow icon on hover */}
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#0055A4] group-hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 z-10">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>

                {/* Product Image / Icon Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 my-2 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-slate-50 dark:bg-slate-800/60 group-hover:bg-[#0055A4]/5 transition-colors duration-300" />
                  
                  {category.image ? (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 80px, 96px"
                        className="object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📦
                    </div>
                  )}
                </div>

                {/* Category Name & Count */}
                <div className="mt-2 text-center w-full">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-[#0055A4] transition-colors">
                    {category.name}
                  </h3>

                  {category.productCount !== undefined && category.productCount > 0 && (
                    <span className="inline-block mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full group-hover:bg-[#0055A4]/10 group-hover:text-[#0055A4] transition-colors">
                      {category.productCount} {locale === 'zh' ? '件商品' : locale === 'ru' ? 'товаров' : 'items'}
                    </span>
                  )}
                </div>

                {/* Accent Bottom Line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0055A4] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </LocaleLink>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
