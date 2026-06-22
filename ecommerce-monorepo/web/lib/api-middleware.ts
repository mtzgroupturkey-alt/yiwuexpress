import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

// Allowed origins for CORS
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8081,http://localhost:3000,http://localhost:19006,http://localhost:19000,http://localhost:8080')
  .split(',')
  .map((o) => o.trim())

/**
 * Returns the correct Access-Control-Allow-Origin value for the given request.
 * Echoes the request origin if it is in the allowed list, otherwise falls back to the first allowed origin.
 */
export function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

/**
 * Adds CORS headers to a NextResponse without duplicating them.
 * Uses the request's Origin header to set a specific (not wildcard) value
 * so it is compatible with credentials-bearing requests.
 */
export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = getAllowedOrigin(request)
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

/**
 * Handles an OPTIONS preflight request with the correct CORS headers.
 */
export function handleOptions(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response, request)
}



export function withAuth(handler: Function) {
  return async function (req: NextRequest, ...args: any[]) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user info to request
    const requestWithUser = req.clone()
    Object.assign(requestWithUser, { user: payload })

    return handler(requestWithUser, ...args)
  }
}