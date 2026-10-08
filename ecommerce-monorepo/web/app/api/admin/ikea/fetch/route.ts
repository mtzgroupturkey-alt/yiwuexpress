import { NextRequest, NextResponse } from 'next/server'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { fetchIkeaProduct, cleanIkeaItemNumber } from '@/lib/ikea/fetchProduct'
import { mapIkeaProductToAttributes } from '@/lib/ikea/mapToAttributes'

// In-memory rate limiting per admin user: max 30 fetches per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkAdminRateLimit(adminId: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now()
  const current = rateLimitMap.get(adminId)

  if (!current || now > current.resetAt) {
    rateLimitMap.set(adminId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['ADMIN'])

    if (!checkAdminRateLimit(admin.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before fetching more IKEA items.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { itemNumbers, targetCategoryId, locale = 'us/en', skipCache = false } = body

    if (!itemNumbers || !Array.isArray(itemNumbers) || itemNumbers.length === 0) {
      return NextResponse.json(
        { error: 'itemNumbers must be a non-empty array of IKEA item strings' },
        { status: 400 }
      )
    }

    // Process up to 20 items per batch request
    const batch = itemNumbers.slice(0, 20)
    const results = []

    for (const rawNum of batch) {
      const cleanNum = cleanIkeaItemNumber(rawNum)
      if (!cleanNum) {
        results.push({
          itemNumber: rawNum,
          status: 'NOT_FOUND',
          error: 'Empty or invalid IKEA item number'
        })
        continue
      }

      try {
        const product = await fetchIkeaProduct(rawNum, { locale, skipCache })
        const mapped = await mapIkeaProductToAttributes(product, targetCategoryId)

        results.push({
          itemNumber: product.itemNumber,
          cleanItemNumber: cleanNum,
          status: 'READY',
          product,
          mappedResult: mapped
        })
      } catch (err: any) {
        results.push({
          itemNumber: rawNum,
          cleanItemNumber: cleanNum,
          status: err.status || 'FETCH_FAILED',
          error: err.reason || err.message || 'Failed to fetch product from IKEA',
          retryable: err.retryable || false
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalRequested: itemNumbers.length,
      processed: results.length,
      results
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return createAuthErrorResponse(err)
    }
    console.error('[API /api/admin/ikea/fetch] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching IKEA products' },
      { status: 500 }
    )
  }
}
