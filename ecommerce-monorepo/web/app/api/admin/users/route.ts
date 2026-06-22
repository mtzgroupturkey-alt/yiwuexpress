import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  return null // No error
}

export async function GET(request: NextRequest) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (role) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get users with pagination and counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          businessType: true,
          taxId: true,
          country: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              quotes: true,
              shipments: true,
            }
          }
        },
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
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { 
      email, 
      password, 
      name, 
      companyName, 
      businessType, 
      taxId, 
      country, 
      phone, 
      role = 'USER' 
    } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        businessType,
        taxId,
        country,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        businessType: true,
        taxId: true,
        country: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}