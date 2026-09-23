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

    const LOCAL_FALLBACKS = [
      '/images/hero/hero-1.jpg',
      '/images/hero/hero-2.jpg',
      '/images/hero/hero-3.jpg',
    ]

    const data = mainSlides.map((s, idx) => {
      const fallback = LOCAL_FALLBACKS[idx % LOCAL_FALLBACKS.length]
      const sanitizedSlide = {
        ...s,
        imageUrl: (!s.imageUrl || s.imageUrl.includes('unsplash.com')) ? fallback : s.imageUrl,
        mobileImageUrl: (!s.mobileImageUrl || s.mobileImageUrl.includes('unsplash.com')) ? fallback : s.mobileImageUrl,
      }
      return localizeHeroSlide(sanitizedSlide, locale)
    })

    const sideBanners = {
      top: sideTopSlide ? localizeHeroSlide({
        ...sideTopSlide,
        imageUrl: (!sideTopSlide.imageUrl || sideTopSlide.imageUrl.includes('unsplash.com')) ? LOCAL_FALLBACKS[0] : sideTopSlide.imageUrl,
      }, locale) : null,
      bottom: sideBottomSlide ? localizeHeroSlide({
        ...sideBottomSlide,
        imageUrl: (!sideBottomSlide.imageUrl || sideBottomSlide.imageUrl.includes('unsplash.com')) ? LOCAL_FALLBACKS[1] : sideBottomSlide.imageUrl,
      }, locale) : null,
    }

    // Background self-healing: Update database rows if they still reference blocked Unsplash URLs
    if (allSlides.some(s => s.imageUrl?.includes('unsplash.com') || s.mobileImageUrl?.includes('unsplash.com'))) {
      prisma.heroSlide.findMany({
        where: {
          OR: [
            { imageUrl: { contains: 'unsplash.com' } },
            { mobileImageUrl: { contains: 'unsplash.com' } },
          ],
        },
      }).then(async (legacySlides) => {
        for (let i = 0; i < legacySlides.length; i++) {
          const slide = legacySlides[i]
          const fallback = LOCAL_FALLBACKS[i % LOCAL_FALLBACKS.length]
          await prisma.heroSlide.update({
            where: { id: slide.id },
            data: {
              imageUrl: (!slide.imageUrl || slide.imageUrl.includes('unsplash.com')) ? fallback : slide.imageUrl,
              mobileImageUrl: (!slide.mobileImageUrl || slide.mobileImageUrl.includes('unsplash.com')) ? fallback : slide.mobileImageUrl,
            },
          }).catch(() => {})
        }
      }).catch(() => {})
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
