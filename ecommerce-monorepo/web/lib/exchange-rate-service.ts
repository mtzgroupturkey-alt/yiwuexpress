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

interface NbrbEntry {
  Cur_ID: number
  Cur_Code: string
  Cur_Abbreviation: string
  Cur_Scale: number
  Cur_Name: string
  Cur_OfficialRate: number
  Date: string
}

interface NbrbRatesResult {
  /** currency code → units of that currency per 1 USD (matches Currency.exchangeRate semantics) */
  rates: Record<string, number>
  /** how many BYN per 1 USD (direct from NBRB USD entry) */
  usdBynRate: number
  /** ISO date string from NBRB response */
  date: string
  /** raw entries for audit/logging */
  rawEntries: Array<{ code: string; officialRate: number; scale: number; name: string }>
}

export class ExchangeRateService {
  private apiKey: string
  private baseUrl: string
  private freeBaseUrl: string

  /** Official NBRB (National Bank of the Republic of Belarus) daily rates endpoint. Free, keyless. */
  private readonly nbrbUrl = 'https://api.nbrb.by/exrates/rates?periodicity=0'

  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || ''
    this.baseUrl = 'https://v6.exchangerate-api.com/v6'
    this.freeBaseUrl = 'https://open.er-api.com/v6'
  }

  // ---------------------------------------------------------------------------
  // NBRB — primary rate source
  // ---------------------------------------------------------------------------

  /**
   * Fetch official daily exchange rates from the NBRB public API.
   *
   * Rate semantics from NBRB:
   *   Cur_OfficialRate = how many BYN for Cur_Scale units of the foreign currency.
   *
   * Normalisation:
   *   bynPerUnit = Cur_OfficialRate / Cur_Scale        → 1 foreignUnit = X BYN
   *   rateVsUsd  = usdBynRate / bynPerUnit             → 1 USD = Y units of foreign currency
   *
   * Special case — BYN itself:
   *   Currency.exchangeRate for BYN = usdBynRate       → "how many BYN per 1 USD"
   */
  async fetchNbrbRates(): Promise<NbrbRatesResult | null> {
    try {
      console.log(`[NBRB] Fetching official rates from ${this.nbrbUrl}`)

      const response = await fetch(this.nbrbUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        console.error(`[NBRB] Request failed: ${response.status} ${response.statusText}`)
        return null
      }

      const entries: NbrbEntry[] = await response.json()

      if (!Array.isArray(entries) || entries.length === 0) {
        console.error('[NBRB] Unexpected response shape')
        return null
      }

      // USD is our base — we need its BYN rate to anchor all others
      const usdEntry = entries.find(e => e.Cur_Abbreviation === 'USD')
      if (!usdEntry) {
        console.error('[NBRB] USD entry not found — cannot compute USD-relative rates')
        return null
      }

      const usdBynRate = usdEntry.Cur_OfficialRate / usdEntry.Cur_Scale
      console.log(`[NBRB] 1 USD = ${usdBynRate} BYN (date: ${usdEntry.Date})`)

      const rates: Record<string, number> = {}
      const rawEntries: NbrbRatesResult['rawEntries'] = []

      for (const entry of entries) {
        const { Cur_Abbreviation: code, Cur_OfficialRate: officialRate, Cur_Scale: scale, Cur_Name: name } = entry

        // 1 unit of foreign currency = bynPerUnit BYN
        const bynPerUnit = officialRate / scale

        // 1 USD = usdBynRate BYN → 1 USD = (usdBynRate / bynPerUnit) units of foreign currency
        const rateVsUsd = usdBynRate / bynPerUnit

        rates[code] = rateVsUsd
        rawEntries.push({ code, officialRate, scale, name })
      }

      // BYN itself — store as "how many BYN per 1 USD"
      rates['BYN'] = usdBynRate

      const date = entries[0]?.Date ?? new Date().toISOString()
      console.log(`[NBRB] Parsed ${Object.keys(rates).length} rates (incl. BYN)`)

      return { rates, usdBynRate, date, rawEntries }
    } catch (error) {
      console.error('[NBRB] Error fetching rates:', error)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Fallback — open.er-api.com / exchangerate-api.com
  // ---------------------------------------------------------------------------

  /**
   * Fetch latest exchange rates from external API.
   * Uses free API (open.er-api.com) if no API key configured.
   * Uses paid API (exchangerate-api.com) if EXCHANGE_RATE_API_KEY env var is set.
   */
  async fetchLatestRates(baseCurrency: string = 'USD'): Promise<ExchangeRateAPIResponse | null> {
    try {
      let url: string
      let data: Record<string, unknown>

      if (!this.apiKey) {
        url = `${this.freeBaseUrl}/latest/${baseCurrency}`
        console.log(`[FallbackAPI] Fetching from FREE API: ${url}`)

        const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
        if (!response.ok) {
          console.error(`[FallbackAPI] Free API failed: ${response.status} ${response.statusText}`)
          return null
        }

        data = await response.json()

        if (data.result === 'success' && data.rates) {
          ;(data as Record<string, unknown>).conversion_rates = data.rates
          return data as unknown as ExchangeRateAPIResponse
        } else {
          console.error('[FallbackAPI] Free API error:', data)
          return null
        }
      } else {
        url = `${this.baseUrl}/${this.apiKey}/latest/${baseCurrency}`
        console.log(`[FallbackAPI] Fetching from PAID API: ${url}`)

        const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
        if (!response.ok) {
          console.error(`[FallbackAPI] Paid API failed: ${response.status} ${response.statusText}`)
          return null
        }

        data = await response.json()
        if (data.result !== 'success') {
          console.error('[FallbackAPI] Paid API error:', data)
          return null
        }

        return data as unknown as ExchangeRateAPIResponse
      }
    } catch (error) {
      console.error('[FallbackAPI] Error fetching exchange rates:', error)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Core update — NBRB first, fallback if unavailable
  // ---------------------------------------------------------------------------

  /**
   * Update all active currency rates in the database.
   *
   * Priority:
   *   1. NBRB official API (free, keyless, authoritative for BYN/RUB/CNY etc.)
   *   2. open.er-api.com (free fallback) or exchangerate-api.com (paid fallback)
   */
  async updateAllRates(): Promise<{ success: boolean; message: string; updated: number; source: string }> {
    try {
      // ── 1. Try NBRB ────────────────────────────────────────────────────────
      const nbrbData = await this.fetchNbrbRates()
      if (nbrbData) {
        return this._updateFromNbrb(nbrbData)
      }

      console.warn('[ExchangeRate] NBRB unavailable — falling back to open.er-api / exchangerate-api')

      // ── 2. Fallback ────────────────────────────────────────────────────────
      const baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } })
      if (!baseCurrency) {
        return { success: false, message: 'Base currency not found', updated: 0, source: 'none' }
      }

      const ratesData = await this.fetchLatestRates(baseCurrency.code)
      if (!ratesData) {
        return {
          success: false,
          message: 'Failed to fetch exchange rates from both NBRB and fallback API',
          updated: 0,
          source: 'none',
        }
      }

      return this._updateFromFallbackApi(ratesData, baseCurrency.code)
    } catch (error) {
      console.error('[ExchangeRate] Error in updateAllRates:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        updated: 0,
        source: 'error',
      }
    }
  }

  /** Persist NBRB rates to the database */
  private async _updateFromNbrb(
    nbrbData: NbrbRatesResult,
  ): Promise<{ success: boolean; message: string; updated: number; source: string }> {
    const currencies = await prisma.currency.findMany({ where: { isActive: true } })
    const now = new Date()
    let updatedCount = 0

    for (const currency of currencies) {
      if (currency.isBase) continue // USD.exchangeRate stays 1.0

      const rate = nbrbData.rates[currency.code]
      if (!rate || rate <= 0) {
        console.warn(`[NBRB] No rate for ${currency.code} — skipping`)
        continue
      }

      const raw = nbrbData.rawEntries.find(e => e.code === currency.code)
      const notes = raw
        ? `NBRB ${nbrbData.date}: officialRate=${raw.officialRate}, scale=${raw.scale}, 1USD=${nbrbData.usdBynRate}BYN`
        : `NBRB ${nbrbData.date}: BYN itself, 1USD=${nbrbData.usdBynRate}BYN`

      await prisma.currency.update({
        where: { id: currency.id },
        data: { exchangeRate: rate, exchangeRateUpdatedAt: now },
      })

      await prisma.exchangeRateHistory.create({
        data: {
          fromCurrency: currency.code,
          toCurrency: 'USD',
          rate,
          source: 'nbrb',
          notes,
        },
      })

      updatedCount++
      console.log(`[NBRB] ${currency.code}: ${rate.toFixed(6)} per 1 USD`)
    }

    return {
      success: true,
      message: `NBRB: updated ${updatedCount} currency rates (date: ${nbrbData.date})`,
      updated: updatedCount,
      source: 'nbrb',
    }
  }

  /** Persist fallback-API rates to the database */
  private async _updateFromFallbackApi(
    ratesData: ExchangeRateAPIResponse,
    baseCode: string,
  ): Promise<{ success: boolean; message: string; updated: number; source: string }> {
    const currencies = await prisma.currency.findMany({ where: { isActive: true } })
    const apiLabel = this.apiKey ? 'exchangerate-api.com' : 'open.er-api.com'
    let updatedCount = 0

    for (const currency of currencies) {
      if (currency.isBase) continue

      const rate = ratesData.conversion_rates[currency.code]
      if (!rate || rate <= 0) continue

      await prisma.currency.update({
        where: { id: currency.id },
        data: { exchangeRate: rate, exchangeRateUpdatedAt: new Date() },
      })

      await prisma.exchangeRateHistory.create({
        data: {
          fromCurrency: currency.code,
          toCurrency: baseCode,
          rate,
          source: 'api',
          notes: `Fallback: ${apiLabel} at ${new Date().toISOString()}`,
        },
      })

      updatedCount++
      console.log(`[Fallback] ${currency.code}: ${rate}`)
    }

    return {
      success: true,
      message: `Fallback (${apiLabel}): updated ${updatedCount} currency rates`,
      updated: updatedCount,
      source: apiLabel,
    }
  }

  // ---------------------------------------------------------------------------
  // Single-currency update
  // ---------------------------------------------------------------------------

  /**
   * Update a single currency rate (NBRB first, then fallback).
   */
  async updateCurrencyRate(currencyCode: string): Promise<{ success: boolean; message: string; rate?: number }> {
    try {
      const baseCurrency = await prisma.currency.findFirst({ where: { isBase: true } })
      if (!baseCurrency) return { success: false, message: 'Base currency not found' }

      // Try NBRB
      const nbrbData = await this.fetchNbrbRates()
      if (nbrbData) {
        const rate = nbrbData.rates[currencyCode]
        if (rate && rate > 0) {
          await prisma.currency.update({
            where: { code: currencyCode },
            data: { exchangeRate: rate, exchangeRateUpdatedAt: new Date() },
          })
          await prisma.exchangeRateHistory.create({
            data: {
              fromCurrency: currencyCode,
              toCurrency: 'USD',
              rate,
              source: 'nbrb',
              notes: `NBRB single update ${nbrbData.date}`,
            },
          })
          return { success: true, message: `${currencyCode} updated to ${rate} via NBRB`, rate }
        }
      }

      // Fallback
      const ratesData = await this.fetchLatestRates(baseCurrency.code)
      if (!ratesData) return { success: false, message: 'Failed to fetch exchange rates from API' }

      const rate = ratesData.conversion_rates[currencyCode]
      if (!rate || rate <= 0) return { success: false, message: `Rate not found for ${currencyCode}` }

      const currency = await prisma.currency.findUnique({ where: { code: currencyCode } })
      if (!currency) return { success: false, message: `Currency ${currencyCode} not found in database` }

      await prisma.currency.update({
        where: { code: currencyCode },
        data: { exchangeRate: rate, exchangeRateUpdatedAt: new Date() },
      })

      await prisma.exchangeRateHistory.create({
        data: {
          fromCurrency: currencyCode,
          toCurrency: baseCurrency.code,
          rate,
          source: 'api',
          notes: `Updated from exchangerate-api.com`,
        },
      })

      return { success: true, message: `${currencyCode} rate updated to ${rate}`, rate }
    } catch (error) {
      console.error('Error updating currency rate:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  isConfigured(): boolean {
    return true // free NBRB + free fallback always available
  }

  hasPaidAPI(): boolean {
    return this.apiKey.length > 0
  }

  /**
   * Test API connections — NBRB first, then fallback.
   */
  async testConnection(): Promise<{ success: boolean; message: string; api: string }> {
    const nbrbData = await this.fetchNbrbRates()
    if (nbrbData) {
      return {
        success: true,
        message: `NBRB connected. 1 USD = ${nbrbData.usdBynRate} BYN (${nbrbData.date}). ${Object.keys(nbrbData.rates).length} currencies available.`,
        api: 'NBRB api.nbrb.by [PRIMARY]',
      }
    }

    const data = await this.fetchLatestRates('USD')
    if (data) {
      const apiType = this.apiKey ? 'PAID (exchangerate-api.com)' : 'FREE (open.er-api.com)'
      return {
        success: true,
        message: `NBRB unavailable. Fallback: ${apiType}. Last update: ${data.time_last_update_utc}`,
        api: `${apiType} [FALLBACK]`,
      }
    }

    return {
      success: false,
      message: 'Failed to connect to both NBRB and fallback exchange rate APIs',
      api: 'NONE',
    }
  }
}

export const exchangeRateService = new ExchangeRateService()
