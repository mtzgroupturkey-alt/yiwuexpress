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
        kitchenSectionEnabled: true,
        kitchenSectionTitle: true,
        kitchenSectionSubtitle: true,
        kitchenSectionBadge: true,
        kitchenSectionViewAllLabel: true,
        kitchenSectionCategoryIds: true,
        kitchenSectionPinnedProductIds: true,
        kitchenSectionMaxProducts: true,
        electronicsSectionEnabled: true,
        electronicsSectionTitle: true,
        electronicsSectionSubtitle: true,
        electronicsSectionBadge: true,
        electronicsSectionViewAllLabel: true,
        electronicsSectionCategoryIds: true,
        electronicsSectionPinnedProductIds: true,
        electronicsSectionMaxProducts: true,
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
      kitchenSectionEnabled: true,
      kitchenSectionTitle: 'Kitchenware, Cookware & Dining Essentials',
      kitchenSectionSubtitle: 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
      kitchenSectionBadge: 'KITCHEN & DINING',
      kitchenSectionViewAllLabel: 'View all Kitchen & Dining',
      kitchenSectionCategoryIds: null,
      kitchenSectionPinnedProductIds: null,
      kitchenSectionMaxProducts: 12,
      electronicsSectionEnabled: true,
      electronicsSectionTitle: 'Popular in Electronics & Appliances',
      electronicsSectionSubtitle: 'Official manufacturer equipment with factory guarantee',
      electronicsSectionBadge: 'ELECTRONICS & APPLIANCES',
      electronicsSectionViewAllLabel: 'View all in category',
      electronicsSectionCategoryIds: null,
      electronicsSectionPinnedProductIds: null,
      electronicsSectionMaxProducts: 8,
      translations: []
    }

    // Expand-and-Contract read-path localization for company-facing copy.
    const localizedName = localizeSystemSetting(effectiveSettings.translations, 'companyName', effectiveSettings.companyName, locale)
    const localizedTagline = localizeSystemSetting(effectiveSettings.translations, 'siteTagline', effectiveSettings.siteTagline, locale)
    const localizedDescription = localizeSystemSetting(effectiveSettings.translations, 'companyDescription', effectiveSettings.companyDescription, locale)

    // Localize Homepage Ads & Promo Banners (Weekly Mega Bargains & Member Club)
    const rawWbEnabled = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsEnabled', 'true', locale)
    const weeklyBargainsEnabled = rawWbEnabled !== 'false'
    const weeklyBargainsBadge = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsBadge', 'UP TO -40%', locale)
    const weeklyBargainsTag = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsTag', '', locale)
    const weeklyBargainsTitle = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsTitle', '', locale)
    const weeklyBargainsSubtitle = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsSubtitle', '', locale)
    const weeklyBargainsButtonText = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsButtonText', '', locale)
    const weeklyBargainsButtonLink = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsButtonLink', '', locale)

    const rawMcEnabled = localizeSystemSetting(effectiveSettings.translations, 'memberClubEnabled', 'true', locale)
    const memberClubEnabled = rawMcEnabled !== 'false'
    const memberClubBadge = localizeSystemSetting(effectiveSettings.translations, 'memberClubBadge', '', locale)
    const memberClubMembersCount = localizeSystemSetting(effectiveSettings.translations, 'memberClubMembersCount', '', locale)
    const memberClubTitle = localizeSystemSetting(effectiveSettings.translations, 'memberClubTitle', '', locale)
    const memberClubDescription = localizeSystemSetting(effectiveSettings.translations, 'memberClubDescription', '', locale)
    const memberClubActivateBtn = localizeSystemSetting(effectiveSettings.translations, 'memberClubActivateBtn', '', locale)
    const memberClubActivateLink = localizeSystemSetting(effectiveSettings.translations, 'memberClubActivateLink', '', locale)
    const memberClubHowPointsWork = localizeSystemSetting(effectiveSettings.translations, 'memberClubHowPointsWork', '', locale)
    const memberClubHowPointsLink = localizeSystemSetting(effectiveSettings.translations, 'memberClubHowPointsLink', '', locale)

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
        weeklyBargainsEnabled,
        weeklyBargainsBadge: weeklyBargainsBadge || 'UP TO -40%',
        weeklyBargainsTag: weeklyBargainsTag || null,
        weeklyBargainsTitle: weeklyBargainsTitle || null,
        weeklyBargainsSubtitle: weeklyBargainsSubtitle || null,
        weeklyBargainsButtonText: weeklyBargainsButtonText || null,
        weeklyBargainsButtonLink: weeklyBargainsButtonLink || null,
        memberClubEnabled,
        memberClubBadge: memberClubBadge || null,
        memberClubMembersCount: memberClubMembersCount || null,
        memberClubTitle: memberClubTitle || null,
        memberClubDescription: memberClubDescription || null,
        memberClubActivateBtn: memberClubActivateBtn || null,
        memberClubActivateLink: memberClubActivateLink || null,
        memberClubHowPointsWork: memberClubHowPointsWork || null,
        memberClubHowPointsLink: memberClubHowPointsLink || null,
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