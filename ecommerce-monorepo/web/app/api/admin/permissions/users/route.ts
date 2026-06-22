import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

// GET users with their permission roles
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
