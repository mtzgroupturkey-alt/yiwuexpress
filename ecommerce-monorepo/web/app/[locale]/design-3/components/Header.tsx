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
  ChevronDown, 
  ChevronRight,
  Search, 
  Heart, 
  ShoppingCart, 
  LayoutGrid, 
  Zap, 
  X,
  Sparkles,
  User as UserIcon,
  Coins,
  Menu,
  Truck,
  FileText,
  Camera,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerView } from '@/hooks/useCustomerView';
import { useStoreMode } from '@/contexts/StoreModeContext';
import { cleanAddressDisplay } from '@/lib/geo/coordinateResolver';
import { useSessionMode } from '@/contexts/SessionModeContext';
import { useQuoteCart } from '@/components/QuoteCartContext';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { useMobile } from '@/components/MobileProvider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/i18n/CurrencySwitcher';
import { VisualSearchModal } from '@/components/search/VisualSearchModal';
import { useAuthContext } from '@/components/providers/AuthProvider';

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

export interface HeaderProps {
  locale?: string;
  isAuthenticated?: boolean;
  user?: any;
  cartCount: number;
  cartTotal: number;
  favoritesCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenOrders?: () => void;
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

export interface WholesaleCtaButtonProps {
  locale: string;
  label?: string;
  tooltip?: string;
}

export const WholesaleCtaButton: React.FC<WholesaleCtaButtonProps> = ({
  locale,
  label,
  tooltip,
}) => {
  const defaultLabel =
    locale === 'zh'
      ? 'DRÖMKÖK 企业专区'
      : locale === 'ru'
      ? 'DRÖMKÖK ДЛЯ БИЗНЕСА'
      : 'DRÖMKÖK FOR BUSINESS';
  const defaultTooltip =
    locale === 'zh'
      ? '注册企业采购账户'
      : locale === 'ru'
      ? 'Создать оптовый аккаунт'
      : 'Create a wholesale account';

  const resolvedLabel = label || defaultLabel;
  const resolvedTooltip = tooltip || defaultTooltip;

  return (
    <Link
      id="header-cta-business-btn"
      href={`/${locale}/register-b2b`}
      title={resolvedTooltip}
      aria-label={resolvedTooltip}
      className="group relative h-10 px-3.5 py-1.5 flex items-center gap-2 rounded-xl text-xs sm:text-[13px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap cursor-pointer overflow-hidden transition-all duration-300 bg-gradient-to-r from-[#003366] via-[#00407a] to-[#0b4d8c] text-white shadow-sm shadow-[#00407a]/20 hover:shadow-md hover:shadow-[#00407a]/35 hover:-translate-y-0.5 active:translate-y-0 border border-white/15"
    >
      {/* Subtle glossy shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />

      {/* Glowing icon container with gold accent */}
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/30 group-hover:bg-amber-400/30 group-hover:scale-105 transition-all shrink-0">
        <Building2 className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] shrink-0" />
      </span>

      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{resolvedLabel}</span>

      {/* Mini PRO/B2B indicator pill */}
      <span className="relative ml-0.5 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-extrabold tracking-normal leading-none shadow-xs group-hover:bg-amber-300 transition-colors">
        B2B
      </span>
    </Link>
  );
};

export interface SignInLinkProps {
  locale: string;
  label?: string;
}

export const SignInLink: React.FC<SignInLinkProps> = ({
  locale,
  label,
}) => {
  const defaultLabel =
    locale === 'zh'
      ? '登录'
      : locale === 'ru'
      ? 'Войти'
      : 'Sign In';
  const resolvedLabel = label || defaultLabel;

  return (
    <Link
      id="header-signin-btn"
      href={`/${locale}/sign-in`}
      className="h-10 px-3.5 py-2 flex items-center gap-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors text-xs sm:text-sm font-semibold shrink-0 whitespace-nowrap cursor-pointer"
    >
      <UserIcon className="w-4 h-4 text-slate-600" />
      <span>{resolvedLabel}</span>
    </Link>
  );
};

export interface FavoritesIconProps {
  favoritesCount: number;
  label: string;
  onClick: () => void;
}

export const FavoritesIcon: React.FC<FavoritesIconProps> = ({
  favoritesCount,
  label,
  onClick,
}) => {
  return (
    <button
      id="header-favorites-btn"
      onClick={onClick}
      className="h-10 flex flex-col items-center justify-center relative p-1.5 text-slate-700 hover:text-[#00407a] transition-colors cursor-pointer group"
    >
      <div className="relative">
        <Heart className="w-5 h-5 text-slate-600 group-hover:text-red-500 transition-colors" />
        {favoritesCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
            {favoritesCount}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium mt-0.5 text-slate-600 leading-none">{label}</span>
    </button>
  );
};

export interface BasketIconProps {
  cartCount: number;
  cartTotal: number;
  canRequestQuote: boolean;
  isInstantWholesale: boolean;
  isWholesaleActive: boolean;
  quoteCount: number;
  currentLocale: string;
  formatPrice: (amount: number) => string;
  tHeader: any;
  onOpenCart: () => void;
  verificationStatus?: string;
}

export const BasketIcon: React.FC<BasketIconProps> = ({
  cartCount,
  cartTotal,
  canRequestQuote,
  isInstantWholesale,
  isWholesaleActive,
  quoteCount,
  currentLocale,
  formatPrice,
  tHeader,
  onOpenCart,
  verificationStatus,
}) => {
  if (canRequestQuote && !isInstantWholesale) {
    return (
      <Link
        id="header-cart-btn"
        href={`/${currentLocale}/quote-cart`}
        title={`${tHeader('quoteRequest')} (${quoteCount} ${quoteCount === 1 ? tHeader('item') : tHeader('items')})`}
        className="h-10 flex items-center gap-2.5 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-blue-200 text-blue-950"
      >
        <div className="relative">
          <FileText className="w-5 h-5 text-blue-700" />
          {quoteCount > 0 && (
            <span className="absolute -top-2 -right-2.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
              {quoteCount}
            </span>
          )}
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1">
            <span>{tHeader('quoteRequest')}</span>
            {verificationStatus === 'PENDING' && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-normal">Pending</span>
            )}
          </div>
          <div className="text-xs font-black text-blue-950">
            {quoteCount} {quoteCount === 1 ? tHeader('item') : tHeader('items')}
          </div>
        </div>
      </Link>
    );
  }

  if (isWholesaleActive && isInstantWholesale) {
    return (
      <button
        id="header-cart-btn"
        onClick={onOpenCart}
        title={`${tHeader('wholesaleCart')} (${cartCount} ${cartCount === 1 ? tHeader('item') : tHeader('items')})`}
        className="h-10 flex items-center gap-2.5 bg-amber-50 hover:bg-amber-100/80 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-amber-200"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 text-amber-700" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <div className="text-left leading-tight hidden sm:block">
          {verificationStatus === 'PENDING' && (
            <div className="text-[9px] font-semibold text-amber-700 leading-none mb-0.5">Pending Approval</div>
          )}
          <div className="text-xs font-black text-slate-900">
            {formatPrice(cartTotal)}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      id="header-cart-btn"
      onClick={onOpenCart}
      title={`Shopping Cart (${cartCount} items)`}
      className="h-10 flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-slate-200"
    >
      <div className="relative">
        <ShoppingCart className="w-5 h-5 text-[#00407a]" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2.5 bg-[#F5A602] text-slate-900 text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </div>
      <div className="text-xs font-black text-slate-900 hidden sm:block">
        {formatPrice(cartTotal)}
      </div>
    </button>
  );
};

export interface ProfileIconProps {
  user: any;
  tHeader: any;
  onClick: () => void;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({
  user,
  tHeader,
  onClick,
}) => {
  return (
    <button
      id="header-profile-btn"
      onClick={onClick}
      className="h-10 flex items-center gap-2 pl-1 hover:opacity-90 cursor-pointer transition-opacity"
      title={`Account: ${user?.name || user?.email || 'User'}`}
    >
      {user?.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt={user.name || 'User'}
          className="w-9 h-9 rounded-full object-cover border border-amber-300 ring-2 ring-amber-100"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00407a] to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-blue-100">
          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
      )}
      <div className="text-left hidden xl:block leading-tight">
        <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
          {user?.name ? user.name.split(' ')[0] : user?.email ? user.email.split('@')[0] : 'Member'}
        </div>
        <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
          {user?.role === 'ADMIN'
            ? tHeader('roleAdmin')
            : user?.role === 'SUPPLIER'
            ? tHeader('roleSupplier')
            : tHeader('roleMember')}
        </div>
      </div>
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({
  locale: propLocale,
  isAuthenticated: propIsAuthenticated,
  user: propUser,
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
  const { isWholesale: isWholesaleActive, canRequestQuote } = useCustomerView();
  const { quoteCount } = useQuoteCart();
  const { isStandalone, openDrawer } = useMobile();

  const rfqModel = settings?.rfqModel || 'RFQ';
  const isInstantWholesale = rfqModel === 'INSTANT';

  const { currency, currencies, setCurrency, formatPrice, currentCurrency } = useCurrency();
  const authCtx = useAuthContext();
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authCtx.isAuthenticated;
  const user = propUser !== undefined ? propUser : authCtx.user;
  const rawHookLocale = useLocale();
  const currentLocale = propLocale || rawHookLocale || 'en';
  const locale = currentLocale;
  const tHeader = useTranslations('Home.header');
  const tRootHeader = useTranslations('header');
  const tBusiness = useTranslations('business');

  const isWholesaleUser = Boolean(
    user &&
    (user.userType === 'WHOLESALE' ||
     user.userType === 'BOTH' ||
     user.verificationStatus === 'PENDING' ||
     user.verificationStatus === 'APPROVED') &&
    user.role !== 'ADMIN'
  );
  const pathname = usePathname();
  const router = useRouter();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedSearchScope, setSelectedSearchScope] = useState(() => tHeader('everywhere'));
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const desktopLogo = settings?.companyLogo || '/logo.png';
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [desktopLogo]);

  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{
    id: string;
    category: NavCategory;
    top: number;
    left?: number;
    right?: number;
    isNearRight: boolean;
  } | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringDropdownRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      // If user cursor is actively hovering or interacting inside the menu/trigger, do NOT close on scroll!
      if (isHoveringDropdownRef.current) return;
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
    isHoveringDropdownRef.current = true;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (!dept.children || dept.children.length === 0) {
      setActiveDropdown(null);
      setActiveChildId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const hasAnyLevel3 = dept.children.some((c) => c.children && c.children.length > 0);
    const totalFlyoutWidth = hasAnyLevel3 ? 490 : 250;
    const isNearRight = rect.left + totalFlyoutWidth > window.innerWidth - 16;
    const computedLeft = Math.max(16, rect.left);
    const computedRight = Math.max(16, window.innerWidth - rect.right);

    // Reset active child when category ribbon item is hovered
    setActiveChildId(null);

    setActiveDropdown({
      id: dept.id,
      category: dept,
      top: rect.bottom + 2,
      left: computedLeft,
      right: computedRight,
      isNearRight,
    });
  };

  const handleCategoryMouseLeave = () => {
    isHoveringDropdownRef.current = false;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setActiveChildId(null);
    }, 280);
  };

  const handleDropdownMouseEnter = () => {
    isHoveringDropdownRef.current = true;
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
    let targetPath = `/${newLocale}`;
    if (segments.length > 1 && ['en', 'ru', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
      targetPath = segments.join('/') || `/${newLocale}`;
    } else {
      targetPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
    }

    // Preserve query parameters if present
    if (typeof window !== 'undefined' && window.location.search) {
      targetPath += window.location.search;
    }

    try {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    window.location.href = targetPath;
  };

  const isHomePage =
    pathname === `/${currentLocale}` ||
    pathname === `/${currentLocale}/` ||
    pathname === '/' ||
    !pathname;

  return (
    <>
      {/* MOBILE HEADER (Switches between website mobile view and native PWA app header) */}
      <MobileHeader
        showSearch={true}
        showBack={!isHomePage}
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
        onMenuClick={isStandalone ? openDrawer : onOpenCatalog}
        onCartClick={isWholesaleActive && !isInstantWholesale ? undefined : onOpenCart}
      />

      {/* In-flow layout spacer so following content naturally clears the fixed header on mobile */}
      <div
        className={`md:hidden w-full shrink-0 pointer-events-none ${
          isStandalone
            ? 'h-[calc(56px+env(safe-area-inset-top,0px))]'
            : 'h-[calc(120px+env(safe-area-inset-top,0px))]'
        }`}
        aria-hidden="true"
      />

      {/* Collapsible Mobile Search Input (Only for Standalone PWA mode where search is an overlay icon) */}
      {isStandalone && isMobileSearchOpen && (
        <div
          className="md:hidden fixed left-0 right-0 z-50 px-4 py-2.5 bg-slate-50 border-b border-slate-200 shadow-md animate-in slide-in-from-top-2 duration-150"
          style={{ top: 'calc(56px + env(safe-area-inset-top, 0px))' }}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={tHeader('searchPlaceholder')}
                autoFocus
                className="w-full h-10 pl-9 pr-10 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#00407a]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setIsVisualSearchOpen(true)}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-[#00407a] cursor-pointer"
                aria-label="Search by image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              className="h-10 px-4 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold text-xs rounded-xl shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {currentLocale === 'zh' ? '搜索' : currentLocale === 'ru' ? 'Поиск' : 'Search'}
            </button>
          </form>
        </div>
      )}

      {/* DESKTOP HEADER (100% desktop experience, hidden on mobile) */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
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
                {cleanAddressDisplay(deliveryAddress, currentLocale) || tHeader('worldwideShipping')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
            </button>
          </div>

          {/* Right Side: Currency & Language Switchers */}
          <div className="flex items-center gap-2.5 pl-1">
            <LanguageSwitcher variant="header-dropdown" />
            <CurrencySwitcher variant="header-dropdown" />
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
            {desktopLogo && !logoFailed ? (
              <div 
                className="flex items-center justify-center shrink-0"
                style={{ height: settings?.companyLogoHeight ? `${settings.companyLogoHeight}px` : '40px' }}
              >
                <img
                  src={desktopLogo}
                  alt={`${companyName} Logo`}
                  onError={() => setLogoFailed(true)}
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
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#00407a] font-sans leading-none">
                {companyName}
              </span>
              {settings?.siteTagline ? (
                <span className="text-[9px] font-bold text-amber-600 tracking-wider uppercase mt-0.5">
                  {settings.siteTagline}
                </span>
              ) : null}
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[180px] max-w-[660px] relative hidden md:block">
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
                  className="p-1 text-slate-400 hover:text-slate-600 mr-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Visual Search (Camera) Button */}
              <button
                type="button"
                onClick={() => setIsVisualSearchOpen(true)}
                title="Search by image"
                aria-label="Search by image"
                className="p-1.5 text-slate-400 hover:text-[#00407a] hover:bg-slate-100 rounded-md transition-colors mr-1 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
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

        {/* Action Controls: STATE A (Guest) vs STATE B (Logged-in) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-10">
          {!isAuthenticated ? (
            /* --- STATE A: GUEST (not logged in) --- */
            <>
              <WholesaleCtaButton
                locale={currentLocale}
                label={tRootHeader('forBusiness') || 'DRÖMKÖK FOR BUSINESS'}
                tooltip={tRootHeader('forBusinessTooltip') || 'Create a wholesale account'}
              />
              <SignInLink
                locale={currentLocale}
                label={tRootHeader('signIn') || 'Sign In'}
              />
            </>
          ) : (
            /* --- STATE B: AUTHENTICATED USER (wholesale or retail) --- */
            <>
              <FavoritesIcon
                favoritesCount={favoritesCount}
                label={tRootHeader('favorites') || tHeader('favorites')}
                onClick={onOpenFavorites}
              />
              <BasketIcon
                cartCount={cartCount}
                cartTotal={cartTotal}
                canRequestQuote={canRequestQuote}
                isInstantWholesale={isInstantWholesale}
                isWholesaleActive={isWholesaleActive}
                quoteCount={quoteCount}
                currentLocale={currentLocale}
                formatPrice={formatPrice}
                tHeader={tHeader}
                onOpenCart={onOpenCart}
                verificationStatus={user?.verificationStatus}
              />
              <ProfileIcon
                user={user}
                tHeader={tHeader}
                onClick={onOpenMemberModal}
              />
            </>
          )}
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
                    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                    setActiveDropdown(null);
                    const targetCategory = dept.slug || dept.id || dept.name;
                    router.push(`/${currentLocale}/store?category=${encodeURIComponent(targetCategory)}`);
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
    </header>

    {/* Teleported Category Submenu Dropdown (Guaranteed on top of everything) */}
    {mounted && activeDropdown && (() => {
      const activeChild = activeDropdown.category.children?.find((c) => c.id === activeChildId);
      const hasActiveChildL3 = Boolean(activeChild && activeChild.children && activeChild.children.length > 0);

      return createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${activeDropdown.top}px`,
            ...(activeDropdown.isNearRight
              ? { right: `${activeDropdown.right ?? 16}px` }
              : { left: `${activeDropdown.left ?? 16}px` }),
            zIndex: 99999,
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          className={`animate-in fade-in-50 zoom-in-95 duration-100 flex items-start ${
            activeDropdown.isNearRight ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Level 2 Submenu Panel */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] py-2 w-[240px] text-xs shrink-0 flex flex-col max-h-[min(580px,calc(100vh-140px))] overscroll-contain">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between shrink-0">
              <span className="truncate max-w-[140px] text-slate-700">{activeDropdown.category.name}</span>
              <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full">{tHeader('subCount', { count: activeDropdown.category.children?.length || 0 })}</span>
            </div>
            
            {/* View all in department option */}
            <button
              type="button"
              onClick={() => {
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                setActiveDropdown(null);
                setActiveChildId(null);
                const targetCategory = activeDropdown.category.slug || activeDropdown.category.id || activeDropdown.category.name;
                router.push(`/${currentLocale}/store?category=${encodeURIComponent(targetCategory)}`);
              }}
              className="w-full text-left px-3 py-1.5 font-bold text-[#00407a] hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer shrink-0"
            >
              <span>{tHeader('allProducts')}</span>
              <span className="text-[11px] font-bold">&rarr;</span>
            </button>

            <div className="h-px bg-slate-100 my-1 shrink-0" />

            {/* Direct Level 2 child categories - SCROLLABLE with custom scrollbar */}
            <div className="flex-1 overflow-y-auto overscroll-contain dropdown-scrollbar px-1 py-0.5 space-y-0.5">
              {activeDropdown.category.children?.map((child) => {
                const isChildActive = activeChildId === child.id;
                const childHasL3 = Boolean(child.children && child.children.length > 0);

                return (
                  <button
                    key={child.id || child.slug}
                    type="button"
                    onMouseEnter={() => setActiveChildId(child.id)}
                    onClick={() => {
                      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                      setActiveDropdown(null);
                      setActiveChildId(null);
                      const targetCategory = child.slug || child.id || child.name;
                      router.push(`/${currentLocale}/store?category=${encodeURIComponent(targetCategory)}`);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between group cursor-pointer ${
                      isChildActive
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
                        isChildActive
                          ? 'text-[#00407a]'
                          : 'text-slate-300 group-hover:text-[#00407a]'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 3 Cascading Sibling Panel */}
          {hasActiveChildL3 && activeChild && (
            <div
              className={`bg-white border border-slate-200/90 rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.18)] py-2 w-[240px] text-xs shrink-0 flex flex-col max-h-[min(580px,calc(100vh-140px))] overscroll-contain animate-in fade-in-50 zoom-in-95 duration-100 ${
                activeDropdown.isNearRight ? 'mr-1.5' : 'ml-1.5'
              }`}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between shrink-0">
                <span className="truncate max-w-[140px] text-[#00407a]">{activeChild.name}</span>
                <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">{activeChild.children?.length || 0} {tHeader('items')}</span>
              </div>

              {/* View all in this Level 2 subcategory */}
              <button
                type="button"
                onClick={() => {
                  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                  setActiveDropdown(null);
                  setActiveChildId(null);
                  const targetCategory = activeChild.slug || activeChild.id || activeChild.name;
                  router.push(`/${currentLocale}/store?category=${encodeURIComponent(targetCategory)}`);
                }}
                className="w-full text-left px-3 py-1.5 font-bold text-slate-800 hover:bg-slate-50 hover:text-[#00407a] flex items-center justify-between transition-colors cursor-pointer shrink-0"
              >
                <span className="truncate">{tHeader('allProducts')} ({activeChild.name})</span>
                <span className="text-[10px] font-bold shrink-0 ml-1">&rarr;</span>
              </button>

              <div className="h-px bg-slate-100 my-1 shrink-0" />

              {/* Level 3 items - SCROLLABLE with custom scrollbar */}
              <div className="flex-1 overflow-y-auto overscroll-contain dropdown-scrollbar px-1 py-0.5 space-y-0.5">
                {activeChild.children?.map((sub) => (
                  <button
                    key={sub.id || sub.slug}
                    type="button"
                    onClick={() => {
                      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                      setActiveDropdown(null);
                      setActiveChildId(null);
                      const targetCategory = sub.slug || sub.id || sub.name;
                      router.push(`/${currentLocale}/store?category=${encodeURIComponent(targetCategory)}`);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-[#00407a] hover:font-bold font-medium transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#00407a] group-hover:scale-125 transition-all shrink-0" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      );
    })()}

    {/* Visual Search Modal */}
    <VisualSearchModal
      isOpen={isVisualSearchOpen}
      onClose={() => setIsVisualSearchOpen(false)}
    />
  </>
);
};
