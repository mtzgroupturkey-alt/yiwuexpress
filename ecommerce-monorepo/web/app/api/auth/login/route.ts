export const dynamic = 'force-dynamic';
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
  console.log('[API /auth/login] Request received')
  console.log('[API /auth/login] URL:', request.url)
  console.log('[API /auth/login] Method:', request.method)
  console.log('[API /auth/login] Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Rate limiting check
    const rateLimitResponse = loginRateLimit(request)
    if (rateLimitResponse) {
      console.log('[API /auth/login] Rate limit exceeded')
      return rateLimitResponse
    }

    const body = await request.json()
    console.log('[API /auth/login] Email:', body.email)
    
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
      console.log('[API /auth/login] User not found:', validatedData.email)
      // Generic error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('[API /auth/login] User found:', { id: user.id, email: user.email, role: user.role })

    // Check if account is active
    if (!user.isActive) {
      console.log('[API /auth/login] Account is inactive')
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    console.log('[API /auth/login] Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('[API /auth/login] Invalid password')
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
    
    console.log('[API /auth/login] Token generated (first 20 chars):', token.substring(0, 20) + '...')

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

    console.log('[API /auth/login] Setting cookie...')
    // Set httpOnly cookie
    setAuthCookie(response, token)
    
    console.log('[API /auth/login] Cookie set successfully')
    console.log('[API /auth/login] Response headers:', Object.fromEntries(response.headers.entries()))

    // Update last login (non-blocking)
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((err) => console.error('Failed to update lastLoginAt:', err))

    console.log('[API /auth/login] Login successful, returning response')
    return response
  } catch (error) {
    console.error('[API /auth/login] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
