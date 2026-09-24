export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth';
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer';
import { getLocalField, localizeEntity } from '@/lib/utils/localize';

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en';
    const now = new Date();

    // 1. Fetch Campaign Settings from SystemSettings singleton
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
      select: {
        id: true,
        flashSaleEnabled: true,
        flashSaleStartDate: true,
        flashSaleEndDate: true,
        flashSaleTitle: true,
        flashSaleSubtitle: true,
        flashSaleBadgeText: true,
      },
    });

    const isEnabled = settings?.flashSaleEnabled ?? false;
    const startDate = settings?.flashSaleStartDate ? new Date(settings.flashSaleStartDate) : null;
    const endDate = settings?.flashSaleEndDate ? new Date(settings.flashSaleEndDate) : null;

    // Check if section is master-disabled
    if (!isEnabled) {
      return NextResponse.json({
        success: true,
        active: false,
        reason: 'disabled',
        data: [],
      });
    }

    // Check scheduled start time
    if (startDate && now < startDate) {
      return NextResponse.json({
        success: true,
        active: false,
        reason: 'scheduled',
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        data: [],
      });
    }

    // Check expiration end time
    if (endDate && now > endDate) {
      return NextResponse.json({
        success: true,
        active: false,
        reason: 'expired',
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
        data: [],
      });
    }

    // 2. Fetch Active Flash Sale Products
    const products = await prisma.product.findMany({
      where: {
        isFlashSale: true,
        isActive: true,
        OR: [
          { flashSaleStock: null },
          { flashSaleStock: { gt: 0 } },
        ],
      },
      orderBy: { flashSaleOrder: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            translations: {
              where: { locale: { in: [locale, 'en'] } },
              select: { locale: true, name: true },
            },
          },
        },
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, name: true, description: true },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        active: false,
        reason: 'no_products',
        data: [],
      });
    }

    // 3. Check caller wholesale access permissions
    const currentUser = await getAuthUser(req);
    const canViewWholesale = isApprovedWholesaleUser(currentUser);
    const isAdmin = currentUser?.role === 'ADMIN';

    // 4. Localize and enrich product data
    const endsInMs = endDate ? Math.max(0, endDate.getTime() - now.getTime()) : null;

    const enrichedProducts = products.map((product: any) => {
      const { name, description } = localizeEntity(
        product.translations,
        locale,
        { name: product.name, description: product.description }
      );

      const categoryName = product.category
        ? getLocalField(product.category.translations, locale, 'name', product.category.name)
        : '';

      const effectivePrice =
        typeof product.flashSalePrice === 'number' && product.flashSalePrice > 0
          ? product.flashSalePrice
          : product.price;

      const effectiveOldPrice =
        product.compareAtPrice && product.compareAtPrice > effectivePrice
          ? product.compareAtPrice
          : product.price > effectivePrice
          ? product.price
          : null;

      const discount = effectiveOldPrice
        ? Math.round(((effectiveOldPrice - effectivePrice) / effectiveOldPrice) * 100)
        : 0;

      const sanitized = sanitizeProductForClient(
        {
          ...product,
          name,
          description,
          categoryName,
          dealPrice: effectivePrice,
          oldPrice: effectiveOldPrice,
          discount,
          timeRemaining: endsInMs,
          hasLimitedStock: product.flashSaleStock !== null,
          stockRemaining: product.flashSaleStock,
        },
        canViewWholesale,
        isAdmin
      );

      return sanitized;
    });

    // 5. Localize Section Title, Subtitle, and Badge Text
    let localizedTitle = settings?.flashSaleTitle || 'Seasonal Discounts & Flash Home Deals';
    let localizedSubtitle =
      settings?.flashSaleSubtitle ||
      'Special prices on furniture, kitchenware, and smart living appliances';
    let localizedBadgeText = settings?.flashSaleBadgeText || 'LIMITED QUANTITY';

    if (settings?.id && locale !== 'en') {
      try {
        const translations = await prisma.systemSettingTranslation.findMany({
          where: {
            systemSettingId: settings.id,
            locale,
            key: { in: ['flashSaleTitle', 'flashSaleSubtitle', 'flashSaleBadgeText'] },
          },
        });
        for (const row of translations) {
          if (row.key === 'flashSaleTitle' && row.value?.trim()) localizedTitle = row.value.trim();
          if (row.key === 'flashSaleSubtitle' && row.value?.trim()) localizedSubtitle = row.value.trim();
          if (row.key === 'flashSaleBadgeText' && row.value?.trim()) localizedBadgeText = row.value.trim();
        }
      } catch (err) {
        console.error('Error fetching flash sale translations:', err);
      }

      // If translation wasn't explicitly saved yet, apply language fallbacks
      if (locale === 'ru') {
        if (localizedTitle === 'Seasonal Discounts & Flash Home Deals') {
          localizedTitle = 'Сезонные скидки и горячие предложения для дома';
        }
        if (localizedSubtitle.includes('Special prices on furniture')) {
          localizedSubtitle = 'Специальные цены на мебель, посуду и технику для умного дома';
        }
        if (localizedBadgeText === 'LIMITED QUANTITY') {
          localizedBadgeText = 'ОГРАНИЧЕННОЕ КОЛИЧЕСТВО';
        }
      } else if (locale === 'zh') {
        if (localizedTitle === 'Seasonal Discounts & Flash Home Deals') {
          localizedTitle = '限时特惠与精选家居折扣';
        }
        if (localizedSubtitle.includes('Special prices on furniture')) {
          localizedSubtitle = '家具、厨具及智能生活家居精选特惠好物';
        }
        if (localizedBadgeText === 'LIMITED QUANTITY') {
          localizedBadgeText = '限量特惠';
        }
      }
    }

    return NextResponse.json({
      success: true,
      active: true,
      title: localizedTitle,
      subtitle: localizedSubtitle,
      badgeText: localizedBadgeText,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      endsInMs,
      now: now.toISOString(),
      count: enrichedProducts.length,
      data: enrichedProducts,
    });
  } catch (error) {
    console.error('Error fetching public flash sale products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flash sale products' },
      { status: 500 }
    );
  }
}
