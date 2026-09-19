'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Briefcase, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Globe2, 
  TrendingUp, 
  Award, 
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function CareersPage() {
  const t = useTranslations('Careers')
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const roles = [
    'sourcingSpecialist',
    'qualityInspectionLead',
    'logisticsCoordinator',
    'businessDevelopmentManager',
  ]

  const culturePerks = [
    {
      title: locale === 'ru' ? 'Конкурентная оплата и бонусы' : locale === 'zh' ? '有竞争力的薪酬与绩效奖金' : 'Competitive Pay & Bonuses',
      desc: locale === 'ru' ? 'Высокие базовые ставки плюс процент от успешных контрактов.' : locale === 'zh' ? '行业领先的基础薪资与大宗外贸成单高额绩效激励。' : 'Market-leading salaries paired with performance bonuses for global trade execution.',
      icon: TrendingUp,
    },
    {
      title: locale === 'ru' ? 'Карьерный рост в Китае' : locale === 'zh' ? '中国枢纽与海外轮岗机遇' : 'Global Career Mobility',
      desc: locale === 'ru' ? 'Возможность стажировок и постоянной работы в офисах в Чжэцзяне и Нинбо.' : locale === 'zh' ? '常驻浙江/宁波运营中心，提供跨国商务派遣与全球轮岗通道。' : 'Opportunities for placement in our Zhejiang headquarters and coastal maritime hubs.',
      icon: Globe2,
    },
    {
      title: locale === 'ru' ? 'Международная команда' : locale === 'zh' ? '中英俄多语言国际化团队' : 'Multilingual Environment',
      desc: locale === 'ru' ? 'Работа со специалистами из СНГ, Европы, Китая и стран Ближнего Востока.' : locale === 'zh' ? '团队涵盖中国贸易专家、俄语区商务经理与欧美外贸合规人才。' : 'Collaborate directly with multilingual logistics operators, auditors, and trade lawyers.',
      icon: Users,
    },
    {
      title: locale === 'ru' ? 'Профессиональное обучение' : locale === 'zh' ? '供应链与外贸实战认证' : 'Continuous Certification',
      desc: locale === 'ru' ? 'Курсы по международному праву, Инкотермс 2020 и стандартам ISO 9001.' : locale === 'zh' ? '提供国际货运代理、外贸风控、海关商品归类及验厂专项深造课程。' : 'Sponsored training in Incoterms 2020, customs brokerage, and ISO manufacturing audits.',
      icon: Award,
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
              <span className="text-[#F5A602] font-semibold">{t('breadcrumb')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Присоединяйтесь к нашей международной команде' : locale === 'zh' ? '加入全球外贸供应链领先团队' : 'Build the Bridge to Global Trade'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('pageTitle')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('heroBody')}
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>Global Team</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>High Growth</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>China Hubs</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>EN / RU / ZH</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. CULTURE & PERKS STRIP
           ========================================================================= */}
        <section className="py-12 border-b border-slate-200/80 bg-white">
          <Container>
            <div className="max-w-2xl mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ru' ? 'Почему профессионалы выбирают нас' : locale === 'zh' ? '在跨国供应链中实现职业跃升' : 'Why Work at ' + companyName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {locale === 'ru' ? 'Мы создаем среду, где ценится профессионализм, честность и знание международной коммерции.' : locale === 'zh' ? '我们提供开放透明的跨国平台，汇聚全球外贸、质检与海运精英。' : 'We build an empowering workplace for specialists connecting manufacturers directly to global buyers.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {culturePerks.map((perk, idx) => {
                const PerkIcon = perk.icon
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center font-bold">
                      <PerkIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{perk.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{perk.desc}</p>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. OPEN POSITIONS
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#00407a] text-xs font-bold mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Открытые вакансии' : locale === 'zh' ? '热招职位' : 'Open Positions'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ru' ? 'Актуальные позиции в наших офисах' : locale === 'zh' ? '招募全球业务伙伴' : 'Explore Open Roles'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map((roleKey) => (
                <div
                  key={roleKey}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 hover:border-[#00407a]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-[#00407a] border border-blue-100">
                        {t(`${roleKey}.type` as any)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t(`${roleKey}.location` as any)}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {t(`${roleKey}.title` as any)}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {t(`${roleKey}.description` as any)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <LocaleLink
                      href={`/contact?subject=Career%20Application%20-%20${encodeURIComponent(t(`${roleKey}.title` as any))}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>{t('applyNow')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </LocaleLink>
                    <span className="text-[11px] text-slate-400">Response &lt; 48h</span>
                  </div>
                </div>
              ))}
            </div>

            {/* General Application Banner */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-[#00407a] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-800">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-black tracking-tight">
                  {locale === 'ru' ? 'Не нашли подходящую вакансию?' : locale === 'zh' ? '未找到心仪的对应岗位？' : "Don't see the exact match?"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  {locale === 'ru'
                    ? 'Мы всегда рады талантливым специалистам по ВЭД, аудиторам фабрик и логистам. Отправьте нам ваше резюме.'
                    : locale === 'zh'
                    ? '我们随时欢迎优秀的国际贸易、报关及验厂人才加入。请直接向我们投递个人简历。'
                    : 'We are always looking for driven trade specialists, factory auditors, and shipping experts. Send us your open CV.'}
                </p>
              </div>
              <LocaleLink
                href="/contact?subject=General%20Career%20Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 text-xs font-bold transition shadow-xs shrink-0"
              >
                <span>{locale === 'ru' ? 'Отправить резюме' : locale === 'zh' ? '投递简历' : 'Send Open Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </LocaleLink>
            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
