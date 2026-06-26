import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // CORS is handled by individual API routes using addCorsHeaders() from api-middleware.ts
  // This prevents duplicate Access-Control-Allow-Origin headers
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}