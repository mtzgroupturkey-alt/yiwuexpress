import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mock cookies for getServerAuth
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock custom hooks used by Header
vi.mock('@/hooks/useCompanyName', () => ({
  useCompanyName: () => 'Global Trade',
}));

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: {
      companyName: 'Global Trade',
      companyLogo: null,
      rfqModel: 'RFQ',
    },
    loading: false,
  }),
}));

vi.mock('@/hooks/useCustomerView', () => ({
  useCustomerView: () => ({
    isWholesale: false,
    canRequestQuote: false,
    canAddToWholesaleCart: false,
  }),
}));

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 0 }),
}));

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0 }),
}));

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}));

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}));

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}));

vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({
    isStandalone: false,
    openDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
    toggleSearch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    currency: 'USD',
    currencies: [{ code: 'USD', symbol: '$' }],
    setCurrency: vi.fn(),
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
    currentCurrency: { code: 'USD', symbol: '$' },
  }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  }),
}));

vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock verifyToken and getUserFromToken
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
  getUserFromToken: vi.fn(),
}));

import { Header, WholesaleCtaButton, SignInLink, FavoritesIcon, BasketIcon, ProfileIcon } from '@/app/[locale]/design-3/components/Header';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { getServerAuth } from '@/lib/auth/getServerAuth';

const messages = {
  header: {
    forBusiness: 'DRÖMKÖK FOR BUSINESS',
    forBusinessTooltip: 'Create a wholesale account',
    signIn: 'Sign In',
    favorites: 'Favorites',
    basket: 'Basket',
    profile: 'Profile',
  },
  Home: {
    header: {
      everywhere: 'Everywhere',
      favorites: 'Favorites',
      orders: 'Orders',
      cartTotal: 'Cart Total',
      signIn: 'Sign In',
      cart: 'Basket',
      wholesaleCart: 'Quote Cart',
      item: 'item',
      items: 'items',
      myFavorites: 'My Favorites',
      myCart: 'My Cart',
      searchPlaceholder: 'Search products...',
      clear: 'Clear',
      trending: 'Trending',
    },
  },
  business: {
    forBusiness: 'DRÖMKÖK FOR BUSINESS',
  },
};

const mockAppRouter = {
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

function renderWithProviders(ui: React.ReactElement, locale = 'en') {
  return render(
    <AppRouterContext.Provider value={mockAppRouter as any}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </AppRouterContext.Provider>
  );
}

describe('Storefront Header Authentication Switch', () => {
  const defaultHeaderProps = {
    cartCount: 2,
    cartTotal: 150,
    favoritesCount: 3,
    searchQuery: '',
    onSearchChange: vi.fn(),
    onOpenCart: vi.fn(),
    onOpenFavorites: vi.fn(),
    onOpenOrders: vi.fn(),
    onOpenCatalog: vi.fn(),
    onOpenLocation: vi.fn(),
    onOpenMemberModal: vi.fn(),
    categories: [],
    selectedDepartment: 'All',
    onSelectDepartment: vi.fn(),
    deliveryAddress: 'USA',
  };

  it('1. Guest render: shows "DRÖMKÖK FOR BUSINESS" CTA and "Sign In", hides Favorites / Basket / Profile icons', () => {
    renderWithProviders(
      <Header
        {...defaultHeaderProps}
        isAuthenticated={false}
        user={null}
      />
    );

    // Guest items must be visible
    const b2bCta = document.getElementById('header-cta-business-btn');
    expect(b2bCta).toBeInTheDocument();
    expect(b2bCta).toHaveAttribute('href', '/en/register-b2b');
    expect(b2bCta).toHaveTextContent(/DRÖMKÖK FOR BUSINESS/i);

    const signInLink = document.getElementById('header-signin-btn');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/en/sign-in');
    expect(signInLink).toHaveTextContent(/Sign In/i);

    // Authenticated icons must NOT be visible
    expect(document.getElementById('header-favorites-btn')).toBeNull();
    expect(document.getElementById('header-cart-btn')).toBeNull();
    expect(document.getElementById('header-profile-btn')).toBeNull();
  });

  it('2. Logged-in wholesale render: shows Favorites / Basket / Profile icons, hides CTA and Sign In', () => {
    const wholesaleUser = {
      id: 'ws-123',
      email: 'wholesale@example.com',
      name: 'Wholesale Buyer',
      role: 'WHOLESALE_BUYER',
      userType: 'WHOLESALE',
      verificationStatus: 'APPROVED',
    };

    renderWithProviders(
      <Header
        {...defaultHeaderProps}
        isAuthenticated={true}
        user={wholesaleUser}
      />
    );

    // Guest items must NOT be visible in desktop header
    expect(document.getElementById('header-cta-business-btn')).toBeNull();
    expect(document.getElementById('header-signin-btn')).toBeNull();

    // Authenticated icons must be present
    expect(document.getElementById('header-favorites-btn')).toBeInTheDocument();
    expect(document.getElementById('header-cart-btn')).toBeInTheDocument();
    expect(document.getElementById('header-profile-btn')).toBeInTheDocument();
  });

  it('3. Logged-in retail render: shows Favorites / Basket / Profile icons, hides CTA and Sign In', () => {
    const retailUser = {
      id: 'rt-456',
      email: 'retail@example.com',
      name: 'Retail Shopper',
      role: 'CUSTOMER',
      userType: 'RETAIL',
    };

    renderWithProviders(
      <Header
        {...defaultHeaderProps}
        isAuthenticated={true}
        user={retailUser}
      />
    );

    expect(document.getElementById('header-cta-business-btn')).toBeNull();
    expect(document.getElementById('header-signin-btn')).toBeNull();
    expect(document.getElementById('header-favorites-btn')).toBeInTheDocument();
    expect(document.getElementById('header-cart-btn')).toBeInTheDocument();
    expect(document.getElementById('header-profile-btn')).toBeInTheDocument();
  });

  it('4. Expired JWT -> treated as guest (CTA + Sign In visible)', async () => {
    const { verifyToken } = await import('@/lib/auth');
    const { cookies } = await import('next/headers');

    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: 'expired-jwt-token' }),
    });
    (verifyToken as any).mockReturnValue(null); // verification failed/expired

    const authResult = await getServerAuth();
    expect(authResult.isAuthenticated).toBe(false);
    expect(authResult.user).toBeUndefined();

    // Render header with this result
    renderWithProviders(
      <Header
        {...defaultHeaderProps}
        isAuthenticated={authResult.isAuthenticated}
        user={authResult.user}
      />
    );

    expect(document.getElementById('header-cta-business-btn')).toBeInTheDocument();
    expect(document.getElementById('header-signin-btn')).toBeInTheDocument();
    expect(document.getElementById('header-cart-btn')).toBeNull();
  });

  it('5. Invalid / tampered JWT -> treated as guest (CTA + Sign In visible)', async () => {
    const { verifyToken } = await import('@/lib/auth');
    const { cookies } = await import('next/headers');

    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: 'tampered-garbage-token' }),
    });
    (verifyToken as any).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const authResult = await getServerAuth();
    expect(authResult.isAuthenticated).toBe(false);
    expect(authResult.user).toBeUndefined();

    renderWithProviders(
      <Header
        {...defaultHeaderProps}
        isAuthenticated={authResult.isAuthenticated}
        user={authResult.user}
      />
    );

    expect(document.getElementById('header-cta-business-btn')).toBeInTheDocument();
    expect(document.getElementById('header-signin-btn')).toBeInTheDocument();
  });

  it('6. Locale switch: respects localized CTA and Sign In labels', () => {
    renderWithProviders(
      <div>
        <WholesaleCtaButton locale="ru" label="ДЛЯ БИЗНЕСА" tooltip="Создать оптовый аккаунт" />
        <SignInLink locale="ru" label="Войти" />
      </div>,
      'ru'
    );

    const b2bBtn = screen.getByRole('link', { name: /Создать оптовый аккаунт/i });
    expect(b2bBtn).toHaveAttribute('href', '/ru/register-b2b');
    expect(b2bBtn).toHaveTextContent('ДЛЯ БИЗНЕСА');

    const signInBtn = screen.getByRole('link', { name: /Войти/i });
    expect(signInBtn).toHaveAttribute('href', '/ru/sign-in');
    expect(signInBtn).toHaveTextContent('Войти');
  });

  it('7. Mobile viewport: CTA and Sign In visible for guests, cart hidden', () => {
    const { container } = renderWithProviders(
      <MobileHeader
        isAuthenticated={false}
      />
    );

    const mobileB2bCta = container.querySelector('[data-testid="mobile-b2b-cta"]');
    const mobileSignIn = container.querySelector('[data-testid="mobile-sign-in"]');
    const mobileCart = container.querySelector('[data-testid="mobile-cart-trigger"]');

    expect(mobileB2bCta).toBeInTheDocument();
    expect(mobileSignIn).toBeInTheDocument();
    expect(mobileCart).not.toBeInTheDocument();
  });

  it('8. No hydration mismatch: both branches render uniform h-10 container height', () => {
    const { container: guestContainer } = renderWithProviders(
      <div className="flex items-center gap-2">
        <WholesaleCtaButton locale="en" />
        <SignInLink locale="en" />
      </div>
    );

    const { container: authContainer } = renderWithProviders(
      <div className="flex items-center gap-2">
        <FavoritesIcon favoritesCount={0} label="Favorites" onClick={vi.fn()} />
        <BasketIcon
          cartCount={0}
          cartTotal={0}
          canRequestQuote={false}
          isInstantWholesale={false}
          isWholesaleActive={false}
          quoteCount={0}
          currentLocale="en"
          formatPrice={(val) => `$${val}`}
          tHeader={(k: string) => k}
          onOpenCart={vi.fn()}
        />
        <ProfileIcon
          user={{ name: 'Admin', email: 'admin@test.com' }}
          tHeader={(k: string) => k}
          onClick={vi.fn()}
        />
      </div>
    );

    const guestElements = guestContainer.querySelectorAll('.h-10');
    expect(guestElements.length).toBeGreaterThanOrEqual(2);

    const authElements = authContainer.querySelectorAll('.h-10');
    expect(authElements.length).toBeGreaterThanOrEqual(3);
  });
});
