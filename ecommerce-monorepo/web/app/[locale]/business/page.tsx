'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { useCompanyName } from '@/hooks/useCompanyName';
import { 
  Building2, 
  Percent, 
  Package, 
  Truck, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Sparkles,
  ChevronRight,
  Globe2
} from 'lucide-react';

export default function BusinessLandingPage() {
  const locale = useLocale();
  const companyName = useCompanyName();
  const t = useTranslations('business');

  return (
    <SharedLayout pageTitle={`${companyName} for Business`}>
      <div className="min-h-screen bg-slate-50/70">
        {/* =========================================================================
            HERO SECTION
            ========================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#072648] via-[#00407a] to-[#0a2540] text-white py-16 sm:py-24 border-b border-blue-900/40">
          {/* Ambient decorative background glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-300/30 text-amber-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                <span>B2B Wholesale & Procurement Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-5">
                {companyName} <span className="text-amber-400">for Business</span>
              </h1>

              <p className="text-base sm:text-xl text-blue-100/90 leading-relaxed mb-8 max-w-2xl">
                {t('subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href={`/${locale}/business/register`}
                  className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-7 py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  <Building2 className="w-5 h-5 stroke-[2.5]" />
                  <span>{t('cta.apply')}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <Link
                  href={`/${locale}/login?redirect=/${locale}/business/dashboard`}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold px-6 py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all backdrop-blur-xs active:scale-[0.98]"
                >
                  <span>{t('cta.signIn')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-10 mt-10 border-t border-white/15 text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tier-1 Factory Direct Sourcing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Strict QC Pre-Shipment Inspection</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>FCL / LCL Sea & Air Logistics</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            BENEFITS SECTION (4 Core Pillars)
            ========================================================================= */}
        <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
              Why Global Wholesalers Choose {companyName}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Designed specifically for importers, commercial distributors, retail chains, and procurement leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1: Factory Wholesale Price */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mb-5">
                  <Percent className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {t('benefit.wholesalePrice')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('benefit.wholesalePriceDesc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-[#00407a] flex items-center gap-1">
                <span>Save 20% to 45% vs Retail</span>
              </div>
            </div>

            {/* Benefit 2: Flexible MOQ */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-[#00407a] flex items-center justify-center mb-5">
                  <Package className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {t('benefit.moq')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('benefit.moqDesc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-[#00407a] flex items-center gap-1">
                <span>Tailored for scaling businesses</span>
              </div>
            </div>

            {/* Benefit 3: Consolidated Direct Shipping */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-5">
                  <Truck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {t('benefit.shipping')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('benefit.shippingDesc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <span>DDP, FOB & CIF Terms</span>
              </div>
            </div>

            {/* Benefit 4: Dedicated Account Manager */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mb-5">
                  <UserCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {t('benefit.manager')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('benefit.managerDesc')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-purple-700 flex items-center gap-1">
                <span>Multilingual 24/7 Assistance</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            HOW IT WORKS (Simple 3-Step Process)
            ========================================================================= */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00407a] block mb-2">Streamlined Onboarding</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                How to Get Started in 3 Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#00407a] text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Submit Business Application</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Provide your registered company information, tax identification, and upload your business license.
                </p>
              </div>

              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mb-4 shadow-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Fast 24-Hour Review</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Our compliance trade officers verify your registration documents and assign your dedicated account manager.
                </p>
              </div>

              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Unlock Commercial Catalog</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Access wholesale tier pricing, instant RFQ quote generation, container dispatch tracking, and priority order dispatch.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FINAL CTA STRIP
            ========================================================================= */}
        <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-16">
          <div className="rounded-3xl bg-gradient-to-r from-[#072648] to-[#00407a] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Ready to Scale Your Procurement?
              </h2>
              <p className="text-sm text-blue-100">
                Join hundreds of international retail chains and distributors sourcing reliably through {companyName}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href={`/${locale}/business/register`}
                className="w-full sm:w-auto bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-8 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>{t('cta.apply')}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}
