export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { analyzeProductImage } from '@/lib/storage/image-analyzer';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { categoryId, limit = 200, applyFix = true } = body;

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        thumbnail: true,
        hasRealImage: true,
      },
      take: Math.min(1000, Math.max(1, limit)),
    });

    let realCount = 0;
    let placeholderCount = 0;
    let missingCount = 0;
    const toUpdateReal: string[] = [];
    const toUpdatePlaceholder: string[] = [];

    for (const p of products) {
      const analysis = await analyzeProductImage(p.thumbnail);
      if (analysis.isReal && !analysis.isPlaceholder) {
        realCount++;
        if (!p.hasRealImage) {
          toUpdateReal.push(p.id);
        }
      } else {
        if (analysis.isMissing) {
          missingCount++;
        } else {
          placeholderCount++;
        }
        if (p.hasRealImage) {
          toUpdatePlaceholder.push(p.id);
        }
      }
    }

    if (applyFix) {
      if (toUpdateReal.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: toUpdateReal } },
          data: { hasRealImage: true },
        });
      }
      if (toUpdatePlaceholder.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: toUpdatePlaceholder } },
          data: { hasRealImage: false },
        });
      }
    }

    return NextResponse.json({
      success: true,
      audited: products.length,
      realCount,
      placeholderCount,
      missingCount,
      updatedCount: toUpdateReal.length + toUpdatePlaceholder.length,
    });
  } catch (error: any) {
    console.error('[AuditPlaceholders API Error]:', error);
    return NextResponse.json({ error: error.message || 'Audit failed' }, { status: 500 });
  }
}
