export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { resolveSegmentAudience } from '@/lib/push'

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN'])

    const { searchParams } = new URL(request.url)
    const segment = searchParams.get('segment') || 'ALL'
    const targetUserId = searchParams.get('targetUserId')

    const audience = await resolveSegmentAudience(segment, targetUserId)

    return NextResponse.json({
      segment,
      count: audience.length,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return createAuthErrorResponse(error)
    }
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: error.status || 500 }
    )
  }
}
