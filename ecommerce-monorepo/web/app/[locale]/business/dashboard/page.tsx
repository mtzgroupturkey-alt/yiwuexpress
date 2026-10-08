'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useCurrency } from '@/hooks/useCurrency';
import { useWishlist } from '@/hooks/useWishlist';
import { useQuoteCart } from '@/components/QuoteCartContext';
import { 
  Building2, 
  ShieldCheck, 
  Package, 
  FileText, 
  ShoppingCart, 
  Heart, 
  Download, 
  UserCheck, 
  Mail, 
  Phone, 
  ArrowUpRight, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  PlusCircle,
  Truck,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  itemsCount?: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
}

export default function BusinessDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const companyName = useCompanyName();
  const { formatPrice } = useCurrency();
  const { wishlistCount } = useWishlist();
  const { quoteCount } = useQuoteCart();
  const t = useTranslations('business');

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Authentication & Access Control Gate
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push(`/${locale}/login?redirect=/${locale}/business/dashboard`);
        return;
      }

      // If user is Admin, allow inspection
      if (user.role === 'ADMIN') {
        fetchDashboardData();
        return;
      }

      // Check userType & verificationStatus
      if (user.userType === 'RETAIL') {
        router.push(`/${locale}`);
        return;
      }

      if (user.verificationStatus === 'PENDING') {
        router.push(`/${locale}/business/pending`);
        return;
      }

      if (user.verificationStatus === 'REJECTED') {
        router.push(`/${locale}/business/rejected`);
        return;
      }

      // If approved WHOLESALE or BOTH
      if ((user.userType === 'WHOLESALE' || user.userType === 'BOTH') && user.verificationStatus === 'APPROVED') {
        fetchDashboardData();
      } else {
        router.push(`/${locale}`);
      }
    }
  }, [authLoading, isAuthenticated, user, locale, router]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);

      const [ordersRes, quotesRes] = await Promise.allSettled([
        fetch('/api/orders', { credentials: 'include' }),
        fetch('/api/b2b/quotes', { credentials: 'include' }),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const oData = await ordersRes.value.json();
        const list = Array.isArray(oData.data) ? oData.data : Array.isArray(oData) ? oData : [];
        setOrders(list.slice(0, 5));
      }

      if (quotesRes.status === 'fulfilled' && quotesRes.value.ok) {
        const qData = await quotesRes.value.json();
        const list = Array.isArray(qData.quotes) ? qData.quotes : [];
        setQuotes(list.slice(0, 5));
      }
    } catch (err) {
      console.error('[B2B Dashboard] Error loading metrics:', err);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading || (!user && isAuthenticated)) {
    return (
      <SharedLayout pageTitle={`Wholesale Portal | ${companyName}`}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00407a]" />
            <span className="text-xs font-semibold text-slate-500">Verifying commercial credentials...</span>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout pageTitle={`B2B Wholesale Portal | ${companyName}`}>
      <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* =========================================================================
              1. TOP WELCOME & COMMERCIAL VERIFICATION BADGE
              ========================================================================= */}
          <div className="bg-gradient-to-r from-[#072648] via-[#00407a] to-[#0d3460] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>APPROVED WHOLESALE ACCOUNT</span>
                </span>
                <span className="text-blue-200 text-xs font-semibold">
                  • Tier-1 Factory Pricing Active
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.companyName || user?.name || 'Wholesale Partner'}
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
                {t('dashboard.welcome')} • Account ID: <span className="font-mono text-amber-300">#{user?.id?.slice(-8).toUpperCase()}</span>
              </p>
            </div>

            {/* Price List Download CTA */}
            <div className="relative z-10 shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('The latest wholesale price list (Q4 Full Catalog) is downloading.')}
                className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{t('dashboard.downloadPriceList')}</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              2. STATS ROW (Orders, Quotes, RFQ Cart, Wishlist)
              ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Commercial Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('dashboard.stats.orders')}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {orders.length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#00407a] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            {/* Active Quotes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('dashboard.stats.quotes')}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {quotes.length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            {/* Items in RFQ Cart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('dashboard.stats.cart')}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {quoteCount}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            {/* Wishlist Items */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('dashboard.stats.wishlist')}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {wishlistCount}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. MAIN CONTENT: RECENT ORDERS & ACCOUNT MANAGER SIDEBAR
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders & Quotes Left Columns (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#00407a]" />
                    <h2 className="text-base font-bold text-slate-900">
                      {t('dashboard.recentOrders')}
                    </h2>
                  </div>
                  <Link
                    href={`/${locale}/dashboard/orders`}
                    className="text-xs font-bold text-[#00407a] hover:underline flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-5">
                  {dataLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading commercial orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="py-10 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No commercial orders placed yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Start by browsing the catalog or requesting a bulk quotation.</p>
                      <Link
                        href={`/${locale}/store`}
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#00407a] text-white rounded-xl text-xs font-bold"
                      >
                        <span>Browse Wholesale Catalog</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                            <th className="pb-3 font-bold">Order #</th>
                            <th className="pb-3 font-bold">Date</th>
                            <th className="pb-3 font-bold">Status</th>
                            <th className="pb-3 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-mono font-bold text-[#00407a]">
                                #{ord.orderNumber}
                              </td>
                              <td className="py-3 text-slate-600">
                                {new Date(ord.createdAt).toLocaleDateString(locale)}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-3 text-right font-black text-slate-900">
                                {formatPrice(ord.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href={`/${locale}/store`}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#00407a] shadow-xs flex items-center gap-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">New RFQ Order</div>
                    <div className="text-[11px] text-slate-500">Explore wholesale catalog</div>
                  </div>
                </Link>

                <Link
                  href={`/${locale}/quote-cart`}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#00407a] shadow-xs flex items-center gap-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Review Quotation</div>
                    <div className="text-[11px] text-slate-500">View items in quote cart</div>
                  </div>
                </Link>

                <Link
                  href={`/${locale}/contact`}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#00407a] shadow-xs flex items-center gap-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Custom Container</div>
                    <div className="text-[11px] text-slate-500">Request FCL/LCL shipping</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Sidebar Right Column (1 col): Account Manager & Commercial Terms */}
            <div className="space-y-6">
              {/* Account Manager Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <UserCheck className="w-5 h-5 text-[#00407a]" />
                  <h3 className="text-sm font-bold text-slate-900">{t('dashboard.accountManager')}</h3>
                </div>

                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00407a] to-blue-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
                    GT
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Trade Support Officer</div>
                    <div className="text-xs text-amber-600 font-semibold">China Desk • Global Sourcing</div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium truncate">support@dromkok.com</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">+86 579 8500 0000 (WeChat / WhatsApp)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/${locale}/contact`}
                    className="w-full py-2.5 bg-[#00407a] hover:bg-[#003366] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Message Account Desk</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Commercial Privileges Active Box */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Wholesale Privileges Active</span>
                </div>
                <ul className="text-xs text-amber-950/80 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>Direct factory tiered prices on all catalog items</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>Priority container inspection & export documentation</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>Formal Proforma Invoice (PI) & Contract generation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
