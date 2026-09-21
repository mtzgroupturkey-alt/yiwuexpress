import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileSort } from '@/components/mobile/store/MobileSort'

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

describe('MobileSort (components/mobile/store/MobileSort.tsx)', () => {
  it('renders sort options and selects an option', () => {
    const handleSelectSort = vi.fn()
    const handleClose = vi.fn()

    render(
      <MobileSort
        isOpen={true}
        onClose={handleClose}
        currentSort="popular"
        onSelectSort={handleSelectSort}
      />
    )

    expect(screen.getByText('Sort Products')).toBeInTheDocument()
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument()
    expect(screen.getByText('Price: High to Low')).toBeInTheDocument()

    // Click Price: Low to High
    fireEvent.click(screen.getByText('Price: Low to High'))
    expect(handleSelectSort).toHaveBeenCalledWith('price-asc')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
