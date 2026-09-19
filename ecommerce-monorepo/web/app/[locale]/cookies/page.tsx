'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Cookie, 
  Settings, 
  BarChart3, 
  ShieldCheck, 
  Scale, 
  Lock, 
  ChevronRight, 
  Building2, 
  Mail, 
  Printer, 
  Sparkles,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react'

export default function CookiesPage() {
  const t = useTranslations('Legal')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'
  const privacyEmail = settings?.companyEmail || 'privacy@yiwuexpress.com'

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const legalNav = [
    { name: t('terms.title'), href: '/terms', active: false, icon: Scale },
    { name: t('privacy.title'), href: '/privacy', active: false, icon: Lock },
    { name: t('cookies.title'), href: '/cookies', active: true, icon: Cookie },
    { name: locale === 'ru' ? 'Связаться с юристами' : locale === 'zh' ? '法务与合规支持' : 'Legal Inquiries', href: '/contact', active: false, icon: Mail },
  ]

  const cookieCategories = [
    {
      title: locale === 'ru' ? 'Обязательные куки' : locale === 'zh' ? '必要性基础 Cookie' : 'Strictly Necessary Cookies',
      desc: locale === 'ru' ? 'Необходимы для аутентификации, работы корзины и безопасного входа в личный кабинет.' : locale === 'zh' ? '维持用户登录状态、购物车结算与账户安全所必需的基础数据。' : 'Essential for user authentication, shopping session persistence, and order tracking.',
      status: locale === 'ru' ? 'Всегда активны' : locale === 'zh' ? '始终启用' : 'Always Active',
      icon: ShieldCheck,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: locale === 'ru' ? 'Аналитические куки' : locale === 'zh' ? '性能与体验分析 Cookie' : 'Analytics & Performance',
      desc: locale === 'ru' ? 'Помогают собирать анонимную статистику посещений для улучшения каталога и поиска.' : locale === 'zh' ? '帮助统计匿名页面浏览与搜索热度，用于持续优化商品目录与采购效率。' : 'Aggregates anonymous usage metrics to improve catalog search and navigation speeds.',
      status: locale === 'ru' ? 'По выбору' : locale === 'zh' ? '用户可选' : 'Optional',
      icon: BarChart3,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: locale === 'ru' ? 'Функциональные настройки' : locale === 'zh' ? '偏好与语言记忆 Cookie' : 'Functional Preferences',
      desc: locale === 'ru' ? 'Сохраняют выбранный вами язык, валюту и адрес доставки.' : locale === 'zh' ? '记忆您选择的语言、结算货币及默认收货港口与交货地。' : 'Remembers your language choice, active currency, and preferred shipping destination port.',
      status: locale === 'ru' ? 'По выбору' : locale === 'zh' ? '用户可选' : 'Optional',
      icon: Settings,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
  ]

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Trust Badges)
           ========================================================================= */}
        <section className="relative bg-gradient-to-b from-[#0B192C] via-[#00407a] to-[#0B192C] text-white py-14 sm:py-18 overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#F5A602_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-3xl pointer-events-none"></div>

          <Container className="relative z-10">
            {/* Breadcrumb Pill */}
            <nav className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 mb-5">
              <LocaleLink href="/" className="hover:text-white transition">
                {locale === 'ru' ? 'Главная' : locale === 'zh' ? '首页' : 'Home'}
              </LocaleLink>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#F5A602] font-semibold">{t('cookies.title')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Политика использования файлов cookie' : locale === 'zh' ? 'Cookie 使用与合规控制' : 'Cookie Governance & User Consent'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {t('cookies.title')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('cookies.description')}
              </p>

              {/* Document Meta Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/15 mt-8 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('lastUpdated')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <Cookie className="w-4 h-4 text-amber-400" />
                  <span>GDPR / ePrivacy Compliant</span>
                </span>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{locale === 'ru' ? 'Распечатать' : locale === 'zh' ? '打印政策' : 'Print Document'}</span>
                </button>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. FLOATING LEGAL NAVIGATION STRIP
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-2">
              {legalNav.map((item) => {
                const Icon = item.icon
                return (
                  <LocaleLink
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      item.active
                        ? 'bg-[#00407a] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </LocaleLink>
                )
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. MAIN CONTENT: COOKIE CLAUSES & CATEGORIES
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cookie Clauses (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80 space-y-8">
                
                {/* Section 1 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Cookie className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('cookies.h1')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('cookies.p1')}
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <SlidersHorizontal className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('cookies.h2')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('cookies.p2')}
                  </p>
                </div>

                {/* Interactive Cookie Categories Grid */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {locale === 'ru' ? 'Категории используемых файлов' : locale === 'zh' ? '平台所使用的 Cookie 分类' : 'Active Cookie Categories'}
                  </h3>
                  <div className="space-y-3">
                    {cookieCategories.map((cat, idx) => {
                      const CatIcon = cat.icon
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white text-[#00407a] border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{cat.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cat.desc}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${cat.badgeColor}`}>
                            {cat.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Settings className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('cookies.h3')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('cookies.p3')}
                  </p>
                </div>

                {/* Section 4: Contact */}
                <div className="space-y-3 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Mail className="w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {t('cookies.h4')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('cookies.p4a')}{' '}
                    <a href={`mailto:${privacyEmail}`} className="text-[#00407a] font-bold hover:underline">
                      {privacyEmail}
                    </a>
                    {t('cookies.p4b')}
                  </p>
                </div>

              </div>

              {/* Right Column: Preferences Control (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* User Control Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Cookie className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {locale === 'ru' ? 'Управление согласием' : locale === 'zh' ? '管理您的 Cookie 偏好' : 'Consent Management'}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {companyName} Platform
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {locale === 'ru' 
                      ? 'Вы можете настроить ваш браузер на блокировку или оповещение об этих файлах. Обратите внимание, что отключение обязательных файлов может нарушить работу оформления заказов.'
                      : locale === 'zh'
                      ? '您可以通过浏览器随时清除或拒绝 Cookie。请注意，禁用必要性 Cookie 可能会导致无法结算或同步报价单。'
                      : 'You can configure your browser to reject cookies. Please note that disabling essential cookies may impact checkout and quote submission features.'}
                  </p>
                </div>

                {/* Direct Help Banner */}
                <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-[#00407a] text-white shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{locale === 'ru' ? 'Конфиденциальность' : locale === 'zh' ? '数据主权保护' : 'Privacy Control'}</span>
                  </div>
                  <h4 className="text-base font-black tracking-tight leading-snug">
                    {locale === 'ru' ? 'Есть вопросы по обработке данных?' : locale === 'zh' ? '对数据跟踪有任何合规疑问？' : 'Questions on Data Compliance?'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {locale === 'ru'
                      ? 'Наши специалисты по информационной безопасности готовы ответить на любые вопросы.'
                      : locale === 'zh'
                      ? '我们的合规专员随时为您解答有关跨国贸易数据留存及安全协议的一切咨询。'
                      : 'Our data protection officer is available to clarify any queries regarding international data retention.'}
                  </p>
                  <div className="pt-2">
                    <LocaleLink
                      href="/contact"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 text-xs font-bold transition shadow-xs"
                    >
                      <span>{locale === 'ru' ? 'Написать в поддержку' : locale === 'zh' ? '咨询合规专员' : 'Contact Support'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </LocaleLink>
                  </div>
                </div>

              </div>

            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
