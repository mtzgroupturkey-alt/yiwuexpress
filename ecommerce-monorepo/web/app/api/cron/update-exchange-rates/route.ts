import { NextRequest, NextResponse } from 'next/server'
import { exchangeRateService } from '@/lib/exchange-rate-service'

/**
 * Cron job endpoint to automatically update exchange rates daily
 * 
 * This endpoint can be called by:
 * 1. External cron service (e.g., cron-job.org, EasyCron)
 * 2. Vercel Cron Jobs (vercel.json configuration)
 * 3. GitHub Actions workflow
 * 4. Manual trigger for testing
 * 
 * To secure this endpoint, you can:
 * - Add authorization header check
 * - Use Vercel Cron Secret
 * - Whitelist IP addresses
 */

export async function GET(req: NextRequest) {
  try {
    // Optional: Add authorization check
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting automatic exchange rate update...')

    // Update all rates (works with free or paid API)
    const result = await exchangeRateService.updateAllRates()

    if (result.success) {
      const apiType = exchangeRateService.hasPaidAPI() ? 'paid API' : 'FREE API'
      console.log(`[CRON] Successfully updated ${result.updated} currency rates from ${apiType}`)
      return NextResponse.json({
        success: true,
        message: result.message,
        updated: result.updated,
        api: apiType,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('[CRON] Failed to update rates:', result.message)
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[CRON] Error updating exchange rates:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST method
export async function POST(req: NextRequest) {
  return GET(req)
}
