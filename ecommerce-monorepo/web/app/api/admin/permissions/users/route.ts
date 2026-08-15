export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET users with their permission roles
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN'])

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'STAFF'] } // Only show admin panel users
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        roleId: true,
        createdAt: true,
        permissionRole: {
          include: {
            permissions: true
          }
        },
        customPermissions: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return createAuthErrorResponse(error as Error)
  }
}
