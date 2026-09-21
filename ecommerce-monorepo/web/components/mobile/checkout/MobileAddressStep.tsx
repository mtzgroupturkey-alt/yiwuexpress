'use client'

import React from 'react'
import { User, Mail, Phone, MapPin, Building, Globe } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface AddressFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName?: string
  shippingAddress: string
  shippingCity: string
  shippingState?: string
  shippingPostalCode: string
  shippingCountryId: string
  customerNotes?: string
}

interface MobileAddressStepProps {
  formData: AddressFormData
  onChange: (data: Partial<AddressFormData>) => void
  countries: Array<{ id: string; name: string; code?: string }>
  errors?: Record<string, string>
  className?: string
}

export function MobileAddressStep({
  formData,
  onChange,
  countries,
  errors = {},
  className = '',
}: MobileAddressStepProps) {
  const locale = useLocale()

  return (
    <div
      data-testid="mobile-address-step"
      className={`space-y-4 ${className}`}
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
          {locale === 'zh' ? '联系人信息' : locale === 'ru' ? 'Контактные данные' : 'Contact Information'}
        </h3>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            {locale === 'zh' ? '收件人姓名 *' : locale === 'ru' ? 'ФИО получателя *' : 'Full Name *'}
          </label>
          <div className="relative">
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={(e) => onChange({ customerName: e.target.value })}
              placeholder="e.g. John Doe"
              className={`w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                errors.customerName
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            />
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.customerName && (
            <p className="text-[11px] text-red-500 mt-1">{errors.customerName}</p>
          )}
        </div>

        {/* Email & Phone */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '电子邮箱 *' : locale === 'ru' ? 'Email для уведомлений *' : 'Email Address *'}
            </label>
            <div className="relative">
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={(e) => onChange({ customerEmail: e.target.value })}
                placeholder="buyer@example.com"
                className={`w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                  errors.customerEmail
                    ? 'border-red-500'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.customerEmail && (
              <p className="text-[11px] text-red-500 mt-1">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '联系电话 / WhatsApp *' : locale === 'ru' ? 'Номер телефона / WhatsApp *' : 'Phone / WhatsApp *'}
            </label>
            <div className="relative">
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => onChange({ customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className={`w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                  errors.customerPhone
                    ? 'border-red-500'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.customerPhone && (
              <p className="text-[11px] text-red-500 mt-1">{errors.customerPhone}</p>
            )}
          </div>
        </div>

        {/* Company Name (Optional) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            {locale === 'zh' ? '公司 / 企业名称 (选填)' : locale === 'ru' ? 'Название компании (опционально)' : 'Company Name (Optional)'}
          </label>
          <div className="relative">
            <input
              type="text"
              name="companyName"
              value={formData.companyName || ''}
              onChange={(e) => onChange({ companyName: e.target.value })}
              placeholder="e.g. Acme Trade Corp."
              className="w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
            />
            <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
        </div>
      </div>

      {/* Shipping Address Container */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-2xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
          {locale === 'zh' ? '目的地收件地址' : locale === 'ru' ? 'Адрес доставки' : 'Delivery Destination'}
        </h3>

        {/* Country Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            {locale === 'zh' ? '国家 / 地区 *' : locale === 'ru' ? 'Страна доставки *' : 'Country / Region *'}
          </label>
          <div className="relative">
            <select
              name="shippingCountryId"
              value={formData.shippingCountryId}
              onChange={(e) => onChange({ shippingCountryId: e.target.value })}
              aria-label="Country / Region"
              className={`w-full min-h-[48px] pl-10 pr-8 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl appearance-none focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white ${
                errors.shippingCountryId
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <option value="">
                {locale === 'zh' ? '请选择国家' : locale === 'ru' ? 'Выберите страну' : 'Select Country'}
              </option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
          {errors.shippingCountryId && (
            <p className="text-[11px] text-red-500 mt-1">{errors.shippingCountryId}</p>
          )}
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            {locale === 'zh' ? '详细地址 (街道、门牌号) *' : locale === 'ru' ? 'Улица, дом, офис *' : 'Street Address *'}
          </label>
          <div className="relative">
            <input
              type="text"
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={(e) => onChange({ shippingAddress: e.target.value })}
              placeholder="e.g. 123 Main Street, Suite 400"
              className={`w-full min-h-[48px] pl-10 pr-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                errors.shippingAddress
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            />
            <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.shippingAddress && (
            <p className="text-[11px] text-red-500 mt-1">{errors.shippingAddress}</p>
          )}
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '城市 *' : locale === 'ru' ? 'Город *' : 'City *'}
            </label>
            <input
              type="text"
              name="shippingCity"
              value={formData.shippingCity}
              onChange={(e) => onChange({ shippingCity: e.target.value })}
              placeholder="City"
              className={`w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
                errors.shippingCity
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            />
            {errors.shippingCity && (
              <p className="text-[11px] text-red-500 mt-1">{errors.shippingCity}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
              {locale === 'zh' ? '省 / 州' : locale === 'ru' ? 'Область / Регион' : 'State / Province'}
            </label>
            <input
              type="text"
              name="shippingState"
              value={formData.shippingState || ''}
              onChange={(e) => onChange({ shippingState: e.target.value })}
              placeholder="State"
              className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            {locale === 'zh' ? '邮政编码 *' : locale === 'ru' ? 'Почтовый индекс *' : 'Postal / ZIP Code *'}
          </label>
          <input
            type="text"
            name="shippingPostalCode"
            value={formData.shippingPostalCode}
            onChange={(e) => onChange({ shippingPostalCode: e.target.value })}
            placeholder="e.g. 10001"
            className={`w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:border-primary-500 ${
              errors.shippingPostalCode
                ? 'border-red-500'
                : 'border-gray-200 dark:border-slate-700'
            }`}
          />
          {errors.shippingPostalCode && (
            <p className="text-[11px] text-red-500 mt-1">{errors.shippingPostalCode}</p>
          )}
        </div>
      </div>
    </div>
  )
}
