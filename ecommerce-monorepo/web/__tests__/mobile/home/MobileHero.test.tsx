import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MobileHero, HeroSlide } from '@/components/mobile/home/MobileHero'

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

describe('MobileHero (components/mobile/home/MobileHero.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders default hero slides with 44px CTA button and indicators', () => {
    render(<MobileHero />)

    expect(
      screen.getByText('Sourcing Direct From China')
    ).toBeInTheDocument()

    const ctaBtns = screen.getAllByRole('button', { name: /explore catalog/i })
    expect(ctaBtns[0]).toBeInTheDocument()
    expect(ctaBtns[0].className).toContain('min-h-[44px]')

    expect(screen.getByLabelText('Slide 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 3')).toBeInTheDocument()
  })

  it('renders N custom slides when provided', () => {
    const customSlides: HeroSlide[] = [
      {
        id: 's1',
        title: 'Exclusive Factory Deals',
        subtitle: 'Save up to 40% on bulk industrial machinery',
        ctaText: 'Shop Machinery',
        href: '/store?category=machinery',
      },
      {
        id: 's2',
        title: 'New Hardware Arrival',
        subtitle: 'Precision tools and components',
        ctaText: 'Browse Tools',
        href: '/store?category=tools',
      },
    ]

    render(<MobileHero slides={customSlides} />)

    expect(screen.getByText('Exclusive Factory Deals')).toBeInTheDocument()
    expect(screen.getByText('New Hardware Arrival')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide 2')).toBeInTheDocument()
    expect(screen.queryByLabelText('Slide 3')).not.toBeInTheDocument()
  })

  it('returns null and does not render section when slides array is empty', () => {
    const { container } = render(<MobileHero slides={[]} />)

    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('mobile-hero')).not.toBeInTheDocument()
  })

  it('navigates to slide href on CTA click', () => {
    render(<MobileHero />)

    const ctaBtn = screen.getAllByRole('button', { name: /explore catalog/i })[0]
    fireEvent.click(ctaBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store')
  })

  it('calls onShopNow callback if provided instead of default router navigation', () => {
    const handleShopNow = vi.fn()
    render(<MobileHero onShopNow={handleShopNow} />)

    const ctaBtn = screen.getAllByRole('button', { name: /explore catalog/i })[0]
    fireEvent.click(ctaBtn)

    expect(handleShopNow).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('changes active slide when dot indicator is clicked', () => {
    render(<MobileHero />)

    const dot2 = screen.getByLabelText('Slide 2')
    fireEvent.click(dot2)

    // Dot 2 now has active pill class (w-6)
    const dotSpan = dot2.querySelector('span')
    expect(dotSpan).toHaveClass('w-6')
  })

  it('auto-rotates slides on timer interval', () => {
    render(<MobileHero />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    const dot2 = screen.getByLabelText('Slide 2')
    const dotSpan = dot2.querySelector('span')
    expect(dotSpan).toHaveClass('w-6')
  })

  it('pauses auto-rotation when touched or hovered', () => {
    render(<MobileHero />)

    const heroSection = screen.getByTestId('mobile-hero')
    fireEvent.touchStart(heroSection)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Still on slide 1 because it's paused
    const dot1 = screen.getByLabelText('Slide 1')
    const dotSpan = dot1.querySelector('span')
    expect(dotSpan).toHaveClass('w-6')
  })
})
