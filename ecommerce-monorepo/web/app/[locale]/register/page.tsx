'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Gift, 
  ShoppingBag, 
  Building2, 
  ArrowRight, 
  Check, 
  Sparkles
} from 'lucide-react';
import { Design3LayoutHeader } from '@/components/layout/Design3LayoutHeader';
import { Footer } from '@/app/[locale]/design-3/components/Footer';
import { RetailRegisterForm } from '@/components/auth/RetailRegisterForm';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useLocale } from 'next-intl';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const companyName = useCompanyName();

  const redirectParam = searchParams.get('redirect') || '';
  const isFromCheckout = redirectParam.includes('checkout');

  const loginHref = `/${locale}/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`;
  const businessRegisterHref = `/${locale}/business/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Design3LayoutHeader />

      <main className="flex-1 py-8 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Checkout Notification Banner */}
          {isFromCheckout && (
            <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5A602]/20 flex items-center justify-center text-amber-700 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Finish your order in just a few clicks
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Register a free retail account now to continue to delivery address & secure checkout.
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-600 shrink-0">
                Already registered?{' '}
                <Link href={loginHref} className="font-bold text-[#00407a] hover:underline">
                  Sign in here →
                </Link>
              </div>
            </div>
          )}

          {/* Account Type Selector / Tabs */}
          <div className="mb-8 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto grid grid-cols-2 gap-2">
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#00407a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all">
              <ShoppingBag className="w-4 h-4 text-[#F5A602]" />
              <span>Retail Customer</span>
              <span className="hidden sm:inline-block bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Personal
              </span>
            </div>

            <Link
              href={businessRegisterHref}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs sm:text-sm transition-all text-center group"
            >
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#00407a]" />
              <span>Wholesale</span>
              <span className="hidden sm:inline-block bg-slate-100 group-hover:bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Business
              </span>
            </Link>
          </div>

          {/* Main Grid: Form (Left) & Value Proposition (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Registration Form Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
              <div className="mb-6">
                <span className="inline-block text-[11px] font-bold text-[#00407a] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                  Consumer Shopping Account
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Create Your Retail Account
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enjoy express door-to-door delivery, member club rewards, and easy parcel tracking.
                </p>
              </div>

              {/* Extracted Reusable Retail Register Form */}
              <RetailRegisterForm />

              {/* Already have an account footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <span>Already have a customer account?</span>
                <Link
                  href={loginHref}
                  className="font-bold text-[#00407a] hover:text-[#002f5a] hover:underline flex items-center gap-1"
                >
                  <span>Sign In to Your Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Value Proposition & Trust Column (Right) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Member Perks Card */}
              <div className="bg-gradient-to-br from-[#00407a] to-[#002244] text-white rounded-3xl p-6 sm:p-8 shadow-md">
                <div className="flex items-center gap-2 text-[#F5A602] text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Retail Membership Benefits</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Why Create an Account with {companyName}?
                </h3>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Join hundreds of thousands of satisfied buyers getting direct factory products delivered smoothly.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F5A602] shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Direct Dispatch from China</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Air & postal express parcels shipped straight from manufacturer logistics hubs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F5A602] shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">100% Buyer Protection</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Guaranteed parcel delivery, damaged item reimbursement, and hassle-free returns.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F5A602] shrink-0 mt-0.5">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Instant 3% Cashback Points</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Earn reward points on every completed purchase to redeem directly at checkout.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#F5A602] shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Live Real-Time Tracking</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Track your order round-the-clock from factory sorting to your local carrier.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Standard Consumer Account</span>
                  <span className="font-bold text-[#F5A602]">100% Free Forever</span>
                </div>
              </div>

              {/* B2B Alternative Callout Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Buying for a Business or Store?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      If you need bulk container shipments, custom OEM branding, factory audits, or tax invoices, register as a wholesale partner instead.
                    </p>
                    <Link
                      href={businessRegisterHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00407a] hover:underline mt-2.5"
                    >
                      <span>Apply for Wholesale Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Security & Guarantee Trust Seals */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/60 flex items-center justify-around text-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700">256-Bit SSL</span>
                  <span className="text-[9px] text-slate-400">Encrypted</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex flex-col items-center">
                  <Truck className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700">Door-to-Door</span>
                  <span className="text-[9px] text-slate-400">Express Delivery</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex flex-col items-center">
                  <Check className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700">Buyer Protection</span>
                  <span className="text-[9px] text-slate-400">Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#00407a] animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading registration...</p>
          </div>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
