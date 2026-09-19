'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Layers, ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { useTranslations, useLocale } from 'next-intl'

interface SubCategory {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
  children?: SubCategory[]
  image?: string | null
}

interface MegaMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export function MegaMenuDrawer({ isOpen, onClose, categories }: MegaMenuDrawerProps) {
  const t = useTranslations('Header')
  const locale = useLocale()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-start">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-7xl mx-auto mt-20 sm:mt-24 px-4"
          >
            <div className="bg-white dark:bg-[#0d1c30] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[78vh]">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1a3a5c] to-[#0f2744] text-white flex items-center justify-center shadow-md">
                    <Layers className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#1a3a5c] dark:text-white tracking-tight font-['Outfit',sans-serif]">
                      {t('catalog' as any) || (locale === 'ru' ? 'Каталог товаров' : locale === 'zh' ? '商品分类大全' : 'Product Catalog')}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {locale === 'ru' 
                        ? 'Промышленное оборудование, станки и комплектующие' 
                        : locale === 'zh' 
                        ? '重型工业机械、精密机床与五金耗材' 
                        : 'Direct factory machinery, equipment & hardware'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LocaleLink
                    href="/store"
                    onClick={onClose}
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#1a3a5c] dark:text-[#c9a84c] hover:bg-gray-100 dark:hover:bg-white/5 transition"
                  >
                    <span>{t('allProducts')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </LocaleLink>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
                    aria-label="Close catalog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content: Two Column Layout (CIS Marketplace Standard) */}
              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-[380px]">
                {/* Left Column: Primary Categories List */}
                <div className="md:col-span-4 border-r border-gray-100 dark:border-white/10 overflow-y-auto p-3 space-y-1 bg-gray-50/40 dark:bg-white/[0.01]">
                  <LocaleLink
                    href="/store"
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#1a3a5c] dark:text-[#e5c158] hover:bg-white dark:hover:bg-white/5 transition group shadow-xs border border-transparent hover:border-gray-200/70 dark:hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                      <span>{t('allProducts')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </LocaleLink>

                  {categories.map((cat) => {
                    const isSelected = (selectedCategoryId || categories[0]?.id) === cat.id
                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setSelectedCategoryId(cat.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-white dark:bg-white/10 text-[#1a3a5c] dark:text-white shadow-sm border border-gray-200/80 dark:border-white/15'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5'
                        }`}
                      >
                        <LocaleLink
                          href={`/store?category=${cat.slug}`}
                          onClick={onClose}
                          className="flex-1 truncate"
                        >
                          {cat.name}
                        </LocaleLink>
                        {cat.children && cat.children.length > 0 && (
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isSelected ? 'text-[#c9a84c] translate-x-0.5' : 'text-gray-400'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Right Column: Subcategories & Promo Cards */}
                <div className="md:col-span-8 p-6 overflow-y-auto bg-white dark:bg-[#0d1c30]">
                  {activeCategory ? (
                    <div>
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            {activeCategory.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {locale === 'ru' ? 'Выберите подкатегорию для быстрого перехода' : 'Select subcategory to browse'}
                          </p>
                        </div>
                        <LocaleLink
                          href={`/store?category=${activeCategory.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-[#c9a84c] hover:text-[#deb859] flex items-center gap-1 group"
                        >
                          <span>{t('viewAll')}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </LocaleLink>
                      </div>

                      {/* Subcategories Grid */}
                      {activeCategory.children && activeCategory.children.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {activeCategory.children.map((sub) => (
                            <LocaleLink
                              key={sub.id}
                              href={`/store?category=${sub.slug}`}
                              onClick={onClose}
                              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100/90 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/15 transition group flex flex-col justify-between min-h-[70px]"
                            >
                              <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#1a3a5c] dark:group-hover:text-[#c9a84c] transition-colors line-clamp-2">
                                {sub.name}
                              </span>
                              <span className="text-[10px] text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 font-medium mt-1 flex items-center gap-0.5">
                                {locale === 'ru' ? 'Перейти' : 'Explore'} →
                              </span>
                            </LocaleLink>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-gray-400 text-xs sm:text-sm">
                          {locale === 'ru' ? 'В этой категории нет дополнительных подразделов' : 'No subcategories listed for this group'}
                        </div>
                      )}

                      {/* Bottom Banner inside Mega Menu */}
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 flex items-center gap-3">
                          <Tag className="w-6 h-6 text-amber-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                              {locale === 'ru' ? 'Оптовые скидки до 45%' : 'Tiered Wholesale Volume'}
                            </div>
                            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                              {locale === 'ru' ? 'Прямой заказ от заводов Китая' : 'Direct factory MOQ pricing'}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 flex items-center gap-3">
                          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                              {locale === 'ru' ? 'Контроль качества CE / ISO' : 'Quality Inspected'}
                            </div>
                            <div className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                              {locale === 'ru' ? 'Проверка станков перед погрузкой' : 'Pre-shipment batch inspection'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
