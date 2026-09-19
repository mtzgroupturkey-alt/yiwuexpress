'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  HelpCircle, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  DollarSign, 
  Package, 
  Building2, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight,
  FileText,
  Clock,
  Globe2
} from 'lucide-react'

export default function FaqPage() {
  const t = useTranslations('Faq')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const categories = [
    { id: 'all', labelEn: 'All Questions', labelRu: 'Все вопросы', labelZh: '全部问答', icon: HelpCircle },
    { id: 'sourcing', labelEn: 'Sourcing & Factories', labelRu: 'Поиск заводов и закупки', labelZh: '工厂寻源与采购', icon: Building2 },
    { id: 'logistics', labelEn: 'Shipping & Freight', labelRu: 'Доставка и логистика', labelZh: '国际货运与报关', icon: Truck },
    { id: 'pricing', labelEn: 'Pricing & Escrow', labelRu: 'Цены и гарантии оплаты', labelZh: '结算与资金担保', icon: DollarSign },
    { id: 'orders', labelEn: 'Orders & Tracking', labelRu: 'Заказы и инспекция', labelZh: '订单跟踪与验货', icon: Package },
  ]

  const rawFaqs = [
    {
      category: 'sourcing',
      qEn: t('sourcingDelivery.q'),
      aEn: t('sourcingDelivery.a'),
      qRu: 'Сколько времени занимает поиск и доставка товаров?',
      aRu: 'Стандартный цикл составляет от 2 до 4 недель, включая проверку благонадежности фабрики, отбор образцов, консолидацию на складе в Китае и таможенное оформление.',
      qZh: '工厂寻源到门交付通常需要多久？',
      aZh: '常规订单全周期约 2 至 4 周，涵盖供应商工商资质核查、样品质检、中国自营仓智能集运与出口报关。',
      icon: Clock,
    },
    {
      category: 'orders',
      qEn: t('qualityInspection.q'),
      aEn: t('qualityInspection.a'),
      qRu: 'Как проводится контроль качества и проверка фабрик?',
      aRu: 'Наши штатные инженеры проводят выездную инспекцию оборудования, проверяют соответствие спецификациям, предоставляют 4K-видеоотчеты и протоколы до отгрузки контейнера.',
      qZh: '你们如何进行驻厂质检与验货？',
      aZh: '我们常驻中国核心产业带的工程师执行出厂前全检或抽检，核对模具尺寸与电气参数，出具高清视频验货报告。',
      icon: ShieldCheck,
    },
    {
      category: 'logistics',
      qEn: t('shippingRoutes.q'),
      aEn: t('shippingRoutes.a'),
      qRu: 'Какие маршруты и способы доставки вы предоставляете?',
      aRu: 'Мы предлагаем морские контейнерные перевозки FCL/LCL через порты Нинбо и Шанхай, ускоренные контейнерные поезда, а также авиадоставку direct-flight за 3-5 дней.',
      qZh: '支持哪些国际货运物流航线？',
      aZh: '涵盖宁波及上海港海运整箱拼箱（FCL/LCL）、中欧班列铁路快运及 48 小时直飞航空专线，双清包税派送到门。',
      icon: Truck,
    },
    {
      category: 'pricing',
      qEn: t('pricing.q'),
      aEn: t('pricing.a'),
      qRu: 'Как формируется оптовая цена и расчет затрат?',
      aRu: 'Мы работаем напрямую с заводами по себестоимости производителей без скрытых надбавок. Все сметы прозрачны, включают логистику, страховку и фиксируются в договоре.',
      qZh: '大宗批发采购价格如何计算？',
      aZh: '我们直接穿透源头工厂底价，提供涵盖内陆驳运、海运干线、出口退税及关税的全透明成本清单，报价有效期长达 30 天。',
      icon: DollarSign,
    },
    {
      category: 'orders',
      qEn: t('trackOrder.q'),
      aEn: t('trackOrder.a'),
      qRu: 'Как отслеживать статус груза и местоположение?',
      aRu: 'Каждому отправлению присваивается уникальный международный трек-номер. Вы можете видеть этапы: консолидация на складе, таможня Китая, выход в море, прибытие в порт назначения.',
      qZh: '如何全程追踪在途货物轨迹？',
      aZh: '系统为每票集装箱提供实时 GPS 与提单跟踪节点，从国内集货入库、报关放行、公海航行至目的港清关一目了然。',
      icon: Package,
    },
    {
      category: 'sourcing',
      qEn: t('smallBusiness.q'),
      aEn: t('smallBusiness.a'),
      qRu: 'Работаете ли вы с малым и средним бизнесом?',
      aRu: 'Да, мы консолидируем сборные грузы (LCL) от 1 кубического метра или паллеты, помогая небольшим компаниям закупать товары в Китае по ценам крупных корпораций.',
      qZh: '支持中小企业小批量定制与拼箱吗？',
      aZh: '完全支持。我们提供 1 立方米起运的小批量拼箱（LCL）与样品打样服务，让初创买家同样享受一手出厂价。',
      icon: Building2,
    },
    {
      category: 'pricing',
      qEn: 'What payment and escrow methods are supported?',
      aEn: 'We support T/T bank wires, Letters of Credit (L/C), Escrow guarantees, and major corporate payment gateways. Funds remain secured until milestone inspection sign-offs.',
      qRu: 'Какие условия оплаты и защиты сделок вы принимаете?',
      aRu: 'Мы поддерживаем международные банковские переводы T/T, аккредитивы (L/C), эскроу-счета и корпоративные платежные карты с поэтапным высвобождением средств.',
      qZh: '支持哪些结算币种与资金托管方式？',
      aZh: '支持美金/人民币/欧元 T/T 电汇、国际信用证（L/C）以及第三方银行级资金托管，阶段性验货合格后方行解冻打款。',
      icon: ShieldCheck,
    },
    {
      category: 'logistics',
      qEn: 'What Incoterms trade terms do you operate under?',
      aEn: 'We provide FOB (Free on Board), CIF (Cost, Insurance and Freight), and comprehensive DDP (Delivered Duty Paid with destination customs clearance directly to your facility).',
      qRu: 'По каким правилам Инкотермс вы работаете?',
      aRu: 'Мы организуем поставки по правилам FOB, CIF и DDP (с полной таможенной очисткой, уплатой пошлин и выгрузкой на вашем складе).',
      qZh: '贸易条款支持哪些国际惯例（Incoterms）？',
      aZh: '标准支持 FOB（离岸价）、CIF（到岸含保价）以及最省心的 DDP（双清关含税直送买家海外仓库）。',
      icon: Globe2,
    },
  ]

  const filteredFaqs = useMemo(() => {
    return rawFaqs.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const question = locale === 'ru' ? item.qRu : locale === 'zh' ? item.qZh : item.qEn
      const answer = locale === 'ru' ? item.aRu : locale === 'zh' ? item.aZh : item.aEn
      const matchesQuery = !searchQuery.trim() || 
        question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        answer.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesQuery
    })
  }, [selectedCategory, searchQuery, locale])

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Search Bar)
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
                <span>{locale === 'ru' ? 'База знаний и ответы на вопросы' : locale === 'zh' ? '官方外贸与物流知识库' : 'Global Trade Knowledge Base'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {t('pageTitle')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('intro')}
              </p>

              {/* Instant Search Bar */}
              <div className="mt-8 max-w-xl relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ru' ? 'Поиск по вопросам (инспекция, сроки, порты)...' : locale === 'zh' ? '输入问题关键词（验厂、运费、清关、账期）...' : 'Search questions (inspection, freight, escrow, MOQs)...'}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F5A602] focus:bg-slate-900/90 text-sm transition"
                />
              </div>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'Ответ < 2 часов' : locale === 'zh' ? '2小时快速响应' : 'Response < 2h'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? '100% Эскроу' : locale === 'zh' ? '100% 履约担保' : '100% Escrow'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'Инспекция в Китае' : locale === 'zh' ? '驻厂品控验货' : 'China QC Audits'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'EN / RU / ZH' : locale === 'zh' ? '多语顾问支持' : 'Dedicated Desk'}</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. CATEGORY FILTER STRIP
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const CatIcon = cat.icon
                const isSelected = selectedCategory === cat.id
                const label = locale === 'ru' ? cat.labelRu : locale === 'zh' ? cat.labelZh : cat.labelEn
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00407a] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <CatIcon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. MAIN CONTENT: ACCORDION LIST & CONTACT BANNER
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive FAQ Accordion (8 cols) */}
              <div className="lg:col-span-8 space-y-3.5">
                {filteredFaqs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">
                      {locale === 'ru' ? 'Вопросы не найдены' : locale === 'zh' ? '未找到相关问答' : 'No matching questions found'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {locale === 'ru' ? 'Попробуйте изменить поисковый запрос или выберите другую категорию.' : locale === 'zh' ? '请尝试搜索其他关键字，或直接联系我们的专属贸易客服。' : 'Try adjusting your search terms or contact our trade advisory desk directly.'}
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isOpen = openIndex === idx
                    const QuestionIcon = faq.icon
                    const question = locale === 'ru' ? faq.qRu : locale === 'zh' ? faq.qZh : faq.qEn
                    const answer = locale === 'ru' ? faq.aRu : locale === 'zh' ? faq.aZh : faq.aEn

                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                          isOpen 
                            ? 'border-[#00407a]/40 shadow-sm ring-1 ring-[#00407a]/10' 
                            : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <button
                          onClick={() => toggleAccordion(idx)}
                          className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isOpen ? 'bg-[#00407a] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#00407a]'
                            }`}>
                              <QuestionIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#00407a] transition-colors">
                              {question}
                            </h3>
                          </div>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                            isOpen ? 'bg-slate-100 text-slate-700 rotate-180' : 'text-slate-400'
                          }`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-6 pt-1 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                            <p>{answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Right Column: Instant Assistance Card (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#00407a] flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {locale === 'ru' ? 'Не нашли ответ на ваш вопрос?' : locale === 'zh' ? '还有其他特殊定制疑问？' : 'Still have questions?'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {locale === 'ru'
                        ? 'Наши специалисты по закупкам и логистике в Китае проконсультируют вас в течение 2 часов.'
                        : locale === 'zh'
                        ? '我们常驻中国的一线商务及海运关务专员随时为您提供 1 对 1 专业咨询。'
                        : 'Our trade and customs specialists in China are ready to provide custom answers for your project.'}
                    </p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <LocaleLink
                      href="/contact"
                      className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
                    >
                      <span>{locale === 'ru' ? 'Связаться с нами' : locale === 'zh' ? '在线联系咨询' : 'Contact Support'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </LocaleLink>

                    <LocaleLink
                      href="/dashboard/quotes"
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{locale === 'ru' ? 'Запросить расчет КП' : locale === 'zh' ? '快速提交询价单' : 'Submit Wholesale RFQ'}</span>
                    </LocaleLink>
                  </div>
                </div>

                {/* Direct Trade Assurance Box */}
                <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-[#00407a] text-white shadow-sm border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{companyName} Guarantee</span>
                  </div>
                  <h4 className="text-base font-black tracking-tight leading-snug">
                    {locale === 'ru' ? 'Гарантированная безопасность груза' : locale === 'zh' ? '全流程闭环采购保障' : 'Guaranteed Cargo Safety'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {locale === 'ru'
                      ? 'Полное страхование морских и авиаперевозок, фотоотчеты при погрузке и таможенная очистка.'
                      : locale === 'zh'
                      ? '提供集装箱监装打铅封照片、海关清关放行回执及 100% 全险保驾护航。'
                      : 'Comprehensive cargo insurance, container loading inspection photo audits, and guaranteed clearance.'}
                  </p>
                </div>
              </div>

            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
