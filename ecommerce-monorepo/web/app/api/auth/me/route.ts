import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/api-middleware'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
})

// GET /api/auth/me
async function getProfileHandler(request: any) {
  try {
    const userPayload = request.user
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: {
        supplierProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        country: user.country,
        profilePhoto: user.profilePhoto,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
        isActive: user.isActive,
        isVerified: user.isVerified,
        supplierProfile: user.supplierProfile ? {
          id: user.supplierProfile.id,
          companyName: user.supplierProfile.companyName,
          businessType: user.supplierProfile.businessType,
        } : undefined,
        createdAt: user.createdAt,
      },
    })
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
        phone: validatedData.phone,
        country: validatedData.country,
        profilePhoto: validatedData.profilePhoto,
        companyName: validatedData.companyName,
        businessType: validatedData.businessType,
        taxId: validatedData.taxId,
      },
      include: {
        supplierProfile: true,
      },
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        country: updatedUser.country,
        profilePhoto: updatedUser.profilePhoto,
        companyName: updatedUser.companyName,
        businessType: updatedUser.businessType,
        taxId: updatedUser.taxId,
        supplierProfile: updatedUser.supplierProfile ? {
          id: updatedUser.supplierProfile.id,
          companyName: updatedUser.supplierProfile.companyName,
          businessType: updatedUser.supplierProfile.businessType,
        } : undefined,
      },
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
