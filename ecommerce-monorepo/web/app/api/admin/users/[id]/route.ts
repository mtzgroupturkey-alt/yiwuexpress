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

  return null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        quotes: {
          include: {
            service: {
              select: {
                name: true,
                type: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        shipments: {
          include: {
            service: {
              select: {
                name: true,
                type: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        company: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      role 
    } = body

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== params.id) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (companyName !== undefined) updateData.companyName = companyName
    if (businessType !== undefined) updateData.businessType = businessType
    if (taxId !== undefined) updateData.taxId = taxId
    if (country !== undefined) updateData.country = country
    if (phone !== undefined) updateData.phone = phone
    if (role) updateData.role = role

    // Handle password update separately
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Update user error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    // Check if user has associated data
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        quotes: true,
        shipments: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting admin users
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    // If user has associated data, we should handle it carefully
    if (user.quotes.length > 0 || user.shipments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with existing quotes or shipments',
          quotes: user.quotes.length,
          shipments: user.shipments.length
        },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}