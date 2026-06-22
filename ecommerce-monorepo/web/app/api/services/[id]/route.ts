import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addCorsHeaders, handleOptions } from '@/lib/api-middleware'

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

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
      return addCorsHeaders(
        NextResponse.json({ error: 'Service not found' }, { status: 404 }),
        request
      )
    }

    return addCorsHeaders(NextResponse.json({ service }), request)
  } catch (error) {
    console.error('Get service error:', error)
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      request
    )
  }
}