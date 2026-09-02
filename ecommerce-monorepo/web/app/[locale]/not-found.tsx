'use client'

import { useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { FileQuestion, Home, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-secondary-50 text-secondary-500 rounded-2xl mx-auto flex items-center justify-center shadow-gold">
          <FileQuestion className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            {t('title')}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <LocaleLink
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-900 text-white font-semibold text-sm hover:bg-primary-800 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            {t('backHome')}
          </LocaleLink>
          <LocaleLink
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('browseProducts')}
          </LocaleLink>
        </div>
      </div>
    </div>
  )
}
