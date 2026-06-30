import { prisma } from '@/lib/db'

export interface CurrencyRate {
  from: string
  to: string
  rate: number
  date: Date
}

export interface ConversionResult {
  amount: number
  from: string
  to: string
  converted: number
  rate: number
}

export class CurrencyService {
  /**
   * Get exchange rate between two currencies
   */
  async getRate(fromCode: string, toCode: string): Promise<number> {
    if (fromCode === toCode) return 1

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: fromCode },
    })
    const toCurrency = await prisma.currency.findUnique({
      where: { code: toCode },
    })

    if (!fromCurrency || !toCurrency) {
      throw new Error(`Currency not found: ${fromCode} or ${toCode}`)
    }

    if (!fromCurrency.isActive || !toCurrency.isActive) {
      throw new Error(`Currency not active: ${fromCode} or ${toCode}`)
    }

    const baseCurrency = await prisma.currency.findFirst({
      where: { isBase: true },
    })

    if (!baseCurrency) {
      throw new Error('Base currency not set')
    }

    // If base currency is USD (or whatever is set as base)
    // Convert: fromCurrency → baseCurrency → toCurrency
    const fromRate = fromCurrency.exchangeRate || 1
    const toRate = toCurrency.exchangeRate || 1

    // Rate = (1 / fromRate) * toRate
    return (1 / fromRate) * toRate
  }

  /**
   * Convert an amount from one currency to another
   */
  async convert(
    amount: number,
    fromCode: string,
    toCode: string
  ): Promise<number> {
    if (fromCode === toCode) return amount
    const rate = await this.getRate(fromCode, toCode)
    return amount * rate
  }

  /**
   * Convert with full details
   */
  async convertWithDetails(
    amount: number,
    fromCode: string,
    toCode: string
  ): Promise<ConversionResult> {
    const rate = await this.getRate(fromCode, toCode)
    const converted = amount * rate

    return {
      amount,
      from: fromCode,
      to: toCode,
      converted,
      rate,
    }
  }

  /**
   * Get base currency
   */
  async getBaseCurrency(): Promise<string> {
    const base = await prisma.currency.findFirst({
      where: { isBase: true },
    })
    return base?.code || 'USD'
  }

  /**
   * Get all active currencies
   */
  async getActiveCurrencies() {
    return await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
  }

  /**
   * Get currency by code
   */
  async getCurrency(code: string) {
    return await prisma.currency.findUnique({
      where: { code },
    })
  }

  /**
   * Update exchange rates manually
   */
  async updateRate(code: string, rate: number, notes?: string): Promise<void> {
    const currency = await prisma.currency.update({
      where: { code },
      data: {
        exchangeRate: rate,
        exchangeRateUpdatedAt: new Date(),
      },
    })

    const baseCurrency = await this.getBaseCurrency()

    await prisma.exchangeRateHistory.create({
      data: {
        fromCurrency: code,
        toCurrency: baseCurrency,
        rate,
        source: 'manual',
        notes,
      },
    })
  }

  /**
   * Get exchange rate history
   */
  async getRateHistory(
    fromCode: string,
    toCode: string,
    days: number = 30
  ): Promise<CurrencyRate[]> {
    const history = await prisma.exchangeRateHistory.findMany({
      where: {
        fromCurrency: fromCode,
        toCurrency: toCode,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'asc' },
    })

    return history.map((h) => ({
      from: h.fromCurrency,
      to: h.toCurrency,
      rate: h.rate,
      date: h.date,
    }))
  }

  /**
   * Format amount with currency symbol
   */
  async formatAmount(
    amount: number,
    currencyCode: string,
    options?: { showSymbol?: boolean; decimalPlaces?: number }
  ): Promise<string> {
    const currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    })

    if (!currency) return `${amount}`

    const decimals = options?.decimalPlaces ?? currency.decimalPlaces
    const formatted = amount.toFixed(decimals)

    if (options?.showSymbol === false) {
      return formatted
    }

    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${formatted}`
    } else {
      return `${formatted}${currency.symbol}`
    }
  }

  /**
   * Format amount with currency symbol (synchronous version for client-side)
   */
  formatAmountSync(
    amount: number,
    currency: { symbol: string; symbolPosition: string; decimalPlaces: number },
    options?: { showSymbol?: boolean; decimalPlaces?: number }
  ): string {
    const decimals = options?.decimalPlaces ?? currency.decimalPlaces
    const formatted = amount.toFixed(decimals)

    if (options?.showSymbol === false) {
      return formatted
    }

    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${formatted}`
    } else {
      return `${formatted}${currency.symbol}`
    }
  }
}

// Export singleton instance
export const currencyService = new CurrencyService()
