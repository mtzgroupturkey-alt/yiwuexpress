import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BackButton } from '@/components/mobile/BackButton'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}))

describe('BackButton (components/mobile/BackButton.tsx)', () => {
  it('renders button with accessible label and 48px target min-dimensions', () => {
    render(<BackButton label="Back to Store" />)

    const btn = screen.getByRole('button', { name: /back to store/i })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('min-w-[48px]')
    expect(btn.className).toContain('min-h-[48px]')
  })

  it('triggers custom onClick if provided', () => {
    const handleClick = vi.fn()
    render(<BackButton onClick={handleClick} />)

    const btn = screen.getByRole('button', { name: /go back/i })
    fireEvent.click(btn)

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(mockBack).not.toHaveBeenCalled()
  })
})
