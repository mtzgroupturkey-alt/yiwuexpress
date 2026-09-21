'use client'

import React, { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Calculator, 
  ArrowRight, 
  Info, 
  PackageOpen, 
  Sparkles, 
  ChevronRight, 
  Plane, 
  Ship, 
  Zap, 
  ShieldCheck, 
  Scale, 
  Box, 
  CheckCircle2, 
  FileText,
  Clock,
  Building2,
  Globe2
} from 'lucide-react'
import { MobileFreightCalculator } from '@/components/mobile/logistics/MobileFreightCalculator'

export default function CalculatorPage() {
  const t = useTranslations('Calculator')
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  // Input State
  const [origin, setOrigin] = useState('China (Ningbo / Zhejiang)')
  const [destination, setDestination] = useState('Russia')
  const [weight, setWeight] = useState('250')
  const [length, setLength] = useState('120')
  const [width, setWidth] = useState('80')
  const [height, setHeight] = useState('100')
  const [serviceType, setServiceType] = useState('sea')
  const [insurance, setInsurance] = useState(true)

  // Output State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<{
    estimatedPrice: number
    currency: string
    breakdown: {
      baseRate: number
      weightKg: number
      multiplier: number
      destinationFactor: number
    }
  } | null>(null)

  // Volumetric weight helper
  const volWeight = (parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0) / 5000
  const cbm = ((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0)) / 1000000

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !weight) {
      setError(locale === 'ru' ? 'Пожалуйста, заполните пункт отправления, назначения и вес.' : locale === 'zh' ? '请填写始发地、目的地和货物重量。' : 'Please fill in Origin, Destination, and Weight.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          weight,
          dimensions: `${length}x${width}x${height}`,
          serviceType,
          insuranceRequired: insurance
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate. Please try again.')
      }

      const data = await response.json()
      setEstimate(data)
    } catch (err: any) {
      setError(err.message || 'Server calculation error. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const transportModes = [
    { id: 'sea', label: locale === 'ru' ? 'Морской фрахт (FCL/LCL)' : locale === 'zh' ? '海运整箱/拼箱' : 'Ocean Freight', speed: '18-28 Days', icon: Ship, color: 'text-blue-500' },
    { id: 'air', label: locale === 'ru' ? 'Авиаперевозка' : locale === 'zh' ? '航空标准专线' : 'Air Freight', speed: '5-8 Days', icon: Plane, color: 'text-sky-500' },
    { id: 'express', label: locale === 'ru' ? 'Экспресс-курьер' : locale === 'zh' ? '特快急件清关' : 'Express Courier', speed: '3-5 Days', icon: Zap, color: 'text-amber-500' },
  ]

  const handleCalculateMobile = async (params: {
    origin: string
    destination: string
    weight: string
    dimensions: string
    serviceType: string
    insuranceRequired: boolean
  }) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error('Failed to calculate. Please try again.')
      }

      const data = await response.json()
      setEstimate(data)
    } catch (err: any) {
      setError(err.message || 'Server calculation error. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* MOBILE FREIGHT CALCULATOR VIEW (Phase 5, hidden on md+) */}
      <div className="md:hidden">
        <MobileFreightCalculator
          onCalculate={handleCalculateMobile}
          estimate={estimate}
          isLoading={loading}
          error={error}
        />
      </div>

      {/* DESKTOP FREIGHT CALCULATOR VIEW (100% byte-identical, hidden on mobile) */}
      <div className="hidden md:block">
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
                <span>{locale === 'ru' ? 'Онлайн-калькулятор логистики' : locale === 'zh' ? '海运与空运运价实时核算' : 'Instant Freight Rate Estimator'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('pageTitle')}
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
                  <span>Real-Time Rates</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>100% Insured</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Ningbo & China Hubs</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <span>DDP & FOB Ready</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. CALCULATOR FORM & ESTIMATION RESULTS
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-[#00407a]/10 text-[#00407a] flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {t('cargoDetails')}
                    </h2>
                    <span className="text-xs text-slate-400">
                      {locale === 'ru' ? 'Укажите параметры груза для моментального расчета' : locale === 'zh' ? '输入货物体积与始发目的港' : 'Enter cargo dimensions and trade lanes'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCalculate} className="space-y-4">
                  {/* Origin & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {t('form.origin')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="e.g. China (Ningbo Port)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {t('form.destination')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Russia, Belarus, USA..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('form.freightSpeed')}
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {transportModes.map((mode) => {
                        const isSelected = serviceType === mode.id
                        const ModeIcon = mode.icon
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setServiceType(mode.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#00407a] bg-[#00407a] text-white shadow-2xs'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <ModeIcon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : mode.color}`} />
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold block truncate">{mode.label}</span>
                              <span className={`text-[10px] block ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                                {mode.speed}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Weight & Dimension */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {t('form.weight')} (KG) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 250"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-900 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {t('form.dimensions')} (L × W × H cm)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="number"
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          placeholder="L"
                          className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-center text-sm text-slate-900"
                        />
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="W"
                          className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-center text-sm text-slate-900"
                        />
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="H"
                          className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-center text-sm text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Volume Summary Info */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-slate-400" />
                      <span>{locale === 'ru' ? 'Расчет объема:' : locale === 'zh' ? '体积核算：' : 'Calculated Volume:'}</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {cbm.toFixed(2)} CBM • Vol: {volWeight.toFixed(1)} KG
                    </span>
                  </div>

                  {/* Insurance Option */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="calc-insurance"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                      className="w-4 h-4 text-[#00407a] rounded border-slate-300 focus:ring-[#00407a] cursor-pointer"
                    />
                    <label htmlFor="calc-insurance" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      {t('form.addInsurance')} (+ $50.00 VIP Coverage)
                    </label>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('estimating')}</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        <span>{t('getEstimation')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Output / Quotation (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {!estimate && !loading ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center flex flex-col justify-center items-center min-h-[380px]">
                    <PackageOpen className="w-14 h-14 text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-900">{t('results.noEstimation')}</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                      {t('results.noEstimationHint')}
                    </p>
                  </div>
                ) : loading ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center flex flex-col justify-center items-center min-h-[380px] animate-pulse space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900">{t('results.quotationPreview')}</h3>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Indicative Quote
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-[#0B192C] to-[#00407a] rounded-2xl p-6 text-white space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Estimated Total Cost
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono">
                        ${((estimate?.estimatedPrice ?? 0) + (insurance ? 50 : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-xs text-slate-300 block">
                        Currency: {estimate?.currency} • Terms: Port-to-Door DDP
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                        <span>{t('results.serviceRate')}</span>
                        <strong className="text-slate-900 font-mono">${estimate?.breakdown.baseRate.toFixed(2)} / kg</strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                        <span>{t('results.totalWeight')}</span>
                        <strong className="text-slate-900 font-mono">{estimate?.breakdown.weightKg} kg</strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                        <span>{t('results.speedFactor')}</span>
                        <strong className="text-slate-900 font-mono">x{estimate?.breakdown.multiplier}</strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                        <span>{t('results.routeFactor', { destination })}</span>
                        <strong className="text-slate-900 font-mono">x{estimate?.breakdown.destinationFactor}</strong>
                      </div>
                      {insurance && (
                        <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-700 bg-emerald-50/50 px-2 rounded-lg">
                          <span>{t('results.insurance')}</span>
                          <strong className="font-mono">+$50.00</strong>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <LocaleLink
                        href={`/dashboard/quotes?service=${serviceType}&weight=${weight}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
                        className="w-full bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{t('results.lockRate')}</span>
                      </LocaleLink>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                      <p>
                        <strong>{t('results.disclaimerTitle')}</strong> {t('results.disclaimerBody')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Direct Guarantee Box */}
                <div className="rounded-3xl p-6 bg-slate-900 text-white shadow-sm border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Fixed Price Guarantee</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Formal quotation offers generated through our platform are locked in for 30 calendar days against freight spot market spikes.
                  </p>
                </div>
              </div>

            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  </div>
</>
  )
}
