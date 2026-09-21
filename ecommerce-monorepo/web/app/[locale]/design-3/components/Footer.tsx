'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  Truck, 
  DollarSign, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Award, 
  Copy, 
  Check, 
  ChevronRight,
  X,
  BadgeCheck,
  Banknote,
  Globe
} from 'lucide-react';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSettings } from '@/components/SettingsProvider';
import { useLocale, useTranslations } from 'next-intl';

interface FooterProps {
  onOpenCatalog?: () => void;
  onOpenOrders?: () => void;
  onOpenMemberModal?: () => void;
  enableMotion?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCatalog,
  onOpenOrders,
  onOpenMemberModal,
}) => {
  const companyName = useCompanyName();
  const { settings } = useSettings();
  const locale = useLocale();
  const tFooter = useTranslations('Home.footer');

  const [isWechatModalOpen, setIsWechatModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Social Links with fallbacks from SystemSettings
  const facebookUrl = settings?.facebookUrl || 'https://facebook.com';
  const twitterUrl = settings?.twitterUrl || 'https://x.com';
  const linkedinUrl = settings?.linkedinUrl || 'https://linkedin.com';
  const instagramUrl = settings?.instagramUrl || 'https://instagram.com';
  const wechatId = settings?.wechatId || 'yiwuexpress_official';
  const whatsappNumber = settings?.whatsappNumber || '+8615757912345';
  const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, '');

  const handleCopyWechat = () => {
    navigator.clipboard.writeText(wechatId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block w-full bg-[#051121] border-t border-slate-800 text-slate-400 relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Value Pillars & Global Sourcing Guarantees Strip */}
      <div className="border-b border-slate-800/80 bg-[#07172B]/60 backdrop-blur-xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Pillar 1 */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white tracking-tight truncate">
                  {tFooter('directPricing')}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {tFooter('directPricingSub')}
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white tracking-tight truncate">
                  {tFooter('qualityInspection')}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {tFooter('qualityInspectionSub')}
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white tracking-tight truncate">
                  {tFooter('globalLogistics')}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {tFooter('globalLogisticsSub')}
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white tracking-tight truncate">
                  {tFooter('tradeAssurance')}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {tFooter('tradeAssuranceSub')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 5-Column Navigation Grid */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-12 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 text-xs">
          
          {/* Col 1: Brand Info & Social Media (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              {settings?.companyLogo ? (
                <img
                  src={settings.companyLogo}
                  alt={`${companyName} Logo`}
                  className="h-9 w-auto object-contain brightness-0 invert opacity-95"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00407a] to-[#0066cc] text-white flex items-center justify-center font-black text-sm shadow-md">
                  {companyName ? companyName.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div>
                <span className="text-base font-black text-white tracking-tight block">
                  {companyName}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  {tFooter('certifiedChinaTrade')}
                </span>
              </div>
            </div>

            {/* Tagline / Mission */}
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings?.siteTagline || tFooter('taglineDefault')}
            </p>

            {/* Direct Contact Snippets */}
            <div className="space-y-2 text-xs pt-1">
              {settings?.companyAddress && (
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{settings.companyAddress}</span>
                </div>
              )}
              {settings?.companyPhone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${settings.companyPhone}`} className="hover:text-white transition-colors">
                    {settings.companyPhone}
                  </a>
                </div>
              )}
              {settings?.companyEmail && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href={`mailto:${settings.companyEmail}`} className="hover:text-white transition-colors">
                    {settings.companyEmail}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{tFooter('operatingHours')}: {settings?.storeHours || '08:00 – 23:00 (GMT+8)'}</span>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                {tFooter('followUs')}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title={tFooter('chatOnWhatsapp')}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.961.82 2.796.82 3.183 0 5.769-2.587 5.77-5.766.001-3.187-2.575-5.77-5.77-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.045-1.144-.085-.308-.09-.705-.224-1.215-.443-2.144-.925-3.535-3.109-3.642-3.251-.107-.142-.871-1.161-.871-2.215 0-1.054.551-1.572.748-1.785.197-.213.43-.267.574-.267.143 0 .287.002.412.008.132.006.309-.05.483.367.179.431.611 1.492.665 1.6.054.108.09.233.018.375-.072.142-.108.231-.215.358-.108.127-.227.284-.324.382-.108.108-.221.226-.095.443.126.217.558.919 1.198 1.49 1.02.911 1.77 1.054 2.023 1.18.252.126.396.108.541-.054.144-.162.611-.71.774-.954.162-.244.324-.204.541-.126.216.079 1.37.646 1.604.764.234.117.391.175.448.273.058.098.058.568-.086.973zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.179L2 22l4.957-1.399C8.423 21.494 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                </a>

                {/* WeChat */}
                <button
                  onClick={() => setIsWechatModalOpen(true)}
                  className="w-8 h-8 rounded-lg bg-[#07C160]/10 hover:bg-[#07C160] text-[#07C160] hover:text-white border border-[#07C160]/30 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title={tFooter('wechatModal')}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.73.96 3.27 2.45 4.28L3.8 16.5l2.64-1.32c.65.19 1.34.32 2.06.32.22 0 .43-.02.64-.04-.26-.62-.4-1.29-.4-2 0-3.04 2.91-5.5 6.5-5.5.34 0 .67.03 1 .08C15.54 5.73 12.28 4 8.5 4zm-2 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 3c-3.04 0-5.5 2.01-5.5 4.5 0 1.38.77 2.62 1.98 3.42L11.5 20l2.12-1.06c.52.16 1.07.26 1.63.26 3.04 0 5.5-2.01 5.5-4.5S18.29 10 15.25 10zm-1.5 2.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm3.5 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z"/>
                  </svg>
                </button>

                {/* Facebook */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-blue-600/10 hover:bg-[#1877F2] text-blue-400 hover:text-white border border-blue-600/30 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border border-[#0A66C2]/30 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="LinkedIn"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-pink-600/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-600 hover:to-purple-600 text-pink-400 hover:text-white border border-pink-500/30 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Shop & Wholesale (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              {tFooter('shop')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/store`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('allProducts')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/wholesale`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('wholesale')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/store?sale=true`} className="text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1.5">
                  <span>{tFooter('flashDeals')}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800 text-red-300 font-black">
                    {tFooter('saleTag')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/store?sort=newest`} className="hover:text-white transition-colors text-slate-300 flex items-center gap-1.5">
                  <span>{tFooter('newArrivals')}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-700 text-blue-300 font-black">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/quotes`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('requestQuote')}
                </Link>
              </li>
              {onOpenCatalog && (
                <li>
                  <button onClick={onOpenCatalog} className="text-[#0066cc] hover:text-blue-300 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1">
                    <span>{tFooter('title')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Sourcing & B2B Solutions (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              {tFooter('services')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/services`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('sourcingServices')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services#inspection`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('qualityControl')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services#warehousing`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('warehousing')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services#logistics`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('freightLogistics')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/calculator`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('shippingCalculator')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/network`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('supplierNetwork')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Customer Care & Tracking (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              {tFooter('customerCare')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/faq`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('faq')}
                </Link>
              </li>
              <li>
                {onOpenOrders ? (
                  <button onClick={onOpenOrders} className="hover:text-white transition-colors text-left text-slate-300 cursor-pointer block">
                    {tFooter('trackOrder')}
                  </button>
                ) : (
                  <Link href={`/${locale}/track`} className="hover:text-white transition-colors text-slate-300 block">
                    {tFooter('trackOrder')}
                  </Link>
                )}
              </li>
              <li>
                <Link href={`/${locale}/terms#shipping`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('shippingTerms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms#returns`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('returnPolicy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms#payment`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('paymentSecurity')}
                </Link>
              </li>
              {onOpenMemberModal && (
                <li>
                  <button onClick={onOpenMemberModal} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1.5">
                    <span>★ {tFooter('bonusClub')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 5: Company & Mobile App (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              {tFooter('company')}
            </h4>
            <ul className="space-y-2.5 mb-6">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('aboutUs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about#hub`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('chinaHub')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/careers`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('careers')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('blog')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('contact')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sitemap`} className="hover:text-white transition-colors text-slate-300 block">
                  {tFooter('sitemap')}
                </Link>
              </li>
            </ul>

            {/* Mobile App Download Badges */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {tFooter('getItOn')}
              </span>
              <div className="flex flex-col gap-2">
                <a
                  href="#download-android"
                  className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white rounded-xl p-2 flex items-center gap-2.5 hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400">{tFooter('getItOn')}</div>
                    <div className="text-xs font-bold">{tFooter('googlePlay')}</div>
                  </div>
                </a>

                <a
                  href="#download-ios"
                  className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white rounded-xl p-2 flex items-center gap-2.5 hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[8px] uppercase tracking-wider text-slate-400">{tFooter('downloadOn')}</div>
                    <div className="text-xs font-bold">{tFooter('appStore')}</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Global Payments, Security, and Compliance Bar */}
        <div className="pt-8 mt-10 border-t border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs">
          {/* Trust Badges & Accepted Payment Methods */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{tFooter('secureCheckout')}</span>
            </div>

            {/* Visa */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-black tracking-tight text-[#1A1F71]">
              VISA
            </span>

            {/* Mastercard */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-900 tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block -mr-1 opacity-90"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90"></span>
              <span className="ml-1 font-extrabold text-[#0a1b2a]">Mastercard</span>
            </span>

            {/* PayPal */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-[#003087]">
              <i>Pay</i><i className="text-[#0079C1]">Pal</i>
            </span>

            {/* Apple Pay */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-900">
              Pay
            </span>

            {/* Google Pay */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-800">
              GPay
            </span>

            {/* UnionPay (银联) */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-extrabold text-[#C41230]">
              UnionPay
            </span>

            {/* Wire Transfer / T/T */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>T/T Wire</span>
            </span>

            {/* Escrow */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Escrow 100%</span>
            </span>
          </div>

          {/* Quick Legal Links */}
          <div className="flex items-center gap-4 text-slate-400 text-xs flex-wrap justify-center">
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              {tFooter('termsOfService')}
            </Link>
            <span>•</span>
            <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
              {tFooter('privacyPolicy')}
            </Link>
            <span>•</span>
            <Link href={`/${locale}/cookies`} className="hover:text-white transition-colors">
              {tFooter('cookiePolicy')}
            </Link>
            <span>•</span>
            <Link href={`/${locale}/sitemap`} className="hover:text-white transition-colors">
              {tFooter('sitemap')}
            </Link>
          </div>
        </div>

        {/* 4. Bottom Legal Registration & Copyright Strip */}
        <div className="pt-6 mt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center md:text-left">
          <div>
            <p className="text-slate-400 font-medium">
              © {currentYear} {companyName}. {tFooter('allRightsReserved')}
            </p>
            {(settings?.businessLicense || settings?.taxRegistrationNumber) && (
              <p className="text-slate-600 text-[10px] mt-0.5">
                {settings.businessLicense && `${tFooter('businessLicenseLabel')}: ${settings.businessLicense}`}
                {settings.businessLicense && settings.taxRegistrationNumber && ' • '}
                {settings.taxRegistrationNumber && `${tFooter('taxNumberLabel')}: ${settings.taxRegistrationNumber}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Global Export & Wholesale Hub</span>
          </div>
        </div>
      </div>

      {/* WECHAT MODAL */}
      {isWechatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsWechatModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#07C160]/20 text-[#07C160] flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.73.96 3.27 2.45 4.28L3.8 16.5l2.64-1.32c.65.19 1.34.32 2.06.32.22 0 .43-.02.64-.04-.26-.62-.4-1.29-.4-2 0-3.04 2.91-5.5 6.5-5.5.34 0 .67.03 1 .08C15.54 5.73 12.28 4 8.5 4zm-2 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 3c-3.04 0-5.5 2.01-5.5 4.5 0 1.38.77 2.62 1.98 3.42L11.5 20l2.12-1.06c.52.16 1.07.26 1.63.26 3.04 0 5.5-2.01 5.5-4.5S18.29 10 15.25 10zm-1.5 2.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm3.5 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z"/>
              </svg>
            </div>

            <h3 className="text-base font-bold text-white mb-1">WeChat Support</h3>
            <p className="text-xs text-slate-400 mb-4">
              {tFooter('wechatModal')}
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                {wechatId}
              </span>
              <button
                onClick={handleCopyWechat}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Open WeChat &rarr; Contacts &rarr; Add Contacts &rarr; Search ID: <span className="text-slate-300 font-mono">{wechatId}</span>
            </p>
          </div>
        </div>
      )}
    </footer>
  );
};
