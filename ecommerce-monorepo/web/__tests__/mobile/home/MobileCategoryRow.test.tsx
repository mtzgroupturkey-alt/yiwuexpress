import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Categories header and See all link', () => {
    render(<MobileCategoryRow />)

    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /see all/i })).toBeInTheDocument()
  })

  it('renders default category cards when no categories prop passed', () => {
    render(<MobileCategoryRow />)

    expect(screen.getByText('Machinery')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Kitchenware')).toBeInTheDocument()
  })

  it('renders custom category list with 88px circle dimensions', () => {
    const customCats = [
      { id: 'cat-1', name: 'Smartphones', slug: 'smartphones' },
      { id: 'cat-2', name: 'Laptops', slug: 'laptops' },
      { id: 'cat-3', name: 'Audio Gear', slug: 'audio' },
    ]

    const { container } = render(<MobileCategoryRow categories={customCats as any} />)

    expect(screen.getByText('Smartphones')).toBeInTheDocument()
    expect(screen.getByText('Laptops')).toBeInTheDocument()
    expect(screen.getByText('Audio Gear')).toBeInTheDocument()

    // Verify 88x88px circle styling class
    const circle = container.querySelector('.rounded-full')
    expect(circle).toHaveClass('w-[88px]')
    expect(circle).toHaveClass('h-[88px]')
  })

  it('handles empty categories array gracefully with friendly message', () => {
    render(<MobileCategoryRow categories={[]} />)

    expect(screen.getByTestId('category-empty-state')).toBeInTheDocument()
    expect(screen.getByText(/no categories available right now/i)).toBeInTheDocument()
  })

  it('navigates to store category on click', () => {
    render(<MobileCategoryRow />)

    const catBtn = screen.getByRole('button', { name: /machinery/i })
    fireEvent.click(catBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store?category=machinery')
  })

  it('triggers onSelectCategory callback when passed', () => {
    const handleSelect = vi.fn()
    const customCats = [{ id: 'cat-e', name: 'Electronics', slug: 'electronics' }]
    render(<MobileCategoryRow categories={customCats as any} onSelectCategory={handleSelect} />)

    const catBtn = screen.getByRole('button', { name: /electronics/i })
    fireEvent.click(catBtn)

    expect(handleSelect).toHaveBeenCalledWith(customCats[0])
  })
})
