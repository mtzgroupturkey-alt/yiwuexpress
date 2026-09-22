import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MobileProvider } from '@/components/MobileProvider'
import { MobileLayoutContainer } from '@/components/mobile/MobileLayoutContainer'
import { BottomNav } from '@/components/mobile/BottomNav'
import { InstallBanner } from '@/components/mobile/InstallBanner'
import { InstallWelcomeModal } from '@/components/mobile/InstallWelcomeModal'
import { Footer } from '@/app/[locale]/design-3/components/Footer'

let mockPathname = '/en'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: {
      companyName: 'Global Trade',
      companyLogo: '/logo.png',
    },
  }),
}))

vi.mock('@/hooks/useCompanyName', () => ({
  useCompanyName: () => 'Global Trade',
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 2 }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 0 }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: 1 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}))

describe('Progressive PWA Install Strategy Integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mockPathname = '/en'
    vi.restoreAllMocks()
  })

  describe('MobileLayoutContainer', () => {
    it('applies pb-0 in browser mode (no BottomNav offset)', () => {
      render(
        <MobileProvider initialIsStandalone={false}>
          <MobileLayoutContainer>
            <div>Page Content</div>
          </MobileLayoutContainer>
        </MobileProvider>
      )

      const container = screen.getByTestId('main-content-container')
      expect(container).toHaveClass('pb-0')
      expect(container).not.toHaveClass('pb-20')
      expect(container).toHaveAttribute('data-display-mode', 'browser')
    })

    it('applies pb-20 in standalone mode (provides clearance for BottomNav)', () => {
      render(
        <MobileProvider initialIsStandalone={true}>
          <MobileLayoutContainer>
            <div>Page Content</div>
          </MobileLayoutContainer>
        </MobileProvider>
      )

      const container = screen.getByTestId('main-content-container')
      expect(container).toHaveClass('pb-20')
      expect(container).toHaveAttribute('data-display-mode', 'standalone')
    })
  })

  describe('BottomNav Progressive Rendering', () => {
    it('is hidden in browser mode so standard web navigation is used', () => {
      const { container } = render(
        <MobileProvider initialIsStandalone={false}>
          <BottomNav />
        </MobileProvider>
      )

      // In browser mode, BottomNav returns null
      expect(container.firstChild).toBeNull()
      expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument()
    })

    it('is visible in standalone mode (installed PWA app-like experience)', () => {
      render(
        <MobileProvider initialIsStandalone={true}>
          <BottomNav />
        </MobileProvider>
      )

      expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })
  })

  describe('Footer Progressive Visibility', () => {
    it('is visible on mobile in browser mode (block class)', () => {
      render(
        <MobileProvider initialIsStandalone={false}>
          <Footer />
        </MobileProvider>
      )

      const footerEl = screen.getByTestId('app-footer')
      expect(footerEl).toHaveClass('block')
      expect(footerEl).not.toHaveClass('hidden')
    })

    it('is hidden on mobile in standalone mode (hidden md:block class)', () => {
      render(
        <MobileProvider initialIsStandalone={true}>
          <Footer />
        </MobileProvider>
      )

      const footerEl = screen.getByTestId('app-footer')
      expect(footerEl).toHaveClass('hidden')
      expect(footerEl).toHaveClass('md:block')
    })
  })

  describe('InstallBanner Strategy & Suppression', () => {
    it('renders install banner in browser mode with company name and install button', () => {
      render(
        <MobileProvider initialIsStandalone={false}>
          <InstallBanner forceVisible={true} />
        </MobileProvider>
      )

      expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument()
      expect(screen.getByText('Install Global Trade')).toBeInTheDocument()
      expect(screen.getByTestId('pwa-banner-install-btn')).toBeInTheDocument()
    })

    it('does not render install banner in standalone mode', () => {
      const { container } = render(
        <MobileProvider initialIsStandalone={true}>
          <InstallBanner />
        </MobileProvider>
      )

      expect(container.querySelector('[data-testid="pwa-install-banner"]')).toBeNull()
    })

    it('snoozes for 7 days and increments dismiss count when dismissed', () => {
      render(
        <MobileProvider initialIsStandalone={false}>
          <InstallBanner forceVisible={true} />
        </MobileProvider>
      )

      const dismissBtn = screen.getByTestId('pwa-banner-dismiss-btn')
      fireEvent.click(dismissBtn)

      expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument()
      const snoozedUntil = localStorage.getItem('gt_pwa_banner_dismissed_until')
      expect(snoozedUntil).toBeTruthy()
      expect(parseInt(snoozedUntil!, 10)).toBeGreaterThan(Date.now())
      expect(localStorage.getItem('gt_pwa_dismiss_count')).toBe('1')
    })

    it('suppresses install banner on checkout route', () => {
      mockPathname = '/en/checkout'
      const { container } = render(
        <MobileProvider initialIsStandalone={false}>
          <InstallBanner />
        </MobileProvider>
      )

      expect(container.querySelector('[data-testid="pwa-install-banner"]')).toBeNull()
    })

    it('suppresses install banner on product detail page (PDP)', () => {
      mockPathname = '/en/products/test-slug'
      const { container } = render(
        <MobileProvider initialIsStandalone={false}>
          <InstallBanner />
        </MobileProvider>
      )

      expect(container.querySelector('[data-testid="pwa-install-banner"]')).toBeNull()
    })

    it('opens iOS installation guide sheet when install button is clicked without native prompt', () => {
      render(
        <MobileProvider initialIsStandalone={false}>
          <InstallBanner forceVisible={true} />
        </MobileProvider>
      )

      const installBtn = screen.getByTestId('pwa-banner-install-btn')
      fireEvent.click(installBtn)

      expect(screen.getByTestId('pwa-ios-guide-sheet')).toBeInTheDocument()
      expect(screen.getByText('Add to Home Screen')).toBeInTheDocument()
      expect(screen.getByText('Got it')).toBeInTheDocument()
    })
  })

  describe('InstallWelcomeModal', () => {
    it('displays after 3 seconds on first visit and persists browser choice for 30 days', () => {
      vi.useFakeTimers()

      render(
        <MobileProvider initialIsStandalone={false}>
          <InstallWelcomeModal onInstallClick={vi.fn()} />
        </MobileProvider>
      )

      // Before 3 seconds
      expect(screen.queryByTestId('pwa-welcome-modal')).not.toBeInTheDocument()

      // Advance by 3000ms
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.getByTestId('pwa-welcome-modal')).toBeInTheDocument()
      expect(screen.getByText('Welcome to Global Trade')).toBeInTheDocument()
      expect(screen.getByText('Faster Loading')).toBeInTheDocument()
      expect(screen.getByText('Offline Access')).toBeInTheDocument()

      // Click "Continue in browser"
      const continueBtn = screen.getByRole('button', { name: /continue in browser/i })
      fireEvent.click(continueBtn)

      expect(screen.queryByTestId('pwa-welcome-modal')).not.toBeInTheDocument()
      expect(localStorage.getItem('gt_pwa_welcome_choice')).toBe('browser')

      vi.useRealTimers()
    })
  })
})
