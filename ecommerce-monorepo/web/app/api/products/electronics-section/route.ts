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
      title: settings?.electronicsSectionTitle || 'Popular in Electronics & Appliances',
      subtitle:
        settings?.electronicsSectionSubtitle ||
        'Official manufacturer equipment with factory guarantee',
      badgeText: settings?.electronicsSectionBadge || 'ELECTRONICS & APPLIANCES',
      viewAllText: settings?.electronicsSectionViewAllLabel || 'View all in category',
      maxProducts,
      data: formattedProducts,
    });
  } catch (err: any) {
    console.error('Error fetching electronics section products:', err);
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}
