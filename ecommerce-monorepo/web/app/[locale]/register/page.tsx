'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Gift, 
  ShoppingBag, 
  Building2, 
  ArrowRight, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Design3LayoutHeader } from '@/components/layout/Design3LayoutHeader';
import { Footer } from '@/app/[locale]/design-3/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useLocale, useTranslations } from 'next-intl';

const POPULAR_COUNTRIES = [
  'China',
  'United States',
  'United Kingdom',
  'Russia',
  'Belarus',
  'Kazakhstan',
  'Uzbekistan',
  'Germany',
  'France',
  'United Arab Emirates',
  'Saudi Arabia',
  'Canada',
  'Australia',
  'Turkey',
  'Poland',
  'Spain',
  'Italy',
  'Brazil',
  'Mexico',
  'Japan',
  'South Korea',
];

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const companyName = useCompanyName();
  const { register: registerUser, isLoading } = useAuth();

  const redirectParam = searchParams.get('redirect') || '';
  const isFromCheckout = redirectParam.includes('checkout');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'United States',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [subscribeNews, setSubscribeNews] = useState(true);
  const [error, setError] = useState('');
  const [dbCountries, setDbCountries] = useState<string[]>([]);

  // Fetch active countries from DB if available
  useEffect(() => {
    fetch(`/api/countries?locale=${encodeURIComponent(locale || 'en')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const names = data.data
            .filter((c: any) => c.isActive)
            .map((c: any) => c.name)
            .filter(Boolean);
          if (names.length > 0) {
            setDbCountries(names);
          }
        }
      })
      .catch(() => {});
  }, [locale]);

  const countryOptions = useMemo(() => {
    if (dbCountries.length > 0) return dbCountries;
    return POPULAR_COUNTRIES;
  }, [dbCountries]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', width: '66%' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  }, [formData.password]);

  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        country: formData.country || undefined,
      });

      // User is now registered and authenticated via httpOnly cookie!
      if (redirectParam) {
        // Direct redirect back to where they were headed (e.g. /checkout)
        const target = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
        window.location.href = target;
      } else {
        // Direct to localized storefront
        window.location.href = `/${locale}`;
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please check your information and try again.');
    }
  };

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
              <span>Wholesale & B2B</span>
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

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Unable to register</p>
                    <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="block w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. customer@example.com"
                      className="block w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Phone & Country 2-col row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-slate-400 font-normal">(for SMS tracking)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 555 0199"
                        className="block w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Country Selector */}
                  <div>
                    <label htmlFor="reg-country" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Destination Country
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <select
                        id="reg-country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="block w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        {countryOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password *
                    </label>
                    {formData.password && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        Strength: <strong className="text-slate-800">{passwordStrength.label}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 8 characters"
                      className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength progress bar */}
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        Min. 8 characters
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repeat your password"
                      className={`block w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] transition-all ${
                        formData.confirmPassword && !passwordsMatch
                          ? 'border-rose-300 focus:ring-rose-500'
                          : formData.confirmPassword && passwordsMatch
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200'
                      }`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {passwordsMatch && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {formData.confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#00407a] focus:ring-[#00407a]"
                    />
                    <span>
                      I agree to the{' '}
                      <Link href={`/${locale}/terms`} className="text-[#00407a] font-semibold hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href={`/${locale}/privacy`} className="text-[#00407a] font-semibold hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subscribeNews}
                      onChange={(e) => setSubscribeNews(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#00407a] focus:ring-[#00407a]"
                    />
                    <span>
                      Send me exclusive retail member coupons, parcel shipment updates, and flash deals.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#00407a] hover:bg-[#002f5a] active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {isFromCheckout ? 'Create Account & Continue to Checkout' : 'Create Free Retail Account'}
                        </span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>

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
                      If you need bulk container shipments, custom OEM branding, factory audits, or tax invoices, register as a B2B partner instead.
                    </p>
                    <Link
                      href={businessRegisterHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00407a] hover:underline mt-2.5"
                    >
                      <span>Apply for Wholesale B2B Account</span>
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
