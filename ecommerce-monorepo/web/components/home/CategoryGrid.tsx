'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { LocaleLink } from '@/components/LocaleLink'
import { api } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
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
    : `featured=true&limit=6&locale=${locale}`

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
      <section className="py-16 bg-gray-50">
        <Container maxWidth="2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1a3a5c]">{sectionTitle}</h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {sectionSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
                <Skeleton className="h-4 w-20 mt-3" />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <Container maxWidth="2xl">
          <div className="text-center py-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1a3a5c]">{sectionTitle}</h2>
            <p className="text-gray-600 mt-3 text-base md:text-lg">{t('empty')}</p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <Container maxWidth="2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>✨</span> {locale === 'zh' ? '热门分类' : locale === 'ru' ? 'Популярные категории' : 'Popular Categories'}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1a3a5c]">
            {sectionTitle}
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto text-sm md:text-base">
            {sectionSubtitle}
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={{
                hidden: { opacity: 0, y: 25, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
              }}
            >
              <LocaleLink
                href={`/products?category=${category.slug}`}
                className="group flex flex-col items-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-4 rounded-2xl p-2 transition-transform"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                  {/* Subtle animated ambient glow */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#1a3a5c]/20 via-[#c9a84c]/25 to-[#1a3a5c]/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
                  
                  <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-premium-lg group-hover:ring-[#c9a84c]/80 group-hover:scale-105 transition-all duration-500">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 144px"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
                        <span className="group-hover:scale-110 transition-transform duration-300">📦</span>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="mt-3.5 text-sm md:text-base font-semibold text-gray-800 text-center group-hover:text-[#1a3a5c] transition-colors">
                  {category.name}
                </h3>

                <div className="w-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent group-hover:w-12 transition-all duration-300 mt-1.5" />
              </LocaleLink>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <LocaleLink
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#1a3a5c] font-semibold text-sm rounded-full shadow-sm hover:shadow-md hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-all duration-300 group outline-none"
          >
            {t('viewAll')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </LocaleLink>
        </motion.div>
      </Container>
    </section>
  )
}
