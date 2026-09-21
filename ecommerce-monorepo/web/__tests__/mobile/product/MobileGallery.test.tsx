import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileGallery } from '@/components/mobile/product/MobileGallery'

describe('MobileGallery (components/mobile/product/MobileGallery.tsx)', () => {
  const images = ['/img1.jpg', '/img2.jpg', '/img3.jpg']

  it('renders gallery with in-stock badge and next/prev image navigators', () => {
    render(
      <MobileGallery
        images={images}
        mainImage="/img1.jpg"
        productName="Industrial Pump"
        inStock={true}
        discountBadge="-20%"
      />
    )

    expect(screen.getByTestId('mobile-gallery')).toBeInTheDocument()
    expect(screen.getByText('-20%')).toBeInTheDocument()
    expect(screen.getByText(/in stock/i)).toBeInTheDocument()

    // Check next button
    const nextBtn = screen.getByRole('button', { name: /next image/i })
    expect(nextBtn).toBeInTheDocument()

    fireEvent.click(nextBtn)
    // Now active index should be 1
    const secondDot = screen.getByRole('button', { name: /go to slide 2/i })
    expect(secondDot).toBeInTheDocument()
  })

  it('toggles fullscreen lightbox when maximize button is clicked', () => {
    render(
      <MobileGallery
        images={images}
        mainImage="/img1.jpg"
        productName="Industrial Pump"
      />
    )

    const maxBtn = screen.getByRole('button', { name: /view fullscreen image/i })
    fireEvent.click(maxBtn)

    const closeBtn = screen.getByRole('button', { name: /close fullscreen view/i })
    expect(closeBtn).toBeInTheDocument()

    fireEvent.click(closeBtn)
    expect(screen.queryByRole('button', { name: /close fullscreen view/i })).not.toBeInTheDocument()
  })
})
