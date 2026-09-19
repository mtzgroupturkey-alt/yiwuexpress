'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Search, 
  MapPin, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Anchor, 
  Building2, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Globe2
} from 'lucide-react'

export default function TrackPage() {
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['track-shipment', searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(searchTerm)}`)
      if (!res.ok) {
        throw new Error('No shipment found with this tracking code.')
      }
      return res.json()
    },
    enabled: !!searchTerm,
    retry: false,
  })

  const result = data?.data

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      setSearchTerm(trackingNumber.trim())
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const num = params.get('num') || params.get('tracking')
      if (num) {
        setTrackingNumber(num)
        setSearchTerm(num)
      }
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'IN_TRANSIT':
      case 'AT_SEA':
        return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'CUSTOMS':
      case 'CUSTOMS_CLEARED':
      case 'LOADING':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, { en: string; ru: string; zh: string }> = {
      PENDING: { en: 'Pending Confirmation', ru: 'Ожидает подтверждения', zh: '待处理' },
      PAID: { en: 'Payment Confirmed', ru: 'Оплачен', zh: '已支付' },
      PROCESSING: { en: 'Warehouse Processing', ru: 'Сборка на складе', zh: '仓库处理中' },
      LOADING: { en: 'Container Loading', ru: 'Погрузка в контейнер', zh: '集装箱装箱中' },
      CUSTOMS_CLEARED: { en: 'China Customs Cleared', ru: 'Таможня Китая пройдена', zh: '中国海关放行' },
      AT_SEA: { en: 'Maritime Transit (At Sea)', ru: 'В море / Морской фрахт', zh: '公海航行中' },
      IN_TRANSIT: { en: 'Destination Transit', ru: 'В пути к получателю', zh: '干线转运中' },
      DELIVERED: { en: 'Delivered & Accepted', ru: 'Доставлен и принят', zh: '已成功签收' },
    }
    const item = map[status]
    if (!item) return status
    return locale === 'ru' ? item.ru : locale === 'zh' ? item.zh : item.en
  }

  const sampleCodes = ['YWE87349823CN', 'GLT-88210T', 'CONT-99412D']

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
              <span className="text-[#F5A602] font-semibold">{locale === 'ru' ? 'Отслеживание' : locale === 'zh' ? '轨迹查询' : 'Track Cargo'}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Спутниковый мониторинг грузов' : locale === 'zh' ? '实时在途物流监控系统' : 'Real-Time Freight Tracker'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {locale === 'ru' ? 'Отслеживание грузов и контейнеров' : locale === 'zh' ? '集装箱与运单实时跟踪' : 'Cargo & Shipment Tracking'}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {locale === 'ru'
                  ? 'Введите номер отслеживания, номер заказа или коносамента для проверки текущей локации и таможенных отметок.'
                  : locale === 'zh'
                  ? '输入运单号、采购订单号或提单封条号，实时调取中国港口发运记录、公海海图轨迹与目的港清关状态。'
                  : 'Track your container, bill of lading, or express consignment from China consolidation ports to final delivery destination.'}
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleTrack} className="mt-8 max-w-xl flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={locale === 'ru' ? 'Введите трек-номер (например, YW123456CN)...' : locale === 'zh' ? '输入国际运单号 (如 YWE87349823CN)...' : 'Enter tracking code (e.g. YWE87349823CN)...'}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F5A602] focus:bg-slate-900/90 text-sm transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3.5 bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-sm shrink-0"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{locale === 'ru' ? 'Найти груз' : locale === 'zh' ? '立即查询' : 'Track Cargo'}</span>
                  )}
                </button>
              </form>

              {/* Sample Code Pills */}
              <div className="flex items-center gap-2 mt-4 text-xs text-slate-300 flex-wrap">
                <span className="text-slate-400">{locale === 'ru' ? 'Тестовые номера:' : locale === 'zh' ? '示例单号：' : 'Try samples:'}</span>
                {sampleCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setTrackingNumber(code)
                      setSearchTerm(code)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 font-mono transition cursor-pointer"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. TRACKING RESULTS & TIMELINE
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="max-w-4xl mx-auto">
              
              {/* Error Banner */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-6 sm:p-8 text-center mb-8 shadow-xs">
                  <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-rose-900">
                    {locale === 'ru' ? 'Отправление не найдено' : locale === 'zh' ? '未找到该运单' : 'Shipment Not Found'}
                  </h3>
                  <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
                    {locale === 'ru' ? 'Проверьте правильность введенного трек-номера или воспользуйтесь образцами выше.' : locale === 'zh' ? '请核对单号是否准确，或点击上方示例单号进行测试。' : 'Please verify the tracking code or try one of the sample numbers above.'}
                  </p>
                </div>
              )}

              {/* No Search Empty State */}
              {!searchTerm && !isLoading && (
                <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200/80 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#00407a] flex items-center justify-center mx-auto">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {locale === 'ru' ? 'Готовы отследить груз?' : locale === 'zh' ? '实时调取您的在途货物信息' : 'Ready to Track Your Freight?'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      {locale === 'ru' 
                        ? 'Введите трек-номер в поле выше, чтобы увидеть этапы прохождения таможни Китая, морские коридоры и ориентировочную дату прибытия.'
                        : locale === 'zh' 
                        ? '在上方输入单号，即可实时调阅宁波集货仓分拣、海关报关放行与目的港派送全节点。'
                        : 'Enter your tracking number above to inspect China warehouse check-ins, customs releases, and vessel arrival dates.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Result Card */}
              {result && (
                <div className="space-y-6">
                  {/* Summary Box */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {result.type === 'order' ? 'Commercial Order' : 'Container Consignment'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                            {result.trackingNumber}
                          </h2>
                          {result.orderNumber && (
                            <span className="text-xs text-slate-500">
                              (Order #{result.orderNumber})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${getStatusBadge(result.status)}`}>
                        {getStatusText(result.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Trade Corridor</span>
                          <span className="font-bold text-slate-900">{result.origin || 'China (Ningbo)'}</span>
                          <span className="mx-1.5 text-slate-400">→</span>
                          <span className="font-bold text-slate-900">{result.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Est. Delivery</span>
                          <span className="font-bold text-slate-900">
                            {result.estimatedDelivery 
                              ? new Date(result.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Calculating...'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Carrier</span>
                          <span className="font-bold text-slate-900">{result.carrier || 'Ocean Line'}</span>
                        </div>
                      </div>
                    </div>

                    {result.containerNumber && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-[#00407a]" />
                          <span>Container Seal ID:</span>
                          <strong className="text-slate-900 font-mono">{result.containerNumber}</strong>
                        </span>
                        <span className="text-emerald-700 font-bold">100% Escrow Insured</span>
                      </div>
                    )}
                  </div>

                  {/* Milestones Stepper */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                      {locale === 'ru' ? 'Этапы транспортировки и таможни' : locale === 'zh' ? '全链路物流节点详情' : 'Logistics Milestones & Checkpoints'}
                    </h3>

                    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      {(result.statusHistory || []).map((event: any, idx: number) => {
                        return (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-[23px] sm:-left-[27px] top-1 w-6 h-6 rounded-full bg-[#00407a] text-white flex items-center justify-center border-4 border-white shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {getStatusText(event.status)}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                                </span>
                              </div>
                              {event.note && (
                                <p className="text-xs text-slate-600 leading-relaxed">{event.note}</p>
                              )}
                              {event.location && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{event.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
