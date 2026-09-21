'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  Truck, 
  Shield, 
  Package, 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Building2,
  FileText
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { EmptyState } from '../EmptyState'

export interface MobileServiceItem {
  id: string
  title: string
  type: string
  description: string
  features?: string[]
  price?: number | null
}

interface MobileServicesViewProps {
  services: MobileServiceItem[]
  onSelectService?: (service: MobileServiceItem) => void
  isLoading?: boolean
  onBack?: () => void
  className?: string
}

export function MobileServicesView({
  services,
  onSelectService,
  isLoading = false,
  onBack,
  className = '',
}: MobileServicesViewProps) {
  const router = useRouter()
  const locale = useLocale()

  const [activeTab, setActiveTab] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: '', label: locale === 'zh' ? '全部服务' : locale === 'ru' ? 'Все' : 'All Services' },
    { id: 'shipping', label: locale === 'zh' ? '国际物流' : locale === 'ru' ? 'Доставка' : 'Shipping' },
    { id: 'customs', label: locale === 'zh' ? '清关退税' : locale === 'ru' ? 'Таможня' : 'Customs' },
    { id: 'warehousing', label: locale === 'zh' ? '仓储质检' : locale === 'ru' ? 'Склад / QC' : 'Warehouse' },
    { id: 'sourcing', label: locale === 'zh' ? '驻厂采购' : locale === 'ru' ? 'Сорсинг' : 'Sourcing' },
  ]

  const filteredServices = services.filter((s) => {
    const matchesTab = !activeTab || s.type.toLowerCase() === activeTab.toLowerCase()
    const matchesQuery =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
  })

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shipping':
        return Truck
      case 'customs':
        return Shield
      case 'warehousing':
        return Package
      case 'sourcing':
        return Users
      default:
        return Sparkles
    }
  }

  return (
    <div
      data-testid="mobile-services-view"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-24 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.push(`/${locale}`))}
        title={locale === 'zh' ? '外贸与供应链服务' : locale === 'ru' ? 'Услуги и сервис' : 'Trade & Sourcing Services'}
        showSearchToggle={false}
      />

      {/* 2. Filter Pills Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border-b border-gray-200/80 dark:border-slate-800 sticky top-14 z-20">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 border ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                  : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 3. Search Bar */}
      <div className="px-3.5 pt-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'zh' ? '搜索服务关键词...' : locale === 'ru' ? 'Поиск услуги...' : 'Search services...'}
            className="w-full h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* 4. Services List */}
      <div className="p-3.5 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title={locale === 'zh' ? '未找到相关服务' : locale === 'ru' ? 'Услуги не найдены' : 'No Services Found'}
            description={locale === 'zh' ? '请尝试更换筛选条件或输入其他关键词' : locale === 'ru' ? 'Попробуйте изменить параметры поиска' : 'Try adjusting your search query or filter.'}
          />
        ) : (
          filteredServices.map((srv) => {
            const Icon = getServiceIcon(srv.type)

            return (
              <div
                key={srv.id}
                onClick={() => onSelectService ? onSelectService(srv) : router.push(`/${locale}/quotes?service=${srv.id}`)}
                className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 cursor-pointer active:scale-98 transition-transform touch-manipulation"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200/50">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>
                </div>

                {srv.features && srv.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.features.slice(0, 3).map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium border border-gray-100 dark:border-slate-700"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-gray-400">
                    {locale === 'zh' ? '驻厂中英俄多语种对接' : locale === 'ru' ? 'Русскоязычные менеджеры' : 'Dedicated Trade Agent'}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-[#00407a] dark:text-primary-400">
                    <span>{locale === 'zh' ? '咨询报价' : locale === 'ru' ? 'Запросить' : 'Inquire'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 5. Quick RFQ Banner at Bottom */}
      <div className="mx-3.5 p-4 bg-gradient-to-br from-[#00407a] to-[#0B192C] text-white rounded-2xl shadow-md space-y-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#F5A602]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-[#F5A602]">
            {locale === 'zh' ? '专属定制采购委托' : locale === 'ru' ? 'Индивидуальный заказ' : 'Custom Sourcing Request'}
          </h4>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          {locale === 'zh'
            ? '没找到所需服务？发布您的采购需求，我们在24小时内为您寻获源头工厂优质底价。'
            : locale === 'ru'
            ? 'Оставьте запрос на поиск фабрики или нестандартного оборудования — свяжемся в течение 24 часов.'
            : 'Need custom procurement or factory audit? Submit an RFQ and receive a direct factory quote within 24h.'}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/quotes`)}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
        >
          <span>{locale === 'zh' ? '立即提交委托需求 (RFQ)' : locale === 'ru' ? 'Оставить заявку (RFQ)' : 'Submit Direct RFQ'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
