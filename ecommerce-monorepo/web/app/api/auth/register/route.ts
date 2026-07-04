import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { registerRateLimit } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'), // Increased from 6 to 8
  phone: z.string().optional(),
  country: z.string().optional(),
  // Explicitly define role to strip it - any client-sent role is ignored
  role: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = registerRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      // Generic error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Unable to register with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create customer user (public registration)
    // SECURITY: Always set role to 'USER', ignoring any client-sent role
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        country: validatedData.country,
        role: 'USER', // HARDCODED - never trust client input for role
        isVerified: false, // Set to false - email verification required
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        // DO NOT SELECT PASSWORD
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      user,
      message: 'Account created successfully. Welcome to YIWU EXPRESS!',
      // NO TOKEN IN RESPONSE BODY - only in httpOnly cookie
    })

    // Set httpOnly cookie
    setAuthCookie(response, token)

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, { name: user.name }).catch((err) =>
      console.error('Failed to send welcome email:', err)
    )

    return response
  } catch (error) {
    console.error('Registration error:', error)
    
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
