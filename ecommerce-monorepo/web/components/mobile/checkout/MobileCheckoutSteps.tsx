'use client'

import React from 'react'
import { Check, MapPin, Truck, CreditCard } from 'lucide-react'
import { useLocale } from 'next-intl'

interface MobileCheckoutStepsProps {
  currentStep: number // 1, 2, or 3
  onStepClick?: (step: number) => void
  className?: string
}

export function MobileCheckoutSteps({
  currentStep,
  onStepClick,
  className = '',
}: MobileCheckoutStepsProps) {
  const locale = useLocale()

  const steps = [
    {
      num: 1,
      label: locale === 'zh' ? '收货地址' : locale === 'ru' ? 'Адрес' : 'Address',
      icon: MapPin,
    },
    {
      num: 2,
      label: locale === 'zh' ? '配送方式' : locale === 'ru' ? 'Доставка' : 'Delivery',
      icon: Truck,
    },
    {
      num: 3,
      label: locale === 'zh' ? '安全支付' : locale === 'ru' ? 'Оплата' : 'Payment',
      icon: CreditCard,
    },
  ]

  return (
    <div
      data-testid="mobile-checkout-steps"
      className={`bg-white dark:bg-[#0f172a] border-b border-gray-200/80 dark:border-slate-800 px-4 py-3 ${className}`}
    >
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {steps.map((s, idx) => {
          const isCompleted = currentStep > s.num
          const isActive = currentStep === s.num
          const Icon = s.icon

          return (
            <React.Fragment key={s.num}>
              {/* Step indicator */}
              <button
                type="button"
                disabled={!onStepClick || (!isCompleted && !isActive)}
                onClick={() => isCompleted && onStepClick && onStepClick(s.num)}
                className={`flex flex-col items-center gap-1 min-w-[64px] touch-manipulation transition-all ${
                  isCompleted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : isActive
                      ? 'bg-[#00407a] dark:bg-primary-600 text-white shadow-xs ring-4 ring-primary-100 dark:ring-primary-950'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    isActive
                      ? 'text-[#00407a] dark:text-primary-400'
                      : isCompleted
                      ? 'text-gray-900 dark:text-slate-200'
                      : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </button>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                    currentStep > idx + 1
                      ? 'bg-emerald-600'
                      : 'bg-gray-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
