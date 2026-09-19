'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Compass, 
  Search, 
  ChevronRight, 
  Sparkles, 
  ShoppingBag, 
  Wrench, 
  UserCircle, 
  Building2, 
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Clock
} from 'lucide-react'

export default function SitemapPage() {
  const t = useTranslations('Sitemap')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'
  const [searchQuery, setSearchQuery] = useState('')

  const sections = [
    {
      titleKey: 'main',
      title: locale === 'ru' ? 'Витрина и каталог товаров' : locale === 'zh' ? '商城与现货目录' : 'Storefront & Products',
      icon: ShoppingBag,
      color: 'text-blue-500 bg-blue-50',
      links: [
        { name: locale === 'ru' ? 'Главная страница' : locale === 'zh' ? '商城首页' : 'Home', href: '/' },
        { name: locale === 'ru' ? 'О компании' : locale === 'zh' ? '关于我们' : 'About Us', href: '/about' },
        { name: locale === 'ru' ? 'Услуги и логистика' : locale === 'zh' ? '采购与外贸服务' : 'Services', href: '/services' },
        { name: locale === 'ru' ? 'Оптовый каталог (Store)' : locale === 'zh' ? '在线现货批发商城' : 'Wholesale Store', href: '/store' },
        { name: locale === 'ru' ? 'Крупный опт и спецзаказы' : locale === 'zh' ? '大宗定制与集运' : 'Wholesale Sourcing', href: '/wholesale' },
        { name: locale === 'ru' ? 'Глобальная сеть складов' : locale === 'zh' ? '全球自营海外仓网' : 'Global Logistics Network', href: '/network' },
      ],
    },
    {
      titleKey: 'tools',
      title: locale === 'ru' ? 'Инструменты и расчет логистики' : locale === 'zh' ? '外贸计算与物流工具' : 'Trade Tools & Logistics',
      icon: Wrench,
      color: 'text-amber-500 bg-amber-50',
      links: [
        { name: locale === 'ru' ? 'Калькулятор стоимости доставки' : locale === 'zh' ? '国际海空运费核算器' : 'Freight Cost Calculator', href: '/calculator' },
        { name: locale === 'ru' ? 'Запрос коммерческого предложения' : locale === 'zh' ? '在线申请正式报价单' : 'Request a Quote (RFQ)', href: '/quotes' },
        { name: locale === 'ru' ? 'Отслеживание контейнеров и грузов' : locale === 'zh' ? '实时在途轨迹查询' : 'Track Shipment', href: '/track' },
        { name: locale === 'ru' ? 'Контакты и офисы в Китае' : locale === 'zh' ? '联系中国总部中心' : 'Contact & China Offices', href: '/contact' },
      ],
    },
    {
      titleKey: 'account',
      title: locale === 'ru' ? 'Личный кабинет и заказы' : locale === 'zh' ? '客户账户与订单管理' : 'Customer Account & Orders',
      icon: UserCircle,
      color: 'text-emerald-500 bg-emerald-50',
      links: [
        { name: locale === 'ru' ? 'Вход в аккаунт' : locale === 'zh' ? '买家登录' : 'Customer Login', href: '/login' },
        { name: locale === 'ru' ? 'Регистрация компании' : locale === 'zh' ? '注册企业买家' : 'Register Account', href: '/register' },
        { name: locale === 'ru' ? 'Оформление заказа' : locale === 'zh' ? '订单结算台' : 'Checkout', href: '/checkout' },
        { name: locale === 'ru' ? 'История заказов' : locale === 'zh' ? '我的订单列表' : 'Orders History', href: '/orders' },
        { name: locale === 'ru' ? 'Панель управления (Dashboard)' : locale === 'zh' ? '客户专属控制台' : 'Customer Dashboard', href: '/dashboard' },
      ],
    },
    {
      titleKey: 'company',
      title: locale === 'ru' ? 'Компания и правовые документы' : locale === 'zh' ? '企业治理与法律合规' : 'Company & Governance',
      icon: Building2,
      color: 'text-purple-500 bg-purple-50',
      links: [
        { name: locale === 'ru' ? 'Блог и торговая аналитика' : locale === 'zh' ? '外贸洞察与资讯' : 'Blog & Trade Insights', href: '/blog' },
        { name: locale === 'ru' ? 'Карьера и вакансии' : locale === 'zh' ? '招贤纳士' : 'Careers', href: '/careers' },
        { name: locale === 'ru' ? 'Часто задаваемые вопросы (FAQ)' : locale === 'zh' ? '常见问题与答疑' : 'FAQ', href: '/faq' },
        { name: locale === 'ru' ? 'Политика конфиденциальности' : locale === 'zh' ? '隐私保护政策' : 'Privacy Policy', href: '/privacy' },
        { name: locale === 'ru' ? 'Условия обслуживания' : locale === 'zh' ? '平台服务条款' : 'Terms of Service', href: '/terms' },
        { name: locale === 'ru' ? 'Политика использования Cookie' : locale === 'zh' ? 'Cookie 管理准则' : 'Cookie Policy', href: '/cookies' },
      ],
    },
  ]

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections

    const query = searchQuery.toLowerCase()
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter(
          (link) => link.name.toLowerCase().includes(query) || link.href.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.links.length > 0)
  }, [sections, searchQuery])

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Instant Search)
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
              <span className="text-[#F5A602] font-semibold">{t('title')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Карта сайта и навигация' : locale === 'zh' ? '全站导航与服务索引' : 'Platform Directory & Index'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('title')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('subheading')}
              </p>

              {/* Instant Search Bar */}
              <div className="mt-8 max-w-xl relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ru' ? 'Поиск раздела или страницы...' : locale === 'zh' ? '搜索页面或功能名称...' : 'Search pages or services...'}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F5A602] focus:bg-slate-900/90 text-sm transition"
                />
              </div>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span>25+ Active Portals</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>100% Escrow</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Global Corridors</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>24/7 Monitoring</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. MAIN CONTENT: SECTION DIRECTORY CARDS
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            {filteredSections.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto">
                <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  {locale === 'ru' ? 'Страницы не найдены' : locale === 'zh' ? '未找到匹配的页面' : 'No pages matched your search'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'ru' ? 'Попробуйте изменить поисковый запрос.' : locale === 'zh' ? '请尝试不同的关键字搜索。' : 'Try searching with different keywords.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredSections.map((section) => {
                  const SectionIcon = section.icon
                  return (
                    <div
                      key={section.titleKey}
                      className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${section.color}`}>
                            <SectionIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                              {section.title}
                            </h2>
                            <span className="text-[11px] text-slate-400">
                              {section.links.length} {locale === 'ru' ? 'разделов' : locale === 'zh' ? '个页面' : 'endpoints'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {section.links.map((link) => (
                          <LocaleLink
                            key={link.href}
                            href={link.href}
                            className="group p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/60 hover:border-[#00407a]/30 transition-all flex items-center justify-between"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-[#00407a] transition-colors truncate">
                              {link.name}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00407a] group-hover:translate-x-0.5 transition-all shrink-0" />
                          </LocaleLink>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
