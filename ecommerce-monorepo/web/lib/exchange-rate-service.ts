import { prisma } from '@/lib/db'

interface ExchangeRateAPIResponse {
  result: string
  documentation: string
  terms_of_use: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  base_code: string
  conversion_rates: {
    [key: string]: number
  }
}

export class ExchangeRateService {
  private apiKey: string
  private baseUrl: string
  private freeBaseUrl: string

  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || ''
    this.baseUrl = 'https://v6.exchangerate-api.com/v6'
    // Using open.er-api.com - truly free, no signup, no key
    this.freeBaseUrl = 'https://open.er-api.com/v6'
  }

  /**
   * Fetch latest exchange rates from external API
   * Uses free API (open.er-api.com) if no API key configured
   * Uses paid API (exchangerate-api.com) if API key provided
   */
  async fetchLatestRates(baseCurrency: string = 'USD'): Promise<ExchangeRateAPIResponse | null> {
    try {
      let url: string
      let data: any

      // Use free API if no key configured (open.er-api.com - truly free, no signup)
      if (!this.apiKey) {
        url = `${this.freeBaseUrl}/latest/${baseCurrency}`
        console.log(`Fetching exchange rates from FREE API: ${url}`)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Free API request failed: ${response.status} ${response.statusText}`)
          return null
        }

        data = await response.json()

        // Free API returns same format as paid API, just map rates to conversion_rates
        if (data.result === 'success' && data.rates) {
          data.conversion_rates = data.rates
          return data
        } else {
          console.error('Free API returned error:', data)
          return null
        }
      } 
      // Use paid API if key provided (exchangerate-api.com)
      else {
        url = `${this.baseUrl}/${this.apiKey}/latest/${baseCurrency}`
        console.log(`Fetching exchange rates from PAID API: ${url}`)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Paid API request failed: ${response.status} ${response.statusText}`)
          return null
        }

        data = await response.json()

        if (data.result !== 'success') {
          console.error('Paid API returned error:', data)
          return null
        }

        return data
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      return null
    }
  }

  /**
   * Update all currency rates in database from external API
   */
  async updateAllRates(): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      // Get base currency from database
      const baseCurrency = await prisma.currency.findFirst({
        where: { isBase: true }
      })

      if (!baseCurrency) {
        return {
          success: false,
          message: 'Base currency not found',
          updated: 0
        }
      }

      // Fetch latest rates
      const ratesData = await this.fetchLatestRates(baseCurrency.code)

      if (!ratesData) {
        return {
          success: false,
          message: 'Failed to fetch exchange rates from API',
          updated: 0
        }
      }

      // Get all active currencies from database
      const currencies = await prisma.currency.findMany({
        where: { isActive: true }
      })

      let updatedCount = 0

      // Update each currency (except base)
      for (const currency of currencies) {
        if (currency.isBase) continue

        const rate = ratesData.conversion_rates[currency.code]

        if (rate && rate > 0) {
          // Update currency rate
          await prisma.currency.update({
            where: { id: currency.id },
            data: {
              exchangeRate: rate,
              exchangeRateUpdatedAt: new Date()
            }
          })

          // Log to history
          await prisma.exchangeRateHistory.create({
            data: {
              fromCurrency: currency.code,
              toCurrency: baseCurrency.code,
              rate: rate,
              source: 'api',
              notes: `Auto-updated from exchangerate-api.com at ${new Date().toISOString()}`
            }
          })

          updatedCount++
          console.log(`Updated ${currency.code}: ${rate}`)
        }
      }

      return {
        success: true,
        message: `Successfully updated ${updatedCount} currency rates`,
        updated: updatedCount
      }
    } catch (error) {
      console.error('Error updating currency rates:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        updated: 0
      }
    }
  }

  /**
   * Update a specific currency rate
   */
  async updateCurrencyRate(currencyCode: string): Promise<{ success: boolean; message: string; rate?: number }> {
    try {
      const baseCurrency = await prisma.currency.findFirst({
        where: { isBase: true }
      })

      if (!baseCurrency) {
        return {
          success: false,
          message: 'Base currency not found'
        }
      }

      const ratesData = await this.fetchLatestRates(baseCurrency.code)

      if (!ratesData) {
        return {
          success: false,
          message: 'Failed to fetch exchange rates from API'
        }
      }

      const rate = ratesData.conversion_rates[currencyCode]

      if (!rate || rate <= 0) {
        return {
          success: false,
          message: `Rate not found for ${currencyCode}`
        }
      }

      // Find currency in database
      const currency = await prisma.currency.findUnique({
        where: { code: currencyCode }
      })

      if (!currency) {
        return {
          success: false,
          message: `Currency ${currencyCode} not found in database`
        }
      }

      // Update currency rate
      await prisma.currency.update({
        where: { code: currencyCode },
        data: {
          exchangeRate: rate,
          exchangeRateUpdatedAt: new Date()
        }
      })

      // Log to history
      await prisma.exchangeRateHistory.create({
        data: {
          fromCurrency: currencyCode,
          toCurrency: baseCurrency.code,
          rate: rate,
          source: 'api',
          notes: `Updated from exchangerate-api.com`
        }
      })

      return {
        success: true,
        message: `${currencyCode} rate updated to ${rate}`,
        rate: rate
      }
    } catch (error) {
      console.error('Error updating currency rate:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    // Always return true since we have free API fallback
    return true
  }

  /**
   * Check if paid API key is configured
   */
  hasPaidAPI(): boolean {
    return this.apiKey.length > 0
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; api: string }> {
    const data = await this.fetchLatestRates('USD')

    if (data) {
      const apiType = this.apiKey ? 'PAID (exchangerate-api.com)' : 'FREE (open.er-api.com)'
      return {
        success: true,
        message: `Connected successfully to ${apiType}. Last update: ${data.time_last_update_utc}`,
        api: apiType
      }
    }

    return {
      success: false,
      message: 'Failed to connect to API',
      api: 'UNKNOWN'
    }
  }
}

export const exchangeRateService = new ExchangeRateService()
