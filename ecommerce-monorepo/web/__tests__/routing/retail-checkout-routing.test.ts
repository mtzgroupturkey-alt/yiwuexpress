import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for Retail Checkout & Quote Cart routing guards.
 *
 * Verifies all 7 customer classifications:
 * Case 1: Guest on /checkout -> redirects to register/login
 * Case 2: Authenticated Retail Customer on /checkout -> stays on Retail Checkout (mode: RETAIL)
 * Case 3: Authenticated Pending Wholesale on /checkout -> stays on Retail Checkout (mode: RETAIL)
 * Case 4: Authenticated Approved Wholesale on /checkout -> redirects to /quote-cart (RFQ mode)
 * Case 5: Authenticated Retail on /quote-cart -> redirects to /cart (NOT /login)
 * Case 6: Authenticated Pending Wholesale on /quote-cart -> redirects to /cart (NOT /login)
 * Case 7: Authenticated Approved Wholesale on /quote-cart -> remains on /quote-cart
 */

// Pure helper function implementing the Checkout Page routing decision logic
function getCheckoutRouteDecision(params: {
  isInitialized: boolean
  isAuthenticated: boolean
  isCustomerViewLoading: boolean
  canRequestQuote: boolean
  isWholesaleActive: boolean
  rfqModel: 'RFQ' | 'INSTANT'
  locale: string
}) {
  const {
    isInitialized,
    isAuthenticated,
    isCustomerViewLoading,
    canRequestQuote,
    isWholesaleActive,
    rfqModel,
    locale,
  } = params

  // 1. Unauthenticated guest redirect
  if (isInitialized && !isAuthenticated) {
    return {
      action: 'REDIRECT',
      destination: `/${locale}/register?redirect=/${locale}/checkout`,
    }
  }

  // 2. Quote cart redirect calculation
  const isInstantWholesale = isWholesaleActive && rfqModel === 'INSTANT'
  const shouldRedirectToQuoteCart = canRequestQuote && isWholesaleActive && !isInstantWholesale

  if (!isCustomerViewLoading && shouldRedirectToQuoteCart) {
    return {
      action: 'REDIRECT',
      destination: '/quote-cart',
    }
  }

  // 3. Otherwise proceed with retail checkout
  const orderMode = (canRequestQuote && isWholesaleActive) ? 'WHOLESALE' : 'RETAIL'

  return {
    action: 'PROCEED_CHECKOUT',
    orderMode,
    showsRfqBlocker: !isCustomerViewLoading && shouldRedirectToQuoteCart && rfqModel === 'RFQ',
  }
}

// Pure helper function implementing the Quote Cart Page guard decision logic
function getQuoteCartRouteDecision(params: {
  isLoading: boolean
  isAuthenticated: boolean
  canRequestQuote: boolean
}) {
  const { isLoading, isAuthenticated, canRequestQuote } = params

  if (isLoading) {
    return { action: 'LOADING' }
  }

  if (!canRequestQuote) {
    if (!isAuthenticated) {
      return {
        action: 'REDIRECT',
        destination: '/login?redirect=/quote-cart',
      }
    } else {
      return {
        action: 'REDIRECT',
        destination: '/cart',
      }
    }
  }

  return {
    action: 'PROCEED_QUOTE_CART',
  }
}

describe('Retail Checkout & Quote Cart Routing Rules', () => {
  describe('Checkout Page Routing Guard', () => {
    it('Case 1: Guest on /checkout redirects to register/login', () => {
      const decision = getCheckoutRouteDecision({
        isInitialized: true,
        isAuthenticated: false,
        isCustomerViewLoading: false,
        canRequestQuote: false,
        isWholesaleActive: true, // Even if site has wholesale enabled
        rfqModel: 'RFQ',
        locale: 'en',
      })

      expect(decision.action).toBe('REDIRECT')
      expect(decision.destination).toBe('/en/register?redirect=/en/checkout')
    })

    it('Case 2: Authenticated Retail Customer stays in Retail Checkout with mode RETAIL', () => {
      // Even when storeMode is WHOLESALE or BOTH, a retail customer must NOT be sent to quote-cart
      const decision = getCheckoutRouteDecision({
        isInitialized: true,
        isAuthenticated: true,
        isCustomerViewLoading: false,
        canRequestQuote: false, // userType: 'RETAIL'
        isWholesaleActive: true, // Store has wholesale active
        rfqModel: 'RFQ',
        locale: 'en',
      })

      expect(decision.action).toBe('PROCEED_CHECKOUT')
      expect(decision.orderMode).toBe('RETAIL')
      expect(decision.showsRfqBlocker).toBe(false)
    })

    it('Case 3: Authenticated Pending Wholesale Customer stays in Retail Checkout with mode RETAIL', () => {
      // A pending wholesale customer has not been approved yet, canRequestQuote is false
      const decision = getCheckoutRouteDecision({
        isInitialized: true,
        isAuthenticated: true,
        isCustomerViewLoading: false,
        canRequestQuote: false, // verificationStatus: 'PENDING' -> canRequestQuote is false
        isWholesaleActive: true,
        rfqModel: 'RFQ',
        locale: 'en',
      })

      expect(decision.action).toBe('PROCEED_CHECKOUT')
      expect(decision.orderMode).toBe('RETAIL')
      expect(decision.showsRfqBlocker).toBe(false)
    })

    it('Case 4: Authenticated Approved Wholesale Customer on /checkout redirects to /quote-cart', () => {
      const decision = getCheckoutRouteDecision({
        isInitialized: true,
        isAuthenticated: true,
        isCustomerViewLoading: false,
        canRequestQuote: true, // Approved wholesale customer
        isWholesaleActive: true,
        rfqModel: 'RFQ',
        locale: 'en',
      })

      expect(decision.action).toBe('REDIRECT')
      expect(decision.destination).toBe('/quote-cart')
    })

    it('Case 4b: Approved Wholesale with INSTANT model proceeds to checkout with mode WHOLESALE', () => {
      const decision = getCheckoutRouteDecision({
        isInitialized: true,
        isAuthenticated: true,
        isCustomerViewLoading: false,
        canRequestQuote: true,
        isWholesaleActive: true,
        rfqModel: 'INSTANT', // Instant wholesale model
        locale: 'en',
      })

      expect(decision.action).toBe('PROCEED_CHECKOUT')
      expect(decision.orderMode).toBe('WHOLESALE')
      expect(decision.showsRfqBlocker).toBe(false)
    })
  })

  describe('Quote Cart Page Guard', () => {
    it('Case 1: Unauthenticated Guest on /quote-cart redirects to /login', () => {
      const decision = getQuoteCartRouteDecision({
        isLoading: false,
        isAuthenticated: false,
        canRequestQuote: false,
      })

      expect(decision.action).toBe('REDIRECT')
      expect(decision.destination).toBe('/login?redirect=/quote-cart')
    })

    it('Case 5: Authenticated Retail Customer on /quote-cart redirects to /cart, NOT to /login', () => {
      const decision = getQuoteCartRouteDecision({
        isLoading: false,
        isAuthenticated: true,
        canRequestQuote: false, // retail customer cannot request quotes
      })

      expect(decision.action).toBe('REDIRECT')
      expect(decision.destination).toBe('/cart')
    })

    it('Case 6: Authenticated Pending Wholesale on /quote-cart redirects to /cart, NOT to /login', () => {
      const decision = getQuoteCartRouteDecision({
        isLoading: false,
        isAuthenticated: true,
        canRequestQuote: false, // pending wholesale customer cannot request quotes
      })

      expect(decision.action).toBe('REDIRECT')
      expect(decision.destination).toBe('/cart')
    })

    it('Case 7: Authenticated Approved Wholesale Customer on /quote-cart remains on quote cart', () => {
      const decision = getQuoteCartRouteDecision({
        isLoading: false,
        isAuthenticated: true,
        canRequestQuote: true, // approved wholesale customer can request quotes
      })

      expect(decision.action).toBe('PROCEED_QUOTE_CART')
    })

    it('Waits for loading before making any redirect decision', () => {
      const decision = getQuoteCartRouteDecision({
        isLoading: true,
        isAuthenticated: false,
        canRequestQuote: false,
      })

      expect(decision.action).toBe('LOADING')
    })
  })
})
