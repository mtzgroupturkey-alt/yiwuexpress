export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/settings - Get system settings
export async function GET(request: Request) {
  try {
    // SystemSettings is a singleton addressed by singletonKey.
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
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
    // Authorization: only ADMIN may change system settings.
    await requireRole(request, ['ADMIN'])

    const body = await request.json()

    // SystemSettings is a singleton addressed by singletonKey. Upsert so a
    // save always targets the one canonical row instead of spawning a new one.
    const settings = await prisma.systemSettings.upsert({
      where: { singletonKey: 'SINGLETON' },
      update: body,
      create: { ...body, singletonKey: 'SINGLETON' },
    })

    return NextResponse.json({
      success: true,
      settings: settings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
