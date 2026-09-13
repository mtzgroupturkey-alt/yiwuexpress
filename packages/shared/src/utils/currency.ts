import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies'

export function formatCurrency(
  amount: number,
  currencyCode = DEFAULT_CURRENCY,
  locale = 'en-US'
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount

  const from = SUPPORTED_CURRENCIES[fromCurrency] || SUPPORTED_CURRENCIES.USD
  const to = SUPPORTED_CURRENCIES[toCurrency] || SUPPORTED_CURRENCIES.USD

  // Convert to USD base first, then to target currency
  const amountInUSD = amount / from.rateAgainstUSD
  const targetAmount = amountInUSD * to.rateAgainstUSD

  return parseFloat(targetAmount.toFixed(to.decimals))
}

export function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  const sum = items.reduce((total, item) => total + item.price * item.quantity, 0)
  return parseFloat(sum.toFixed(2))
}
