import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

// PUT update user's permission role and custom permissions
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { roleId, customPermissions } = body

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        roleId: roleId || null
      }
    })

    // Update custom permissions if provided
    if (customPermissions) {
      // Delete existing custom permissions
      await prisma.userPermission.deleteMany({
        where: { userId: params.userId }
      })

      // Create new custom permissions
      if (customPermissions.length > 0) {
        await prisma.userPermission.createMany({
          data: customPermissions.map((perm: any) => ({
            userId: params.userId,
            resource: perm.resource,
            canView: perm.canView || false,
            canCreate: perm.canCreate || false,
            canEdit: perm.canEdit || false,
            canDelete: perm.canDelete || false,
          }))
        })
      }
    }

    // Fetch updated user with permissions
    const result = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        permissionRole: {
          include: {
            permissions: true
          }
        },
        customPermissions: true
      }
    })

    return NextResponse.json({ user: result })
  } catch (error) {
    console.error('Update user permissions error:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}
