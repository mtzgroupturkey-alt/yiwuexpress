export interface CurrencyDefinition {
  code: string
  symbol: string
  name: string
  decimals: number
  rateAgainstUSD: number // Base USD = 1.0
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    rateAgainstUSD: 1.0,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimals: 2,
    rateAgainstUSD: 7.24,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    rateAgainstUSD: 0.92,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    decimals: 2,
    rateAgainstUSD: 90.5,
  },
}

export const DEFAULT_CURRENCY = 'USD'
