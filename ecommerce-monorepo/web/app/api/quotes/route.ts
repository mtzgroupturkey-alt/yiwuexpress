import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quotes = await prisma.quote.findMany({
      where: { userId: user.userId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Get quotes error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { serviceId, serviceType, weight, dimensions, origin, destination, description } = body

    if (!serviceId || !serviceType || !origin || !destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const quote = await prisma.quote.create({
      data: {
        userId: user.userId,
        serviceId,
        serviceType,
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        origin,
        destination,
        description,
        status: 'PENDING',
      },
      include: {
        service: true
      }
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Create quote error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}