import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/settings/company - Get company settings (Admin)
export async function GET(request: Request) {
  try {
    // TODO: Add authentication check for admin

    const settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      // Return default company settings
      return NextResponse.json({
        success: true,
        settings: {
          companyName: 'YIWU EXPRESS',
          companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
          companyPhone: '+86 579 8555 1234',
          companyEmail: 'info@yiwuexpress.com',
          companyWebsite: 'https://yiwuexpress.com',
          businessLicense: '',
          taxRegistrationNumber: '',
          companyDescription: 'Leading logistics and trade services provider connecting China to the world.',
          companyLogo: '',
          companyLogoHeight: 40,
          companyFavicon: '',
          primaryColor: '#1a3a5c',
          accentColor: '#c9a84c',
          currency: 'USD',
          timezone: 'Asia/Shanghai',
          language: 'en'
        }
      })
    }

    // Return company-specific settings including branding
    const companyData = {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      companyEmail: settings.companyEmail,
      companyWebsite: settings.companyWebsite,
      businessLicense: settings.businessLicense,
      taxRegistrationNumber: settings.taxRegistrationNumber,
      companyDescription: settings.companyDescription,
      companyLogo: settings.companyLogo,
      companyLogoHeight: settings.companyLogoHeight,
      companyFavicon: settings.companyFavicon,
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      currency: settings.currency,
      timezone: settings.timezone,
      language: settings.language
    }

    return NextResponse.json({
      success: true,
      settings: companyData
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings/company - Update company settings (Admin)
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
        data: {
          companyName: body.companyName,
          companyAddress: body.companyAddress,
          companyPhone: body.companyPhone,
          companyEmail: body.companyEmail,
          companyWebsite: body.companyWebsite,
          businessLicense: body.businessLicense,
          taxRegistrationNumber: body.taxRegistrationNumber,
          companyDescription: body.companyDescription,
          companyLogo: body.companyLogo,
          companyLogoHeight: body.companyLogoHeight || 40,
          companyFavicon: body.companyFavicon,
          primaryColor: body.primaryColor,
          accentColor: body.accentColor,
          currency: body.currency,
          timezone: body.timezone,
          language: body.language
        }
      })

      return NextResponse.json({
        success: true,
        settings: settings,
        message: 'Company settings updated successfully'
      })
    } else {
      // Create new settings with company data
      const settings = await prisma.systemSettings.create({
        data: {
          companyName: body.companyName || 'YIWU EXPRESS',
          companyAddress: body.companyAddress,
          companyPhone: body.companyPhone,
          companyEmail: body.companyEmail,
          companyWebsite: body.companyWebsite,
          businessLicense: body.businessLicense,
          taxRegistrationNumber: body.taxRegistrationNumber,
          companyDescription: body.companyDescription,
          companyLogo: body.companyLogo,
          companyLogoHeight: body.companyLogoHeight || 40,
          companyFavicon: body.companyFavicon,
          primaryColor: body.primaryColor || '#1a3a5c',
          accentColor: body.accentColor || '#c9a84c',
          currency: body.currency || 'USD',
          timezone: body.timezone || 'Asia/Shanghai',
          language: body.language || 'en'
        }
      })

      return NextResponse.json({
        success: true,
        settings: settings,
        message: 'Company settings created successfully'
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update company settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/company - Also handle POST (same as PUT for compatibility)
export async function POST(request: Request) {
  return PUT(request)
}
