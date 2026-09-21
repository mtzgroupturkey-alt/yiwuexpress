import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCategoryRow } from '@/components/mobile/home/MobileCategoryRow'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobileCategoryRow (components/mobile/home/MobileCategoryRow.tsx)', () => {
  it('renders browse categories header and category items', () => {
    render(<MobileCategoryRow />)

    expect(screen.getByText('Browse Categories')).toBeInTheDocument()
    expect(screen.getByText('Machinery')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Kitchenware')).toBeInTheDocument()
  })

  it('navigates to store category on click', () => {
    render(<MobileCategoryRow />)

    const catBtn = screen.getByRole('button', { name: /machinery/i })
    fireEvent.click(catBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store?category=machinery')
  })

  it('triggers onSelectCategory callback when passed', () => {
    const handleSelect = vi.fn()
    render(<MobileCategoryRow onSelectCategory={handleSelect} />)

    const catBtn = screen.getByRole('button', { name: /electronics/i })
    fireEvent.click(catBtn)

    expect(handleSelect).toHaveBeenCalledWith('electronics')
  })
})
