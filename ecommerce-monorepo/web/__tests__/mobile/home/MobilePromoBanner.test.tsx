import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobilePromoBanner } from '@/components/mobile/home/MobilePromoBanner'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobilePromoBanner (components/mobile/home/MobilePromoBanner.tsx)', () => {
  it('renders promotional headline and action button', () => {
    render(<MobilePromoBanner />)

    expect(screen.getByText('B2B Sourcing Concierge')).toBeInTheDocument()
    expect(screen.getByText('Submit Your RFQ · Direct Factory Quotes in 24h')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /request custom quote/i })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('min-h-[48px]')
  })

  it('navigates to /wholesale on button click', () => {
    render(<MobilePromoBanner />)

    const btn = screen.getByRole('button', { name: /request custom quote/i })
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith('/en/wholesale')
  })
})
