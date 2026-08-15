export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeSystemSetting } from '@/lib/utils/localize'

// Note: CORS is handled globally by next.config.js

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'en'

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
        storeMode: true,
        // Don't expose sensitive information
        businessLicense: false,
        taxRegistrationNumber: false,
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, key: true, value: true }
        }
      }
    })

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        companyName: 'Global Trade',
        companyAddress: 'China',
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
        storeMode: 'WHOLESALE',
        translations: []
      }
    }

    // Expand-and-Contract read-path localization for company-facing copy.
    const localizedName = localizeSystemSetting(settings.translations, 'companyName', settings.companyName, locale)
    const localizedDescription = localizeSystemSetting(settings.translations, 'companyDescription', settings.companyDescription, locale)

    const { translations, ...publicSettings } = settings

    return NextResponse.json({
      settings: {
        ...publicSettings,
        companyName: localizedName,
        companyDescription: localizedDescription,
      }
    })
  } catch (error) {
    console.error('Public settings error:', error)

    // Return default settings on error
    const defaultSettings = {
      companyName: 'Global Trade',
      companyAddress: 'China',
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
      storeMode: 'WHOLESALE',
    }

    return NextResponse.json({ settings: defaultSettings })
  }
}