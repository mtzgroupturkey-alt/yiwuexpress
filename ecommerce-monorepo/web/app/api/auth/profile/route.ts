import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/api-middleware'

// GET /api/auth/profile - Get current user profile
async function profileHandler(request: NextRequest & { user: any }) {
  try {
    const userPayload = request.user
    const userId = userPayload.userId || userPayload.sub

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        profilePhoto: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          where: { isDefault: true },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data with success flag for client-side checks
    return NextResponse.json({
      success: true,
      data: user,
      user: user // Also include at top level for compatibility
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(profileHandler)