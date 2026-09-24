import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileSectionHeader } from '@/components/mobile/home/MobileSectionHeader'
import { MobileProductRow } from '@/components/mobile/home/MobileProductRow'
import { MobileNewArrivals } from '@/components/mobile/home/MobileNewArrivals'
import { MobileTrendingProducts } from '@/components/mobile/home/MobileTrendingProducts'
import { MobileRecommendedForYou } from '@/components/mobile/home/MobileRecommendedForYou'
import { MobileDealsOfTheDay } from '@/components/mobile/home/MobileDealsOfTheDay'
import { MobileRecentlyViewed } from '@/components/mobile/home/MobileRecentlyViewed'
import { MobileCategorySections } from '@/components/mobile/home/MobileCategorySections'
import { Product } from '@/app/[locale]/design-3/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    isWholesaleSession: false,
  }),
}))

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Smart Robotic Vacuum Cleaner',
    price: 199.99,
    oldPrice: 249.99,
    category: 'Electronics',
    categorySlug: 'electronics',
    brand: 'RoboClean',
    rating: 4.8,
    reviewsCount: 35,
    image: '/images/product-placeholder.webp',
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Cast Iron Dutch Oven',
    price: 59.99,
    category: 'Cookware',
    categorySlug: 'cookware',
    brand: 'MasterChef',
    rating: 4.9,
    reviewsCount: 50,
    image: '/images/product-placeholder.webp',
    inStock: true,
  },
]

describe('PWA Home New Sections', () => {
  describe('MobileSectionHeader', () => {
    it('renders title, subtitle, badge, and handles view all click', () => {
      const onViewAll = vi.fn()
      render(
        <MobileSectionHeader
          title="Featured Items"
          subtitle="Top factory direct picks"
          badge="HOT"
          onViewAll={onViewAll}
        />
      )

      expect(screen.getByText('Featured Items')).toBeInTheDocument()
      expect(screen.getByText('Top factory direct picks')).toBeInTheDocument()
      expect(screen.getByText('HOT')).toBeInTheDocument()

      const button = screen.getByRole('button', { name: /view all/i })
      expect(button).toBeInTheDocument()
      fireEvent.click(button)
      expect(onViewAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('MobileProductRow', () => {
    it('renders products with horizontal scroll container and handles actions', () => {
      const onAddToCart = vi.fn()
      const onSelectProduct = vi.fn()

      render(
        <MobileProductRow
          products={mockProducts}
          onAddToCart={onAddToCart}
          onSelectProduct={onSelectProduct}
        />
      )

      expect(screen.getByTestId('mobile-product-row')).toBeInTheDocument()
      expect(screen.getByText('Smart Robotic Vacuum Cleaner')).toBeInTheDocument()
      expect(screen.getByText('Cast Iron Dutch Oven')).toBeInTheDocument()

      const card = screen.getByTestId('mobile-product-card-prod-1')
      fireEvent.click(card)
      expect(onSelectProduct).toHaveBeenCalledWith(mockProducts[0])

      const addButtons = screen.getAllByRole('button', { name: /add to cart/i })
      fireEvent.click(addButtons[0])
      expect(onAddToCart).toHaveBeenCalledWith(mockProducts[0], 1)
    })

    it('renders loading skeleton when isLoading is true', () => {
      render(<MobileProductRow isLoading={true} />)
      expect(screen.getByTestId('mobile-product-row-loading')).toBeInTheDocument()
    })

    it('returns null when products array is empty', () => {
      const { container } = render(<MobileProductRow products={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('MobileNewArrivals', () => {
    it('renders section with title and products', () => {
      render(<MobileNewArrivals products={mockProducts} />)
      expect(screen.getByTestId('mobile-new-arrivals')).toBeInTheDocument()
      expect(screen.getByText('New Arrivals')).toBeInTheDocument()
      expect(screen.getByText('Smart Robotic Vacuum Cleaner')).toBeInTheDocument()
    })
  })

  describe('MobileTrendingProducts', () => {
    it('renders section with title and products', () => {
      render(<MobileTrendingProducts products={mockProducts} />)
      expect(screen.getByTestId('mobile-trending-products')).toBeInTheDocument()
      expect(screen.getByText('Trending Now')).toBeInTheDocument()
      expect(screen.getByText('Cast Iron Dutch Oven')).toBeInTheDocument()
    })
  })

  describe('MobileRecommendedForYou', () => {
    it('renders section with title and products', () => {
      render(<MobileRecommendedForYou products={mockProducts} />)
      expect(screen.getByTestId('mobile-recommended-for-you')).toBeInTheDocument()
      expect(screen.getByText('Recommended For You')).toBeInTheDocument()
    })
  })

  describe('MobileDealsOfTheDay', () => {
    it('renders section with title and products', () => {
      render(<MobileDealsOfTheDay products={mockProducts} />)
      expect(screen.getByTestId('mobile-deals-of-the-day')).toBeInTheDocument()
      expect(screen.getByText('Deals of the Day')).toBeInTheDocument()
    })
  })

  describe('MobileRecentlyViewed', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('returns null when no recently viewed products in localStorage and no initialProducts', () => {
      const { container } = render(<MobileRecentlyViewed />)
      expect(container.firstChild).toBeNull()
    })

    it('renders when products are provided directly', () => {
      render(<MobileRecentlyViewed products={mockProducts} />)
      expect(screen.getByTestId('mobile-recently-viewed')).toBeInTheDocument()
      expect(screen.getByText('Recently Viewed')).toBeInTheDocument()
    })
  })

  describe('MobileCategorySections', () => {
    it('renders multiple category sections partitioned from allProducts', () => {
      const categories = [
        { id: 'cat-1', name: 'Electronics', slug: 'electronics', itemCount: 10, icon: '📱' },
        { id: 'cat-2', name: 'Cookware', slug: 'cookware', itemCount: 15, icon: '🍳' },
      ]

      render(
        <MobileCategorySections
          categories={categories as any}
          allProducts={mockProducts}
        />
      )

      expect(screen.getByTestId('mobile-category-sections')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Cookware')).toBeInTheDocument()
    })
  })
})
