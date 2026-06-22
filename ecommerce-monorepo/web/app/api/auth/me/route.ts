import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/api-middleware'
import { z } from 'zod'

// Note: CORS is handled globally by middleware.ts, no need to duplicate headers here

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['IMPORTER', 'EXPORTER', 'MANUFACTURER', 'DISTRIBUTOR', 'OTHER']),
  phone: z.string().min(10, 'Valid phone number is required'),
  taxId: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
})

// GET /api/auth/me
async function getProfileHandler(request: any) {
  try {
    const userPayload = request.user
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        businessType: true,
        taxId: true,
        country: true,
        phone: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/auth/me
async function updateProfileHandler(request: any) {
  try {
    const userPayload = request.user
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: userPayload.userId },
      data: {
        name: validatedData.name,
        companyName: validatedData.companyName,
        businessType: validatedData.businessType,
        phone: validatedData.phone,
        taxId: validatedData.taxId,
        country: validatedData.country,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        businessType: true,
        taxId: true,
        country: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Update profile error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(getProfileHandler)
export const PUT = withAuth(updateProfileHandler)
