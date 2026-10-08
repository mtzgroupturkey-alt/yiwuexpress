import { cookies } from 'next/headers'
import { verifyToken, getUserFromToken } from '@/lib/auth'

export interface ServerAuthUser {
  id: string
  email: string
  name?: string
  role: string
  userType?: string
  verificationStatus?: string
  profilePhoto?: string
}

export interface ServerAuthResult {
  isAuthenticated: boolean
  user?: ServerAuthUser
}

/**
 * Server-side auth detector for SSR layouts and server components.
 * Reads the httpOnly `auth_token` cookie, verifies cryptographic validity,
 * and extracts typed user details.
 *
 * Guarantees:
 * - NEVER throws.
 * - Returns { isAuthenticated: false } on missing, expired, or tampered tokens.
 * - Allows optional `tokenOverride` for testing and deterministic evaluation.
 */
export async function getServerAuth(tokenOverride?: string | null): Promise<ServerAuthResult> {
  try {
    let token = tokenOverride
    if (token === undefined) {
      try {
        const cookieStore = cookies()
        token = cookieStore.get('auth_token')?.value
      } catch {
        // Outside of request scope or cookies() unavailable
        token = undefined
      }
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return { isAuthenticated: false }
    }

    // 1. Verify token signature and expiration
    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return { isAuthenticated: false }
    }

    // 2. Fetch active user record (selective projection)
    try {
      const dbUser = await getUserFromToken(token)
      if (dbUser && dbUser.isActive !== false) {
        return {
          isAuthenticated: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name ?? undefined,
            role: dbUser.role,
            userType: dbUser.userType ?? undefined,
            verificationStatus: dbUser.verificationStatus ?? undefined,
          },
        }
      }
    } catch {
      // If DB is temporarily unavailable, fall back to validated JWT payload
    }

    // 3. Fallback to valid JWT payload if database lookup fails
    return {
      isAuthenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    }
  } catch {
    return { isAuthenticated: false }
  }
}
