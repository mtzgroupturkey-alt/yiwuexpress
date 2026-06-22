import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// Handle OPTIONS preflight request
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || undefined,
      businessType: user.businessType || undefined,
      taxId: user.taxId || undefined,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
      },
      token,
    })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}