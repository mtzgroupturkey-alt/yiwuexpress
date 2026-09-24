'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Package,
  Heart,
  Globe,
  Coins,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  Layers,
  HelpCircle,
  Truck,
  ShieldCheck,
  Building2,
  FileText,
  Phone,
  Settings,
  LogIn,
} from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency, type CurrencyItem } from '@/hooks/useCurrency'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { CurrencySwitcher } from '@/components/i18n/CurrencySwitcher'

export interface MobileDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

const CATEGORIES = [
  { name: 'All Products', href: '/store', zh: '全部商品', ru: 'Все товары' },
  { name: 'Machinery & Equipment', href: '/store?category=machinery', zh: '机械与设备', ru: 'Оборудование' },
  { name: 'Hardware & Tools', href: '/store?category=tools', zh: '五金与工具', ru: 'Инструменты' },
  { name: 'Electronics & Smart Tech', href: '/store?category=electronics', zh: '电子与智能科技', ru: 'Электроника' },
  { name: 'Kitchen & Home', href: '/store?category=kitchen', zh: '家居与厨房用品', ru: 'Дом и кухня' },
  { name: 'Materials & Supplies', href: '/store?category=supplies', zh: '原料与耗材', ru: 'Материалы и сырье' },
]

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export function MobileDrawer({
  isOpen: propIsOpen,
  onClose,
  className = '',
}: MobileDrawerProps) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const locale = useLocale()
  const { settings } = useSettings()
  const { isDrawerOpen: contextIsOpen, closeDrawer } = useMobile()
  const { user, isAuthenticated, logout } = useAuth()
  const { currency, setCurrency, currencies } = useCurrency()
  const { isBoth } = useStoreMode()
  const { isWholesaleSession, toggleSessionMode } = useSessionMode()

  // Use prop if explicitly passed, otherwise mobile context
  const isOpen = propIsOpen !== undefined ? propIsOpen : (contextIsOpen ?? false)

  const [activeTab, setActiveTab] = useState<'menu' | 'categories'>('menu')
  const effectiveLogo = settings?.companyLogo || '/logo.png'
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    setLogoFailed(false)
  }, [effectiveLogo])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (closeDrawer) {
      closeDrawer()
    }
  }

  const isFirstRender = React.useRef(true)

  // Close on navigation
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    handleClose()
  }, [pathname])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return
    const segments = pathname.split('/')
    if (segments[1] === 'en' || segments[1] === 'ru' || segments[1] === 'zh') {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    const newPath = segments.join('/') || `/${newLocale}`
    router.push(newPath)
    handleClose()
  }

  const rawName = settings?.companyName || 'Dromkok'
  const companyName = rawName.toLowerCase() === 'dromkok' ? 'Dromkok' : rawName

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid="mobile-drawer-wrapper"
          className={`md:hidden fixed inset-0 z-50 flex ${className}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Sheet (Slide in from Left) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-50 w-[85%] max-w-sm h-full bg-white dark:bg-[#0f172a] shadow-2xl flex flex-col overflow-hidden border-r border-gray-200 dark:border-slate-800"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                {effectiveLogo && !logoFailed ? (
                  <div className="flex items-center justify-center shrink-0">
                    <img
                      src={effectiveLogo}
                      alt={`${companyName} Logo`}
                      onError={() => setLogoFailed(true)}
                      className="h-8 max-h-8 w-auto max-w-[120px] object-contain shrink-0"
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#00407a] dark:bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {companyName
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'GT'}
                  </div>
                )}
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {companyName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close menu"
                data-testid="mobile-drawer-close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card / Sign In Prompt */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800 shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-sm">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <LocaleLink
                    href="/profile"
                    onClick={handleClose}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-primary-600 dark:text-primary-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </LocaleLink>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LocaleLink
                    href="/login"
                    onClick={handleClose}
                    className="flex-1 min-h-[44px] px-3 bg-primary-600 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-transform"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{locale === 'zh' ? '登录' : locale === 'ru' ? 'Войти' : 'Sign In'}</span>
                  </LocaleLink>
                  <LocaleLink
                    href="/register"
                    onClick={handleClose}
                    className="flex-1 min-h-[44px] px-3 bg-white dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl font-semibold text-xs flex items-center justify-center active:scale-98 transition-transform"
                  >
                    <span>{locale === 'zh' ? '注册' : locale === 'ru' ? 'Регистрация' : 'Register'}</span>
                  </LocaleLink>
                </div>
              )}
            </div>

            {/* Navigation Tabs (Menu / Categories) */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`flex-1 min-h-[44px] text-xs font-semibold py-2.5 transition-colors border-b-2 ${
                  activeTab === 'menu'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                }`}
              >
                {locale === 'zh' ? '主要菜单' : locale === 'ru' ? 'Меню' : 'Main Menu'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`flex-1 min-h-[44px] text-xs font-semibold py-2.5 transition-colors border-b-2 ${
                  activeTab === 'categories'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400'
                }`}
              >
                {locale === 'zh' ? '商品分类' : locale === 'ru' ? 'Категории' : 'Categories'}
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm divide-y divide-gray-100 dark:divide-slate-800">
              {activeTab === 'categories' ? (
                <div className="space-y-1 pt-1">
                  {CATEGORIES.map((cat) => (
                    <LocaleLink
                      key={cat.name}
                      href={cat.href}
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="font-medium">
                        {locale === 'zh' ? cat.zh : locale === 'ru' ? cat.ru : cat.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>
                  ))}
                </div>
              ) : (
                <>
                  {/* Account & Orders Links */}
                  <div className="space-y-1 pt-1">
                    <LocaleLink
                      href="/profile/orders"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span>{locale === 'zh' ? '我的订单' : locale === 'ru' ? 'Мои заказы' : 'My Orders'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>

                    <LocaleLink
                      href="/wishlist"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-rose-500" />
                        <span>{locale === 'zh' ? '我的收藏' : locale === 'ru' ? 'Избранное' : 'Wishlist'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>

                    <LocaleLink
                      href="/track"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-blue-500" />
                        <span>{locale === 'zh' ? '物流追踪' : locale === 'ru' ? 'Отслеживание' : 'Track Cargo'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>

                    <LocaleLink
                      href="/calculator"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span>{locale === 'zh' ? '运费计算器' : locale === 'ru' ? 'Калькулятор доставки' : 'Freight Calculator'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>
                  </div>

                  {/* Store Mode Switcher (Wholesale / Retail) */}
                  {isBoth && (
                    <div className="pt-3 pb-1">
                      <div className="flex items-center justify-between min-h-[48px] px-3 bg-gray-50 dark:bg-slate-800/80 rounded-2xl">
                        <div className="flex items-center gap-2.5">
                          <ArrowLeftRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          <span className="font-semibold text-xs text-gray-700 dark:text-slate-300">
                            {isWholesaleSession
                              ? (locale === 'zh' ? '批发/B2B模式' : locale === 'ru' ? 'Оптовый режим B2B' : 'Wholesale / B2B Mode')
                              : (locale === 'zh' ? '零售/B2C模式' : locale === 'ru' ? 'Розничный режим B2C' : 'Retail / B2C Mode')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleSessionMode}
                          aria-label="Toggle Store Mode"
                          className="min-h-[36px] px-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-800 dark:text-white active:scale-95 transition-transform"
                        >
                          {isWholesaleSession
                            ? (locale === 'zh' ? '切换零售' : locale === 'ru' ? 'Розница' : 'Switch Retail')
                            : (locale === 'zh' ? '切换批发' : locale === 'ru' ? 'Опт' : 'Switch Wholesale')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Company & Support Links */}
                  <div className="space-y-1 pt-3">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider px-3 mb-1">
                      {locale === 'zh' ? '服务与企业' : locale === 'ru' ? 'Услуги и компания' : 'Services & Company'}
                    </p>

                    <LocaleLink
                      href="/services"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>{locale === 'zh' ? '供应链与质检服务' : locale === 'ru' ? 'Логистика и инспекция' : 'Trade & Sourcing Services'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>

                    <LocaleLink
                      href="/about"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>{locale === 'zh' ? '关于我们' : locale === 'ru' ? 'О нас' : 'About Us'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>

                    <LocaleLink
                      href="/contact"
                      onClick={handleClose}
                      className="flex items-center justify-between min-h-[48px] px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-primary-500" />
                        <span>{locale === 'zh' ? '联系客服' : locale === 'ru' ? 'Контакты' : 'Contact Support'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </LocaleLink>
                  </div>

                  {/* Dedicated Language & Currency Section (R2) */}
                  <div className="pt-3 pb-1 border-t border-gray-100 dark:border-slate-800/80">
                    <div className="px-3 mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                        Language & Currency
                      </span>
                      <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800 ml-3" />
                    </div>

                    <div className="px-2 space-y-4">
                      {/* Language Radio List */}
                      <LanguageSwitcher 
                        variant="drawer-radio" 
                        onSelect={(targetLoc) => {
                          const segments = pathname.split('/')
                          if (segments[1] === 'en' || segments[1] === 'ru' || segments[1] === 'zh') {
                            segments[1] = targetLoc
                          } else {
                            segments.splice(1, 0, targetLoc)
                          }
                          const newPath = segments.join('/') || `/${targetLoc}`
                          try { router.push(newPath) } catch {}
                          handleClose()
                        }}
                      />

                      {/* Currency Radio List */}
                      <CurrencySwitcher variant="drawer-radio" />
                    </div>
                  </div>

                  {/* Logout Action if Authenticated */}
                  {isAuthenticated && (
                    <div className="pt-3 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          handleClose()
                        }}
                        className="w-full min-h-[48px] px-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{locale === 'zh' ? '退出登录' : locale === 'ru' ? 'Выйти' : 'Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Note */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-400 dark:text-slate-500 text-center shrink-0">
              © {new Date().getFullYear()} {companyName}. China Warehouse & Global Logistics.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
