import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Add CORS headers to response
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
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
      const response = NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ service })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Get service error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}