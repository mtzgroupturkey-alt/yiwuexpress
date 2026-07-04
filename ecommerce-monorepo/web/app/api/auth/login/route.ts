import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { loginRateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = loginRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user - use select to exclude password from being accidentally returned
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true, // Only include for verification, will remove from response
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

    if (!user) {
      // Generic error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    if (!isValidPassword) {
      // Same generic error to prevent account enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Create response with httpOnly cookie
    // ✅ SECURITY: No token in response body - only in httpOnly cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        country: user.country,
        isActive: user.isActive,
        supplierProfile: user.supplierProfile,
      },
    })

    // Set httpOnly cookie
    setAuthCookie(response, token)

    // Update last login (non-blocking)
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((err) => console.error('Failed to update lastLoginAt:', err))

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
