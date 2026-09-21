import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileNewsletterCard } from '@/components/mobile/home/MobileNewsletterCard'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobileNewsletterCard (components/mobile/home/MobileNewsletterCard.tsx)', () => {
  it('renders email subscription input and submit button', () => {
    render(<MobileNewsletterCard />)

    expect(screen.getByText('Subscribe to Weekly Factory Drops')).toBeInTheDocument()
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /subscribe for free/i })
    expect(submitBtn).toBeInTheDocument()
    expect(submitBtn.className).toContain('min-h-[48px]')
  })

  it('shows success message upon submitting valid email', () => {
    render(<MobileNewsletterCard />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'buyer@globaltrade.com' } })

    const submitBtn = screen.getByRole('button', { name: /subscribe for free/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/thank you! you are now subscribed/i)).toBeInTheDocument()
  })
})
