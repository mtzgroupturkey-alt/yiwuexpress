import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from '@/components/mobile/Chip'

describe('Chip (components/mobile/Chip.tsx)', () => {
  it('renders chip label and handles click', () => {
    const handleClick = vi.fn()
    render(<Chip label="Electronics" onClick={handleClick} />)

    const chip = screen.getByText('Electronics')
    expect(chip).toBeInTheDocument()

    fireEvent.click(chip)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders remove button and handles remove click', () => {
    const handleRemove = vi.fn()
    render(<Chip label="Active Filter" selected={true} onRemove={handleRemove} />)

    const removeBtn = screen.getByRole('button', { name: /remove active filter/i })
    expect(removeBtn).toBeInTheDocument()

    fireEvent.click(removeBtn)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })
})
