'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Edit2, 
  Check, 
  X, 
  LogOut, 
  Package, 
  FileText, 
  Heart, 
  ChevronRight,
  Coins,
  AlertCircle
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { MobilePreferencesSheet } from './MobilePreferencesSheet'
import { useCurrency } from '@/hooks/useCurrency'

export interface UserProfileData {
  id?: string
  name: string
  email: string
  companyName?: string
  businessType?: string
  phone?: string
  taxId?: string
  country?: string
}

interface MobileProfileViewProps {
  user: UserProfileData | null
  isLoading?: boolean
  error?: string | null
  onSave?: (data: Partial<UserProfileData>) => Promise<void> | void
  onLogout?: () => void
  onBack?: () => void
  className?: string
}

export function MobileProfileView({
  user,
  isLoading = false,
  error = null,
  onSave,
  onLogout,
  onBack,
  className = '',
}: MobileProfileViewProps) {
  const router = useRouter()
  const locale = useLocale()
  const { currency } = useCurrency()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPrefOpen, setIsPrefOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [localError, setLocalError] = useState('')

  const [formData, setFormData] = useState({
    name: user?.name || '',
    companyName: user?.companyName || '',
    businessType: user?.businessType || 'IMPORTER',
    phone: user?.phone || '',
    taxId: user?.taxId || '',
    country: user?.country || '',
  })

  // Sync form data if user prop updates
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        businessType: user.businessType || 'IMPORTER',
        phone: user.phone || '',
        taxId: user.taxId || '',
        country: user.country || '',
      })
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setLocalError('Name is required')
      return
    }

    setIsSaving(true)
    setLocalError('')
    setSaveSuccess(false)

    try {
      if (onSave) {
        await onSave(formData)
      } else {
        const res = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to update profile')
      }
      setSaveSuccess(true)
      setIsEditing(false)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const businessTypeLabels: Record<string, string> = {
    IMPORTER: locale === 'zh' ? '进口商' : locale === 'ru' ? 'Импортер' : 'Importer',
    EXPORTER: locale === 'zh' ? '出口商' : locale === 'ru' ? 'Экспортер' : 'Exporter',
    MANUFACTURER: locale === 'zh' ? '源头制造厂商' : locale === 'ru' ? 'Производитель' : 'Manufacturer',
    DISTRIBUTOR: locale === 'zh' ? '分销批发商' : locale === 'ru' ? 'Дистрибьютор' : 'Distributor',
    OTHER: locale === 'zh' ? '其他贸易形式' : locale === 'ru' ? 'Другое' : 'Other',
  }

  return (
    <div
      data-testid="mobile-profile-view"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-28 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.push(`/${locale}`))}
        title={locale === 'zh' ? '个人中心与设置' : locale === 'ru' ? 'Профиль и настройки' : 'Account & Profile'}
        showSearchToggle={false}
      />

      {/* 2. Main Content */}
      <div className="p-3.5 space-y-3.5">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-32 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
            <div className="h-20 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
            <div className="h-48 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
          </div>
        ) : (
          <>
            {/* User Avatar & Identity Card */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00407a] to-[#0B192C] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-black text-gray-900 dark:text-white truncate">
                    {user?.name || (locale === 'zh' ? '采购商用户' : 'Trade Buyer')}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-slate-400 truncate block">
                    {user?.email || 'user@example.com'}
                  </span>
                  {user?.companyName && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 font-semibold mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{user.companyName}</span>
                    </div>
                  )}
                </div>
              </div>

              {user?.businessType && (
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{locale === 'zh' ? '认证资质' : locale === 'ru' ? 'Тип бизнеса' : 'Business Type'}</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 text-[11px] border border-primary-200 dark:border-primary-800">
                    {businessTypeLabels[user.businessType] || user.businessType}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Links Hub (Orders, Quotes, Wishlist) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => router.push(`/${locale}/orders`)}
                className="p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs active:scale-95 transition-transform touch-manipulation min-h-[72px]"
              >
                <Package className="w-5 h-5 text-primary-600 mb-1" />
                <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 leading-tight">
                  {locale === 'zh' ? '我的订单' : locale === 'ru' ? 'Заказы' : 'My Orders'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/${locale}/quotes`)}
                className="p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs active:scale-95 transition-transform touch-manipulation min-h-[72px]"
              >
                <FileText className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 leading-tight">
                  {locale === 'zh' ? '询价委托' : locale === 'ru' ? 'Запросы' : 'My RFQs'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/${locale}/wishlist`)}
                className="p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs active:scale-95 transition-transform touch-manipulation min-h-[72px]"
              >
                <Heart className="w-5 h-5 text-rose-500 mb-1" />
                <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 leading-tight">
                  {locale === 'zh' ? '收藏夹' : locale === 'ru' ? 'Избранное' : 'Wishlist'}
                </span>
              </button>
            </div>

            {/* Profile Information & Edit Form */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {locale === 'zh' ? '基本外贸信息' : locale === 'ru' ? 'Данные профиля' : 'Profile Information'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 py-1 px-2.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 active:scale-95 transition-transform"
                >
                  {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>{isEditing ? (locale === 'zh' ? '取消' : 'Cancel') : (locale === 'zh' ? '编辑修改' : 'Edit')}</span>
                </button>
              </div>

              {/* Feedback messages */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{locale === 'zh' ? '资料已成功保存更新' : locale === 'ru' ? 'Профиль обновлен' : 'Profile saved successfully!'}</span>
                </div>
              )}
              {(localError || error) && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError || error}</span>
                </div>
              )}

              {isEditing ? (
                /* Editable Form */
                <form onSubmit={handleSave} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '联系人姓名 *' : locale === 'ru' ? 'Имя контактного лица *' : 'Contact Name *'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '公司 / 企业法定名称' : locale === 'ru' ? 'Название компании' : 'Company Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '贸易商业类型' : locale === 'ru' ? 'Тип бизнеса' : 'Business Type'}
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white"
                    >
                      <option value="IMPORTER">{locale === 'zh' ? '进口商' : 'Importer'}</option>
                      <option value="EXPORTER">{locale === 'zh' ? '出口商' : 'Exporter'}</option>
                      <option value="MANUFACTURER">{locale === 'zh' ? '源头厂商' : 'Manufacturer'}</option>
                      <option value="DISTRIBUTOR">{locale === 'zh' ? '分销批发' : 'Distributor'}</option>
                      <option value="OTHER">{locale === 'zh' ? '其他' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                        {locale === 'zh' ? '联系电话' : locale === 'ru' ? 'Телефон' : 'Phone'}
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                        {locale === 'zh' ? '纳税人识别号' : locale === 'ru' ? 'ИНН / Tax ID' : 'Tax ID'}
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full min-h-[48px] px-3 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full min-h-[48px] rounded-xl bg-[#00407a] dark:bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-50 touch-manipulation mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? (locale === 'zh' ? '正在保存...' : 'Saving...') : (locale === 'zh' ? '确认并保存' : 'Save Changes')}</span>
                  </button>
                </form>
              ) : (
                /* View Mode */
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400">{locale === 'zh' ? '联系人姓名' : locale === 'ru' ? 'Имя' : 'Contact Name'}</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400">{locale === 'zh' ? '企业全称' : locale === 'ru' ? 'Компания' : 'Company Name'}</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{user?.companyName || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400">{locale === 'zh' ? '联系电话' : locale === 'ru' ? 'Телефон' : 'Phone'}</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{user?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400">{locale === 'zh' ? '税号' : locale === 'ru' ? 'Tax ID' : 'Tax ID'}</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{user?.taxId || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">{locale === 'zh' ? '国家/地区' : locale === 'ru' ? 'Страна' : 'Country'}</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{user?.country || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Language & Currency Preferences Row */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {locale === 'zh' ? '应用偏好设置' : locale === 'ru' ? 'Настройки' : 'Preferences'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPrefOpen(true)}
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 flex items-center justify-between text-xs active:scale-98 transition-transform touch-manipulation"
              >
                <div className="flex items-center gap-2.5 text-gray-800 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-primary-500" />
                  <span className="font-semibold">{locale === 'zh' ? '语言与货币' : locale === 'ru' ? 'Язык и валюта' : 'Language & Currency'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="uppercase font-mono text-[11px] font-bold text-primary-600">
                    {locale.toUpperCase()} / {currency}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Sign Out Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onLogout) {
                    onLogout()
                  } else {
                    router.push(`/${locale}/login`)
                  }
                }}
                className="w-full min-h-[48px] px-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform border border-red-200/60 dark:border-red-900/50 touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                <span>{locale === 'zh' ? '退出登录' : locale === 'ru' ? 'Выйти из аккаунта' : 'Sign Out'}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preferences Bottom Sheet */}
      <MobilePreferencesSheet
        isOpen={isPrefOpen}
        onClose={() => setIsPrefOpen(false)}
      />
    </div>
  )
}
