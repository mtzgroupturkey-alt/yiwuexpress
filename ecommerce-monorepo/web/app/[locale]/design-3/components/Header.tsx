import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSettings } from '@/components/SettingsProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Clock, 
  Phone, 
  ChevronDown, 
  ChevronRight,
  Search, 
  Heart, 
  ClipboardList, 
  ShoppingCart, 
  LayoutGrid, 
  Zap, 
  X,
  Sparkles,
  Building2,
  PackageCheck,
  User as UserIcon,
  Coins,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface NavChildCategory {
  id: string;
  name: string;
  slug: string;
  level?: number;
  children?: Array<{ id: string; name: string; slug: string; level?: number }>;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  level?: number;
  children?: NavChildCategory[];
}

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
  categories?: NavCategory[];
  currentView?: 'home' | 'shop' | 'product' | 'checkout';
  onNavigateView?: (view: 'home' | 'shop' | 'product' | 'checkout') => void;
  enableMotion?: boolean;
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
  categories,
  currentView = 'home',
  onNavigateView,
}) => {
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const companyName = useCompanyName();
  const { settings } = useSettings();
  const { currency, currencies, setCurrency, formatPrice, currentCurrency } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const currentLocale = useLocale();
  const tHeader = useTranslations('Home.header');
  const pathname = usePathname();
  const router = useRouter();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedSearchScope, setSelectedSearchScope] = useState(() => tHeader('everywhere'));

  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{
    id: string;
    category: NavCategory;
    top: number;
    left: number;
    isNearRight: boolean;
  } | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setActiveDropdown(null);
      setActiveChildId(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleCategoryMouseEnter = (dept: NavCategory, e: React.MouseEvent<HTMLElement>) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (!dept.children || dept.children.length === 0) {
      setActiveDropdown(null);
      setActiveChildId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const hasAnyLevel3 = dept.children.some((c) => c.children && c.children.length > 0);
    const totalFlyoutWidth = hasAnyLevel3 ? 460 : 230;
    const isNearRight = rect.left + totalFlyoutWidth > window.innerWidth - 16;
    const computedLeft = isNearRight 
      ? Math.max(8, rect.right - 230) 
      : rect.left;

    // Reset active child when category ribbon item is hovered
    setActiveChildId(null);

    setActiveDropdown({
      id: dept.id,
      category: dept,
      top: rect.bottom + 2,
      left: computedLeft,
      isNearRight,
    });
  };

  const handleCategoryMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setActiveChildId(null);
    }, 180);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const handleDropdownMouseLeave = () => {
    handleCategoryMouseLeave();
  };

  const displayedCategories: NavCategory[] =
    categories && categories.length > 0
      ? categories
      : DEPARTMENTS.map((d) => ({ id: d, name: d, slug: d }));

  const searchScopes = [
    tHeader('everywhere'),
    ...displayedCategories.slice(0, 5).map((d) => d.name)
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/${currentLocale}/store?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/${currentLocale}/store`);
    }
  };

  const switchLocale = (newLocale: string) => {
    setShowLangDropdown(false);
    if (newLocale === currentLocale) return;
    
    // Replace current locale in pathname with newLocale
    const segments = pathname.split('/');
    if (segments.length > 1) {
      segments[1] = newLocale;
      router.push(segments.join('/') || `/${newLocale}`);
    } else {
      router.push(`/${newLocale}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        {/* 1. Micro Top Bar with Service Info & Quick Actions */}
        <div className="bg-[#F8FAFC] border-b border-slate-200/70 text-xs py-1.5 px-4 lg:px-6 relative z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left Side: Delivery Location & Live Schedule */}
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-0.5">
            {/* Clickable Delivery Address Location */}
            <button
              id="header-delivery-location-btn"
              onClick={onOpenLocation}
              className="flex items-center gap-1.5 text-slate-700 hover:text-[#00407a] transition-colors cursor-pointer group whitespace-nowrap"
              title="Change Delivery City & Address"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-slate-500">{tHeader('deliverTo')}:</span>
              <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 group-hover:border-[#00407a]">
                {deliveryAddress || 'Worldwide Shipping'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
            </button>

            {/* Live Working Hours */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-600 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{tHeader('expressDeliveryDaily')}: <strong className="text-slate-800 font-semibold">{settings?.storeHours || '08:00 – 23:00'}</strong></span>
            </div>

            {/* Clickable Customer Service Hotline */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500">
              <span className="h-3 w-px bg-slate-300" />
              <Phone className="w-3.5 h-3.5 text-emerald-600 ml-1" />
              <a 
                href={`tel:${settings?.companyPhone || '+86 579 8555 1234'}`}
                className="text-slate-700 hover:text-[#00407a] transition-colors"
                title="Call Customer Support"
              >
                <strong className="font-bold text-slate-900">{settings?.companyPhone ? settings.companyPhone : '+86 579 8555 1234'}</strong>
                <span className="text-slate-500 text-[11px] ml-1">({tHeader('freeHotline')})</span>
              </a>
            </div>
          </div>

          {/* Right Side: Track / B2B Corporate / Currency & Language Switchers */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Track Orders Quick Action */}
            <button
              onClick={onOpenOrders}
              className="hover:text-[#00407a] transition-colors cursor-pointer font-medium text-slate-700 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100"
            >
              <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>{tHeader('trackOrders')}</span>
            </button>

            {/* Corporate B2B Wholesale */}
            <button 
              id="b2b-link-btn"
              onClick={() => onNavigateView && onNavigateView('shop')}
              className="hover:text-[#00407a] transition-colors hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700"
              title="Corporate Sales & Volume Pricing"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{tHeader('corporateB2B')}</span>
            </button>

            <span className="h-3 w-px bg-slate-300 hidden sm:inline-block" />

            {/* Real Dynamic Currency Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCurrencyDropdown(!showCurrencyDropdown);
                  setShowLangDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200/90 hover:border-slate-300 transition-colors font-semibold text-slate-700 cursor-pointer text-xs"
                title="Change Currency"
              >
                <span className="text-[11px] font-extrabold text-[#00407a]">
                  {currentCurrency.symbol} {currency}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-52 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Currency
                  </div>
                  {currencies.filter((c) => c.isActive).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                        currency === c.code
                          ? 'bg-blue-50 text-[#00407a] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 text-center font-bold text-slate-500">{c.symbol}</span>
                        <span>{c.code}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">({c.name})</span>
                      </span>
                      {currency === c.code && (
                        <span className="text-xs text-[#00407a]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Real Locale Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLangDropdown(!showLangDropdown);
                  setShowCurrencyDropdown(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200/90 hover:border-slate-300 transition-colors font-semibold text-slate-700 cursor-pointer text-xs"
              >
                <span className="uppercase font-bold">
                  {currentLocale || 'en'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tHeader('selectLanguage')}
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
        {/* Brand Logo & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger to Open Catalog */}
          <button
            type="button"
            onClick={onOpenCatalog}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-[#00407a] hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            title="Open Category Menu"
          >
            <Menu className="w-6 h-6 text-[#00407a]" />
          </button>

          <Link 
            href={`/${currentLocale}`}
            className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
            title={`${companyName} Home Store`}
          >
            {settings?.companyLogo ? (
              <div 
                className="flex items-center justify-center shrink-0"
                style={{ height: settings?.companyLogoHeight ? `${settings.companyLogoHeight}px` : '40px' }}
              >
                <img
                  src={settings.companyLogo}
                  alt={`${companyName} Logo`}
                  className="w-auto object-contain transition-transform group-hover:scale-105"
                  style={{ maxHeight: settings?.companyLogoHeight ? `${settings.companyLogoHeight}px` : '40px' }}
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
                {settings?.siteTagline || 'Global Wholesale & Retail'}
              </span>
            </div>
          </Link>
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
                placeholder={tHeader('searchPlaceholder')}
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
            <span className="text-[11px] font-medium mt-0.5 text-slate-600">{tHeader('favorites')}</span>
          </button>

          {/* Orders */}
          <button
            id="header-orders-btn"
            onClick={onOpenOrders}
            className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-[#00407a] transition-colors cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 text-slate-600" />
            <span className="text-[11px] font-medium mt-0.5 text-slate-600">{tHeader('orders')}</span>
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
              <div className="text-[10px] uppercase font-bold text-slate-400">{tHeader('cartTotal')}</div>
              <div className="text-xs font-black text-slate-900">
                {formatPrice(cartTotal)}
              </div>
            </div>
          </button>

          {/* User Profile */}
          <button
            id="header-profile-btn"
            onClick={onOpenMemberModal}
            className="flex items-center gap-2 pl-1 hover:opacity-90 cursor-pointer transition-opacity"
            title={isAuthenticated && user ? `Account: ${user.name || user.email}` : 'Sign In / Account'}
          >
            {isAuthenticated && user ? (
              user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-amber-300 ring-2 ring-amber-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00407a] to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-blue-100">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-2xs hover:bg-slate-200">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="text-left hidden xl:block leading-tight">
              {isAuthenticated && user ? (
                <>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {user.name ? user.name.split(' ')[0] : user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
                    {user.role === 'ADMIN' ? 'Admin' : user.role === 'SUPPLIER' ? 'Supplier' : 'Member'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-900">{tHeader('signIn')}</div>
                  <div className="text-[10px] font-medium text-slate-400">Account</div>
                </>
              )}
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
            placeholder={tHeader('searchPlaceholder')}
            className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => {
              const q = searchQuery.trim();
              if (q) {
                router.push(`/${currentLocale}/store?search=${encodeURIComponent(q)}`);
              } else {
                router.push(`/${currentLocale}/store`);
              }
            }}
            className="bg-[#F5A602] text-slate-900 px-3 py-2 flex items-center justify-center cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 3. Category Navigation Ribbon */}
      <div className="bg-white border-t border-slate-100 relative z-30 overflow-x-auto no-scrollbar shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center gap-1.5 sm:gap-2 h-11 text-xs font-semibold whitespace-nowrap">
          {/* Mega Menu Button positioned before All Products & Filters */}
          <button
            id="mega-menu-ribbon-btn"
            onClick={onOpenCatalog}
            className="px-3.5 py-1.5 rounded-full bg-[#00407a] hover:bg-[#003366] text-white font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs active:scale-[0.97]"
            title="Open Catalog"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>{tHeader('catalog')}</span>
          </button>

          {/* Shop All Catalog Direct Pill */}
          <Link
            href={`/${currentLocale}/store`}
            onClick={() => {
              onSelectDepartment('All Departments');
              if (onNavigateView) {
                onNavigateView('shop');
              }
            }}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentView === 'shop' && (selectedDepartment === 'All Departments' || selectedDepartment === 'all')
                ? 'bg-[#00407a] text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{tHeader('allHomeProducts')}</span>
          </Link>

          {displayedCategories.map((dept) => {
            const isActive = currentView !== 'shop' && (selectedDepartment === dept.name || selectedDepartment === dept.slug);
            const hasChildren = dept.children && dept.children.length > 0;
            const isMenuOpen = activeDropdown?.id === dept.id;

            return (
              <div
                key={dept.id || dept.slug || dept.name}
                className="relative shrink-0 flex items-center"
                onMouseEnter={(e) => handleCategoryMouseEnter(dept, e)}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <button
                  onClick={() => {
                    onSelectDepartment(dept.name);
                    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                    setActiveDropdown(null);
                    router.push(`/${currentLocale}/store?department=${encodeURIComponent(dept.name)}`);
                  }}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-[#00407a] text-white shadow-xs'
                      : isMenuOpen
                      ? 'bg-blue-50 text-[#00407a] ring-1 ring-[#00407a]/20'
                      : 'text-slate-700 hover:text-[#00407a] hover:bg-slate-100'
                  }`}
                >
                  <span>{dept.name}</span>
                  {hasChildren && (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. USP / Flash Announcement Ticker Ribbon */}
      <div className="bg-[#EFF6FF] border-y border-blue-100 text-[11px] text-blue-900 py-1.5 relative z-10 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-6 whitespace-nowrap font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {tHeader('expressDelivery')}
            </span>
            <span className="flex items-center gap-1 text-blue-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              {tHeader('qualityGuaranteed')}
            </span>
            {settings?.announcementTicker ? (
              <span className="text-slate-700 font-semibold">{settings.announcementTicker}</span>
            ) : (
              <>
                <span className="text-slate-600 hover:text-blue-800 cursor-pointer">{tHeader('modernFurniture')}</span>
                <span className="text-slate-600 hover:text-blue-800 cursor-pointer">{tHeader('professionalCookware')}</span>
                <span className="text-slate-600 hover:text-blue-800 cursor-pointer">{tHeader('directFactoryPricing')}</span>
                <span className="text-slate-600 hover:text-blue-800 cursor-pointer">{tHeader('verifiedManufacturers')}</span>
              </>
            )}
          </div>
          <div className="text-slate-700 font-medium shrink-0">
            {tHeader('freeDeliveryStarts')}{' '}
            <strong className="text-slate-900 font-bold" suppressHydrationWarning>
              {formatPrice(typeof settings?.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : (parseFloat(String(settings?.freeShippingThreshold)) || 35))}
            </strong>
          </div>
        </div>
      </div>
    </header>

    {/* Teleported Category Submenu Dropdown (Guaranteed on top of everything) */}
    {mounted && activeDropdown && (() => {
      return createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            left: `${activeDropdown.left}px`,
            zIndex: 99999,
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          className="animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Level 2 Submenu Panel */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] py-2 w-[230px] text-xs shrink-0 relative">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
              <span className="truncate max-w-[150px]">{activeDropdown.category.name}</span>
              <span className="text-blue-600 font-semibold">{activeDropdown.category.children?.length || 0} sub</span>
            </div>
            
            {/* View all in department option */}
            <button
              type="button"
              onClick={() => {
                onSelectDepartment(activeDropdown.category.name);
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                setActiveDropdown(null);
                setActiveChildId(null);
                router.push(`/${currentLocale}/store?department=${encodeURIComponent(activeDropdown.category.name)}`);
              }}
              className="w-full text-left px-3 py-1.5 font-bold text-[#00407a] hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>{tHeader('allProducts')}</span>
              <span className="text-[11px] font-bold">&rarr;</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* Direct Level 2 child categories */}
            {activeDropdown.category.children?.map((child, idx) => {
              const isChildActive = activeChildId === child.id;
              const childHasL3 = Boolean(child.children && child.children.length > 0);
              const totalItems = activeDropdown.category.children?.length || 0;
              const alignBottom = idx >= Math.max(3, totalItems - 3) && (child.children?.length || 0) > 4;

              return (
                <div
                  key={child.id || child.slug}
                  className="relative"
                  onMouseEnter={() => setActiveChildId(child.id)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDepartment(child.name);
                      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                      setActiveDropdown(null);
                      setActiveChildId(null);
                      router.push(`/${currentLocale}/store?department=${encodeURIComponent(child.name)}`);
                    }}
                    className={`w-full text-left px-3 py-1.5 font-medium transition-colors flex items-center justify-between group cursor-pointer ${
                      isChildActive && childHasL3
                        ? 'bg-blue-50 text-[#00407a] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#00407a]'
                    }`}
                  >
                    <span className="truncate">{child.name}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {childHasL3 && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          isChildActive
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                          {child.children!.length}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 transition-colors ${
                        isChildActive && childHasL3
                          ? 'text-[#00407a]'
                          : 'text-slate-300 group-hover:text-[#00407a]'
                      }`} />
                    </div>
                  </button>

                  {/* Level 3 Cascading Flyout Panel - positioned DIRECTLY in front of / beside this parent row */}
                  {isChildActive && childHasL3 && (
                    <div
                      className={`absolute ${
                        activeDropdown.isNearRight 
                          ? 'right-full mr-1.5' 
                          : 'left-full ml-1.5'
                      } ${
                        alignBottom ? 'bottom-0' : 'top-0'
                      } bg-white border border-slate-200/90 rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.18)] py-2 w-[220px] text-xs shrink-0 z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-[75vh] overflow-y-auto no-scrollbar`}
                    >
                      {/* Invisible hover bridge connecting row to flyout */}
                      <div
                        className={`absolute top-0 bottom-0 ${
                          activeDropdown.isNearRight ? '-right-2 w-2' : '-left-2 w-2'
                        }`}
                      />

                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span className="truncate max-w-[130px] text-[#00407a]">{child.name}</span>
                        <span className="text-emerald-600 font-semibold">{child.children?.length || 0} items</span>
                      </div>

                      {/* View all in this Level 2 subcategory */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDepartment(child.name);
                          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                          setActiveDropdown(null);
                          setActiveChildId(null);
                          router.push(`/${currentLocale}/store?department=${encodeURIComponent(child.name)}`);
                        }}
                        className="w-full text-left px-3 py-1.5 font-bold text-slate-800 hover:bg-slate-50 hover:text-[#00407a] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{tHeader('allProducts')} ({child.name})</span>
                        <span className="text-[10px]">&rarr;</span>
                      </button>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Level 3 items */}
                      {child.children?.map((sub) => (
                        <button
                          key={sub.id || sub.slug}
                          type="button"
                          onClick={() => {
                            onSelectDepartment(sub.name);
                            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                            setActiveDropdown(null);
                            setActiveChildId(null);
                            router.push(`/${currentLocale}/store?department=${encodeURIComponent(sub.name)}`);
                          }}
                          className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-blue-50 hover:text-[#00407a] hover:font-bold font-medium transition-colors flex items-center gap-2 group cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#00407a] group-hover:scale-125 transition-all shrink-0" />
                          <span className="truncate">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      );
    })()}
  </>
);
};
