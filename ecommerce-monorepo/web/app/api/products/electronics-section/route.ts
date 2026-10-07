export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth';
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer';
import { getLocalField, localizeEntity } from '@/lib/utils/localize';

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en';
    const limitParam = req.nextUrl.searchParams.get('limit');

    // 1. Fetch settings from SystemSettings singleton
    const settings = await prisma.systemSettings.findFirst({
      select: {
        id: true,
        electronicsSectionEnabled: true,
        electronicsSectionTitle: true,
        electronicsSectionSubtitle: true,
        electronicsSectionBadge: true,
        electronicsSectionViewAllLabel: true,
        electronicsSectionCategoryIds: true,
        electronicsSectionPinnedProductIds: true,
        electronicsSectionMaxProducts: true,
      },
    });

    const isEnabled = settings?.electronicsSectionEnabled !== false;
    if (!isEnabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        data: [],
      });
    }

    // Resolve localized titles if locale !== 'en'
    let localizedTitle = settings?.electronicsSectionTitle || 'Popular in Electronics & Appliances';
    let localizedSubtitle =
      settings?.electronicsSectionSubtitle ||
      'Official manufacturer equipment with factory guarantee';
    let localizedBadge = settings?.electronicsSectionBadge || 'ELECTRONICS & APPLIANCES';
    let localizedViewAll = settings?.electronicsSectionViewAllLabel || 'View all in category';

    if (settings?.id && locale !== 'en') {
      try {
        const translations = await prisma.systemSettingTranslation.findMany({
          where: {
            systemSettingId: settings.id,
            locale,
            key: {
              in: [
                'electronicsSectionTitle',
                'electronicsSectionSubtitle',
                'electronicsSectionBadge',
                'electronicsSectionViewAllLabel',
              ],
            },
          },
        });
        for (const row of translations) {
          if (row.key === 'electronicsSectionTitle' && row.value?.trim()) localizedTitle = row.value.trim();
          if (row.key === 'electronicsSectionSubtitle' && row.value?.trim()) localizedSubtitle = row.value.trim();
          if (row.key === 'electronicsSectionBadge' && row.value?.trim()) localizedBadge = row.value.trim();
          if (row.key === 'electronicsSectionViewAllLabel' && row.value?.trim()) localizedViewAll = row.value.trim();
        }
      } catch (err) {
        console.error('Failed to load electronics section localized texts:', err);
      }

      // If translation wasn't explicitly saved in DB, apply standard locale fallbacks
      if (locale === 'ru') {
        if (!localizedTitle || localizedTitle === 'Popular in Electronics & Appliances') {
          localizedTitle = 'Популярное в электронике и технике';
        }
        if (!localizedSubtitle || localizedSubtitle.includes('Official manufacturer equipment')) {
          localizedSubtitle = 'Официальная техника от производителей с заводской гарантией';
        }
        if (!localizedBadge || localizedBadge === 'ELECTRONICS & APPLIANCES') {
          localizedBadge = 'ЭЛЕКТРОНИКА И ТЕХНИКА';
        }
        if (!localizedViewAll || localizedViewAll === 'View all in category') {
          localizedViewAll = 'Смотреть всю категорию';
        }
      } else if (locale === 'zh') {
        if (!localizedTitle || localizedTitle === 'Popular in Electronics & Appliances') {
          localizedTitle = '热销家电与数码装备';
        }
        if (!localizedSubtitle || localizedSubtitle.includes('Official manufacturer equipment')) {
          localizedSubtitle = '官方正品行货，全国联保与原厂售后质保';
        }
        if (!localizedBadge || localizedBadge === 'ELECTRONICS & APPLIANCES') {
          localizedBadge = '智能家电与数码';
        }
        if (!localizedViewAll || localizedViewAll === 'View all in category') {
          localizedViewAll = '查看本类全部商品';
        }
      }
    }

    const maxProducts = limitParam
      ? parseInt(limitParam)
      : settings?.electronicsSectionMaxProducts || 8;

    const pinnedIds = (settings?.electronicsSectionPinnedProductIds || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const categoryIds = (settings?.electronicsSectionCategoryIds || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    // 2. Fetch pinned products if any
    let pinnedProducts: any[] = [];
    if (pinnedIds.length > 0) {
      pinnedProducts = await prisma.product.findMany({
        where: {
          id: { in: pinnedIds },
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parent: { select: { id: true, name: true, slug: true } },
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
      // Sort in the exact order specified in pinnedIds
      pinnedProducts.sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id));
    }

    // 3. Fetch category-based products (or keyword-based)
    const needed = Math.max(0, Math.max(maxProducts * 2, 24) - pinnedProducts.length);
    let categoryProducts: any[] = [];
    const excludedIds = pinnedProducts.map((p) => p.id);

    if (needed > 0) {
      let whereClause: any = {
        isActive: true,
        ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
      };

      if (categoryIds.length > 0) {
        whereClause.OR = [
          { categoryId: { in: categoryIds } },
          { category: { parentId: { in: categoryIds } } },
        ];
      } else {
        // Fallback electronics / smart home / lighting keywords
        whereClause.OR = [
          { name: { contains: 'light', mode: 'insensitive' } },
          { name: { contains: 'lamp', mode: 'insensitive' } },
          { name: { contains: 'bulb', mode: 'insensitive' } },
          { name: { contains: 'smart', mode: 'insensitive' } },
          { name: { contains: 'sensor', mode: 'insensitive' } },
          { name: { contains: 'strip', mode: 'insensitive' } },
          { name: { contains: 'appliance', mode: 'insensitive' } },
          { name: { contains: 'electr', mode: 'insensitive' } },
          { name: { contains: 'vacuum', mode: 'insensitive' } },
          { name: { contains: 'speaker', mode: 'insensitive' } },
          { name: { contains: 'charger', mode: 'insensitive' } },
          { category: { name: { contains: 'lighting', mode: 'insensitive' } } },
          { category: { name: { contains: 'smart', mode: 'insensitive' } } },
          { category: { name: { contains: 'electronics', mode: 'insensitive' } } },
        ];
      }

      categoryProducts = await prisma.product.findMany({
        where: whereClause,
        take: needed,
        orderBy: [
          { isFeatured: 'desc' },
          { featuredOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parent: { select: { id: true, name: true, slug: true } },
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
    }

    const allRawProducts = [...pinnedProducts, ...categoryProducts];

    // 4. Check caller wholesale access permissions
    const currentUser = await getAuthUser(req);
    const canViewWholesale = isApprovedWholesaleUser(currentUser);
    const isAdmin = currentUser?.role === 'ADMIN';

    // 5. Format and sanitize products
    const formattedProducts = allRawProducts.map((product) => {
      const { name, description } = localizeEntity(
        product.translations,
        locale,
        { name: product.name, description: product.description }
      );

      const categoryName = product.category
        ? getLocalField(product.category.translations, locale, 'name', product.category.name)
        : null;

      const sanitized = sanitizeProductForClient(
        product,
        canViewWholesale,
        isAdmin
      );

      return {
        ...sanitized,
        name,
        description,
        category: categoryName || sanitized.category,
        categoryName: categoryName || sanitized.category,
        categoryId: product.categoryId,
        categorySlug: product.category?.slug,
        department: product.category?.parent?.name,
        departmentId: product.category?.parent?.id,
        departmentSlug: product.category?.parent?.slug,
      };
    });

    return NextResponse.json({
      success: true,
      enabled: isEnabled,
      title: localizedTitle,
      subtitle: localizedSubtitle,
      badgeText: localizedBadge,
      viewAllText: localizedViewAll,
      maxProducts,
      data: formattedProducts,
    });
  } catch (err: any) {
    console.error('Error fetching electronics section products:', err);
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}
