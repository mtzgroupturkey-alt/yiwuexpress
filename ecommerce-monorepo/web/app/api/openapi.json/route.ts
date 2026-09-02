import { NextRequest, NextResponse } from 'next/server'
import { getOpenAPISpecification } from '@/lib/openapi'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const host = req.nextUrl.origin || 'https://yiwuexpress.com'
  const spec = getOpenAPISpecification(host)

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
