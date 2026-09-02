'use client'

import { LocaleLink } from '@/components/LocaleLink'
import { Container } from '@/components/ui/Container'
import { 
  ArrowRight, 
  BadgePercent,
  CheckCircle2
} from 'lucide-react'
import { useLocale } from 'next-intl'

export function BulkWholesaleBanner() {
  const locale = useLocale()

  const copyMap: Record<string, {
    badge: string
    title: string
    description: string
    tier: string
    cert: string
    moq: string
    ctaRfq: string
    ctaCatalog: string
  }> = {
    en: {
      badge: 'B2B Wholesale & Factory Direct Sourcing',
      title: 'Equip Your Facility with Factory-Direct Machinery & Tools',
      description: 'Need customized industrial equipment, OEM/ODM private labeling, or bulk volume pricing? Submit an instant Request for Quotation (RFQ) and receive verified manufacturer pricing within 24 hours.',
      tier: 'Tiered Volume Discounts',
      cert: 'CE / ISO 9001 Compliance',
      moq: 'Samples & Low MOQ Support',
      ctaRfq: 'Request Wholesale RFQ',
      ctaCatalog: 'Browse Full Product Catalog'
    },
    ru: {
      badge: 'Оптовые B2B поставки напрямую с заводов',
      title: 'Оснастите производство станками и инструментами от производителей',
      description: 'Требуется оборудование под заказ, OEM/ODM производство или оптовые скидки? Отправьте запрос на расчет (RFQ) и получите цены от проверенных заводов в течение 24 часов.',
      tier: 'Скидки от объема заказа',
      cert: 'Стандарты CE / ISO / EAC',
      moq: 'Образцы и гибкий MOQ',
      ctaRfq: 'Запросить оптовый расчет',
      ctaCatalog: 'Каталог всех товаров'
    },
    zh: {
      badge: 'B2B源头工厂直供与大宗批发采购',
      title: '一站式采购工业级机械设备与专业五金工具',
      description: '需要定制工业装备、OEM/ODM贴牌或集装箱批量采购？立即提交大宗采购询价单（RFQ），24小时内获取认证源头工厂底价与交期方案。',
      tier: '阶梯批量采购折扣',
      cert: 'CE / ISO 9001出厂合规认证',
      moq: '支持打样与低起订量试单',
      ctaRfq: '提交大宗采购询价',
      ctaCatalog: '浏览全部产品目录'
    }
  }

  const copy = copyMap[locale] || copyMap.en

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-[#060d17] overflow-hidden">
      <Container maxWidth="2xl">
        <div className="relative rounded-3xl bg-gradient-primary text-white p-8 sm:p-12 lg:p-14 shadow-brand-lg overflow-hidden border border-primary-700">
          {/* Ambient Glows */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-secondary-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary-500/20 border border-secondary-400/30 text-xs font-bold text-secondary-300 backdrop-blur-md">
                <BadgePercent className="w-4 h-4" />
                <span>{copy.badge}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {copy.title}
              </h2>

              <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-2xl">
                {copy.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  <span>{copy.tier}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  <span>{copy.cert}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  <span>{copy.moq}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
              <LocaleLink
                href="/wholesale"
                className="inline-flex items-center justify-center px-6 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-2xl shadow-md hover:shadow-gold transition-all duration-200 text-center text-sm"
              >
                <span>{copy.ctaRfq}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </LocaleLink>

              <LocaleLink
                href="/products"
                className="inline-flex items-center justify-center px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-2xl transition-all duration-200 text-center text-sm backdrop-blur-sm"
              >
                <span>{copy.ctaCatalog}</span>
              </LocaleLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
