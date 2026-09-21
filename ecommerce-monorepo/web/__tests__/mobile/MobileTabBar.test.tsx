import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileTabBar } from '@/components/mobile/MobileTabBar'

describe('MobileTabBar (components/mobile/MobileTabBar.tsx)', () => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specifications', count: 12 },
    { id: 'reviews', label: 'Reviews', count: 5 },
  ]

  it('renders tabs with role tab and selection state', () => {
    render(
      <MobileTabBar
        tabs={tabs}
        activeTab="overview"
        onTabChange={vi.fn()}
      />
    )

    const overviewTab = screen.getByRole('tab', { name: /overview/i })
    const specsTab = screen.getByRole('tab', { name: /specifications/i })

    expect(overviewTab).toHaveAttribute('aria-selected', 'true')
    expect(specsTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('fires onTabChange when a tab is clicked', () => {
    const handleTabChange = vi.fn()
    render(
      <MobileTabBar
        tabs={tabs}
        activeTab="overview"
        onTabChange={handleTabChange}
      />
    )

    const specsTab = screen.getByRole('tab', { name: /specifications/i })
    fireEvent.click(specsTab)

    expect(handleTabChange).toHaveBeenCalledWith('specs')
  })
})
