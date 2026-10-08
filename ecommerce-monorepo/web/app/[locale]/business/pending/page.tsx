'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyName } from '@/hooks/useCompanyName';
import { 
  Clock, 
  Building2, 
  ShieldAlert, 
  Mail, 
  Phone, 
  LogOut, 
  ArrowLeft,
  Calendar,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export default function BusinessPendingPage() {
  const locale = useLocale();
  const router = useRouter();
  const companyName = useCompanyName();
  const t = useTranslations('business');
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.verificationStatus === 'APPROVED') {
        router.push(`/${locale}/business/dashboard`);
      } else if (user.verificationStatus === 'REJECTED') {
        router.push(`/${locale}/business/rejected`);
      } else if (user.userType === 'RETAIL') {
        router.push(`/${locale}`);
      }
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const submissionDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SharedLayout pageTitle={`Application Pending Review | ${companyName}`}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Top decorative gradient glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          {/* Pending Animated / Styled Icon */}
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-10 h-10 stroke-[2.2] animate-pulse" />
          </div>

          {/* Title & Body */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {t('pending.title')}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {t('pending.body')}
          </p>

          {/* Submitted Info Card */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 mb-8 text-left space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 pb-2">
              Application Details
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Company Name:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {user?.companyName || 'Registered Enterprise'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Tax ID / Reg #:</span>
              <span className="font-mono font-bold text-slate-800">
                {user?.taxId || 'Verified on file'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Submission Date:</span>
              <span className="text-slate-800 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {submissionDate}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                <Clock className="w-3 h-3" />
                <span>PENDING REVIEW</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/${locale}/contact`}
              className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Mail className="w-4 h-4" />
              <span>{t('pending.contactSupport')}</span>
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>{t('pending.signOut')}</span>
              </button>
            )}

            <div className="pt-2">
              <Link
                href={`/${locale}`}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
