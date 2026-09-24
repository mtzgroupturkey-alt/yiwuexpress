export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

function updateDiskManifest(name?: string, desc?: string) {
  try {
    const companyName = name?.trim() || 'Dromkok'
    const description = desc?.trim() || `${companyName} - Global Trade & Logistics Platform from China`

    const manifestData = {
      name: `${companyName} - E-Commerce & Freight Platform`,
      short_name: companyName,
      description,
      start_url: '/en',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#00407a',
      theme_color: '#00407a',
      icons: [
        { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      ],
      shortcuts: [
        { name: 'Catalog', short_name: 'Catalog', description: 'Browse wholesale products', url: '/en/store', icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }] },
        { name: 'Shopping Cart', short_name: 'Cart', description: 'View shopping cart and checkout', url: '/en/cart', icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }] },
        { name: 'Freight Quotes', short_name: 'Quote', description: 'Submit RFQ and calculate freight', url: '/en/calculator', icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }] },
      ],
    }

    const targetPaths = [
      path.join(process.cwd(), 'public', 'manifest.json'),
      path.join(process.cwd(), 'web', 'public', 'manifest.json'),
      '/www/wwwroot/www.dromkok.com/web/public/manifest.json',
      '/www/wwwroot/www.dromkok.com/public/manifest.json',
    ]

    for (const p of targetPaths) {
      try {
        if (fs.existsSync(path.dirname(p))) {
          fs.writeFileSync(p, JSON.stringify(manifestData, null, 2), 'utf8')
        }
      } catch {}
    }
  } catch (err) {
    console.error('[company/route] Failed to sync manifest.json to disk:', err)
  }
}

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

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'Global Trade',
  siteTagline: '',
  companyAddress: 'China',
  companyPhone: '+86 579 8555 1234',
  companyEmail: 'info@dromkok.com',
  companyWebsite: 'https://dromkok.com',
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
  storeHours: '08:00 – 23:00',
  freeShippingThreshold: 35.00,
  announcementTicker: '',
  translations: [],
}

// GET /api/admin/settings/company - Get company settings (Admin)
export async function GET(request: Request) {
  try {
    let settings: any = null

    try {
      settings = await prisma.systemSettings.findFirst()
    } catch (prismaErr: any) {
      console.warn('[company/route] prisma.systemSettings.findFirst error, falling back to raw query:', prismaErr?.message)
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "system_settings" LIMIT 1`)
        if (rows && rows.length > 0) {
          settings = rows[0]
        }
      } catch (rawErr) {
        console.error('[company/route] Raw query for system_settings also failed:', rawErr)
      }
    }

    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_COMPANY_SETTINGS,
      })
    }

    let translations: any[] = []
    if (settings.id) {
      try {
        translations = await prisma.systemSettingTranslation.findMany({
          where: { systemSettingId: settings.id },
        })
      } catch (err) {
        console.error('Failed to load company translations:', err)
      }
    }

    const companyData = {
      companyName: settings.companyName || DEFAULT_COMPANY_SETTINGS.companyName,
      siteTagline: settings.siteTagline || DEFAULT_COMPANY_SETTINGS.siteTagline,
      companyAddress: settings.companyAddress || DEFAULT_COMPANY_SETTINGS.companyAddress,
      companyPhone: settings.companyPhone || DEFAULT_COMPANY_SETTINGS.companyPhone,
      companyEmail: settings.companyEmail || DEFAULT_COMPANY_SETTINGS.companyEmail,
      companyWebsite: settings.companyWebsite || DEFAULT_COMPANY_SETTINGS.companyWebsite,
      businessLicense: settings.businessLicense || DEFAULT_COMPANY_SETTINGS.businessLicense,
      taxRegistrationNumber: settings.taxRegistrationNumber || DEFAULT_COMPANY_SETTINGS.taxRegistrationNumber,
      companyDescription: settings.companyDescription || DEFAULT_COMPANY_SETTINGS.companyDescription,
      companyLogo: settings.companyLogo || DEFAULT_COMPANY_SETTINGS.companyLogo,
      companyLogoHeight: settings.companyLogoHeight || DEFAULT_COMPANY_SETTINGS.companyLogoHeight,
      companyFavicon: settings.companyFavicon || DEFAULT_COMPANY_SETTINGS.companyFavicon,
      primaryColor: settings.primaryColor || DEFAULT_COMPANY_SETTINGS.primaryColor,
      accentColor: settings.accentColor || DEFAULT_COMPANY_SETTINGS.accentColor,
      currency: settings.currency || DEFAULT_COMPANY_SETTINGS.currency,
      timezone: settings.timezone || DEFAULT_COMPANY_SETTINGS.timezone,
      language: settings.language || DEFAULT_COMPANY_SETTINGS.language,
      facebookUrl: settings.facebookUrl || DEFAULT_COMPANY_SETTINGS.facebookUrl,
      twitterUrl: settings.twitterUrl || DEFAULT_COMPANY_SETTINGS.twitterUrl,
      linkedinUrl: settings.linkedinUrl || DEFAULT_COMPANY_SETTINGS.linkedinUrl,
      instagramUrl: settings.instagramUrl || DEFAULT_COMPANY_SETTINGS.instagramUrl,
      wechatId: settings.wechatId || DEFAULT_COMPANY_SETTINGS.wechatId,
      whatsappNumber: settings.whatsappNumber || DEFAULT_COMPANY_SETTINGS.whatsappNumber,
      storeHours: settings.storeHours || DEFAULT_COMPANY_SETTINGS.storeHours,
      freeShippingThreshold: settings.freeShippingThreshold !== undefined && settings.freeShippingThreshold !== null ? settings.freeShippingThreshold : DEFAULT_COMPANY_SETTINGS.freeShippingThreshold,
      announcementTicker: settings.announcementTicker || DEFAULT_COMPANY_SETTINGS.announcementTicker,
      translations,
    }

    return NextResponse.json({
      success: true,
      settings: companyData,
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    // Never return 500 to frontend for company settings; fallback gracefully
    return NextResponse.json({
      success: true,
      settings: DEFAULT_COMPANY_SETTINGS,
    })
  }
}

// PUT /api/admin/settings/company - Update company settings (Admin)
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    let existing: any = null
    try {
      existing = await prisma.systemSettings.findFirst()
    } catch {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "system_settings" LIMIT 1`)
        if (rows && rows.length > 0) existing = rows[0]
      } catch {}
    }

    const freeShippingThreshold = body.freeShippingThreshold !== undefined ? (parseFloat(body.freeShippingThreshold) || 0) : undefined

    if (existing) {
      let settings: any = null
      try {
        settings = await prisma.systemSettings.update({
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
            whatsappNumber: body.whatsappNumber,
            storeHours: body.storeHours !== undefined ? body.storeHours : undefined,
            freeShippingThreshold,
            announcementTicker: body.announcementTicker !== undefined ? body.announcementTicker : undefined,
          },
        })
      } catch (updateErr: any) {
        console.warn('Prisma update on systemSettings failed, attempting core field update:', updateErr?.message)
        try {
          settings = await prisma.systemSettings.update({
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
              language: body.language,
              facebookUrl: body.facebookUrl,
              twitterUrl: body.twitterUrl,
              linkedinUrl: body.linkedinUrl,
              instagramUrl: body.instagramUrl,
              wechatId: body.wechatId,
              whatsappNumber: body.whatsappNumber,
            },
          })
        } catch {
          settings = { ...existing, ...body }
        }
      }

      if (settings?.id && body.translations && Array.isArray(body.translations)) {
        try {
          const upserts = buildSystemSettingTranslationUpserts(settings.id, body.translations)
          if (upserts.length) await prisma.$transaction(upserts)
        } catch (err) {
          console.error('Failed to upsert company translations:', err)
        }
      }

      let translations: any[] = []
      if (settings?.id) {
        try {
          translations = await prisma.systemSettingTranslation.findMany({
            where: { systemSettingId: settings.id },
          })
        } catch (err) {
          console.error('Failed to load company translations:', err)
        }
      }

      if (body.companyName) {
        updateDiskManifest(body.companyName, body.companyDescription)
      }

      return NextResponse.json({
        success: true,
        settings: { ...(settings || existing), translations },
        message: 'Company settings updated successfully',
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
          storeHours: body.storeHours || '08:00 – 23:00',
          freeShippingThreshold: body.freeShippingThreshold !== undefined ? parseFloat(body.freeShippingThreshold) || 35.0 : 35.0,
          announcementTicker: body.announcementTicker || null,
        },
      })

      if (body.translations && Array.isArray(body.translations)) {
        try {
          const upserts = buildSystemSettingTranslationUpserts(settings.id, body.translations)
          if (upserts.length) await prisma.$transaction(upserts)
        } catch (err) {
          console.error('Failed to load company translations:', err)
        }
      }

      let createTranslations: any[] = []
      try {
        createTranslations = await prisma.systemSettingTranslation.findMany({
          where: { systemSettingId: settings.id },
        })
      } catch (err) {
        console.error('Failed to load company translations:', err)
      }

      updateDiskManifest(body.companyName, body.companyDescription)

      return NextResponse.json({
        success: true,
        settings: { ...settings, translations: createTranslations },
        message: 'Company settings created successfully',
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update company settings', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/company - Also handle POST (same as PUT for compatibility)
export async function POST(request: Request) {
  return PUT(request)
}
