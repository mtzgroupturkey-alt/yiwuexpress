import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken' // For API routes (Node runtime)
import * as jose from 'jose' // For middleware (Edge runtime)
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const COOKIE_NAME = 'auth_token'

// Validate JWT_SECRET at module load
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables')
}

// Warn if using default/weak secret
if (JWT_SECRET === 'change-me-in-production' || JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is weak or default. Generate a strong secret for production!')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate JWT token (Node runtime - API routes)
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify JWT token (Node runtime - API routes)
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Verify JWT token using jose (Edge runtime - middleware)
 */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    return payload as JwtPayload
  } catch {
    return null
  }
}

/**
 * Set httpOnly cookie with JWT token
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  })
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME)
}

/**
 * Get token from request (cookie first, then Authorization header)
 */
export function getTokenFromRequest(req: NextRequest | Request): string | null {
  // Try cookie first
  if ('cookies' in req) {
    const cookieToken = req.cookies.get(COOKIE_NAME)?.value
    if (cookieToken) return cookieToken
  }

  // Fallback to Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

/**
 * Get user from token (Node runtime - API routes)
 */
export async function getUserFromToken(token: string) {
  const payload = verifyToken(token)
  if (!payload) return null

  return await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      country: true,
      isActive: true,
      isVerified: true,
      supplierId: true,
      supplierProfile: {
        select: {
          id: true,
          companyName: true,
          businessType: true,
        },
      },
    },
  })
}

/**
 * Get authenticated user from request (Node runtime - API routes)
 */
export async function getAuthUser(req: Request | NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null

  return await getUserFromToken(token)
}

/**
 * Require authentication - returns user or throws 401 error
 */
export async function requireAuth(req: Request | NextRequest) {
  const user = await getAuthUser(req)
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.isActive) {
    throw new Error('Account is disabled')
  }

  return user
}

/**
 * Require specific role - returns user or throws 403 error
 */
export async function requireRole(req: Request | NextRequest, allowedRoles: string[]) {
  const user = await requireAuth(req)
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }

  return user
}

/**
 * Helper to create error responses
 */
export function createAuthErrorResponse(error: Error): NextResponse {
  if (error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  if (error.message === 'Forbidden' || error.message === 'Account is disabled') {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
