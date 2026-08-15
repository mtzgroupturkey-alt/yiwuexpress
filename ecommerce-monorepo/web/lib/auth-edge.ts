/**
 * Edge-safe auth helpers.
 *
 * This module MUST NOT import any Node-only packages
 * (jsonwebtoken, bcryptjs, prisma, etc.) because it is
 * consumed by `middleware.ts`, which runs in the Edge Runtime.
 *
 * Token signing/hashing for Node API routes lives in `./auth`.
 */

import * as jose from 'jose'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export const COOKIE_NAME = 'auth_token'

export const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables')
}

/**
 * Get token from request.
 * Works for both NextRequest (middleware) and plain Request (cookie or
 * Authorization header). Pure / runtime-agnostic.
 */
export function getTokenFromRequest(req: Request): string | null {
  const r = req as { cookies?: { get?: (name: string) => { value: string } | undefined } }

  // 1) NextRequest-style cookies (middleware passes NextRequest)
  const cookieToken = r.cookies?.get?.(COOKIE_NAME)?.value
  if (cookieToken) return cookieToken

  // 2) Raw Cookie header (plain Request / fetch)
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const idx = part.indexOf('=')
      if (idx === -1) continue
      const name = part.slice(0, idx).trim()
      const value = part.slice(idx + 1).trim()
      if (name === COOKIE_NAME) return decodeURIComponent(value)
    }
  }

  // 3) Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

/**
 * Verify JWT token using jose (Edge runtime - middleware).
 */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return payload as unknown as JwtPayload
  } catch (error) {
    console.debug('Token verification error in edge runtime:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}
