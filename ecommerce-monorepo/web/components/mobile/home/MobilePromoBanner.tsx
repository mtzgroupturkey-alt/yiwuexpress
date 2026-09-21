'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ShieldCheck, ArrowRight, Sparkles, FileSpreadsheet } from 'lucide-react'

interface MobilePromoBannerProps {
  onAction?: () => void
  className?: string
}

export function MobilePromoBanner({
  onAction,
  className = '',
}: MobilePromoBannerProps) {
  const router = useRouter()
  const locale = useLocale()

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      router.push(`/${locale}/wholesale`)
    }
  }

  return (
    <section
      data-testid="mobile-promo-banner"
      aria-label="Promotional Banner"
      className={`px-3 py-2 ${className}`}
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003366] via-[#00407a] to-[#005599] text-white p-5 shadow-md">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A602]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold text-amber-300 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {locale === 'zh'
                ? '专属企业采购服务'
                : locale === 'ru'
                ? 'Оптовые закупки под ключ'
                : 'B2B Sourcing Concierge'}
            </span>
          </div>

          <h3 className="text-lg font-black tracking-tight leading-tight">
            {locale === 'zh'
              ? '免费提交采购清单 · 24小时极速报价'
              : locale === 'ru'
              ? 'Бесплатный расчет сметы за 24 часа'
              : 'Submit Your RFQ · Direct Factory Quotes in 24h'}
          </h3>

          <p className="text-xs text-white/80 leading-relaxed">
            {locale === 'zh'
              ? '专业贸易团队协助验厂、议价并出具全包海陆空物流解决方案。'
              : locale === 'ru'
              ? 'Персональный менеджер в Китае проверит фабрику и организует доставку.'
              : 'Our China trade specialists inspect factories, negotiate terms, and coordinate complete freight.'}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAction}
              className="min-h-[48px] px-5 bg-white text-[#00407a] hover:bg-gray-100 font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-xs active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {locale === 'zh'
                  ? '立即发起采购需求'
                  : locale === 'ru'
                  ? 'Отправить заявку'
                  : 'Request Custom Quote'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
