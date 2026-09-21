'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  Calculator, 
  Plane, 
  Ship, 
  Truck, 
  Box, 
  Scale, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { useCurrency } from '@/hooks/useCurrency'

export interface FreightEstimateResult {
  estimatedPrice: number
  currency: string
  breakdown: {
    baseRate: number
    weightKg: number
    multiplier: number
    destinationFactor: number
  }
}

interface MobileFreightCalculatorProps {
  onCalculate: (params: {
    origin: string
    destination: string
    weight: string
    dimensions: string
    serviceType: string
    insuranceRequired: boolean
  }) => Promise<void> | void
  estimate?: FreightEstimateResult | null
  isLoading?: boolean
  error?: string | null
  onBack?: () => void
  onRequestQuote?: (estimate: FreightEstimateResult) => void
  className?: string
}

export function MobileFreightCalculator({
  onCalculate,
  estimate,
  isLoading = false,
  error = null,
  onBack,
  onRequestQuote,
  className = '',
}: MobileFreightCalculatorProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()

  const [origin, setOrigin] = useState('China (Ningbo / Zhejiang)')
  const [destination, setDestination] = useState('Russia')
  const [weight, setWeight] = useState('150')
  const [length, setLength] = useState('100')
  const [width, setWidth] = useState('80')
  const [height, setHeight] = useState('80')
  const [serviceType, setServiceType] = useState('sea')
  const [insurance, setInsurance] = useState(true)

  // Calculations
  const cbm = ((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0)) / 1000000
  const volWeight = ((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0)) / 5000

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCalculate({
      origin,
      destination,
      weight,
      dimensions: `${length}x${width}x${height}`,
      serviceType,
      insuranceRequired: insurance,
    })
  }

  const transportModes = [
    {
      id: 'sea',
      label: locale === 'zh' ? '海运整柜/拼箱' : locale === 'ru' ? 'Морской фрахт' : 'Sea Freight',
      icon: Ship,
      time: '18-28 days',
    },
    {
      id: 'air',
      label: locale === 'zh' ? '特快航空货运' : locale === 'ru' ? 'Авиадоставка' : 'Air Express',
      icon: Plane,
      time: '3-7 days',
    },
    {
      id: 'rail',
      label: locale === 'zh' ? '中欧班列铁路' : locale === 'ru' ? 'Ж/Д контейнер' : 'Railway Cargo',
      icon: Truck,
      time: '14-20 days',
    },
  ]

  return (
    <div
      data-testid="mobile-freight-calculator"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-24 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.push(`/${locale}`))}
        title={locale === 'zh' ? '国际物流运费计算器' : locale === 'ru' ? 'Калькулятор доставки' : 'Freight Calculator'}
        showSearchToggle={false}
      />

      {/* 2. Calculator Form */}
      <div className="p-3.5 space-y-3.5">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-4 shadow-2xs">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
              {locale === 'zh' ? '运输渠道方式' : locale === 'ru' ? 'Способ доставки' : 'Shipping Mode'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {transportModes.map((tm) => {
                const isSelected = serviceType === tm.id
                const Icon = tm.icon

                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => setServiceType(tm.id)}
                    className={`min-h-[54px] p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all active:scale-95 touch-manipulation ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-600 text-primary-700 dark:text-primary-300 font-bold ring-2 ring-primary-500/20'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] leading-tight">{tm.label}</span>
                    <span className="text-[9px] opacity-75">{tm.time}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '始发地 (中国仓库)' : locale === 'ru' ? 'Пункт отправления' : 'Origin (China Warehouse)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. China (Zhejiang / Ningbo)"
                  className="w-full min-h-[44px] pl-9 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '目的国家 / 港口城市' : locale === 'ru' ? 'Страна назначения' : 'Destination Country / Port'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Russia, USA, Germany, Kazakhstan"
                  className="w-full min-h-[44px] pl-9 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Cargo Weight & Dimensions */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '货物总毛重 (kg)' : locale === 'ru' ? 'Общий вес (кг)' : 'Gross Weight (kg)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight in kg"
                  className="w-full min-h-[44px] pl-9 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                />
                <Scale className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '外箱尺寸 (长 × 宽 × 高 cm)' : locale === 'ru' ? 'Габариты (Д × Ш × В см)' : 'Dimensions (L × W × H cm)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="L (cm)"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="min-h-[44px] px-2 text-center text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="W (cm)"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="min-h-[44px] px-2 text-center text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="H (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="min-h-[44px] px-2 text-center text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              {/* Volume preview */}
              <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-slate-400 mt-1.5 px-1">
                <span>Volume: <strong>{cbm.toFixed(3)} CBM (m³)</strong></span>
                <span>Volumetric Wt: <strong>{volWeight.toFixed(1)} kg</strong></span>
              </div>
            </div>
          </div>

          {/* Insurance Toggle */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                  {locale === 'zh' ? '包含全程货运损失全额险' : locale === 'ru' ? 'Полное страхование груза' : 'Include Full Cargo Insurance'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          {/* Calculate Button (>=48px tap target) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] px-5 rounded-2xl bg-[#00407a] dark:bg-primary-600 hover:bg-[#00305c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform disabled:opacity-50 touch-manipulation"
          >
            <Calculator className="w-4 h-4" />
            <span>
              {isLoading
                ? locale === 'zh' ? '正在核算国际运费...' : locale === 'ru' ? 'Расчет стоимости...' : 'Calculating Freight...'
                : locale === 'zh' ? '立即测算预估运费' : locale === 'ru' ? 'Рассчитать стоимость' : 'Calculate Freight Quote'}
            </span>
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Calculation Result Card */}
        {estimate && (
          <div
            data-testid="freight-estimate-result"
            className="bg-white dark:bg-[#0f172a] rounded-2xl border border-primary-200 dark:border-primary-900 p-4 shadow-sm space-y-3.5 animate-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Estimated Freight
              </span>
              <span className="text-xl font-black text-[#00407a] dark:text-[#F5A602]">
                {formatPrice(estimate.estimatedPrice)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs border-t border-gray-100 dark:border-slate-800 pt-2.5">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Base Rate</span>
                <span>${estimate.breakdown.baseRate} / unit</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Chargeable Weight</span>
                <span>{estimate.breakdown.weightKg} kg</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Route Factor</span>
                <span>×{estimate.breakdown.destinationFactor}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => onRequestQuote ? onRequestQuote(estimate) : router.push(`/${locale}/quotes`)}
                className="w-full min-h-[44px] px-4 rounded-xl bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
              >
                <span>{locale === 'zh' ? '一键锁定报价并订舱' : locale === 'ru' ? 'Забронировать по этой цене' : 'Book with this Quote'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
