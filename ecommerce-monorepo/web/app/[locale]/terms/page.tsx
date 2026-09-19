'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Cookie, 
  ChevronRight, 
  Building2, 
  Mail, 
  Printer, 
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

export default function TermsPage() {
  const t = useTranslations('Legal')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'
  const legalEmail = settings?.companyEmail || 'legal@yiwuexpress.com'
  const businessLicense = settings?.businessLicense || ''
  const taxNumber = settings?.taxRegistrationNumber || ''

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const legalNav = [
    { name: t('terms.title'), href: '/terms', active: true, icon: Scale },
    { name: t('privacy.title'), href: '/privacy', active: false, icon: Lock },
    { name: t('cookies.title'), href: '/cookies', active: false, icon: Cookie },
    { name: locale === 'ru' ? 'Связаться с юристами' : locale === 'zh' ? '法务与合规支持' : 'Legal Inquiries', href: '/contact', active: false, icon: Mail },
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
              <span className="text-[#F5A602] font-semibold">{t('terms.title')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Правовые стандарты и соглашения' : locale === 'zh' ? '合规与法律服务条款' : 'Enterprise Trade & Governance'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {t('terms.title')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('terms.description')}
              </p>

              {/* Document Meta Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/15 mt-8 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('lastUpdated')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{companyName}</span>
                </span>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{locale === 'ru' ? 'Распечатать' : locale === 'zh' ? '打印条款' : 'Print Document'}</span>
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
            3. MAIN CONTENT: CLAUSES & REGISTRATION
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Legal Clauses (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80 space-y-8">
                
                {/* Section 1 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Scale className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('terms.h1')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('terms.p1')}
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Building2 className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('terms.h2')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('terms.p2')}
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('terms.h3')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('terms.p3')}
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Lock className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('terms.h4')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('terms.p4')}
                  </p>
                </div>

                {/* Section 5: Contact */}
                <div className="space-y-3 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Mail className="w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {t('terms.h5')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('terms.p5a')}{' '}
                    <a href={`mailto:${legalEmail}`} className="text-[#00407a] font-bold hover:underline">
                      {legalEmail}
                    </a>
                    {t('terms.p5b')}
                  </p>
                </div>

              </div>

              {/* Right Column: Entity Info & Assurance (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* Entity Registration Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {locale === 'ru' ? 'Регистрационные данные' : locale === 'zh' ? '主体登记信息' : 'Corporate Identity'}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {companyName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-medium mb-0.5">
                        {locale === 'ru' ? 'Юридическое лицо' : locale === 'zh' ? '公司全称' : 'Legal Entity'}
                      </span>
                      <span className="font-bold text-slate-900">{companyName} Ltd.</span>
                    </div>

                    {businessLicense && (
                      <div>
                        <span className="text-slate-400 block font-medium mb-0.5">
                          {locale === 'ru' ? 'Лицензия' : locale === 'zh' ? '营业执照编号' : 'Business License'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">{businessLicense}</span>
                      </div>
                    )}

                    {taxNumber && (
                      <div>
                        <span className="text-slate-400 block font-medium mb-0.5">
                          {locale === 'ru' ? 'Налоговый номер' : locale === 'zh' ? '统一信用代码' : 'Tax / Credit ID'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">{taxNumber}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 block font-medium mb-0.5">
                        {locale === 'ru' ? 'Юрисдикция' : locale === 'zh' ? '司法管辖区' : 'Governing Law'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {locale === 'ru' ? 'КНР (Международный коммерческий арбитраж)' : locale === 'zh' ? '中华人民共和国民商法及国际海事仲裁' : 'People\'s Republic of China & International Maritime Arbitration'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trade Assurance Banner */}
                <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-[#00407a] text-white shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{locale === 'ru' ? '100% Защита покупателя' : locale === 'zh' ? '买家双重履约保障' : 'Buyer Protection'}</span>
                  </div>
                  <h4 className="text-base font-black tracking-tight leading-snug">
                    {locale === 'ru' ? 'Безопасные оптовые сделки' : locale === 'zh' ? '全额资金托管与发运前检验' : 'Escrow Secured Wholesale'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {locale === 'ru'
                      ? 'Оплата хранится на эскроу-счете до завершения инспекции и оформления коносамента.'
                      : locale === 'zh'
                      ? '资金全程银行级第三方托管，商品经专业团队出厂检验并出具报告后方才结算。'
                      : 'Funds are securely held in milestone escrow and disbursed only upon quality sign-off and bill of lading issuance.'}
                  </p>
                  <div className="pt-2">
                    <LocaleLink
                      href="/contact"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 text-xs font-bold transition shadow-xs"
                    >
                      <span>{locale === 'ru' ? 'Консультация юриста' : locale === 'zh' ? '咨询法务团队' : 'Contact Legal Desk'}</span>
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
