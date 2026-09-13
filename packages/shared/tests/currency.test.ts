import { describe, it, expect } from 'vitest'
import { formatCurrency, convertCurrency, calculateSubtotal } from '../src/utils/currency'

describe('Shared Currency Utilities', () => {
  it('formats currency with default USD', () => {
    const formatted = formatCurrency(1234.56, 'USD')
    expect(formatted).toContain('1,234.56')
    expect(formatted).toContain('$')
  })

  it('formats CNY currency with Chinese Yuan symbol', () => {
    const formatted = formatCurrency(500, 'CNY')
    expect(formatted).toContain('500.00')
    expect(formatted).toContain('¥')
  })

  it('converts USD to CNY accurately using base rates', () => {
    const usdAmount = 100
    const cnyAmount = convertCurrency(usdAmount, 'USD', 'CNY')
    expect(cnyAmount).toBe(724)
  })

  it('converts CNY to USD accurately', () => {
    const cnyAmount = 724
    const usdAmount = convertCurrency(cnyAmount, 'CNY', 'USD')
    expect(usdAmount).toBe(100)
  })

  it('calculates aggregate item subtotals accurately', () => {
    const items = [
      { price: 10.5, quantity: 2 },
      { price: 5.0, quantity: 4 },
      { price: 100.0, quantity: 1 },
    ]
    const subtotal = calculateSubtotal(items)
    expect(subtotal).toBe(141.0)
  })
})
