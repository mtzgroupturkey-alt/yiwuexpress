'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  FileText, 
  Send, 
  Building2, 
  Scale, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'

export interface RfqFormData {
  serviceId?: string
  origin: string
  destination: string
  weight: string
  dimensions?: string
  description: string
  message?: string
}

interface MobileRfqFormProps {
  services?: Array<{ id: string; title: string }>
  initialData?: Partial<RfqFormData>
  onSubmit: (data: RfqFormData) => Promise<void> | void
  isSubmitting?: boolean
  error?: string | null
  onBack?: () => void
  className?: string
}

export function MobileRfqForm({
  services = [],
  initialData,
  onSubmit,
  isSubmitting = false,
  error = null,
  onBack,
  className = '',
}: MobileRfqFormProps) {
  const router = useRouter()
  const locale = useLocale()

  const [formData, setFormData] = useState<RfqFormData>({
    serviceId: initialData?.serviceId || '',
    origin: initialData?.origin || 'China (Zhejiang / Ningbo)',
    destination: initialData?.destination || '',
    weight: initialData?.weight || '',
    dimensions: initialData?.dimensions || '',
    description: initialData?.description || '',
    message: initialData?.message || '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!formData.destination.trim()) errs.destination = 'Destination is required'
    if (!formData.description.trim()) errs.description = 'Cargo description is required'

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs)
      return
    }

    setValidationErrors({})
    onSubmit(formData)
  }

  return (
    <div
      data-testid="mobile-rfq-form"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pt-[calc(56px+env(safe-area-inset-top,0px))] pb-28 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.back())}
        title={locale === 'zh' ? '提交外贸定制询价 (RFQ)' : locale === 'ru' ? 'Запрос расчета (RFQ)' : 'Request for Quote (RFQ)'}
        showSearchToggle={false}
      />

      {/* 2. Form Body */}
      <div className="p-3.5 space-y-3.5">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-2xs">
          {/* Service Category */}
          {services.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '所需服务类型' : locale === 'ru' ? 'Тип услуги' : 'Service Type'}
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white"
              >
                <option value="">
                  {locale === 'zh' ? '请选择服务类型' : locale === 'ru' ? 'Выберите услугу' : 'Select Service Type'}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description of Products */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '采购货物名称及规格说明 *' : locale === 'ru' ? 'Наименование и описание товара *' : 'Product / Cargo Description *'}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                locale === 'zh'
                  ? '例如：500套工业数控钻头，含CE出口检验认证...'
                  : locale === 'ru'
                  ? 'Например: 500 шт. промышленных сверл, сертификат CE...'
                  : 'e.g. 500 sets of CNC tooling drills with CE certification...'
              }
              className={`w-full p-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                validationErrors.description
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            />
            {validationErrors.description && (
              <p className="text-[11px] text-red-500 mt-0.5">{validationErrors.description}</p>
            )}
          </div>

          {/* Origin & Destination */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '出货口岸 / 始发地' : locale === 'ru' ? 'Пункт отправления' : 'Origin City / Port'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '目的国家 / 到货城市 *' : locale === 'ru' ? 'Пункт назначения / Город *' : 'Destination Country / City *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Moscow, Russia or Los Angeles, USA"
                  className={`w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                    validationErrors.destination
                      ? 'border-red-500'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
              {validationErrors.destination && (
                <p className="text-[11px] text-red-500 mt-0.5">{validationErrors.destination}</p>
              )}
            </div>
          </div>

          {/* Weight & Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '预估重量 (kg)' : locale === 'ru' ? 'Вес (кг)' : 'Est. Weight (kg)'}
              </label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g. 350"
                className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                {locale === 'zh' ? '包装尺寸 (cm)' : locale === 'ru' ? 'Габариты (см)' : 'Dimensions (cm)'}
              </label>
              <input
                type="text"
                value={formData.dimensions || ''}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="120x80x100"
                className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Special Notes / Message */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '其他特殊贸易条款要求 (选填)' : locale === 'ru' ? 'Дополнительные пожелания' : 'Additional Notes / Instructions'}
            </label>
            <textarea
              rows={2}
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={locale === 'zh' ? '目标采购价格、期望交期或报关条款...' : locale === 'ru' ? 'Целевая цена, сроки, условия...' : 'Target pricing, required lead time, Incoterms...'}
              className="w-full p-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button (>=48px tap target) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] px-5 rounded-2xl bg-[#00407a] dark:bg-primary-600 hover:bg-[#00305c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform disabled:opacity-50 touch-manipulation"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? locale === 'zh' ? '正在提交询价委托...' : locale === 'ru' ? 'Отправка...' : 'Submitting RFQ...'
                : locale === 'zh' ? '立即提交询价 (24h响应)' : locale === 'ru' ? 'Отправить запрос (ответ за 24ч)' : 'Submit RFQ (24h Response)'}
            </span>
          </button>
        </form>

        {/* B2B Trust Pillars */}
        <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 dark:text-slate-400 text-center py-1">
          <div className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-gray-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Direct Factory</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-gray-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-primary-600" />
            <span>24h Response</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-gray-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Trade Assurance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
