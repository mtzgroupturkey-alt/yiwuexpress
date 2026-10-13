import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { registerRateLimit } from '@/lib/rate-limit'
import { sendEmailVerificationLink } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || !val.includes('@'), {
      message: 'Phone number cannot be an email address',
    }),
  country: z.string().optional(),
  locale: z.string().optional().default('en'),
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
      // If user exists and is unverified, allow updating password and re-sending verification email
      if (!existingUser.isVerified && existingUser.userType === 'RETAIL') {
        const rawVerificationToken = crypto.randomBytes(32).toString('hex')
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const hashedPassword = await hashPassword(validatedData.password)

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: validatedData.name,
            password: hashedPassword,
            phone: validatedData.phone || existingUser.phone,
            country: validatedData.country || existingUser.country,
            resetToken: rawVerificationToken,
            resetTokenExpiry: tokenExpires,
          },
        })

        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const verificationUrl = `${appUrl}/${validatedData.locale}/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(existingUser.email)}`

        sendEmailVerificationLink({
          to: existingUser.email,
          name: validatedData.name,
          verificationUrl,
          locale: validatedData.locale,
          accountType: 'retail',
        }).catch((err) => console.error('Failed to send verification email:', err))

        return NextResponse.json({
          success: true,
          requiresEmailVerification: true,
          message: 'Verification email resent. Please check your inbox to activate your account.',
          email: existingUser.email,
        })
      }

      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Generate secure email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create unverified retail customer
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        country: validatedData.country,
        role: 'USER',
        userType: 'RETAIL',
        isVerified: false,
        resetToken: rawVerificationToken,
        resetTokenExpiry: tokenExpires,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        userType: true,
      },
    })

    // Build verification URL
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const verificationUrl = `${appUrl}/${validatedData.locale}/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(user.email)}`

    // Send verification email (non-blocking)
    sendEmailVerificationLink({
      to: user.email,
      name: user.name,
      verificationUrl,
      locale: validatedData.locale,
      accountType: 'retail',
    }).catch((err) => console.error('Failed to send verification email:', err))

    return NextResponse.json({
      success: true,
      requiresEmailVerification: true,
      message: 'Account created successfully! Please check your email to activate your account.',
      email: user.email,
    })
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
