import React, { useState } from 'react';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSettings } from '@/components/SettingsProvider';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Clock, 
  Phone, 
  ChevronDown, 
  Search, 
  Heart, 
  ClipboardList, 
  ShoppingCart, 
  LayoutGrid, 
  Zap, 
  X,
  Sparkles,
  Building2,
  PackageCheck
} from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  favoritesCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenOrders: () => void;
  onOpenCatalog: () => void;
  onOpenLocation: () => void;
  onOpenMemberModal: () => void;
  selectedDepartment: string;
  onSelectDepartment: (dept: string) => void;
  deliveryAddress: string;
  currentView?: 'home' | 'shop' | 'product' | 'checkout';
  onNavigateView?: (view: 'home' | 'shop' | 'product' | 'checkout') => void;
}

const DEPARTMENTS = [
  'Furniture & Living',
  'Kitchenware & Dining',
  'Home Decor & Accents',
  'Bedding & Linens',
  'Lighting & Lamps',
  'Bathroom Accessories',
  'Smart Home & Appliances',
  'Garden & Outdoor'
];

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  favoritesCount,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenFavorites,
  onOpenOrders,
  onOpenCatalog,
  onOpenLocation,
  onOpenMemberModal,
  selectedDepartment,
  onSelectDepartment,
  deliveryAddress,
  currentView = 'home',
  onNavigateView,
}) => {
  const [selectedSearchScope, setSelectedSearchScope] = useState('Everywhere');
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const companyName = useCompanyName();
  const { settings } = useSettings();
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const searchScopes = ['Everywhere', 'Furniture', 'Kitchenware', 'Home Decor', 'Lighting', 'Appliances'];

  const switchLocale = (newLocale: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    if (segments.length > 1) {
      segments[1] = newLocale;
      router.push(segments.join('/'));
    }
    setShowLangDropdown(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onNavigateView) {
      onNavigateView('shop');
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* 1. Top Utility Micro-Bar */}
      <div className="bg-[#F8FAFC] border-b border-slate-200/80 text-xs text-slate-600">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-9 flex items-center justify-between">
          {/* Left Side: Delivery Address, Status & Phone */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery address button styled as subtle pill */}
            <button 
              id="delivery-address-btn"
              onClick={onOpenLocation}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200/90 shadow-2xs hover:border-[#00407a] hover:text-[#00407a] transition-all cursor-pointer group"
              title="Change Delivery Location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#00407a]" />
              <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-[260px]">
                {deliveryAddress}
              </span>
              <span className="text-[11px] text-[#00407a] font-bold underline underline-offset-2 ml-0.5 group-hover:text-blue-800">
                Change
              </span>
            </button>

            {/* Live Store Hours with Operational Pulse Dot */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-600 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-800">Open now:</span>
              <span>08:00 – 23:00</span>
            </div>

            {/* Clickable Customer Service Hotline */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500">
              <span className="h-3 w-px bg-slate-300" />
              <Phone className="w-3.5 h-3.5 text-emerald-600 ml-1" />
              <a 
                href={`tel:${settings?.companyPhone || '7711'}`}
                className="text-slate-700 hover:text-[#00407a] transition-colors"
                title="Call Customer Support"
              >
                <strong className="font-bold text-slate-900">{settings?.companyPhone ? settings.companyPhone : '7711'}</strong>
                <span className="text-slate-500 text-[11px] ml-1">(Free hotline)</span>
              </a>
            </div>
          </div>

          {/* Right Side: Track / B2B Corporate / Language & Currency */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Track Orders Quick Action */}
            <button
              onClick={onOpenOrders}
              className="hover:text-[#00407a] transition-colors cursor-pointer font-medium text-slate-700 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100"
            >
              <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Orders</span>
            </button>

            {/* Corporate B2B Wholesale */}
            <button 
              id="b2b-link-btn"
              onClick={() => onNavigateView && onNavigateView('shop')}
              className="hover:text-[#00407a] transition-colors hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700"
              title="Corporate Sales & Volume Pricing"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Corporate (B2B)</span>
            </button>

            <span className="h-3 w-px bg-slate-300 hidden sm:inline-block" />

            {/* Real Locale / Currency Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200/90 hover:border-slate-300 transition-colors font-semibold text-slate-700 cursor-pointer text-xs"
              >
                <span className="text-[11px] font-bold uppercase text-[#00407a]">
                  {settings?.currency || 'BYN'}
                </span>
                <span className="text-slate-300 font-normal">/</span>
                <span className="uppercase font-bold">
                  {currentLocale || 'en'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language
                  </div>
                  {[
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                        currentLocale === lang.code
                          ? 'bg-blue-50 text-[#00407a] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {currentLocale === lang.code && (
                        <span className="text-xs text-[#00407a]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Search Bar */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNavigateView && onNavigateView('home')}
            className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
            title={`${companyName} Home Store`}
          >
            {settings?.companyLogo ? (
              <div className="h-10 flex items-center justify-center shrink-0">
                <img
                  src={settings.companyLogo}
                  alt={`${companyName} Logo`}
                  className="max-h-10 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#00407a] flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-[#003366] transition-colors">
                {companyName ? companyName.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#00407a] font-['Inter'] leading-none">
                {companyName}
              </span>
              <span className="text-[9px] font-bold text-amber-600 tracking-wider uppercase mt-0.5">
                HOME LIVING
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[660px] relative hidden md:block">
          <div className="flex items-stretch border-2 border-[#00407a] rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-200">
            {/* Scope selector */}
            <div className="relative">
              <button
                type="button"
                id="search-scope-btn"
                onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                className="h-full px-3 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1 border-r border-slate-200 cursor-pointer whitespace-nowrap"
              >
                <span>{selectedSearchScope}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showScopeDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 w-36 z-50 text-xs">
                  {searchScopes.map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        setSelectedSearchScope(scope);
                        setShowScopeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 font-medium text-slate-700"
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="relative flex-1 flex items-center">
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search quality furniture, kitchenware, decor & appliances..."
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="global-search-submit-btn"
              className="bg-[#F5A602] hover:bg-[#E09500] text-slate-900 px-4 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Favorites */}
          <button
            id="header-favorites-btn"
            onClick={onOpenFavorites}
            className="flex flex-col items-center justify-center relative p-1.5 text-slate-700 hover:text-[#00407a] transition-colors cursor-pointer group"
          >
            <div className="relative">
              <Heart className="w-5 h-5 text-slate-600 group-hover:text-red-500 transition-colors" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium mt-0.5 text-slate-600">Favorites</span>
          </button>

          {/* Orders */}
          <button
            id="header-orders-btn"
            onClick={onOpenOrders}
            className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-[#00407a] transition-colors cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 text-slate-600" />
            <span className="text-[11px] font-medium mt-0.5 text-slate-600">Orders</span>
          </button>

          {/* Cart Button */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#00407a]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-[#F5A602] text-slate-900 text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-slate-400">Cart total</div>
              <div className="text-xs font-black text-slate-900">
                {cartTotal.toFixed(2)} BYN
              </div>
            </div>
          </button>

          {/* User Profile */}
          <button
            id="header-profile-btn"
            onClick={onOpenMemberModal}
            className="flex items-center gap-2.5 pl-1 hover:opacity-90 cursor-pointer transition-opacity"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Anna K."
              className="w-9 h-9 rounded-full object-cover border border-amber-300 ring-2 ring-amber-100"
            />
            <div className="text-left hidden xl:block leading-tight">
              <div className="text-xs font-bold text-slate-900">Anna K.</div>
              <div className="text-[11px] font-semibold text-amber-600">Gold Client</div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (under header for small screens) */}
      <div className="px-4 pb-3 md:hidden">
        <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search home furniture & kitchenware..."
            className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => {}}
            className="bg-[#F5A602] text-slate-900 px-3 py-2 flex items-center justify-center"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 3. Category Navigation Ribbon */}
      <div className="bg-white border-t border-slate-100 overflow-x-auto no-scrollbar shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center gap-1.5 sm:gap-2 h-11 text-xs font-semibold whitespace-nowrap">
          {/* Mega Menu Button positioned before All Products & Filters */}
          <button
            id="mega-menu-ribbon-btn"
            onClick={onOpenCatalog}
            className="px-3.5 py-1.5 rounded-full bg-[#00407a] hover:bg-[#003366] text-white font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs active:scale-[0.97]"
            title="Open Catalog"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>Каталог</span>
          </button>

          {/* Shop All Catalog Direct Pill */}
          <button
            onClick={() => onNavigateView && onNavigateView('shop')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'shop' && selectedDepartment === 'All Departments'
                ? 'bg-[#00407a] text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>All Home Products</span>
          </button>

          {DEPARTMENTS.map((dept) => {
            const isActive = currentView !== 'shop' && selectedDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => {
                  onSelectDepartment(dept);
                  if (dept !== 'All Departments' && onNavigateView) {
                    onNavigateView('shop');
                  }
                }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00407a] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#00407a] hover:bg-slate-100'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. USP / Flash Announcement Ticker Ribbon */}
      <div className="bg-[#EFF6FF] border-y border-blue-100 text-[11px] text-blue-900 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-6 whitespace-nowrap font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Express Delivery
            </span>
            <span className="flex items-center gap-1 text-blue-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Quality Home Products
            </span>
            <span className="text-slate-600 hover:text-blue-800 cursor-pointer">Modern Furniture Collection</span>
            <span className="text-slate-600 hover:text-blue-800 cursor-pointer">Professional Kitchenware</span>
            <span className="text-slate-600 hover:text-blue-800 cursor-pointer">Designer Lighting & Lamps</span>
            <span className="text-slate-600 hover:text-blue-800 cursor-pointer">Smart Appliances 0% Installment</span>
          </div>
          <div className="text-slate-700 font-medium shrink-0">
            Free home delivery starts at <strong className="text-slate-900 font-bold">35.00 BYN</strong>
          </div>
        </div>
      </div>
    </header>
  );
};
