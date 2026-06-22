import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

// GET single role
export async function GET(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const role = await prisma.permissionRole.findUnique({
      where: { id: params.roleId },
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            companyName: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

// PUT update role
export async function PUT(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, permissions } = body

    // Check if role exists and is not a system role
    const existingRole = await prisma.permissionRole.findUnique({
      where: { id: params.roleId }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existingRole.isSystem && name !== existingRole.name) {
      return NextResponse.json({ error: 'Cannot rename system roles' }, { status: 400 })
    }

    // Update role and permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: params.roleId }
    })

    const role = await prisma.permissionRole.update({
      where: { id: params.roleId },
      data: {
        name,
        description,
        permissions: {
          create: permissions.map((p: any) => ({
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

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE role
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const role = await prisma.permissionRole.findUnique({
      where: { id: params.roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 })
    }

    if (role._count.users > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role assigned to ${role._count.users} user(s)` 
      }, { status: 400 })
    }

    await prisma.permissionRole.delete({
      where: { id: params.roleId }
    })

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Delete role error:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
