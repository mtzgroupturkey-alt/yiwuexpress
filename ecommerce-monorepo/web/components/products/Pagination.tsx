'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useTranslations('Products')
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1524] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
        aria-label={t('prevPage')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={`w-10 h-10 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            page === currentPage
              ? 'bg-[#0055A4] text-white shadow-md'
              : page === '...'
                ? 'cursor-default text-slate-400 bg-transparent'
                : 'bg-white dark:bg-[#0B1524] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0055A4] hover:text-[#0055A4] shadow-xs'
          }`}
          disabled={page === '...'}
          aria-label={typeof page === 'number' ? t('goToPage', { n: page }) : undefined}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1524] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
        aria-label={t('nextPage')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
