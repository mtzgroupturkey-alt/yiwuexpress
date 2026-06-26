import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Note: CORS is handled globally by next.config.js

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const service = await prisma.service.findUnique({
      where: { id },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}