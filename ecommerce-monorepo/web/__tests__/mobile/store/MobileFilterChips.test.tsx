import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileFilterChips } from '@/components/mobile/store/MobileFilterChips'

describe('MobileFilterChips (components/mobile/store/MobileFilterChips.tsx)', () => {
  it('renders filters button, sort button, and active chips', () => {
    const handleOpenFilters = vi.fn()
    const handleOpenSort = vi.fn()
    const handleRemoveFilter = vi.fn()
    const handleClearAll = vi.fn()

    render(
      <MobileFilterChips
        onOpenFilters={handleOpenFilters}
        onOpenSort={handleOpenSort}
        activeFiltersCount={2}
        currentSortLabel="Price ↑"
        activeFilters={[
          { id: 'cat', label: 'Machinery' },
          { id: 'price', label: '$0 - $1000' },
        ]}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Price ↑')).toBeInTheDocument()
    expect(screen.getByText('Machinery')).toBeInTheDocument()
    expect(screen.getByText('$0 - $1000')).toBeInTheDocument()
    expect(screen.getByText('Clear All')).toBeInTheDocument()

    // Trigger filters opening
    fireEvent.click(screen.getByRole('button', { name: /open filters/i }))
    expect(handleOpenFilters).toHaveBeenCalledTimes(1)

    // Trigger sort opening
    fireEvent.click(screen.getByRole('button', { name: /open sort/i }))
    expect(handleOpenSort).toHaveBeenCalledTimes(1)

    // Trigger clear all
    fireEvent.click(screen.getByText('Clear All'))
    expect(handleClearAll).toHaveBeenCalledTimes(1)
  })
})
