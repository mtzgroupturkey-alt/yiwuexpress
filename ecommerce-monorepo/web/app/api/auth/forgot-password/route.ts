import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per 15 minutes per IP
    const rateLimitResponse = rateLimit(request, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 3,
      keyPrefix: 'forgot-password',
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Generate reset token (32 random bytes)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Send password reset email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
    
    console.log('🔐 Password Reset Request')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Email: ${email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`Token expires: ${resetTokenExpiry.toISOString()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken)
      console.log(`✅ Password reset email sent to: ${user.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError)
      // Continue anyway - log error but don't reveal email service issues
    }

    // Log email (optional)
    await prisma.emailLog.create({
      data: {
        userId: user.id,
        recipient: user.email,
        subject: 'Reset Your Password - YIWU EXPRESS',
        template: 'password_reset',
        content: `Password reset link: ${resetUrl}`,
        status: 'sent',
        sentAt: new Date(),
      },
    }).catch(err => console.error('Failed to log email:', err))

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
