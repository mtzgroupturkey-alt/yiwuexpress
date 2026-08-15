export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Translations are accepted as: translations: Array<{ locale, key, value }>
// (matching the unique [systemSettingId, locale, key] constraint).
function buildSystemSettingTranslationUpserts(settingsId: string, translations: any[]) {
  const rows = (translations || []).filter(
    (t) => t && t.locale && t.key && (t.value ?? '').toString().trim().length > 0
  )
  if (!rows.length) return []
  return rows.map((t) =>
    prisma.systemSettingTranslation.upsert({
      where: {
        systemSettingId_locale_key: {
          systemSettingId: settingsId,
          locale: t.locale,
          key: t.key,
        },
      },
      create: {
        systemSettingId: settingsId,
        locale: t.locale,
        key: t.key,
        value: t.value.toString().trim(),
      },
      update: { value: t.value.toString().trim() },
    })
  )
}

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
          companyName: 'Global Trade',
          siteTagline: '',
          companyAddress: 'China',
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
          language: 'en',
          facebookUrl: '',
          twitterUrl: '',
          linkedinUrl: '',
          instagramUrl: '',
          wechatId: '',
          whatsappNumber: '',
          translations: [],
        }
      })
    }

    // Return company-specific settings including branding.
    // Translations are loaded separately so a missing/failed
    // `system_setting_translations` relation can never 500 the whole page.
    let translations: any[] = []
    try {
      translations = await prisma.systemSettingTranslation.findMany({
        where: { systemSettingId: settings.id },
      })
    } catch (err) {
      console.error('Failed to load company translations:', err)
    }

    const companyData = {
      companyName: settings.companyName,
      siteTagline: settings.siteTagline,
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
      language: settings.language,
      facebookUrl: settings.facebookUrl,
      twitterUrl: settings.twitterUrl,
      linkedinUrl: settings.linkedinUrl,
      instagramUrl: settings.instagramUrl,
      wechatId: settings.wechatId,
      whatsappNumber: settings.whatsappNumber,
      translations,
    }

    return NextResponse.json({
      success: true,
      settings: companyData
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company settings',
        detail: error instanceof Error ? error.message : String(error),
      },
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
          siteTagline: body.siteTagline,
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
          language: body.language,
          facebookUrl: body.facebookUrl,
          twitterUrl: body.twitterUrl,
          linkedinUrl: body.linkedinUrl,
          instagramUrl: body.instagramUrl,
          wechatId: body.wechatId,
          whatsappNumber: body.whatsappNumber
        }
      })

      // Dual-write: upsert per (locale, key) system setting translations.
      // Isolated so a missing/failed translation table can't roll back the
      // core settings save.
      try {
        const upserts = buildSystemSettingTranslationUpserts(settings.id, body.translations)
        if (upserts.length) await prisma.$transaction(upserts)
      } catch (err) {
        console.error('Failed to upsert company translations:', err)
      }

      const withTranslations = await prisma.systemSettings.findUnique({
        where: { id: settings.id },
      })
      let translations: any[] = []
      try {
        translations = await prisma.systemSettingTranslation.findMany({
          where: { systemSettingId: settings.id },
        })
      } catch (err) {
        console.error('Failed to load company translations:', err)
      }

      return NextResponse.json({
        success: true,
        settings: { ...withTranslations, translations },
        message: 'Company settings updated successfully'
      })
    } else {
      // Create new settings with company data
      const settings = await prisma.systemSettings.create({
        data: {
          companyName: body.companyName || 'Global Trade',
          siteTagline: body.siteTagline,
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
          language: body.language || 'en',
          facebookUrl: body.facebookUrl,
          twitterUrl: body.twitterUrl,
          linkedinUrl: body.linkedinUrl,
          instagramUrl: body.instagramUrl,
          wechatId: body.wechatId,
          whatsappNumber: body.whatsappNumber,
          translations: (body.translations || []).filter(
            (t: any) => t && t.locale && t.key && (t.value ?? '').toString().trim().length > 0
          ).map((t: any) => ({
            locale: t.locale,
            key: t.key,
            value: t.value.toString().trim(),
          })),
        },
      })

      let createTranslations: any[] = []
      try {
        createTranslations = await prisma.systemSettingTranslation.findMany({
          where: { systemSettingId: settings.id },
        })
      } catch (err) {
        console.error('Failed to load company translations:', err)
      }

      return NextResponse.json({
        success: true,
        settings: { ...settings, translations: createTranslations },
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
