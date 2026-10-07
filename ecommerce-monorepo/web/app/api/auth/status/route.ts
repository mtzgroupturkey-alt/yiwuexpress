export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Fetch full user details needed for storefront and wholesale checks
    const user = await prisma.user.findUnique({
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
        userType: true,
        verificationStatus: true,
        profilePhoto: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            businessType: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        authenticated: false,
        user: null
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        country: user.country,
        isActive: user.isActive,
        isVerified: user.isVerified,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        profilePhoto: user.profilePhoto,
        supplierProfile: user.supplierProfile,
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