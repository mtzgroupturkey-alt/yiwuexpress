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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        thumbnail: true,
        images: true,
        hasRealImage: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const analysis = await analyzeProductImage(product.thumbnail);
    const catalog = getCatalogImages({ id: product.id, sku: product.sku, slug: product.slug });

    return NextResponse.json({
      success: true,
      productId: product.id,
      name: product.name,
      thumbnail: product.thumbnail,
      isPlaceholder: analysis.isPlaceholder,
      isMissing: analysis.isMissing,
      isReal: analysis.isReal && product.hasRealImage,
      reason: analysis.reason,
      hasCatalogIkeaPhoto: !!(catalog && catalog.thumbnail),
      catalogIkeaUrl: catalog?.thumbnail || null,
    });
  } catch (error: any) {
    console.error('[PhotoStatus API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
