import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Note: CORS is handled globally by next.config.js

export async function GET(request: NextRequest) {
  try {
    // Get system settings (public information only)
    let settings = await prisma.systemSettings.findFirst({
      select: {
        companyName: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        companyDescription: true,
        companyLogo: true,
        companyLogoHeight: true,
        companyFavicon: true,
        primaryColor: true,
        accentColor: true,
        currency: true,
        timezone: true,
        language: true,
        // Don't expose sensitive information
        businessLicense: false,
        taxRegistrationNumber: false,
      }
    })

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        companyName: 'YIWU EXPRESS',
        companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
        companyPhone: '+86 579 8555 1234',
        companyEmail: 'info@yiwuexpress.com',
        companyWebsite: 'https://yiwuexpress.com',
        companyDescription: 'Leading logistics and trade services provider connecting China to the world',
        companyLogo: '',
        companyLogoHeight: 40,
        companyFavicon: '',
        primaryColor: '#1a3a5c',
        accentColor: '#c9a84c',
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        language: 'en',
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Public settings error:', error)

    // Return default settings on error
    const defaultSettings = {
      companyName: 'YIWU EXPRESS',
      companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
      companyPhone: '+86 579 8555 1234',
      companyEmail: 'info@yiwuexpress.com',
      companyWebsite: 'https://yiwuexpress.com',
      companyDescription: 'Leading logistics and trade services provider connecting China to the world',
      companyLogo: '',
      companyLogoHeight: 40,
      companyFavicon: '',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
    }

    return NextResponse.json({ settings: defaultSettings })
  }
}