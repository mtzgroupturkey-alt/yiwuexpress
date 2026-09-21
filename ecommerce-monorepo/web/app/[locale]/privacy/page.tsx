'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Scale, 
  Cookie, 
  ChevronRight, 
  Building2, 
  Mail, 
  Printer, 
  Sparkles, 
  FileCheck,
  Server,
  ArrowRight
} from 'lucide-react'

export default function PrivacyPage() {
  const t = useTranslations('Legal')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'
  const privacyEmail = settings?.companyEmail || 'privacy@dromkok.com'

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const legalNav = [
    { name: t('terms.title'), href: '/terms', active: false, icon: Scale },
    { name: t('privacy.title'), href: '/privacy', active: true, icon: Lock },
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
              <span className="text-[#F5A602] font-semibold">{t('privacy.title')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Защита конфиденциальности и данных' : locale === 'zh' ? '数据资产与隐私安全保护' : 'Data Protection & Security'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {t('privacy.title')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('privacy.description')}
              </p>

              {/* Document Meta Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/15 mt-8 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('lastUpdated')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 font-semibold">
                  <Lock className="w-4 h-4 text-sky-400" />
                  <span>256-Bit SSL Encrypted</span>
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
            3. MAIN CONTENT: PRIVACY CLAUSES & SECURITY
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Privacy Clauses (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80 space-y-8">
                
                {/* Section 1 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <FileCheck className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('privacy.h1')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('privacy.p1')}
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Eye className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('privacy.h2')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('privacy.p2')}
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Lock className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('privacy.h3')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('privacy.p3')}
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {t('privacy.h4')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('privacy.p4')}
                  </p>
                </div>

                {/* Section 5: Contact */}
                <div className="space-y-3 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-[#00407a]">
                    <Mail className="w-5 h-5" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {t('privacy.h5')}
                    </h2>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('privacy.p5a')}{' '}
                    <a href={`mailto:${privacyEmail}`} className="text-[#00407a] font-bold hover:underline">
                      {privacyEmail}
                    </a>
                    {t('privacy.p5b')}
                  </p>
                </div>

              </div>

              {/* Right Column: Security Guarantees (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* Security Standards Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {locale === 'ru' ? 'Стандарты безопасности' : locale === 'zh' ? '安全认证与加密' : 'Security Standards'}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Enterprise Protection
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <Server className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block">
                          {locale === 'ru' ? 'Защищенные дата-центры' : locale === 'zh' ? '隔离式服务器存储' : 'Isolated Data Tier'}
                        </strong>
                        <span className="text-slate-500">
                          {locale === 'ru' ? 'Хранение данных клиентов с регулярным аудитом' : locale === 'zh' ? '客户贸易信息经脱敏与冷备份存储' : 'Strict tenant isolation and encrypted backups.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block">
                          {locale === 'ru' ? 'Шифрование транзакций' : locale === 'zh' ? '银行级通道传输' : 'PCI DSS Compliance'}
                        </strong>
                        <span className="text-slate-500">
                          {locale === 'ru' ? 'Платежные данные обрабатываются сертифицированными шлюзами' : locale === 'zh' ? '支付信息直连合规国际清算银行' : 'Payment card details are never stored on our hosts.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Commitment */}
                <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-[#00407a] text-white shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>{locale === 'ru' ? 'Защита коммерческой тайны' : locale === 'zh' ? '商业保密承诺' : 'Non-Disclosure Guarantee'}</span>
                  </div>
                  <h4 className="text-base font-black tracking-tight leading-snug">
                    {locale === 'ru' ? 'Ваши спецификации и поставщики конфиденциальны' : locale === 'zh' ? '严格保障供应链伙伴与价格机密' : 'Confidential Sourcing Records'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {locale === 'ru'
                      ? 'Мы гарантируем, что списки ваших товаров, чертежи и контакты поставщиков никогда не передаются конкурентам.'
                      : locale === 'zh'
                      ? '我们严格遵守国际保密协定，采购清单、工厂图纸及定制模具信息绝不向任何第三方公开。'
                      : 'Product drawings, custom mold files, and order volumes are bound by stringent confidentiality agreements.'}
                  </p>
                  <div className="pt-2">
                    <LocaleLink
                      href="/contact"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 text-xs font-bold transition shadow-xs"
                    >
                      <span>{locale === 'ru' ? 'Задать вопрос по безопасности' : locale === 'zh' ? '联系隐私合规专员' : 'Contact Privacy Officer'}</span>
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
