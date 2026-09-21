import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobilePreferencesSheet } from '@/components/mobile/account/MobilePreferencesSheet'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/en/profile',
}))
vi.mock('next-intl', () => ({ useLocale: () => 'en' }))

const mockSetCurrency = vi.fn()
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    currency: 'USD',
    setCurrency: mockSetCurrency,
    currencies: [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    ],
  }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    return React.createElement('div', { ...rest, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('MobilePreferencesSheet', () => {
  it('renders language list options by default', () => {
    render(<MobilePreferencesSheet isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Русский')).toBeInTheDocument()
    expect(screen.getByText('中文')).toBeInTheDocument()
  })

  it('switches to currency tab on button click', () => {
    render(<MobilePreferencesSheet isOpen={true} onClose={vi.fn()} />)
    const currencyTab = screen.getByRole('button', { name: /Currency/i })
    fireEvent.click(currencyTab)
    expect(screen.getByText('Russian Ruble')).toBeInTheDocument()
    expect(screen.getByText('Chinese Yuan')).toBeInTheDocument()
  })

  it('navigates to new locale on language selection', () => {
    const onClose = vi.fn()
    render(<MobilePreferencesSheet isOpen={true} onClose={onClose} />)
    const ruOption = screen.getByText('Русский')
    fireEvent.click(ruOption.closest('button')!)
    expect(mockPush).toHaveBeenCalledWith('/ru/profile')
    expect(onClose).toHaveBeenCalled()
  })

  it('updates currency on currency selection', () => {
    const onClose = vi.fn()
    render(<MobilePreferencesSheet isOpen={true} onClose={onClose} initialTab="currency" />)
    const rubBtn = screen.getByText('Russian Ruble')
    fireEvent.click(rubBtn.closest('button')!)
    expect(mockSetCurrency).toHaveBeenCalledWith('RUB')
    expect(onClose).toHaveBeenCalled()
  })
})
