import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileProfileView, UserProfileData } from '@/components/mobile/account/MobileProfileView'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), usePathname: () => '/en/profile' }))
vi.mock('next-intl', () => ({ useLocale: () => 'en' }))
vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({ isMobile: true, isSearchOpen: false, toggleDrawer: vi.fn(), toggleSearch: vi.fn() }),
}))
vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' } }),
}))
vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0, totalItems: 0, items: [] }),
}))
vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 0 }),
}))
vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))
vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}))
vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}))
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ currency: 'USD', setCurrency: vi.fn(), currencies: [{ code: 'USD', symbol: '$', name: 'US Dollar' }] }),
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

const mockUser: UserProfileData = {
  id: 'usr-1',
  name: 'John Doe',
  email: 'john@example.com',
  companyName: 'Apex Import Group',
  businessType: 'IMPORTER',
  phone: '+1 555 123 4567',
  taxId: 'US-9918239',
  country: 'United States',
}

describe('MobileProfileView', () => {
  it('renders user details in view mode', () => {
    render(<MobileProfileView user={mockUser} />)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('Apex Import Group').length).toBeGreaterThan(0)
    expect(screen.getByText('Importer')).toBeInTheDocument()
  })

  it('renders quick navigation buttons for orders, quotes, wishlist', () => {
    render(<MobileProfileView user={mockUser} />)
    expect(screen.getByRole('button', { name: /My Orders/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /My RFQs/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Wishlist/i })).toBeInTheDocument()
  })

  it('switches to editable mode when Edit button is clicked', () => {
    render(<MobileProfileView user={mockUser} />)
    const editBtn = screen.getByRole('button', { name: /Edit/i })
    fireEvent.click(editBtn)
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
  })

  it('calls onSave when edit form is submitted', async () => {
    const onSave = vi.fn()
    render(<MobileProfileView user={mockUser} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Johnny Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Johnny Doe',
      })
    )
  })

  it('triggers logout when sign out button clicked', () => {
    const onLogout = vi.fn()
    render(<MobileProfileView user={mockUser} onLogout={onLogout} />)
    const logoutBtn = screen.getByRole('button', { name: /Sign Out/i })
    fireEvent.click(logoutBtn)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('handles loading state with skeletons', () => {
    render(<MobileProfileView user={null} isLoading={true} />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
