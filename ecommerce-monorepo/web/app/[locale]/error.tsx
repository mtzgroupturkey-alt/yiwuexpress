'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Error')

  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center border border-red-100 shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-900 text-white font-semibold text-sm hover:bg-primary-800 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </button>
          <LocaleLink
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            <Home className="w-4 h-4" />
            {t('backHome')}
          </LocaleLink>
        </div>
      </div>
    </div>
  )
}
