'use client'

import React, { useState } from 'react'
import { useLocale } from 'next-intl'
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react'

interface MobileNewsletterCardProps {
  className?: string
}

export function MobileNewsletterCard({
  className = '',
}: MobileNewsletterCardProps) {
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return

    setIsSubmitted(true)
    setTimeout(() => {
      setEmail('')
      setIsSubmitted(false)
    }, 4000)
  }

  return (
    <section
      data-testid="mobile-newsletter-card"
      aria-label="Newsletter Subscription"
      className={`px-3 py-3 ${className}`}
    >
      <div className="rounded-3xl bg-gray-100 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-600/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
              {locale === 'zh'
                ? '订阅一手源头工厂行情'
                : locale === 'ru'
                ? 'Рассылка оптовых каталогов'
                : 'Subscribe to Weekly Factory Drops'}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
              {locale === 'zh'
                ? '每周获取一手清仓库存与外贸特惠'
                : locale === 'ru'
                ? 'Новинки, цены и специальные предложения'
                : 'Get weekly liquidation catalogs and export container deals'}
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="min-h-[48px] rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {locale === 'zh'
                ? '感谢订阅！一手工厂目录已发往您的邮箱。'
                : locale === 'ru'
                ? 'Спасибо! Вы успешно подписаны.'
                : 'Thank you! You are now subscribed.'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                locale === 'zh'
                  ? '输入您的企业邮箱地址...'
                  : locale === 'ru'
                  ? 'Введите ваш рабочий email...'
                  : 'Enter your business email...'
              }
              required
              className="w-full h-12 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!email.trim()}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[#1a3a5c] dark:bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 transition-transform touch-manipulation shadow-xs"
            >
              <span>
                {locale === 'zh'
                  ? '免费接收一手报价'
                  : locale === 'ru'
                  ? 'Подписаться'
                  : 'Subscribe for Free'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
