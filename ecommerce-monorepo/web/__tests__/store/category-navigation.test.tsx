import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShopProductsPage } from '@/app/[locale]/design-3/components/ShopProductsPage'
import { MobileStorePage } from '@/components/mobile/store/MobileStorePage'
import { Product, Category } from '@/app/[locale]/design-3/types'

// Mock next/navigation
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()
let mockPathname = '/en/store'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: any) => key,
}))

// Mock storefront translation hook
vi.mock('@/hooks/useStorefrontTranslation', () => ({
  useStorefrontTranslation: () => ({
    tShop: (key: string, params?: any) => key,
    tPdp: (key: string) => key,
    tBadge: (key: string) => key,
    tFlash: (key: string) => key,
  }),
}))

// Mock currency hook
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

// Mock contexts
vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: { rfqModel: 'RFQ' },
    storeMode: 'RETAIL',
  }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({
    storeMode: 'RETAIL',
  }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    sessionMode: 'retail',
    isWholesaleSession: false,
  }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({
    items: [],
    addToQuote: vi.fn(),
    updateQuantity: vi.fn(),
    removeFromQuote: vi.fn(),
  }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({
    addItem: vi.fn(),
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, ...dom } = rest
    return React.createElement('div', { ...dom, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('Category Navigation Regression Tests', () => {
  const sampleCategories: Category[] = [
    {
      id: 'cat-kitchen',
      name: 'Kitchen & Dining',
      slug: 'kitchen-dining',
      icon: 'kitchen',
      itemCount: 45,
      children: [
        {
          id: 'sub-cookware',
          name: 'Cookware',
          slug: 'cookware',
          icon: 'cookware',
          itemCount: 20,
          children: [],
        },
      ],
    },
    {
      id: 'cat-furniture',
      name: 'Living Room Furniture',
      slug: 'living-room-furniture',
      icon: 'sofa',
      itemCount: 30,
      children: [],
    },
  ]

  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Chef Knife',
      price: 49.99,
      brand: 'KitchenPro',
      rating: 4.8,
      reviewsCount: 35,
      image: '/knife.jpg',
      categoryId: 'cat-kitchen',
      categorySlug: 'kitchen-dining',
      category: 'Kitchen & Dining',
      inStock: true,
    },
    {
      id: 'p2',
      name: 'Dining Table',
      price: 299.99,
      brand: 'HomeCraft',
      rating: 4.6,
      reviewsCount: 12,
      image: '/table.jpg',
      categoryId: 'cat-kitchen',
      categorySlug: 'kitchen-dining',
      category: 'Kitchen & Dining',
      inStock: true,
    },
  ]

  const defaultShopProps = {
    products: sampleProducts,
    categories: sampleCategories,
    onAddToCart: vi.fn(),
    onUpdateQuantity: vi.fn(),
    cartQuantities: {},
    favoriteIds: new Set<string>(),
    onToggleFavorite: vi.fn(),
    onSelectProduct: vi.fn(),
    onBackToHome: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockPathname = '/en/store'
  })

  it('fires router.push exactly once when clicking a category', () => {
    render(<ShopProductsPage {...defaultShopProps} />)

    const kitchenButton = screen.getByText('Kitchen & Dining')
    fireEvent.click(kitchenButton)

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('category=kitchen-dining')
    )
  })

  it('uses the canonical slug in the URL rather than raw name', () => {
    render(<ShopProductsPage {...defaultShopProps} />)

    const furnitureButton = screen.getByText('Living Room Furniture')
    fireEvent.click(furnitureButton)

    expect(mockPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockPush.mock.calls[0][0]
    expect(pushedUrl).toContain('category=living-room-furniture')
    expect(pushedUrl).not.toContain('Living%20Room%20Furniture')
    expect(pushedUrl).not.toContain('Living+Room+Furniture')
  })

  it('does not fire router.push twice in rapid succession or from sync effects', async () => {
    render(<ShopProductsPage {...defaultShopProps} />)

    const kitchenButton = screen.getByText('Kitchen & Dining')
    fireEvent.click(kitchenButton)

    // Wait 200ms to verify no secondary useEffect fires a second router.push
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('preserves category param when changing page via onPageChange', () => {
    mockSearchParams = new URLSearchParams('category=kitchen-dining')

    const mockOnPageChange = vi.fn()

    render(
      <ShopProductsPage
        {...defaultShopProps}
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    // Find and click Page 2 button
    const page2Button = screen.getByText('2')
    fireEvent.click(page2Button)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('mobile category selection uses single push with canonical slug', () => {
    render(
      <MobileStorePage
        products={sampleProducts}
        categories={sampleCategories}
      />
    )

    // Open mobile filter sheet
    const filterBtn = screen.getByText('Filters')
    fireEvent.click(filterBtn)

    // Find and click Kitchen & Dining category option in sheet
    const catPill = screen.getByText('Kitchen & Dining')
    fireEvent.click(catPill)

    // Click Apply Filters
    const applyBtn = screen.getByText('Apply Filters')
    fireEvent.click(applyBtn)

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('category=kitchen-dining')
    )
  })
})
