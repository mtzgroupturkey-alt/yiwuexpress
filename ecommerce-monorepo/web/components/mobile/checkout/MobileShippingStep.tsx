'use client'

import React from 'react'
import { Truck, Plane, Ship, Check, Clock } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'

export interface ShippingMethodOption {
  id: string
  name: string
  description?: string
  estimatedDays?: string
  fee: number
  iconType?: 'truck' | 'plane' | 'ship'
}

interface MobileShippingStepProps {
  methods?: ShippingMethodOption[]
  selectedMethod: string
  onSelectMethod: (methodId: string) => void
  totalWeight?: number
  className?: string
}

const DEFAULT_METHODS: ShippingMethodOption[] = [
  {
    id: 'standard',
    name: 'Standard Door-to-Door Express',
    description: 'Tracked commercial logistics with customs clearance',
    estimatedDays: '7-12 business days',
    fee: 25,
    iconType: 'truck',
  },
  {
    id: 'express',
    name: 'Priority Air Cargo Courier',
    description: 'Fastest air dispatch via DHL/FedEx global lines',
    estimatedDays: '3-5 business days',
    fee: 55,
    iconType: 'plane',
  },
  {
    id: 'sea',
    name: 'Consolidated Sea/Railway Freight',
    description: 'Cost-optimized for large or heavy bulk merchandise',
    estimatedDays: '18-28 business days',
    fee: 15,
    iconType: 'ship',
  },
]

export function MobileShippingStep({
  methods = DEFAULT_METHODS,
  selectedMethod,
  onSelectMethod,
  totalWeight = 0,
  className = '',
}: MobileShippingStepProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()

  const activeMethods = methods.length > 0 ? methods : DEFAULT_METHODS

  const getIcon = (type?: string) => {
    switch (type) {
      case 'plane':
        return Plane
      case 'ship':
        return Ship
      default:
        return Truck
    }
  }

  return (
    <div
      data-testid="mobile-shipping-step"
      className={`space-y-4 ${className}`}
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
            {locale === 'zh' ? '选择配送方式' : locale === 'ru' ? 'Способ доставки' : 'Select Delivery Method'}
          </h3>
          {totalWeight > 0 && (
            <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {totalWeight.toFixed(2)} kg
            </span>
          )}
        </div>

        {/* Shipping options cards */}
        <div className="space-y-2.5">
          {activeMethods.map((m) => {
            const isSelected = selectedMethod === m.id
            const IconComponent = getIcon(m.iconType)

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMethod(m.id)}
                className={`w-full min-h-[58px] p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-98 touch-manipulation ${
                  isSelected
                    ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-600 dark:border-primary-500 ring-2 ring-primary-500/20 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                      {m.name}
                    </p>
                    {m.estimatedDays && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{m.estimatedDays}</span>
                      </p>
                    )}
                    {m.description && (
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                    {m.fee === 0
                      ? locale === 'zh'
                        ? '免运费'
                        : locale === 'ru'
                        ? 'Бесплатно'
                        : 'Free'
                      : formatPrice(m.fee)}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
