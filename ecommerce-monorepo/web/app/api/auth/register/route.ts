import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Business account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user with business information
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        companyName: validatedData.companyName,
        businessType: validatedData.businessType,
        taxId: validatedData.taxId,
        role: 'BUSINESS',
      },
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName || '',
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        businessType: user.businessType,
        role: user.role,
      },
      token,
      message: 'Business account created successfully. Welcome to YIWU EXPRESS!',
    })
  } catch (error) {
    console.error('Registration error:', error)
    
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

import { z } from 'zod'