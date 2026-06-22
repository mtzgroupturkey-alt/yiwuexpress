import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

// GET all permission roles
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const roles = await prisma.permissionRole.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

// POST create new role
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, permissions } = body

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Check if role name already exists
    const existing = await prisma.permissionRole.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    // Create role with permissions
    const role = await prisma.permissionRole.create({
      data: {
        name,
        description,
        permissions: {
          create: (permissions || []).map((p: any) => ({
            resource: p.resource,
            canView: p.canView || false,
            canCreate: p.canCreate || false,
            canEdit: p.canEdit || false,
            canDelete: p.canDelete || false,
          }))
        }
      },
      include: {
        permissions: true
      }
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
