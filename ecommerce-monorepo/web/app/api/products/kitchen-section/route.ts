export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter';
import { GROCERY_CATALOG_PRODUCTS } from '@/app/[locale]/design-3/data/groceryCatalogData';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';
    const limitParam = parseInt(searchParams.get('limit') || '12', 10);
    const limit = isNaN(limitParam) ? 12 : Math.min(30, Math.max(1, limitParam));

    // 1. Fetch system settings for kitchen section
    const settings = await prisma.systemSettings.findFirst({
      select: {
        id: true,
        kitchenSectionEnabled: true,
        kitchenSectionTitle: true,
        kitchenSectionSubtitle: true,
        kitchenSectionBadge: true,
        kitchenSectionViewAllLabel: true,
        kitchenSectionPinnedProductIds: true,
        kitchenSectionCategoryIds: true,
        kitchenSectionMaxProducts: true,
      },
    });

    if (settings && settings.kitchenSectionEnabled === false) {
      return NextResponse.json({ success: true, enabled: false, data: [] });
    }

    // Resolve localized titles if locale !== 'en'
    let localizedTitle = settings?.kitchenSectionTitle || undefined;
    let localizedSubtitle = settings?.kitchenSectionSubtitle || undefined;
    let localizedBadge = settings?.kitchenSectionBadge || undefined;
    let localizedViewAll = settings?.kitchenSectionViewAllLabel || undefined;

    if (settings?.id && locale !== 'en') {
      try {
        const translations = await prisma.systemSettingTranslation.findMany({
          where: {
            systemSettingId: settings.id,
            locale,
            key: {
              in: [
                'kitchenSectionTitle',
                'kitchenSectionSubtitle',
                'kitchenSectionBadge',
                'kitchenSectionViewAllLabel',
              ],
            },
          },
        });
        for (const row of translations) {
          if (row.key === 'kitchenSectionTitle' && row.value?.trim()) localizedTitle = row.value.trim();
          if (row.key === 'kitchenSectionSubtitle' && row.value?.trim()) localizedSubtitle = row.value.trim();
          if (row.key === 'kitchenSectionBadge' && row.value?.trim()) localizedBadge = row.value.trim();
          if (row.key === 'kitchenSectionViewAllLabel' && row.value?.trim()) localizedViewAll = row.value.trim();
        }
      } catch (err) {
        console.error('Failed to load kitchen section localized texts:', err);
      }

      // If translation wasn't explicitly saved in DB, apply standard locale fallbacks
      if (locale === 'ru') {
        if (!localizedTitle || localizedTitle === 'Kitchenware, Cookware & Dining Essentials') {
          localizedTitle = 'Посуда, кухонная утварь и сервировка';
        }
        if (!localizedSubtitle || localizedSubtitle.includes('Granite frying pans')) {
          localizedSubtitle = 'Гранитные сковороды, наборы ножей, фарфоровые сервизы и кофеварки';
        }
        if (!localizedBadge || localizedBadge === 'KITCHEN & DINING') {
          localizedBadge = 'КУХНЯ И СТОЛОВАЯ';
        }
        if (!localizedViewAll || localizedViewAll === 'View all Kitchen & Dining') {
          localizedViewAll = 'Смотреть всю категорию';
        }
      } else if (locale === 'zh') {
        if (!localizedTitle || localizedTitle === 'Kitchenware, Cookware & Dining Essentials') {
          localizedTitle = '厨房用品、烹饪锅具与餐具精选';
        }
        if (!localizedSubtitle || localizedSubtitle.includes('Granite frying pans')) {
          localizedSubtitle = '花岗岩不粘锅、厨师刀具套装、骨瓷餐具及意式咖啡器具';
        }
        if (!localizedBadge || localizedBadge === 'KITCHEN & DINING') {
          localizedBadge = '品质餐厨生活';
        }
        if (!localizedViewAll || localizedViewAll === 'View all Kitchen & Dining') {
          localizedViewAll = '查看全部餐厨商品';
        }
      }
    }

    const effectiveLimit = settings?.kitchenSectionMaxProducts || limit;
    const pinnedIds = (settings?.kitchenSectionPinnedProductIds || searchParams.get('pinned') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const customCategoryIds = (settings?.kitchenSectionCategoryIds || searchParams.get('categories') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    // 2. Fetch pinned products first
    let pinnedProducts: any[] = [];
    if (pinnedIds.length > 0) {
      const foundPinned = await prisma.product.findMany({
        where: {
          id: { in: pinnedIds },
          isActive: true,
        },
        include: {
          category: {
            include: { parent: true },
          },
        },
      });
      // Preserve the order of pinnedIds
      pinnedProducts = pinnedIds
        .map((id) => foundPinned.find((p) => p.id === id))
        .filter(Boolean);
    }

    // 3. Resolve target categories
    let targetCategoryIds: string[] = [];
    if (customCategoryIds.length > 0) {
      targetCategoryIds = customCategoryIds;
    } else {
      // Auto-resolve entire Kitchen & Dining category tree
      const rootKitchenCategories = await prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { equals: 'Kitchen & Dining', mode: 'insensitive' } },
            { name: { equals: 'Cookware & Bakeware', mode: 'insensitive' } },
            { name: { equals: 'Dinnerware & Tableware', mode: 'insensitive' } },
            { name: { equals: 'Kitchen Accessories', mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const rootIds = rootKitchenCategories.map((c) => c.id);

      if (rootIds.length > 0) {
        const l1 = await prisma.category.findMany({
          where: { parentId: { in: rootIds }, isActive: true },
          select: { id: true },
        });
        const l1Ids = l1.map((c) => c.id);

        const l2 = await prisma.category.findMany({
          where: { parentId: { in: [...rootIds, ...l1Ids] }, isActive: true },
          select: { id: true },
        });
        targetCategoryIds = Array.from(new Set([...rootIds, ...l1Ids, ...l2.map((c) => c.id)]));
      }
    }

    // 4. Fetch candidate products from DB with diversity across kitchen categories
    const excludeIds = pinnedProducts.map((p) => p.id);
    let matchedProducts: any[] = [];

    if (targetCategoryIds.length > 0) {
      const perCategory = Math.max(2, Math.ceil((effectiveLimit * 2) / targetCategoryIds.length));
      const queries = targetCategoryIds.map((catId) =>
        prisma.product.findMany({
          where: {
            id: { notIn: excludeIds },
            categoryId: catId,
            isActive: true,
          },
          include: {
            category: {
              include: { parent: true },
            },
          },
          take: perCategory,
          orderBy: { isFeatured: 'desc' },
        })
      );
      const batches = await Promise.all(queries);
      const seen = new Set<string>();
      for (const batch of batches) {
        for (const prod of batch) {
          if (!seen.has(prod.id)) {
            seen.add(prod.id);
            matchedProducts.push(prod);
          }
        }
      }
    }

    // Fallback search by keywords if categories returned nothing
    if (matchedProducts.length === 0 && excludeIds.length < effectiveLimit) {
      matchedProducts = await prisma.product.findMany({
        where: {
          id: { notIn: excludeIds },
          isActive: true,
          OR: [
            { name: { contains: 'kitchen', mode: 'insensitive' } },
            { name: { contains: 'cookware', mode: 'insensitive' } },
            { name: { contains: 'cutlery', mode: 'insensitive' } },
            { name: { contains: 'utensil', mode: 'insensitive' } },
            { name: { contains: 'casserole', mode: 'insensitive' } },
            { name: { contains: 'dinnerware', mode: 'insensitive' } },
            { name: { contains: 'tableware', mode: 'insensitive' } },
          ],
        },
        include: {
          category: {
            include: { parent: true },
          },
        },
        take: effectiveLimit,
        orderBy: { updatedAt: 'desc' },
      });
    }

    const combinedDb = [...pinnedProducts, ...matchedProducts].slice(0, effectiveLimit);
    let mapped = combinedDb.map(mapDbProductToDesign3);

    // 5. If fewer than 6 products found in DB, augment with rich catalog fallback
    if (mapped.length < 6) {
      const existingIds = new Set(mapped.map((p) => p.id));
      const fallbacks = GROCERY_CATALOG_PRODUCTS.filter((p) => !existingIds.has(p.id));
      mapped = [...mapped, ...fallbacks].slice(0, Math.max(6, effectiveLimit));
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      title: localizedTitle,
      subtitle: localizedSubtitle,
      badgeText: localizedBadge,
      viewAllText: localizedViewAll,
      maxProducts: effectiveLimit,
      data: mapped,
    });
  } catch (error) {
    console.error('Error fetching kitchen section products:', error);
    return NextResponse.json({
      success: true,
      enabled: true,
      data: GROCERY_CATALOG_PRODUCTS,
    });
  }
}
