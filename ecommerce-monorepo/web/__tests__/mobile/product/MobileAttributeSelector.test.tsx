import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileAttributeSelector } from '@/components/mobile/product/MobileAttributeSelector'

describe('MobileAttributeSelector (components/mobile/product/MobileAttributeSelector.tsx)', () => {
  it('renders variant-based dimensions and color swatches correctly', () => {
    const onSelectOption = vi.fn()
    const optionKeys = ['Color', 'Size']
    const optionValuesMap = {
      Color: ['Red', 'Blue'],
      Size: ['M', 'L', 'XL'],
    }
    const selectedOptions = {
      Color: 'Red',
      Size: 'M',
    }
    const variants = [
      { id: 'v1', attributes: { Color: 'Red', Size: 'M' } },
      { id: 'v2', attributes: { Color: 'Blue', Size: 'L' } },
    ]

    render(
      <MobileAttributeSelector
        optionKeys={optionKeys}
        optionValuesMap={optionValuesMap}
        selectedOptions={selectedOptions}
        onSelectOption={onSelectOption}
        variants={variants}
      />
    )

    expect(screen.getByTestId('mobile-attribute-selector')).toBeInTheDocument()
    expect(screen.getByText('Color:')).toBeInTheDocument()
    expect(screen.getByText('Size:')).toBeInTheDocument()

    // Find and click 'Blue' color swatch
    const blueSwatch = screen.getByRole('button', { name: /^blue$/i })
    expect(blueSwatch).toBeInTheDocument()
    fireEvent.click(blueSwatch)

    expect(onSelectOption).toHaveBeenCalledWith('Color', 'Blue')

    // Find and click 'L' size chip
    const lChip = screen.getByRole('button', { name: /^l$/i })
    expect(lChip).toBeInTheDocument()
    fireEvent.click(lChip)

    expect(onSelectOption).toHaveBeenCalledWith('Size', 'L')
  })

  it('renders configurable category attributes when variants array is empty', () => {
    const onSelectOption = vi.fn()
    const configurableAttributes = [
      {
        slug: 'material',
        name: 'Material Choice',
        type: 'SELECT',
        options: [
          { value: 'aluminum', label: 'Anodized Aluminum' },
          { value: 'carbon', label: 'Carbon Fiber' },
        ],
      },
      {
        slug: 'body_color',
        name: 'Body Finish',
        isColor: true,
        options: [
          { value: '#000000', label: 'Matte Black', hex: '#000000' },
          { value: '#ffffff', label: 'Pearl White', hex: '#ffffff' },
        ],
      },
    ]

    render(
      <MobileAttributeSelector
        configurableAttributes={configurableAttributes}
        selectedOptions={{ material: 'aluminum', body_color: '#000000' }}
        onSelectOption={onSelectOption}
      />
    )

    expect(screen.getByText('Material Choice:')).toBeInTheDocument()
    expect(screen.getByText('Body Finish:')).toBeInTheDocument()

    const carbonChip = screen.getByRole('button', { name: /carbon fiber/i })
    fireEvent.click(carbonChip)

    expect(onSelectOption).toHaveBeenCalledWith('material', 'carbon')

    const whiteSwatch = screen.getByRole('button', { name: /pearl white/i })
    fireEvent.click(whiteSwatch)

    expect(onSelectOption).toHaveBeenCalledWith('body_color', '#ffffff')
  })
})
