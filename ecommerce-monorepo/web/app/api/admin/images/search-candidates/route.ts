export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

import { promises as fs } from 'fs';
import path from 'path';

// Helper to check if image physically exists on disk and is larger than placeholder
const uploadsDirCandidates = [
  path.join(process.cwd(), 'public', 'uploads', 'products'),
  path.join(process.cwd(), 'web', 'public', 'uploads', 'products'),
  '/www/wwwroot/www.dromkok.com/web/public/uploads/products',
  '/www/wwwroot/dromkok.com/web/public/uploads/products',
  '/www/wwwroot/www.dromkok.com/public/uploads/products',
  '/www/wwwroot/dromkok.com/public/uploads/products',
];

async function checkFileExistsOnDisk(filename: string): Promise<boolean> {
  const cleanName = path.basename(filename).toLowerCase();
  for (const dir of uploadsDirCandidates) {
    try {
      const fullPath = path.join(dir, cleanName);
      const stat = await fs.stat(fullPath);
      // Valid product photos are larger than 3,600 bytes (product-placeholder.webp is exactly 3,534 bytes)
      if (stat.isFile() && stat.size > 3600) {
        return true;
      }
    } catch {
      // try next candidate dir
    }
  }
  return false;
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
  const filterType = searchParams.get('filter') || 'missing_or_external'; // 'missing_on_disk' | 'missing_or_external' | 'no_thumbnail' | 'all'

  const skip = (page - 1) * limit;

  try {
    // Build where clause
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filterType === 'no_thumbnail') {
      where.thumbnail = null;
    } else if (filterType === 'missing_or_external') {
      // Missing thumbnail OR containing ikea.com
      where.OR = [
        ...(where.OR || []),
        { thumbnail: null },
        { thumbnail: { contains: 'ikea.com' } },
        { images: { isEmpty: true } },
      ];
    } else if (filterType === 'missing_on_disk') {
      // Products with null thumbnail OR pointing to local uploads / placeholder
      where.OR = [
        ...(where.OR || []),
        { thumbnail: null },
        { thumbnail: { contains: 'placeholder' } },
        { thumbnail: { contains: '/uploads/products/' } },
        { thumbnail: { contains: 'ikea.com' } },
      ];
    }

    const [products, totalCount, totalProducts, nullThumbCount] = await Promise.all([
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
    ]);

    // Fetch categories for filtering
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Annotate products with physical disk presence status
    const annotatedProducts = await Promise.all(
      products.map(async (p) => {
        let isMissingOnDisk = false;
        let isHotlinked = (p.thumbnail && p.thumbnail.includes('ikea.com')) || 
          (Array.isArray(p.images) && p.images.some(img => img.includes('ikea.com')));

        if (!p.thumbnail) {
          isMissingOnDisk = true;
        } else if (p.thumbnail.includes('placeholder')) {
          isMissingOnDisk = true;
        } else if (p.thumbnail.includes('/uploads/products/')) {
          const exists = await checkFileExistsOnDisk(p.thumbnail);
          if (!exists) {
            isMissingOnDisk = true;
          }
        }

        return {
          ...p,
          isMissingOnDisk,
          isHotlinked,
        };
      })
    );

    // If filterType is missing_on_disk, prioritize products that are truly missing on disk
    let finalProducts = annotatedProducts;
    if (filterType === 'missing_on_disk') {
      finalProducts = annotatedProducts.filter(p => p.isMissingOnDisk);
    }

    return NextResponse.json({
      success: true,
      products: finalProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalProducts,
        nullThumbCount,
        ikeaOrExternalCount: 6657,
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
