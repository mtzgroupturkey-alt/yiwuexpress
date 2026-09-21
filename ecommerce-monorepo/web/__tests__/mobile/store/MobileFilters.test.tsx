import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileFilters, FilterValues } from '@/components/mobile/store/MobileFilters'
import { Category } from '@/app/[locale]/design-3/types'

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, drag, dragConstraints, dragElastic, onDragEnd, ...dom } = rest
    return React.createElement('div', { ...dom, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('MobileFilters (components/mobile/store/MobileFilters.tsx)', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Industrial Tools', slug: 'industrial-tools', itemCount: 40, icon: 'tools' },
    { id: 'cat-2', name: 'Smart Home', slug: 'smart-home', itemCount: 25, icon: 'home' },
  ]

  const initialFilters: FilterValues = {
    category: 'industrial-tools',
    minPrice: 50,
    maxPrice: 500,
    inStockOnly: true,
  }

  it('renders categories and inputs correctly', () => {
    render(
      <MobileFilters
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        currentFilters={initialFilters}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
      />
    )

    expect(screen.getByText('Filter Products')).toBeInTheDocument()
    expect(screen.getByText('Industrial Tools')).toBeInTheDocument()
    expect(screen.getByText('Smart Home')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })

  it('handles apply filters callback', () => {
    const handleApply = vi.fn()
    const handleClose = vi.fn()

    render(
      <MobileFilters
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories}
        currentFilters={initialFilters}
        onApplyFilters={handleApply}
        onResetFilters={vi.fn()}
      />
    )

    const applyBtn = screen.getByRole('button', { name: /apply filters/i })
    fireEvent.click(applyBtn)

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'industrial-tools',
        minPrice: 50,
        maxPrice: 500,
        inStockOnly: true,
      })
    )
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('handles reset filters callback', () => {
    const handleReset = vi.fn()
    const handleClose = vi.fn()

    render(
      <MobileFilters
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories}
        currentFilters={initialFilters}
        onApplyFilters={vi.fn()}
        onResetFilters={handleReset}
      />
    )

    const resetBtn = screen.getByRole('button', { name: /reset all/i })
    fireEvent.click(resetBtn)

    expect(handleReset).toHaveBeenCalledTimes(1)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
