'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyName } from '@/hooks/useCompanyName';
import { 
  XCircle, 
  Building2, 
  AlertTriangle, 
  Mail, 
  RefreshCw, 
  LogOut, 
  ArrowLeft,
  FileText
} from 'lucide-react';

export default function BusinessRejectedPage() {
  const locale = useLocale();
  const router = useRouter();
  const companyName = useCompanyName();
  const t = useTranslations('business');
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.verificationStatus === 'APPROVED') {
        router.push(`/${locale}/business/dashboard`);
      } else if (user.verificationStatus === 'PENDING') {
        router.push(`/${locale}/business/pending`);
      } else if (user.userType === 'RETAIL') {
        router.push(`/${locale}`);
      }
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const rejectionReason = user?.verificationNotes || 
    'The uploaded business license or registration details could not be verified by our compliance team.';

  return (
    <SharedLayout pageTitle={`Application Not Approved | ${companyName}`}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Top decorative gradient glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

          {/* Rejected Icon */}
          <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <XCircle className="w-10 h-10 stroke-[2.2]" />
          </div>

          {/* Title & Body */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {t('rejected.title')}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {t('rejected.body')}
          </p>

          {/* Rejection Details Box */}
          <div className="bg-red-50/70 rounded-2xl border border-red-200/80 p-5 mb-8 text-left space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Reason from Verification Officer</span>
            </div>
            <p className="text-xs sm:text-sm text-red-950 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-red-200/50">
              {rejectionReason}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/${locale}/business/register`}
              className="w-full bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>{t('rejected.reapply')}</span>
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Compliance Support</span>
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out</span>
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
