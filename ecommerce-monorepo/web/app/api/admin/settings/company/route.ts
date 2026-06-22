import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get system settings
    let settings = await prisma.systemSettings.findFirst()

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'YIWU EXPRESS',
          companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
          companyPhone: '+86 579 8555 1234',
          companyEmail: 'info@yiwuexpress.com',
          companyWebsite: 'https://yiwuexpress.com',
          businessLicense: '',
          taxRegistrationNumber: '',
          companyDescription: 'Leading logistics and trade services provider connecting China to the world',
          companyLogo: '',
          companyFavicon: '',
          primaryColor: '#1a3a5c',
          accentColor: '#c9a84c',
          currency: 'USD',
          timezone: 'Asia/Shanghai',
          language: 'en',
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Company settings get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Find existing settings or create new
    let settings = await prisma.systemSettings.findFirst()

    if (settings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          companyName: body.companyName,
          companyAddress: body.companyAddress || null,
          companyPhone: body.companyPhone || null,
          companyEmail: body.companyEmail || null,
          companyWebsite: body.companyWebsite || null,
          businessLicense: body.businessLicense || null,
          taxRegistrationNumber: body.taxRegistrationNumber || null,
          companyDescription: body.companyDescription || null,
          companyLogo: body.companyLogo || null,
          companyFavicon: body.companyFavicon || null,
          primaryColor: body.primaryColor || '#1a3a5c',
          accentColor: body.accentColor || '#c9a84c',
          currency: body.currency || 'USD',
          timezone: body.timezone || 'Asia/Shanghai',
          language: body.language || 'en',
        }
      })
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          companyName: body.companyName,
          companyAddress: body.companyAddress || null,
          companyPhone: body.companyPhone || null,
          companyEmail: body.companyEmail || null,
          companyWebsite: body.companyWebsite || null,
          businessLicense: body.businessLicense || null,
          taxRegistrationNumber: body.taxRegistrationNumber || null,
          companyDescription: body.companyDescription || null,
          companyLogo: body.companyLogo || null,
          companyFavicon: body.companyFavicon || null,
          primaryColor: body.primaryColor || '#1a3a5c',
          accentColor: body.accentColor || '#c9a84c',
          currency: body.currency || 'USD',
          timezone: body.timezone || 'Asia/Shanghai',
          language: body.language || 'en',
        }
      })
    }

    return NextResponse.json({ settings, message: 'Company settings updated successfully' })
  } catch (error) {
    console.error('Company settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}