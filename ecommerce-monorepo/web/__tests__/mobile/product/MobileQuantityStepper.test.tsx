import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileQuantityStepper } from '@/components/mobile/product/MobileQuantityStepper'

describe('MobileQuantityStepper (components/mobile/product/MobileQuantityStepper.tsx)', () => {
  it('increments and decrements within bounds', () => {
    const handleChange = vi.fn()
    render(
      <MobileQuantityStepper
        quantity={5}
        onChange={handleChange}
        min={1}
        max={10}
        step={1}
      />
    )

    const incBtn = screen.getByRole('button', { name: /increase quantity/i })
    const decBtn = screen.getByRole('button', { name: /decrease quantity/i })
    const input = screen.getByLabelText(/product quantity/i)

    expect(input).toHaveValue(5)

    fireEvent.click(incBtn)
    expect(handleChange).toHaveBeenCalledWith(6)

    fireEvent.click(decBtn)
    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('disables decrement at min value', () => {
    const handleChange = vi.fn()
    render(
      <MobileQuantityStepper
        quantity={2}
        onChange={handleChange}
        min={2}
        max={10}
      />
    )

    const decBtn = screen.getByRole('button', { name: /decrease quantity/i })
    expect(decBtn).toBeDisabled()
  })
})
