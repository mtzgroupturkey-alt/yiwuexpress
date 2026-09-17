export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeHeroSlide } from '@/lib/utils/localize'

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en'

    const allSlides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { translations: true },
    })

    // Separate main rotating slides from side feature banners
    const mainSlides = allSlides.filter(
      (s) => s.motionType !== 'side_top' && s.motionType !== 'side_bottom'
    )
    const sideTopSlide = allSlides.find((s) => s.motionType === 'side_top')
    const sideBottomSlide = allSlides.find((s) => s.motionType === 'side_bottom')

    const data = mainSlides.map((s) => localizeHeroSlide(s, locale))
    const sideBanners = {
      top: sideTopSlide ? localizeHeroSlide(sideTopSlide, locale) : null,
      bottom: sideBottomSlide ? localizeHeroSlide(sideBottomSlide, locale) : null,
    }

    return NextResponse.json({
      data,
      sideBanners,
    })
  } catch (error) {
    console.error('Failed to fetch hero slides:', error)
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
  }
}
