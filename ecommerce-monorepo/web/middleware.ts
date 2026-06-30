import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add CORS headers for /uploads static files
  // (Next.js headers() config does not apply to /public static files)
  if (request.nextUrl.pathname.startsWith('/uploads')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type')
    return response
  }

  // CORS is handled by individual API routes using addCorsHeaders() from api-middleware.ts
  // This prevents duplicate Access-Control-Allow-Origin headers
  return response
}

export const config = {
  matcher: ['/api/:path*', '/uploads/:path*'],
}