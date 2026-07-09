import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// GET /api/auth/status - Check authentication status (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Try cookie first (preferred), then Authorization header (fallback)
    const cookieToken = request.cookies.get('auth_token')?.value
    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    const token = cookieToken || headerToken

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        user: null
      })
    }

    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({
        authenticated: false,
        user: null
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role
      }
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null
    })
  }
}