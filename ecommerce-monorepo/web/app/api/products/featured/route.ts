export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth';
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer';
import { getLocalField, localizeEntity } from '@/lib/utils/localize';

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en';

    // 1. Fetch products where isFeatured is true, ordered by featuredOrder
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
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

    // 2. Check caller wholesale access permissions
    const currentUser = await getAuthUser(req);
    const canViewWholesale = isApprovedWholesaleUser(currentUser);
    const isAdmin = currentUser?.role === 'ADMIN';

    // 3. Localize & sanitize
    const localizedProducts = products.map((product: any) => {
      const { name, description } = localizeEntity(
        product.translations,
        locale,
        { name: product.name, description: product.description }
      );

      const category = product.category
        ? {
            ...product.category,
            name: getLocalField(
              product.category.translations,
              locale,
              'name',
              product.category.name
            ),
            parent: product.category.parent
              ? {
                  ...product.category.parent,
                  name: getLocalField(
                    product.category.parent.translations,
                    locale,
                    'name',
                    product.category.parent.name
                  ),
                }
              : null,
          }
        : null;

      const { translations, ...rest } = product;
      return { ...rest, name, description, category };
    });

    const safeProducts = localizedProducts.map((p: any) =>
      sanitizeProductForClient(p, canViewWholesale, isAdmin)
    );

    return NextResponse.json({
      success: true,
      data: safeProducts,
    });
  } catch (error) {
    console.error('Error fetching featured products section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
