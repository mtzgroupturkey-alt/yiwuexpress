import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Note: CORS is handled globally by next.config.js

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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
      return NextResponse.json({ error: 'Company info not found' }, { status: 404 })
    }

    return NextResponse.json({ company: companyInfo })
  } catch (error) {
    console.error('Get company info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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

    return NextResponse.json({ company: companyInfo, message: 'Company info updated successfully' })
  } catch (error) {
    console.error('Update company info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}