import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileHero } from '@/components/mobile/home/MobileHero'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: { companyName: 'Global Trade' },
  }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, ...dom } = rest
    return React.createElement('div', { ...dom, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('MobileHero (components/mobile/home/MobileHero.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hero slide headline and CTA button with 48px touch target', () => {
    render(<MobileHero />)

    expect(
      screen.getByText('Sourcing Direct From China')
    ).toBeInTheDocument()

    const ctaBtn = screen.getByRole('button', { name: /explore catalog/i })
    expect(ctaBtn).toBeInTheDocument()
    expect(ctaBtn.className).toContain('min-h-[48px]')
  })

  it('navigates to catalog on CTA click', () => {
    render(<MobileHero />)

    const ctaBtn = screen.getByRole('button', { name: /explore catalog/i })
    fireEvent.click(ctaBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store')
  })

  it('calls onShopNow callback if provided', () => {
    const handleShopNow = vi.fn()
    render(<MobileHero onShopNow={handleShopNow} />)

    const ctaBtn = screen.getByRole('button', { name: /explore catalog/i })
    fireEvent.click(ctaBtn)

    expect(handleShopNow).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders carousel indicator dots', () => {
    render(<MobileHero />)

    expect(screen.getByLabelText('Slide 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 3')).toBeInTheDocument()
  })
})
