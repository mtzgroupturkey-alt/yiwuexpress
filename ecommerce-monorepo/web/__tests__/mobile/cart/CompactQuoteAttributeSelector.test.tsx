import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CompactQuoteAttributeSelector } from '@/components/cart/CompactQuoteAttributeSelector'

describe('CompactQuoteAttributeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch for product details
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/products/prod-100')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: 'prod-100',
                name: 'Precision Milling Tool',
                variants: [
                  {
                    id: 'var-silver',
                    sku: 'PMT-SILVER',
                    attributes: { Color: 'Silver', Size: 'Standard' },
                    images: ['/silver.jpg'],
                  },
                  {
                    id: 'var-black',
                    sku: 'PMT-BLACK',
                    attributes: { Color: 'Black', Size: 'Standard' },
                    images: ['/black.jpg'],
                  },
                ],
              },
            }),
        })
      }
      return Promise.resolve({ ok: false })
    })
  })

  it('renders existing selected options in compact format', () => {
    const handleUpdate = vi.fn()
    render(
      <CompactQuoteAttributeSelector
        productId="prod-test"
        productName="Test Machine"
        selectedOptions={{ Color: 'Silver', Voltage: '220V' }}
        onUpdateOptions={handleUpdate}
      />
    )

    expect(screen.getByTestId('compact-quote-attribute-selector')).toBeInTheDocument()
    expect(screen.getByText('Color:')).toBeInTheDocument()
    expect(screen.getByText('Voltage:')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /select color/i })).toHaveValue('Silver')
    expect(screen.getByRole('combobox', { name: /select voltage/i })).toHaveValue('220V')
  })

  it('fetches product variants and updates options on select change', async () => {
    const handleUpdate = vi.fn()
    render(
      <CompactQuoteAttributeSelector
        productId="prod-100"
        productName="Precision Milling Tool"
        selectedOptions={{ Color: 'Silver', Size: 'Standard' }}
        onUpdateOptions={handleUpdate}
      />
    )

    await waitFor(() => {
      const colorSelect = screen.getByRole('combobox', { name: /select color/i })
      expect(colorSelect).toBeInTheDocument()
    })

    const colorSelect = screen.getByRole('combobox', { name: /select color/i })
    fireEvent.change(colorSelect, { target: { value: 'Black' } })

    expect(handleUpdate).toHaveBeenCalledWith(
      { Color: 'Black', Size: 'Standard' },
      expect.objectContaining({
        id: 'var-black',
        sku: 'PMT-BLACK',
        image: '/black.jpg',
      })
    )
  })

  it('allows adding a custom specification via + Spec button', () => {
    const handleUpdate = vi.fn()
    render(
      <CompactQuoteAttributeSelector
        productId="prod-test-2"
        productName="Industrial Pump"
        selectedOptions={{ Flow: '50L/min' }}
        onUpdateOptions={handleUpdate}
      />
    )

    const specBtn = screen.getByTitle('Add custom specification')
    fireEvent.click(specBtn)

    const keyInput = screen.getByPlaceholderText('Spec (e.g. Model)')
    const valInput = screen.getByPlaceholderText('Value (e.g. 220V)')
    fireEvent.change(keyInput, { target: { value: 'Material' } })
    fireEvent.change(valInput, { target: { value: 'Stainless Steel' } })

    const addBtn = screen.getByTitle('Add spec')
    fireEvent.click(addBtn)

    expect(handleUpdate).toHaveBeenCalledWith(
      { Flow: '50L/min', Material: 'Stainless Steel' },
      null
    )
  })
})
