export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/settings - Get system settings
export async function GET(request: Request) {
  try {
    // Get first system settings record (there should only be one)
    const settings = await prisma.systemSettings.findFirst({
      include: { translations: true }, // Include translations
    })

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: {
          companyName: 'Global Trade',
          companyAddress: 'China, Zhejiang, China',
          companyPhone: '+86 579 8555 1234',
          companyEmail: 'info@globaltrade.com',
          companyWebsite: 'https://globaltrade.com',
          companyLogo: '',
          companyFavicon: '',
          primaryColor: '#1a3a5c',
          accentColor: '#c9a84c',
          currency: 'USD',
          timezone: 'Asia/Shanghai',
          language: 'en',
          // Contact and social media fallbacks
          facebookUrl: '',
          twitterUrl: '',
          linkedinUrl: '',
          instagramUrl: '',
          wechatId: '',
          whatsappNumber: '',
          translations: []
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: settings
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update system settings (Admin only)
export async function PUT(request: Request) {
  try {
    // TODO: Add authentication check for admin
    const body = await request.json()

    // Get existing settings
    const existing = await prisma.systemSettings.findFirst()

    if (existing) {
      // Update existing settings
      const settings = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: body
      })

      return NextResponse.json({
        success: true,
        settings: settings,
        message: 'Settings updated successfully'
      })
    } else {
      // Create new settings
      const settings = await prisma.systemSettings.create({
        data: body
      })

      return NextResponse.json({
        success: true,
        settings: settings,
        message: 'Settings created successfully'
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
