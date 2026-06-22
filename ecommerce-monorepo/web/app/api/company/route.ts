import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return addCorsHeaders(response)
    }

    const token = authHeader.substring(7)
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      return addCorsHeaders(response)
    }

    // Get user company information from CompanyInfo table
    let companyInfo = await prisma.companyInfo.findUnique({
      where: { userId: decoded.userId },
    })

    // If no company info exists, create one with user data
    if (!companyInfo) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          companyName: true,
          phone: true,
          email: true,
          taxId: true,
          country: true,
        },
      })

      if (user) {
        companyInfo = await prisma.companyInfo.create({
          data: {
            userId: decoded.userId,
            name: user.companyName || '',
            address: user.country || '',
            phone: user.phone || '',
            email: user.email,
            taxId: user.taxId || null,
          },
        })
      }
    }

    if (!companyInfo) {
      const response = NextResponse.json({ error: 'Company info not found' }, { status: 404 })
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ company: companyInfo })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Get company info error:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return addCorsHeaders(response)
    }

    const token = authHeader.substring(7)
    let decoded: any
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      return addCorsHeaders(response)
    }

    const body = await request.json()
    
    // Upsert company information
    const companyInfo = await prisma.companyInfo.upsert({
      where: { userId: decoded.userId },
      create: {
        userId: decoded.userId,
        name: body.name || '',
        address: body.address || '',
        phone: body.phone || '',
        email: body.email || '',
        licenseNumber: body.licenseNumber || null,
        taxId: body.taxId || null,
        description: body.description || null,
      },
      update: {
        name: body.name || undefined,
        address: body.address || undefined,
        phone: body.phone || undefined,
        email: body.email || undefined,
        licenseNumber: body.licenseNumber || undefined,
        taxId: body.taxId || undefined,
        description: body.description || undefined,
      },
    })

    const response = NextResponse.json({ company: companyInfo, message: 'Company info updated successfully' })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Update company info error:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return addCorsHeaders(response)
  }
}