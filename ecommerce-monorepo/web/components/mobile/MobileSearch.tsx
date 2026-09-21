'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Search, X, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobile } from '@/components/MobileProvider'

export interface MobileSearchProps {
  isOpen?: boolean
  onClose?: () => void
  onSearch?: (query: string) => void
  placeholder?: string
  initialQuery?: string
  popularTags?: string[]
  className?: string
  sticky?: boolean
}

const DEFAULT_POPULAR_TAGS = [
  'Electronics',
  'Kitchenware',
  'Tools & Hardware',
  'Industrial Parts',
  'Home Decor',
  'Smart Appliances',
]

export function MobileSearch({
  isOpen: propIsOpen,
  onClose,
  onSearch,
  placeholder,
  initialQuery = '',
  popularTags = DEFAULT_POPULAR_TAGS,
  className = '',
  sticky = true,
}: MobileSearchProps) {
  const router = useRouter()
  const locale = useLocale()
  const { isSearchOpen: contextIsOpen, closeSearch } = useMobile()

  // Use prop if provided, otherwise context
  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen ?? true

  const [query, setQuery] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (closeSearch) {
      closeSearch()
    }
  }

  const handleSubmit = (searchVal: string) => {
    const trimmed = searchVal.trim()
    if (!trimmed) return

    if (onSearch) {
      onSearch(trimmed)
    } else {
      router.push(`/${locale}/store?q=${encodeURIComponent(trimmed)}`)
    }
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(query)
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }

  const defaultPlaceholder =
    locale === 'zh'
      ? '搜索产品、型号或供应商...'
      : locale === 'ru'
      ? 'Поиск товаров, моделей или поставщиков...'
      : 'Search products, models, or suppliers...'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="mobile-search-container"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`md:hidden overflow-hidden ${
            sticky ? 'sticky top-14 z-30' : ''
          } bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 shadow-xs ${className}`}
        >
          <div className="px-3 py-2.5 max-w-lg mx-auto space-y-2.5">
            {/* Search Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(query)
              }}
              className="relative flex items-center"
            >
              <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                <Search className="w-5 h-5" />
              </div>

              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || defaultPlaceholder}
                className="w-full h-12 pl-11 pr-20 bg-gray-100 dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 rounded-2xl text-sm font-medium border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors shadow-inner"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear search"
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full active:scale-90 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!query.trim()}
                  aria-label="Submit search"
                  className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-primary-600 dark:bg-primary-500 text-white font-semibold text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Popular Searches / Suggestions */}
            {popularTags.length > 0 && (
              <div className="pt-0.5 pb-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                  <span>
                    {locale === 'zh'
                      ? '热门搜索'
                      : locale === 'ru'
                      ? 'Популярные запросы'
                      : 'Popular Searches'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setQuery(tag)
                        handleSubmit(tag)
                      }}
                      className="shrink-0 h-8 px-3 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700 text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95 transition-colors touch-manipulation"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
