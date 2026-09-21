import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileBrandStrip } from '@/components/mobile/home/MobileBrandStrip'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobileBrandStrip (components/mobile/home/MobileBrandStrip.tsx)', () => {
  it('renders verified factory partners strip and certificates', () => {
    render(<MobileBrandStrip />)

    expect(screen.getByText('Verified Factory Partners')).toBeInTheDocument()
    expect(screen.getByText('China Heavy Precision Co.')).toBeInTheDocument()
    expect(screen.getByText('ISO9001 / CE')).toBeInTheDocument()
    expect(screen.getByText('Apex Smart Tech Corp.')).toBeInTheDocument()
  })
})
