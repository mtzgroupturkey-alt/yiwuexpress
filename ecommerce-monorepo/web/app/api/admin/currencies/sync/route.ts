import { NextResponse } from 'next/server'
import { exchangeRateService } from '@/lib/exchange-rate-service'

// POST /api/admin/currencies/sync - Manually sync all rates from API
export async function POST() {
  try {
    console.log('[SYNC] Starting manual exchange rate sync...')

    // Update all rates (works with free or paid API)
    const result = await exchangeRateService.updateAllRates()

    if (result.success) {
      const apiType = exchangeRateService.hasPaidAPI() ? 'paid API' : 'free API'
      console.log(`[SYNC] Successfully updated ${result.updated} rates from ${apiType}`)
      
      return NextResponse.json({
        success: true,
        message: result.message,
        updated: result.updated,
        api: apiType
      })
    } else {
      console.error('[SYNC] Failed:', result.message)
      return NextResponse.json(
        {
          success: false,
          message: result.message
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[SYNC] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync exchange rates'
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/currencies/sync - Test API connection
export async function GET() {
  try {
    const result = await exchangeRateService.testConnection()
    const hasPaid = exchangeRateService.hasPaidAPI()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      configured: true,  // Always true (free API available)
      api: result.api,
      hasPaidAPI: hasPaid,
      note: hasPaid 
        ? 'Using paid API (exchangerate-api.com) with your API key' 
        : 'Using FREE API (open.er-api.com) - No signup required!'
    })
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test API connection',
        configured: true,
        api: 'ERROR'
      },
      { status: 500 }
    )
  }
}
