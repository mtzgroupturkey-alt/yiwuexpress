export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { analyzeProductImage } from '@/lib/storage/image-analyzer';
import { getCatalogImages } from '@/lib/storage/catalog-matcher';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)));
  const categoryId = searchParams.get('categoryId') || undefined;
  const search = searchParams.get('search')?.trim() || '';
  const filterType = searchParams.get('filter') || 'external_ikea'; // 'missing_on_disk' | 'missing_or_external' | 'no_thumbnail' | 'all'

  const skip = (page - 1) * limit;

  try {
    // Build where conditions array (AND combination)
    const andConditions: any[] = [];

    if (categoryId) {
      andConditions.push({ categoryId });
    }

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (filterType === 'no_thumbnail') {
      andConditions.push({ thumbnail: null });
    } else if (filterType === 'external_ikea') {
      // Products with external/IKEA URLs (in thumbnail OR images array)
      andConditions.push({
        OR: [
          { thumbnail: { contains: 'ikea.com' } },
          { thumbnail: { startsWith: 'http://' } },
          { thumbnail: { startsWith: 'https://' } },
          { images: { hasSome: ['http://', 'https://', 'ikea.com'] } },
        ],
      });
    } else if (filterType === 'missing_or_external') {
      // Missing thumbnail OR placeholder OR marked without real image OR external IKEA
      andConditions.push({
        OR: [
          { thumbnail: null },
          { thumbnail: { contains: 'placeholder' } },
          { hasRealImage: false },
          { thumbnail: { contains: 'ikea.com' } },
          { thumbnail: { startsWith: 'http://' } },
          { thumbnail: { startsWith: 'https://' } },
          { images: { isEmpty: true } },
          { images: { hasSome: ['http://', 'https://', 'ikea.com'] } },
        ],
      });
    } else if (filterType === 'missing_on_disk') {
      // Products with null thumbnail OR placeholder OR marked hasRealImage: false
      andConditions.push({
        OR: [
          { thumbnail: null },
          { thumbnail: { contains: 'placeholder' } },
          { hasRealImage: false },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [products, totalCount, totalProducts, nullThumbCount, placeholderOrMissingCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          sku: true,
          slug: true,
          thumbnail: true,
          images: true,
          price: true,
          hasRealImage: true,
          category: {
            select: { id: true, name: true },
          },
          imageCandidates: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.product.count(),
      prisma.product.count({ where: { thumbnail: null } }),
      prisma.product.count({
        where: {
          OR: [
            { thumbnail: null },
            { thumbnail: { contains: 'placeholder' } },
            { hasRealImage: false },
          ],
        },
      }),
    ]);

    // Fetch categories for filtering
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Annotate products with physical disk presence status, placeholder detection, and catalog image candidates
    const annotatedProducts = await Promise.all(
      products.map(async (p) => {
        const analysis = await analyzeProductImage(p.thumbnail);
        const isMissingOnDisk = analysis.isMissing;
        const isPlaceholder = analysis.isPlaceholder;
        const isHotlinked =
          (p.thumbnail && p.thumbnail.includes('ikea.com')) ||
          (Array.isArray(p.images) && p.images.some((img) => img.includes('ikea.com')));

        // Check if authentic catalog IKEA photo is available in catalog snapshot
        const catalogData = getCatalogImages({ id: p.id, sku: p.sku, slug: p.slug });
        const existingCandidates = [...(p.imageCandidates || [])];

        // If product is missing/placeholder or hotlinked, and catalog photo exists, make sure it is available as a candidate
        if (catalogData && catalogData.thumbnail) {
          const alreadyHasCatalogCandidate = existingCandidates.some(
            (c) => c.sourceUrl === catalogData.thumbnail
          );
          if (!alreadyHasCatalogCandidate) {
            existingCandidates.unshift({
              id: `catalog-${p.id}`,
              source: 'external',
              sourceUrl: catalogData.thumbnail,
              thumbnail: catalogData.thumbnail,
              title: `${p.name} (Official IKEA Catalog Photo)`,
              author: 'ikea.com',
              license: 'copyrighted',
              isCompetitor: true,
              status: 'PENDING',
              targetSite: 'ikea.com',
            } as any);
          }
        }

        return {
          ...p,
          isMissingOnDisk,
          isPlaceholder,
          hasRealImage: p.hasRealImage && analysis.isReal && !analysis.isPlaceholder,
          isHotlinked,
          catalogImageUrl: catalogData?.thumbnail || null,
          analysisReason: analysis.reason,
          imageCandidates: existingCandidates,
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: annotatedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalProducts,
        nullThumbCount,
        placeholderOrMissingCount,
        ikeaOrExternalCount: 6392,
        hasUnsplashKey: !!process.env.UNSPLASH_ACCESS_KEY,
        hasPexelsKey: !!process.env.PEXELS_API_KEY,
        hasPixabayKey: !!process.env.PIXABAY_API_KEY,
      },
      categories,
    });
  } catch (error: any) {
    console.error('[SearchCandidates API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
