import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDisplayMode, getClientDisplayMode } from '@/hooks/useDisplayMode'

describe('useDisplayMode Hook', () => {
  const originalMatchMedia = window.matchMedia
  const originalNavigator = window.navigator

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  it('detects browser mode by default when no standalone indicators exist', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useDisplayMode())

    expect(result.current.mode).toBe('browser')
    expect(result.current.isBrowser).toBe(true)
    expect(result.current.isStandalone).toBe(false)
    expect(result.current.isMinimalUI).toBe(false)
  })

  it('detects standalone mode via matchMedia (display-mode: standalone)', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useDisplayMode())

    expect(result.current.mode).toBe('standalone')
    expect(result.current.isStandalone).toBe(true)
    expect(result.current.isBrowser).toBe(false)
  })

  it('detects standalone mode via iOS navigator.standalone === true', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, standalone: true },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useDisplayMode())

    expect(result.current.mode).toBe('standalone')
    expect(result.current.isStandalone).toBe(true)
  })

  it('detects minimal-ui mode via matchMedia (display-mode: minimal-ui)', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: minimal-ui)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useDisplayMode())

    expect(result.current.mode).toBe('minimal-ui')
    expect(result.current.isMinimalUI).toBe(true)
    expect(result.current.isStandalone).toBe(false)
  })

  it('dispatches pwa_analytics event when entering standalone mode', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    renderHook(() => useDisplayMode())

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pwa_analytics',
        detail: expect.objectContaining({
          event: 'pwa_standalone_entered',
        }),
      })
    )
  })

  it('updates display mode dynamically on media query change event', () => {
    let changeHandler: any = null

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === 'change' && query === '(display-mode: standalone)') {
          changeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useDisplayMode())
    expect(result.current.isStandalone).toBe(false)

    // Simulate transition to standalone PWA
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    act(() => {
      if (changeHandler) changeHandler()
    })

    expect(result.current.isStandalone).toBe(true)
    expect(result.current.mode).toBe('standalone')
  })
})
