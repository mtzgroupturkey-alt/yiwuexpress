'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { useSettings } from '@/components/SettingsProvider'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck, 
  Building2, 
  MessageSquare, 
  Globe2, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileText,
  HelpCircle
} from 'lucide-react'

interface OfficeLocation {
  id: string
  type: string
  city: string
  address: string | null
  phone: string | null
  email: string | null
  hours: string | null
}

const INQUIRY_TYPES = [
  { id: 'sourcing', labelEn: 'Factory Sourcing & Audits', labelRu: 'Поиск заводов и аудит', labelZh: '工厂寻源与验厂' },
  { id: 'logistics', labelEn: 'Container Shipping & Freight', labelRu: 'Контейнерная логистика', labelZh: '集装箱国际物流' },
  { id: 'rfq', labelEn: 'Wholesale Pricing / RFQ', labelRu: 'Оптовые котировки / КП', labelZh: '大宗批发报价' },
  { id: 'support', labelEn: 'Orders & Support', labelRu: 'Заказы и поддержка', labelZh: '订单与售后服务' },
]

export default function ContactPage() {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const { settings } = useSettings()

  const companyName = settings?.companyName || 'Global Trade'
  const companyAddress = settings?.companyAddress || 'China International Trade Center, Chouzhou Road, Zhejiang, China'
  const companyPhone = settings?.companyPhone || '+86 579 8555 1234'
  const companyEmail = settings?.companyEmail || 'support@dromkok.com'
  const storeHours = settings?.storeHours || 'Mon - Sat: 9:00 AM - 6:00 PM (CST)'
  const whatsappNumber = settings?.whatsappNumber || ''
  const wechatId = settings?.wechatId || ''

  const fallbackOffices: OfficeLocation[] = [
    {
      id: 'fb-1',
      type: 'HEADQUARTERS',
      city: locale === 'ru' ? 'Штаб-квартира в Китае' : locale === 'zh' ? '中国总部' : 'China Headquarters',
      address: companyAddress,
      phone: companyPhone,
      email: companyEmail,
      hours: storeHours,
    },
    {
      id: 'fb-2',
      type: 'HUB',
      city: locale === 'ru' ? 'Логистический хаб Нинбо' : locale === 'zh' ? '宁波国际集运港' : 'Ningbo Maritime Gateway',
      address: locale === 'ru' 
        ? 'Портовый район Бэйлунь, ул. Байгуань 88, Нинбо, Чжэцзян, Китай' 
        : locale === 'zh' 
        ? '浙江省宁波市北仑港区百官路88号' 
        : 'No. 88 Baiguan Road, Beilun Deepwater Port, Ningbo, Zhejiang, China',
      phone: '+86 574 8688 5678',
      email: 'nb-ops@dromkok.com',
      hours: 'Mon - Fri: 9:00 AM - 5:30 PM (CST)',
    },
  ]

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [selectedInquiryType, setSelectedInquiryType] = useState('sourcing')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  })

  const [offices, setOffices] = useState<OfficeLocation[]>(fallbackOffices)
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    fetch(`/api/contact-locations?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setOffices(data.data)
        }
      })
      .catch(() => {
        // Fallback offices already initialized
      })
      .finally(() => setLoadingLocations(false))
  }, [locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const selectedTypeObj = INQUIRY_TYPES.find((t) => t.id === selectedInquiryType)
      const typeLabel = locale === 'ru' ? selectedTypeObj?.labelRu : locale === 'zh' ? selectedTypeObj?.labelZh : selectedTypeObj?.labelEn

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        subject: `[${typeLabel || selectedInquiryType}] ${form.subject.trim()}`,
        message: form.message.trim(),
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.')
      }

      setSuccess(true)
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending your message.')
    } finally {
      setLoading(false)
    }
  }

  const cleanPhoneLink = (phoneStr?: string | null) => {
    if (!phoneStr) return '#'
    return `tel:${phoneStr.replace(/[^\d+]/g, '')}`
  }

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Style with Brand Navy Gradient & Trust Badges)
           ========================================================================= */}
        <section className="relative bg-gradient-to-b from-[#0B192C] via-[#00407a] to-[#0B192C] text-white py-14 sm:py-18 overflow-hidden border-b border-slate-800">
          {/* Subtle Ambient Background Elements */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#F5A602_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F5A602]/10 rounded-full blur-3xl pointer-events-none"></div>

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
                <span>{locale === 'ru' ? 'Прямая связь с Китаем' : locale === 'zh' ? '一手直供 · 极速响应' : 'Direct China Sourcing Gateway'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {locale === 'ru'
                  ? `Свяжитесь с ${companyName}`
                  : locale === 'zh'
                  ? `联系 ${companyName} 团队`
                  : `Get in Touch with ${companyName}`}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('pageDescription')}
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'Ответ < 2 часов' : locale === 'zh' ? '2小时内极速响应' : 'Response < 2 Hours'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? '100% Защита сделки' : locale === 'zh' ? '100% 履约担保' : '100% Escrow Secured'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'Контроль на фабриках' : locale === 'zh' ? '驻厂品控验货' : 'On-Site China QC'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{locale === 'ru' ? 'Языки: EN / RU / ZH' : locale === 'zh' ? '中英俄多语支持' : 'EN / RU / ZH Support'}</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. QUICK CONTACT CHANNELS STRIP
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Phone Channel */}
              <a
                href={cleanPhoneLink(companyPhone)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-[#00407a] hover:shadow-md transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] group-hover:bg-[#00407a] group-hover:text-white transition flex items-center justify-center shrink-0 shadow-2xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {locale === 'ru' ? 'Прямой телефон' : locale === 'zh' ? '中国直线电话' : 'Direct Phone Line'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#00407a] transition block truncate">
                    {companyPhone}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {locale === 'ru' ? 'Звонок в главный офис' : locale === 'zh' ? '直连总部商务中心' : 'Direct HQ desk'}
                  </span>
                </div>
              </a>

              {/* Email Channel */}
              <a
                href={`mailto:${companyEmail}`}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-[#00407a] hover:shadow-md transition-all group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center shrink-0 shadow-2xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {locale === 'ru' ? 'Электронная почта' : locale === 'zh' ? '官方商务邮箱' : 'Official Email'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#00407a] transition block truncate">
                    {companyEmail}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {locale === 'ru' ? 'Для запросов и документов' : locale === 'zh' ? '接收询价单与合同' : 'Inquiries & formal quotes'}
                  </span>
                </div>
              </a>

              {/* Instant Messenger Channel */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-[#00407a] hover:shadow-md transition-all group flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center shrink-0 shadow-2xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {locale === 'ru' ? 'Мессенджеры' : locale === 'zh' ? '即时通讯' : 'Instant Chat'}
                  </span>
                  {whatsappNumber ? (
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-emerald-700 hover:underline block truncate"
                    >
                      WhatsApp: {whatsappNumber}
                    </a>
                  ) : wechatId ? (
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      WeChat ID: {wechatId}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      {locale === 'ru' ? 'Онлайн-консультант' : locale === 'zh' ? '专属外贸顾问' : 'B2B Trade Concierge'}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    {locale === 'ru' ? 'Быстрая связь в чате' : locale === 'zh' ? '扫码/加号即时沟通' : 'Real-time trade messaging'}
                  </span>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {locale === 'ru' ? 'Часы работы' : locale === 'zh' ? '工作时间 (北京时间)' : 'Business Hours'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {storeHours}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {locale === 'ru' ? 'Китай (CST, UTC+8)' : locale === 'zh' ? '周一至周六 快速响应' : 'China Standard Time (UTC+8)'}
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. MAIN CONTENT: INQUIRY FORM & VERIFIED HUBS
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Modern B2B Inquiry Form (7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00407a]/10 text-[#00407a] flex items-center justify-center font-bold">
                      <Send className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {t('sendInquiry')}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {t('inquiryHelp')}
                  </p>

                  {/* Department / Inquiry Type Pills */}
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      {locale === 'ru' ? 'Тип запроса' : locale === 'zh' ? '咨询业务类型' : 'Inquiry Purpose'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {INQUIRY_TYPES.map((type) => {
                        const isSelected = selectedInquiryType === type.id
                        const label = locale === 'ru' ? type.labelRu : locale === 'zh' ? type.labelZh : type.labelEn
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedInquiryType(type.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                              isSelected
                                ? 'bg-[#00407a] text-white border-[#00407a] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{label}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-300 ml-1.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Status Banners */}
                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">{t('successTitle')}</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">{t('successBody')}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-2xs">
                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">
                        {locale === 'ru' ? 'Ошибка отправки' : locale === 'zh' ? '提交失败' : 'Submission Error'}
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t('labelName')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        placeholder={t('phName')}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t('labelEmail')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        placeholder={t('phEmail')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {locale === 'ru' ? 'Телефон / WhatsApp' : locale === 'zh' ? '联系电话 / 微信' : 'Phone / WhatsApp'}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        placeholder="+1 (555) 019-2834"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t('labelCompany')}
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        placeholder={t('phCompany')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('labelSubject')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                      placeholder={t('phSubject')}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('labelMessage')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition leading-relaxed resize-y"
                      placeholder={t('phMessage')}
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{t('sending')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('sendMessage')}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2.5">
                      🔒 {locale === 'ru' ? 'Ваши данные защищены и передаются по зашифрованному протоколу SSL' : locale === 'zh' ? '所有信息均经过 256 位 SSL 加密传输，严格保护您的商业机密' : 'Your business inquiry is encrypted and protected under our non-disclosure policy.'}
                    </p>
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Office Locations & Verified Logistics Gateways (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {t('officeLocations')}
                    </h2>
                    <span className="text-xs font-bold text-slate-400">
                      {offices.length} {locale === 'ru' ? 'локации' : locale === 'zh' ? '个基地' : 'Hubs'}
                    </span>
                  </div>

                  {/* Office Cards List */}
                  <div className="space-y-3.5">
                    {loadingLocations ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse space-y-3">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      offices.map((office) => {
                        const isHQ = office.type === 'HEADQUARTERS'
                        return (
                          <div
                            key={office.id}
                            className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all space-y-3.5"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isHQ ? 'bg-[#00407a]/10 text-[#00407a]' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">{office.city}</h3>
                              </div>
                              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                isHQ 
                                  ? 'bg-blue-50 text-[#00407a] border border-blue-100' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {isHQ ? t('headquarters') : t('logisticsHub')}
                              </span>
                            </div>

                            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                              {office.address && (
                                <div className="flex items-start gap-2.5">
                                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <span className="leading-relaxed">{office.address}</span>
                                </div>
                              )}
                              {office.phone && (
                                <div className="flex items-center gap-2.5">
                                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                  <a href={cleanPhoneLink(office.phone)} className="hover:text-[#00407a] font-semibold transition">
                                    {office.phone}
                                  </a>
                                </div>
                              )}
                              {office.email && (
                                <div className="flex items-center gap-2.5">
                                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                  <a href={`mailto:${office.email}`} className="hover:text-[#00407a] font-semibold transition truncate">
                                    {office.email}
                                  </a>
                                </div>
                              )}
                              {office.hours && (
                                <div className="flex items-center gap-2.5">
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="text-slate-500 text-xs">{office.hours}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Trade Assurance & Direct Factory Card */}
                <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-[#00407a] text-white shadow-sm border border-slate-800 space-y-3.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{locale === 'ru' ? 'Гарантии B2B сделок' : locale === 'zh' ? '大宗贸易双重保障' : 'B2B Trade Guarantee'}</span>
                  </div>
                  <h4 className="text-base font-black tracking-tight leading-snug">
                    {locale === 'ru'
                      ? 'Прямой контроль качества и сопровождение грузов в Китае'
                      : locale === 'zh'
                      ? '中国源头工厂验厂、验货与海关通关一站式直通'
                      : 'End-to-End Factory Inspection & Cargo Escrow in China'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {locale === 'ru'
                      ? 'Мы инспектируем производственные линии до отгрузки, предоставляем подробные видеоотчеты и удерживаем оплату на эскроу-счете до успешного прохождения контроля.'
                      : locale === 'zh'
                      ? '装箱发运前由专业工程师现场检测规格与包装，提供全景验货视频；全流程银行级第三方资金托管保障。'
                      : 'Our local engineering inspectors verify dimensions, materials, and packaging before dispatch, providing pre-shipment video audits and milestone escrow.'}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <LocaleLink
                      href="/store"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5A602] hover:bg-[#d99200] text-slate-950 text-xs font-bold transition shadow-xs"
                    >
                      <span>{locale === 'ru' ? 'В каталог товаров' : locale === 'zh' ? '查看现货商城' : 'Explore Store'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </LocaleLink>
                    <LocaleLink
                      href="/dashboard/quotes"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{locale === 'ru' ? 'Запросить КП' : locale === 'zh' ? '在线询价' : 'Request RFQ'}</span>
                    </LocaleLink>
                  </div>
                </div>

              </div>

            </div>
          </Container>
        </section>

        {/* =========================================================================
            4. COMMON TRADE INQUIRY FAQ STRIP
           ========================================================================= */}
        <section className="py-12 bg-white border-t border-slate-200/80">
          <Container>
            <div className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#00407a] text-xs font-bold mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FAQ</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {locale === 'ru' ? 'Часто задаваемые вопросы перед обращением' : locale === 'zh' ? '商务咨询常见问答' : 'Frequently Asked Trade Questions'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {locale === 'ru' ? 'Как быстро мы получим расчет стоимости?' : locale === 'zh' ? '提交询价后多久可以收到正式报价单？' : 'How fast will we receive formal wholesale quotes?'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {locale === 'ru' 
                    ? 'Для стандартных позиций из каталога смета формируется в течение 2-4 рабочих часов. Для кастомных спецификаций и OEM/ODM — до 24 часов.' 
                    : locale === 'zh' 
                    ? '标准目录商品通常在 2-4 个工作小时内完成核算；OEM/ODM 定制模具及大宗外贸询价在 24 小时内出具含运费关税明细。' 
                    : 'Standard catalog items receive formal pricing within 2 to 4 hours. Custom OEM/ODM requests and large container consignments take up to 24 hours.'}
                </p>
              </div>

              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {locale === 'ru' ? 'Можно ли заказать инспекцию конкретного завода?' : locale === 'zh' ? '可以委托你们对指定中国供应商进行验厂吗？' : 'Can you inspect our existing suppliers in China?'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {locale === 'ru' 
                    ? 'Да. Наши выездные инспекторы проверяют легальность юрлица, производственные мощности, оборудование и стандарты ISO перед перечислением аванса.' 
                    : locale === 'zh' 
                    ? '支持。我们常驻浙江、江苏及广东的验厂专员可上门核验工商注册、车间设备、ISO 认证并提供详尽背景调查报告。' 
                    : 'Yes. Our licensed inspectors across Zhejiang, Jiangsu, and Guangdong can audit business licenses, machinery, working conditions, and quality protocols.'}
                </p>
              </div>

              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {locale === 'ru' ? 'Какие условия доставки вы поддерживаете?' : locale === 'zh' ? '支持哪些国际贸易运输条款（Incoterms）？' : 'What shipping incoterms do you support?'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {locale === 'ru' 
                    ? 'Мы работаем по правилам FOB, CIF и DDP (с полной таможенной очисткой и доставкой до склада покупателя в вашей стране).' 
                    : locale === 'zh' 
                    ? '支持 FOB、CIF、DAP 以及 DDP（双清包税到门）服务，覆盖海运整柜 FCL、拼箱 LCL、中欧班列及空运专线。' 
                    : 'We handle FOB, CIF, DAP, and comprehensive DDP (Delivered Duty Paid with full customs clearance directly to your destination warehouse).'}
                </p>
              </div>
            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
