import { getTranslations } from 'next-intl/server'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { 
  Globe, 
  Users, 
  Target, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Package,
  Building2,
  Anchor,
  Truck,
  Sparkles,
  CheckCircle2,
  Star,
  Quote
} from 'lucide-react'
import { StorySection } from '@/components/home/StorySection'
import { CompanyTimeline } from '@/components/about/CompanyTimeline'
import { ProcessFlow } from '@/components/about/ProcessFlow'
import { ClientLogos } from '@/components/about/ClientLogos'
import { AboutContactCTA } from '@/components/about/AboutContactCTA'
import { getCompanyName } from '@/lib/company'

export default async function AboutPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params?.locale || 'en'
  const companyName = await getCompanyName(locale)
  const t = await getTranslations({ locale, namespace: 'About' })

  const copyMap: Record<string, {
    provenTrackRecord: string
    logisticsInfrastructure: string
    infrastructureTitle: string
    infrastructureSubtitle: string
    onSiteSupervision: string
    competitiveEdge: string
    clientTrust: string
    experienceBadge: string
    growth: [string, string, string, string]
    diffMetrics: [
      { metric: string; badge: string },
      { metric: string; badge: string },
      { metric: string; badge: string },
      { metric: string; badge: string }
    ]
    strategicHubs: Array<{
      name: string
      role: string
      specs: string
      icon: any
    }>
  }> = {
    en: {
      provenTrackRecord: 'Proven Track Record',
      logisticsInfrastructure: 'Logistics Infrastructure',
      infrastructureTitle: "Direct Operations Across China's Trade Gateways",
      infrastructureSubtitle: 'We operate our own consolidation facilities and licensed customs teams in key industrial manufacturing centers across China.',
      onSiteSupervision: '100% On-Site Supervision',
      competitiveEdge: 'Competitive Edge',
      clientTrust: 'Client Trust & Verification',
      experienceBadge: '15+ Years Direct China Freight & Sourcing',
      growth: ['+15% YoY', 'Across 6 Continents', '+28% Annual Volume', 'Enterprise Standard'],
      diffMetrics: [
        { metric: '15+ years local presence in China', badge: 'Direct Access' },
        { metric: '99.7% quality approval rate', badge: 'ISO 9001 Audited' },
        { metric: '12-18 days average delivery', badge: 'Dedicated Routes' },
        { metric: '100% price transparency', badge: 'Zero Hidden Fees' }
      ],
      strategicHubs: [
        {
          name: 'Yiwu Central Logistics Park',
          role: 'Consolidation & Quality Inspection HQ',
          specs: '30,000+ sqm automated sorting hub',
          icon: Building2
        },
        {
          name: 'Ningbo-Zhoushan Port CFS',
          role: 'Direct Ocean Freight Staging',
          specs: "World's busiest cargo port gateway",
          icon: Anchor
        },
        {
          name: 'Shanghai (Yangshan) Deepwater Hub',
          role: 'Global Transpacific & Euro Corridors',
          specs: 'Express container vessel allocations',
          icon: Globe
        },
        {
          name: 'Shenzhen & Guangzhou Air Station',
          role: 'High-Speed Express & Tech Logistics',
          specs: '48-hour global air cargo dispatch',
          icon: Truck
        }
      ]
    },
    ru: {
      provenTrackRecord: 'Проверенная репутация',
      logisticsInfrastructure: 'Логистическая инфраструктура',
      infrastructureTitle: 'Прямые операции в ключевых торговых узлах Китая',
      infrastructureSubtitle: 'Мы управляем собственными складами консолидации и лицензированными таможенными брокерами в крупнейших промышленных центрах Китая.',
      onSiteSupervision: '100% контроль на месте',
      competitiveEdge: 'Ключевые преимущества',
      clientTrust: 'Доверие и отзывы клиентов',
      experienceBadge: 'Более 15 лет прямых поставок и логистики из Китая',
      growth: ['+15% в год', 'На 6 континентах', '+28% годовой объем', 'Корпоративный стандарт'],
      diffMetrics: [
        { metric: 'Более 15 лет на рынке Китая', badge: 'Прямой доступ' },
        { metric: '99.7% соответствие стандартам', badge: 'Аудит ISO 9001' },
        { metric: '12-18 дней средний срок', badge: 'Выделенные маршруты' },
        { metric: '100% прозрачность цен', badge: 'Без скрытых комиссий' }
      ],
      strategicHubs: [
        {
          name: 'Центральный логистический парк в Иу',
          role: 'Штаб-квартира консолидации и контроля качества',
          specs: 'Автоматизированный склад более 30 000 кв.м',
          icon: Building2
        },
        {
          name: 'Морской терминал Нинбо-Чжоушань',
          role: 'Прямая морская контейнерная обработка',
          specs: 'Крупнейший грузовой морской порт в мире',
          icon: Anchor
        },
        {
          name: 'Глубоководный хаб Шанхай (Яншань)',
          role: 'Европейские и трансокеанские коридоры',
          specs: 'Прямое букирование контейнерных судов',
          icon: Globe
        },
        {
          name: 'Авиатерминал Шэньчжэнь и Гуанчжоу',
          role: 'Срочная авиалогистика и доставка',
          specs: 'Авиаотправка по миру за 48 часов',
          icon: Truck
        }
      ]
    },
    zh: {
      provenTrackRecord: '卓越实力见证',
      logisticsInfrastructure: '中国枢纽自营网络',
      infrastructureTitle: '直营集运枢纽覆盖中国核心外贸口岸',
      infrastructureSubtitle: '我们在中国主要工业制造基地和集运港口设立自营集货分拨仓与专业报关清关团队。',
      onSiteSupervision: '100% 现场全程监管',
      competitiveEdge: '核心竞争优势',
      clientTrust: '客户信任与口碑验证',
      experienceBadge: '15+ 年中国源头采购与国际集运物流沉淀',
      growth: ['同比增长 +15%', '覆盖全球 6 大洲', '年交付量增长 +28%', '全球企业级标准'],
      diffMetrics: [
        { metric: '15+ 年中国本地自营团队', badge: '源头直连' },
        { metric: '99.7% 出厂质量合格率', badge: 'ISO 9001 认证' },
        { metric: '12-18 天全球干线时效', badge: '专属集运干线' },
        { metric: '100% 价格透明', badge: '零隐藏杂费' }
      ],
      strategicHubs: [
        {
          name: '义乌中央集运与国际物流园区',
          role: '自营集货仓与出厂质检中心',
          specs: '30,000+ ㎡ 智能化分拣仓储中心',
          icon: Building2
        },
        {
          name: '宁波舟山港拼箱海运中心',
          role: '直发海运集装箱堆场',
          specs: '全球货物吞吐量第一大港核心枢纽',
          icon: Anchor
        },
        {
          name: '上海洋山深水港国际枢纽',
          role: '欧美与中亚干线快船走廊',
          specs: '保税快运与重箱直装专属舱位',
          icon: Globe
        },
        {
          name: '深圳与广州空港快件物流站',
          role: '高精设备空运与极速清关',
          specs: '48小时全球高运力航空直飞',
          icon: Truck
        }
      ]
    }
  }

  const copy = copyMap[locale] || copyMap.en

  const achievements = [
    { label: t('achievements.verifiedSuppliers'), value: '2,500+', icon: Users, growth: copy.growth[0] },
    { label: t('achievements.globalDestinations'), value: '180+', icon: Globe, growth: copy.growth[1] },
    { label: t('achievements.ordersFulfilled'), value: '1.2M+', icon: Package, growth: copy.growth[2] },
    { label: t('achievements.clientRetention'), value: '94%', icon: TrendingUp, growth: copy.growth[3] },
  ]

  const differentiators = [
    {
      title: t('differentiators.marketInsidersTitle'),
      description: t('differentiators.marketInsidersDesc'),
      icon: MapPin,
      metrics: copy.diffMetrics[0].metric,
      badge: copy.diffMetrics[0].badge
    },
    {
      title: t('differentiators.qualityAssuranceTitle'),
      description: t('differentiators.qualityAssuranceDesc'),
      icon: ShieldCheck,
      metrics: copy.diffMetrics[1].metric,
      badge: copy.diffMetrics[1].badge
    },
    {
      title: t('differentiators.logisticsNetworkTitle'),
      description: t('differentiators.logisticsNetworkDesc'),
      icon: Clock,
      metrics: copy.diffMetrics[2].metric,
      badge: copy.diffMetrics[2].badge
    },
    {
      title: t('differentiators.transparentPricingTitle'),
      description: t('differentiators.transparentPricingDesc'),
      icon: Target,
      metrics: copy.diffMetrics[3].metric,
      badge: copy.diffMetrics[3].badge
    },
  ]

  const testimonials = [
    {
      quote: t('testimonials.quote1', { name: companyName }),
      author: "Marcus Vance",
      title: t('testimonials.author1Title'),
      company: "Vance Industrial Systems Ltd",
      rating: 5,
      location: locale === 'ru' ? 'Сан-Франциско, США' : locale === 'zh' ? '美国 旧金山' : 'San Francisco, USA'
    },
    {
      quote: t('testimonials.quote2'),
      author: "Dmitry Sokolov",
      title: t('testimonials.author2Title'),
      company: "Sokolov Heavy Workshop",
      rating: 5,
      location: locale === 'ru' ? 'Москва, Россия' : locale === 'zh' ? '俄罗斯 莫斯科' : 'Moscow, Russia'
    }
  ]

  return (
    <SharedLayout 
      pageTitle={t('pageTitle', { name: companyName })}
      pageDescription={t('pageDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/about' }
      ]}
      backgroundImage="/images/services-bg.jpg"
    >
      <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#060d17] dark:via-[#0a1628] dark:to-[#060d17]">
        {/* Top Story Narrative Section */}
        <StorySection />

        {/* Enhanced Global Stats & Impact Section */}
        <section className="bg-white dark:bg-[#0a1628] border-y border-gray-200/80 dark:border-white/10 py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-500 bg-secondary-50 dark:bg-secondary-950/40 px-3.5 py-1 rounded-full border border-secondary-200 dark:border-secondary-500/30">
                {copy.provenTrackRecord}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('stats.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                {t('stats.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div 
                    key={idx} 
                    className="p-6 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary-200 hover:bg-white dark:hover:bg-white/10 hover:shadow-brand-lg transition-all duration-300 text-center group"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white dark:bg-[#0d1e32] text-secondary-500 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-white/10 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-[#c9a84c] mb-1 tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      {stat.label}
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                      {stat.growth}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Strategic Infrastructure & China Hubs */}
        <section className="py-20 bg-gray-50/80 dark:bg-[#070e18]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-[#c9a84c] bg-primary-50 dark:bg-white/5 px-3.5 py-1 rounded-full border border-primary-200 dark:border-white/10">
                {copy.logisticsInfrastructure}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                {copy.infrastructureTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {copy.infrastructureSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {copy.strategicHubs.map((hub, idx) => {
                const Icon = hub.icon
                return (
                  <div 
                    key={idx}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0a1628] border border-gray-200/80 dark:border-white/10 shadow-brand hover:shadow-brand-lg hover:border-primary-300 dark:hover:border-[#c9a84c]/50 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-white/5 text-primary-600 dark:text-[#c9a84c] flex items-center justify-center border border-primary-100 dark:border-white/10 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug">{hub.name}</h3>
                      <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">{hub.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{hub.specs}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-white/10 mt-4 flex items-center text-xs font-semibold text-primary-600 dark:text-[#c9a84c]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                      {copy.onSiteSupervision}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Company History & Timeline */}
        <CompanyTimeline />

        {/* Mission & Process Flow Section */}
        <section className="bg-white dark:bg-[#0a1628] border-y border-gray-200/80 dark:border-white/10 py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-500 bg-secondary-50 dark:bg-secondary-950/40 px-3.5 py-1 rounded-full border border-secondary-200 dark:border-secondary-500/30">
                {t('mission.badge')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 max-w-3xl mx-auto">
                {t('mission.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
                {t('mission.description')}
              </p>
            </div>
          
            {/* Process Flow */}
            <ProcessFlow />
          </div>
        </section>

        {/* What Makes Us Different / Core Differentiators */}
        <section className="py-20 bg-gray-50 dark:bg-[#070e18]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-[#c9a84c] bg-primary-50 dark:bg-white/5 px-3.5 py-1 rounded-full border border-primary-200 dark:border-white/10">
                {copy.competitiveEdge}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('differentiators.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {t('differentiators.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {differentiators.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div 
                    key={idx} 
                    className="p-8 rounded-3xl bg-white dark:bg-[#0a1628] border border-gray-200/80 dark:border-white/10 shadow-brand hover:shadow-brand-lg hover:border-primary-300 dark:hover:border-[#c9a84c]/50 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-950/40 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-500/30 group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:text-[#c9a84c] bg-primary-50 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-primary-100 dark:border-white/10">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{item.description}</p>
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-secondary-600 dark:text-secondary-400 pt-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          {item.metrics}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Client Success Stories & Social Proof */}
        <section className="bg-white dark:bg-[#0a1628] border-t border-gray-200/80 dark:border-white/10 py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-500 bg-secondary-50 dark:bg-secondary-950/40 px-3.5 py-1 rounded-full border border-secondary-200 dark:border-secondary-500/30">
                {copy.clientTrust}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('testimonials.heading')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                {t('testimonials.subheading', { name: companyName })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className="bg-gray-50/70 dark:bg-white/5 rounded-3xl p-8 border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-brand-lg hover:bg-white dark:hover:bg-white/10 hover:border-primary-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                >
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-gray-200/60 dark:text-white/10 pointer-events-none" />
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base italic">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="border-t border-gray-200/80 dark:border-white/10 pt-4 mt-6 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{testimonial.author}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.title}</p>
                      <p className="text-xs font-bold text-secondary-600 dark:text-secondary-400 mt-0.5">{testimonial.company}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{testimonial.location}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Client Brand Logos */}
            <ClientLogos />
          </div>
        </section>

        {/* Global Conversion CTA Section */}
        <section className="bg-gradient-primary text-white py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-secondary-300 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              {copy.experienceBadge}
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t('cta.title')}
            </h2>
            <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('cta.subtitle', { name: companyName })}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <LocaleLink 
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-secondary-500 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-secondary-600 hover:shadow-gold hover:scale-[1.02] shadow-md w-full sm:w-auto"
              >
                {t('cta.getQuote')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </LocaleLink>
              <LocaleLink 
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40 w-full sm:w-auto"
              >
                {t('cta.exploreServices')}
              </LocaleLink>
            </div>

            <div className="pt-6">
              <AboutContactCTA />
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
