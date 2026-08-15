export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeSystemSetting } from '@/lib/utils/localize'

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en'
    const settings = await prisma.systemSettings.findFirst({
      include: {
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, key: true, value: true }
        }
      }
    })

    if (settings) {
      return NextResponse.json({
        data: {
          name: localizeSystemSetting(settings.translations, 'companyName', settings.companyName, locale),
          logo: settings.companyLogo,
          logoHeight: settings.companyLogoHeight,
          description: localizeSystemSetting(settings.translations, 'companyDescription', settings.companyDescription, locale),
          phone: settings.companyPhone,
          email: settings.companyEmail,
          address: settings.companyAddress,
        }
      })
    }
    
    // Fallback if system settings not found
    return NextResponse.json({
      data: {
        name: 'Global Trade',
        logo: null,
        logoHeight: 40
      }
    })
  } catch (error) {
    console.error("API Company Error:", error)
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 })
  }
}