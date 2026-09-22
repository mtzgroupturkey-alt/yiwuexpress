import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InstallPrompt } from '@/components/mobile/InstallPrompt'

vi.mock('next/navigation', () => ({ usePathname: () => '/en' }))
vi.mock('next-intl', () => ({ useLocale: () => 'en' }))
vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' } }),
}))
vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({
    isStandalone: false,
    isMobile: true,
    isBrowser: true,
  }),
}))

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('increments visit count on mount', () => {
    render(<InstallPrompt />)
    expect(localStorage.getItem('gt_pwa_visits')).toBe('1')
  })

  it('renders install prompt on second visit in development or with prompt', () => {
    localStorage.setItem('gt_pwa_visits', '1')
    render(<InstallPrompt />)
    expect(screen.getByTestId('pwa-install-prompt')).toBeInTheDocument()
    expect(screen.getByText('Global Trade App')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Install$/i })).toBeInTheDocument()
  })

  it('snoozes for 7 days when dismissed', () => {
    localStorage.setItem('gt_pwa_visits', '1')
    render(<InstallPrompt />)
    const dismissBtn = screen.getByLabelText(/Dismiss installation prompt/i)
    fireEvent.click(dismissBtn)

    expect(screen.queryByTestId('pwa-install-prompt')).not.toBeInTheDocument()
    const snoozedUntil = localStorage.getItem('gt_pwa_install_snoozed_until')
    expect(snoozedUntil).toBeTruthy()
    expect(parseInt(snoozedUntil!, 10)).toBeGreaterThan(Date.now())
  })
})
