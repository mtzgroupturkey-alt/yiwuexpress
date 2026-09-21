import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from '@/components/mobile/BottomSheet'

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

describe('BottomSheet (components/mobile/BottomSheet.tsx)', () => {
  it('renders title, subtitle, drag handle, and children when isOpen is true', () => {
    const handleClose = vi.fn()
    render(
      <BottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Sheet Title"
        subtitle="Sheet subtitle details"
      >
        <div data-testid="sheet-content">Inner Sheet Content</div>
      </BottomSheet>
    )

    expect(screen.getByText('Test Sheet Title')).toBeInTheDocument()
    expect(screen.getByText('Sheet subtitle details')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument()
  })

  it('does not render content when isOpen is false', () => {
    const handleClose = vi.fn()
    render(
      <BottomSheet
        isOpen={false}
        onClose={handleClose}
        title="Hidden Sheet"
      >
        <div data-testid="sheet-content">Inner Content</div>
      </BottomSheet>
    )

    expect(screen.queryByText('Hidden Sheet')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <BottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Closable Sheet"
      >
        <div>Content</div>
      </BottomSheet>
    )

    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <BottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Esc Sheet"
      >
        <div>Content</div>
      </BottomSheet>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
