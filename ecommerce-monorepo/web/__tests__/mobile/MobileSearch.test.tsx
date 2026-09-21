import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileSearch } from '@/components/mobile/MobileSearch'

const mockPush = vi.fn()
const mockCloseSearch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({
    isMobile: true,
    isIOS: false,
    isAndroid: false,
    isSearchOpen: true,
    closeSearch: mockCloseSearch,
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

describe('MobileSearch (components/mobile/MobileSearch.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input and popular suggestion tags', () => {
    render(<MobileSearch isOpen={true} />)

    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()

    expect(screen.getByText('Popular Searches')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Electronics' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kitchenware' })).toBeInTheDocument()
  })

  it('updates query value when typing in search box', () => {
    render(<MobileSearch isOpen={true} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Drill Machine' } })

    expect(input).toHaveValue('Drill Machine')
  })

  it('submits search query on form submission', () => {
    render(<MobileSearch isOpen={true} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'CNC Lathe' } })

    const submitBtn = screen.getByRole('button', { name: /submit search/i })
    fireEvent.click(submitBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store?q=CNC%20Lathe')
  })

  it('clicking a popular tag executes search for that tag', () => {
    render(<MobileSearch isOpen={true} />)

    const tagBtn = screen.getByRole('button', { name: 'Tools & Hardware' })
    fireEvent.click(tagBtn)

    expect(mockPush).toHaveBeenCalledWith('/en/store?q=Tools%20%26%20Hardware')
  })

  it('clears query when clear button is clicked', () => {
    render(<MobileSearch isOpen={true} initialQuery="Power Tools" />)

    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('Power Tools')

    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)

    expect(input).toHaveValue('')
  })
})
