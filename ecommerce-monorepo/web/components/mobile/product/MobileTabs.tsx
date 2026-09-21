'use client'

import React, { useState } from 'react'
import { Product } from '@/app/[locale]/design-3/types'
import { Star, ShieldCheck, Truck, FileText, CheckCircle2 } from 'lucide-react'
import { useLocale } from 'next-intl'

interface MobileTabsProps {
  product: Product
  className?: string
}

export function MobileTabs({ product, className = '' }: MobileTabsProps) {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'shipping' | 'reviews'>('overview')

  const tabs = [
    { id: 'overview', label: locale === 'zh' ? '商品概览' : locale === 'ru' ? 'Описание' : 'Overview' },
    { id: 'specs', label: locale === 'zh' ? '技术规格' : locale === 'ru' ? 'Характеристики' : 'Specs' },
    { id: 'shipping', label: locale === 'zh' ? '包装与物流' : locale === 'ru' ? 'Доставка' : 'Shipping' },
    { id: 'reviews', label: locale === 'zh' ? '采购评价' : locale === 'ru' ? 'Отзывы' : 'Reviews' },
  ]

  return (
    <div
      data-testid="mobile-tabs"
      className={`rounded-3xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 overflow-hidden shadow-xs ${className}`}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-h-[46px] px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors text-center ${
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Body */}
      <div className="p-4 text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {product.name}
            </p>
            <p>
              {product.description ||
                'High-performance manufacturing equipment engineered for international production standards with factory warranty.'}
            </p>
            {product.specs && product.specs.length > 0 && (
              <ul className="space-y-1.5 pt-2">
                {product.specs.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-2">
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              <div className="py-2 flex justify-between">
                <span className="text-gray-400">Brand</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.brand || 'Verified Manufacturer'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-gray-400">Origin</span>
                <span className="font-semibold text-gray-900 dark:text-white">China</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-gray-400">Category</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.category}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-gray-400">Min. Order Qty (MOQ)</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.moq || 1} units</span>
              </div>
              {product.sku && (
                <div className="py-2 flex justify-between">
                  <span className="text-gray-400">SKU / Model</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{product.sku}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Global Express Freight</p>
                <p className="text-gray-500 mt-0.5">
                  Direct dispatch from China warehouse with full export documentation and customs clearance.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Export Wooden Packaging</p>
                <p className="text-gray-500 mt-0.5">
                  Reinforced export seaworthy crating meeting ISPM 15 fumigation guidelines.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                {product.rating ? product.rating.toFixed(1) : '4.8'} out of 5
              </span>
              <span className="text-gray-400">({product.reviewsCount || 12} reviews)</span>
            </div>
            <p className="text-gray-500">
              Verified global wholesale buyers report 99.4% on-time factory delivery and reliable machine performance.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
