import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { CurrencySwitcher } from '@/components/i18n/CurrencySwitcher'
import { LocaleCurrencyAutoDetect } from '@/components/i18n/LocaleCurrencyAutoDetect'
import { setCookie, getCookie, switchLocale } from '@/lib/locale-navigation'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/store',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const mockSetCurrency = vi.fn()
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    currency: 'USD',
    currentCurrency: { code: 'USD', symbol: '$', name: 'US Dollar' },
    setCurrency: mockSetCurrency,
    currencies: [
      { code: 'USD', symbol: '$', name: 'US Dollar', isActive: true },
      { code: 'RUB', symbol: '₽', name: 'Russian Ruble', isActive: true },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', isActive: true },
      { code: 'EUR', symbol: '€', name: 'Euro', isActive: true },
    ],
  }),
}))

describe('LanguageSwitcher', () => {
  it('renders desktop header dropdown with active language EN', () => {
    render(<LanguageSwitcher variant="header-dropdown" />)
    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
  })

  it('opens dropdown on click and displays options for EN, RU, ZH', () => {
    render(<LanguageSwitcher variant="header-dropdown" />)
    const btn = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(btn)

    expect(screen.getByText(/English/i)).toBeInTheDocument()
    expect(screen.getByText('Русский')).toBeInTheDocument()
    expect(screen.getByText('中文')).toBeInTheDocument()
  })

  it('renders drawer radio list variant with flags and titles', () => {
    render(<LanguageSwitcher variant="drawer-radio" />)
    expect(screen.getByText('Русский')).toBeInTheDocument()
    expect(screen.getByText('中文')).toBeInTheDocument()
  })

  it('renders footer dropdown variant', () => {
    render(<LanguageSwitcher variant="footer-dropdown" />)
    expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument()
  })
})

describe('CurrencySwitcher', () => {
  it('renders desktop header dropdown with active currency USD', () => {
    render(<CurrencySwitcher variant="header-dropdown" />)
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('opens dropdown on click and shows available currencies (RUB, CNY, EUR)', () => {
    render(<CurrencySwitcher variant="header-dropdown" />)
    const btn = screen.getByRole('button', { name: /select currency/i })
    fireEvent.click(btn)

    expect(screen.getByText(/Russian Ruble/i)).toBeInTheDocument()
    expect(screen.getByText(/Chinese Yuan/i)).toBeInTheDocument()
    expect(screen.getByText(/Euro/i)).toBeInTheDocument()
  })

  it('triggers setCurrency when a currency is selected', () => {
    render(<CurrencySwitcher variant="header-dropdown" />)
    const btn = screen.getByRole('button', { name: /select currency/i })
    fireEvent.click(btn)

    const rubOption = screen.getByText(/Russian Ruble/i)
    fireEvent.click(rubOption.closest('button')!)
    expect(mockSetCurrency).toHaveBeenCalledWith('RUB')
  })

  it('renders drawer radio list with popular currencies', () => {
    render(<CurrencySwitcher variant="drawer-radio" />)
    expect(screen.getByText('RUB')).toBeInTheDocument()
    expect(screen.getByText('CNY')).toBeInTheDocument()
    expect(screen.getByText('EUR')).toBeInTheDocument()
  })
})

describe('Locale and Cookie Navigation Utilities', () => {
  it('sets and retrieves cookies correctly', () => {
    setCookie('NEXT_CURRENCY', 'RUB', 365)
    expect(document.cookie).toContain('NEXT_CURRENCY=RUB')
    expect(getCookie('NEXT_CURRENCY')).toBe('RUB')
  })

  it('switchLocale sets NEXT_LOCALE cookie', () => {
    setCookie('NEXT_LOCALE', 'zh', 365)
    expect(getCookie('NEXT_LOCALE')).toBe('zh')
  })
})

describe('LocaleCurrencyAutoDetect', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'gt_locale_autodetect_dismissed=; max-age=0'
    document.cookie = 'NEXT_LOCALE=; max-age=0'
  })

  it('suggests Russian when browser language is ru-RU and current locale is en', async () => {
    Object.defineProperty(navigator, 'language', { value: 'ru-RU', configurable: true })
    render(<LocaleCurrencyAutoDetect />)

    await waitFor(() => {
      expect(screen.getByTestId('locale-autodetect-banner')).toBeInTheDocument()
      expect(screen.getByText('Переключить на Русский (RUB)')).toBeInTheDocument()
    })
  })

  it('dismisses banner on dismiss click and stores dismissal flag', async () => {
    Object.defineProperty(navigator, 'language', { value: 'ru-RU', configurable: true })
    render(<LocaleCurrencyAutoDetect />)

    await waitFor(() => {
      expect(screen.getByTestId('locale-autodetect-banner')).toBeInTheDocument()
    })

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissBtn)

    expect(screen.queryByTestId('locale-autodetect-banner')).not.toBeInTheDocument()
    expect(localStorage.getItem('gt_locale_autodetect_dismissed')).toBe('true')
  })
})
