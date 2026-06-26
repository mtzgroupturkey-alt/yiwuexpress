import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Note: CORS is handled globally by next.config.js

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || limit.resetAt < now) {
    // Reset or create new limit
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 3) {
    // Max 3 requests per minute
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // TODO: Send email to admin
    console.log('📧 Contact Form Submission')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`From: ${validatedData.name} <${validatedData.email}>`)
    console.log(`Company: ${validatedData.company || 'N/A'}`)
    console.log(`Phone: ${validatedData.phone || 'N/A'}`)
    console.log(`Subject: ${validatedData.subject}`)
    console.log(`Message: ${validatedData.message}`)
    console.log(`IP: ${ip}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // In production, send email:
    // await sendContactFormEmail({
    //   to: process.env.COMPANY_EMAIL || 'info@yiwuexpress.com',
    //   from: validatedData.email,
    //   name: validatedData.name,
    //   company: validatedData.company,
    //   phone: validatedData.phone,
    //   subject: validatedData.subject,
    //   message: validatedData.message,
    // })

    // Send auto-reply to customer
    console.log(`📧 Send auto-reply to: ${validatedData.email}`)

    return NextResponse.json({
      message: 'Thank you for contacting us! We will get back to you within 24 hours.',
      success: true,
    })
  } catch (error) {
    console.error('Contact form error:', error)

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
