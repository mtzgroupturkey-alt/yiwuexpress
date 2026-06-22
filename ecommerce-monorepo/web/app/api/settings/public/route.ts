import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { addCorsHeaders, handleOptions } from '@/lib/api-middleware'

// Handle OPTIONS preflight request
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

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
        companyFavicon: '',
        primaryColor: '#1a3a5c',
        accentColor: '#c9a84c',
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        language: 'en',
      }
    }

    return addCorsHeaders(NextResponse.json({ settings }), request)
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
      companyFavicon: '',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
    }

    return addCorsHeaders(NextResponse.json({ settings: defaultSettings }), request)
  }
}