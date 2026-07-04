import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireRole, createAuthErrorResponse } from '@/lib/auth'
import { adminRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['USER', 'SUPPLIER', 'ADMIN']).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
  // Supplier fields
  companyName: z.string().optional(),
  businessType: z.enum(['MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR']).optional(),
  taxId: z.string().optional(),
  profilePhoto: z.string().optional(),
})

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = adminRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require ADMIN role
    await requireRole(request, ['ADMIN'])

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        country: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            businessType: true,
            taxId: true,
          },
        },
        _count: {
          select: {
            orders: true,
            quotes: true,
            addresses: true,
          },
        },
        // NO PASSWORD
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('GET user error:', error)
    return createAuthErrorResponse(error)
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = adminRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require ADMIN role
    const adminUser = await requireRole(request, ['ADMIN'])

    // Self-protection: Admin cannot modify their own account
    if (adminUser.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account. Use another admin account.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { supplierProfile: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Last-admin protection: Cannot demote or deactivate the last active ADMIN
    if (user.role === 'ADMIN' && (validatedData.role !== 'ADMIN' || validatedData.isActive === false)) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
      })

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote or deactivate the last active admin' },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}

    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.country !== undefined) updateData.country = validatedData.country
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.profilePhoto !== undefined) updateData.profilePhoto = validatedData.profilePhoto

    // Only hash password if provided (blank = no change)
    if (validatedData.password) {
      updateData.password = await hashPassword(validatedData.password)
    }

    // Handle role transitions
    if (validatedData.role && validatedData.role !== user.role) {
      await prisma.$transaction(async (tx) => {
        // Transitioning TO SUPPLIER
        if (validatedData.role === 'SUPPLIER') {
          if (!validatedData.companyName) {
            throw new Error('Company name required for supplier role')
          }

          if (!user.supplierProfile) {
            // Create supplier profile
            const profile = await tx.supplierProfile.create({
              data: {
                companyName: validatedData.companyName,
                businessType: validatedData.businessType,
                taxId: validatedData.taxId,
                phone: validatedData.phone || user.phone,
              },
            })
            updateData.supplierId = profile.id
          } else {
            // Update existing profile
            await tx.supplierProfile.update({
              where: { id: user.supplierProfile.id },
              data: {
                companyName: validatedData.companyName,
                businessType: validatedData.businessType,
                taxId: validatedData.taxId,
              },
            })
          }
        }

        // Transitioning FROM SUPPLIER
        if (user.role === 'SUPPLIER' && validatedData.role !== 'SUPPLIER') {
          if (user.supplierProfile) {
            // Remove supplier profile
            await tx.supplierProfile.delete({
              where: { id: user.supplierProfile.id },
            })
            updateData.supplierId = null
          }
        }

        updateData.role = validatedData.role

        // Update user
        await tx.user.update({
          where: { id: params.id },
          data: updateData,
        })
      })
    } else {
      // No role change - simple update
      if (user.supplierProfile && validatedData.companyName) {
        // Update supplier profile if exists
        await prisma.supplierProfile.update({
          where: { id: user.supplierProfile.id },
          data: {
            ...(validatedData.companyName && { companyName: validatedData.companyName }),
            ...(validatedData.businessType && { businessType: validatedData.businessType }),
            ...(validatedData.taxId !== undefined && { taxId: validatedData.taxId }),
          },
        })
      }

      await prisma.user.update({
        where: { id: params.id },
        data: updateData,
      })
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        country: true,
        profilePhoto: true,
        isActive: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            businessType: true,
          },
        },
        // NO PASSWORD
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error: any) {
    console.error('PUT user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Company name required for supplier role') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return createAuthErrorResponse(error)
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = adminRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require ADMIN role
    const adminUser = await requireRole(request, ['ADMIN'])

    // Self-protection: Admin cannot delete their own account
    if (adminUser.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account. Use another admin account.' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        supplierProfile: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Last-admin protection: Cannot delete the last active ADMIN
    if (user.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
      })

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last active admin' },
          { status: 403 }
        )
      }
    }

    // Prefer soft delete (deactivate) if user has orders
    if (user._count.orders > 0) {
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'User deactivated (has order history)',
        action: 'deactivated',
      })
    }

    // Hard delete if no orders
    await prisma.$transaction(async (tx) => {
      // Delete supplier profile if exists
      if (user.supplierProfile) {
        await tx.supplierProfile.delete({
          where: { id: user.supplierProfile.id },
        })
      }

      // Delete user (cascades to related records)
      await tx.user.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({
      message: 'User deleted successfully',
      action: 'deleted',
    })
  } catch (error: any) {
    console.error('DELETE user error:', error)
    return createAuthErrorResponse(error)
  }
}
