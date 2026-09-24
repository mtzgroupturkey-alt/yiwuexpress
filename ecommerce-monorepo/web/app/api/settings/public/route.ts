export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeSystemSetting } from '@/lib/utils/localize'
import fs from 'fs'
import path from 'path'

// Note: CORS is handled globally by next.config.js

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'en'

    // Get system settings (public information only)
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
      select: {
        companyName: true,
        siteTagline: true,
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
        rfqModel: true,
        wholesaleDefaultMoq: true,
        rfqEnabled: true,
        wholesaleEnabled: true,
        retailEnabled: true,
        facebookUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        instagramUrl: true,
        whatsappNumber: true,
        wechatId: true,
        storeHours: true,
        freeShippingThreshold: true,
        announcementTicker: true,
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, key: true, value: true }
        }
      }
    })

    // If no settings exist, use defaults
    const effectiveSettings = settings ?? {
      companyName: 'Global Trade',
      siteTagline: 'Global Trade & Logistics Platform',
      companyAddress: 'China',
      companyPhone: '+86 579 8555 1234',
      companyEmail: 'info@dromkok.com',
      companyWebsite: 'https://dromkok.com',
      companyDescription: 'Leading logistics and trade services provider connecting China to the world',
      companyLogo: '/logo.png',
      companyLogoHeight: 40,
      companyFavicon: '/favicon.svg',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
      storeMode: 'WHOLESALE',
      rfqModel: 'RFQ',
      wholesaleDefaultMoq: 1,
      rfqEnabled: true,
      wholesaleEnabled: true,
      retailEnabled: true,
      facebookUrl: null,
      twitterUrl: null,
      linkedinUrl: null,
      instagramUrl: null,
      whatsappNumber: null,
      wechatId: null,
      storeHours: '08:00 – 23:00',
      freeShippingThreshold: 35.00,
      announcementTicker: null,
      translations: []
    }

    // Expand-and-Contract read-path localization for company-facing copy.
    const localizedName = localizeSystemSetting(effectiveSettings.translations, 'companyName', effectiveSettings.companyName, locale)
    const localizedTagline = localizeSystemSetting(effectiveSettings.translations, 'siteTagline', effectiveSettings.siteTagline, locale)
    const localizedDescription = localizeSystemSetting(effectiveSettings.translations, 'companyDescription', effectiveSettings.companyDescription, locale)

    const { translations, ...publicSettings } = effectiveSettings


    // Verify companyLogo file exists on disk; if missing, fall back to /logo.png
    let resolvedLogo = publicSettings.companyLogo || '/logo.png'
    if (resolvedLogo.startsWith('/uploads/')) {
      const relative = resolvedLogo.replace(/^\/uploads\//, '')
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relative),
        path.join(process.cwd(), 'web', 'public', 'uploads', relative),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', relative),
      ]
      const exists = possiblePaths.some((p) => {
        try {
          return fs.existsSync(p)
        } catch {
          return false
        }
      })
      if (!exists) {
        resolvedLogo = '/logo.png'
      } else {
        resolvedLogo = `/api${resolvedLogo}`
      }
    } else if (resolvedLogo.startsWith('uploads/')) {
      resolvedLogo = `/api/${resolvedLogo}`
    }

    let resolvedFavicon = publicSettings.companyFavicon || '/favicon.svg'
    if (resolvedFavicon.startsWith('/uploads/')) {
      const relative = resolvedFavicon.replace(/^\/uploads\//, '')
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relative),
        path.join(process.cwd(), 'web', 'public', 'uploads', relative),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', relative),
      ]
      const exists = possiblePaths.some((p) => {
        try {
          return fs.existsSync(p)
        } catch {
          return false
        }
      })
      if (!exists) {
        resolvedFavicon = '/favicon.ico'
      } else {
        resolvedFavicon = `/api${resolvedFavicon}`
      }
    } else if (resolvedFavicon.startsWith('uploads/')) {
      resolvedFavicon = `/api/${resolvedFavicon}`
    }

    return NextResponse.json({
      settings: {
        ...publicSettings,
        companyLogo: resolvedLogo,
        companyFavicon: resolvedFavicon,
        companyName: localizedName,
        siteTagline: localizedTagline || publicSettings.siteTagline,
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
      companyEmail: 'info@dromkok.com',
      companyWebsite: 'https://dromkok.com',
      companyDescription: 'Leading logistics and trade services provider connecting China to the world',
      companyLogo: '/logo.png',
      companyLogoHeight: 40,
      companyFavicon: '/favicon.svg',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
      storeMode: 'WHOLESALE',
      storeHours: '08:00 – 23:00',
      freeShippingThreshold: 35.00,
      announcementTicker: null,
    }

    return NextResponse.json({ settings: defaultSettings })
  }
}