import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireRole, createAuthErrorResponse } from '@/lib/auth'
import { adminRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'SUPPLIER', 'ADMIN']),
  phone: z.string().optional(),
  country: z.string().optional(),
  // Supplier fields
  companyName: z.string().optional(),
  businessType: z.enum(['MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR']).optional(),
  taxId: z.string().optional(),
  profilePhoto: z.string().optional(),
})

// GET /api/admin/users - List all users (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = adminRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require ADMIN role
    await requireRole(request, ['ADMIN'])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyName: true,
          businessType: true,
          taxId: true,
          phone: true,
          country: true,
          profilePhoto: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roleId: true,
          permissionRole: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              quotes: true,
              shipments: true,
            },
          },
          // NO PASSWORD
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('GET users error:', error)
    return createAuthErrorResponse(error)
  }
}

// POST /api/admin/users - Create user (ADMIN only, any role)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = adminRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require ADMIN role
    const adminUser = await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Unable to create user with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user based on role
    if (validatedData.role === 'SUPPLIER') {
      // Validate required supplier fields
      if (!validatedData.companyName) {
        return NextResponse.json(
          { error: 'Company name is required for supplier accounts' },
          { status: 400 }
        )
      }

      // Create supplier profile and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create supplier profile first
        const supplierProfile = await tx.supplierProfile.create({
          data: {
            companyName: validatedData.companyName!,
            businessType: validatedData.businessType,
            taxId: validatedData.taxId,
            phone: validatedData.phone,
          },
        })

        // Create user linked to supplier profile
        const user = await tx.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: 'SUPPLIER',
            phone: validatedData.phone,
            country: validatedData.country,
            isActive: true,
            isVerified: true,
            supplierId: supplierProfile.id,
            profilePhoto: validatedData.profilePhoto,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
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

        return user
      })

      return NextResponse.json({
        user: result,
        message: 'Supplier account created successfully',
      })
    } else {
      // Create regular USER or ADMIN
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
          phone: validatedData.phone,
          country: validatedData.country,
          isActive: true,
          isVerified: true,
          profilePhoto: validatedData.profilePhoto,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
          // NO PASSWORD
        },
      })

      return NextResponse.json({
        user,
        message: `${validatedData.role} account created successfully`,
      })
    }
  } catch (error: any) {
    console.error('POST user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return createAuthErrorResponse(error)
  }
}
