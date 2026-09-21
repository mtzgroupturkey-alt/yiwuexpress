import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/mobile/EmptyState'

describe('EmptyState (components/mobile/EmptyState.tsx)', () => {
  it('renders empty title and description', () => {
    render(
      <EmptyState
        title="No items found"
        description="Try searching for something else"
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Try searching for something else')).toBeInTheDocument()
  })

  it('renders action button and triggers callback when clicked', () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title="Empty Cart"
        actionLabel="Start Shopping"
        onAction={handleAction}
      />
    )

    const btn = screen.getByRole('button', { name: /start shopping/i })
    expect(btn).toBeInTheDocument()

    fireEvent.click(btn)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})
