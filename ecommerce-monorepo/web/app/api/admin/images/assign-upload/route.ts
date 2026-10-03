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

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, uploadedUrl, asThumbnail = true } = body;

    if (!productId || !uploadedUrl) {
      return NextResponse.json({ error: 'productId and uploadedUrl are required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, thumbnail: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentImages = product.images || [];
    const updatedImages = [uploadedUrl, ...currentImages.filter((u) => u !== uploadedUrl && !u.includes('ikea.com'))];

    await prisma.product.update({
      where: { id: productId },
      data: {
        thumbnail: asThumbnail ? uploadedUrl : (product.thumbnail || uploadedUrl),
        images: updatedImages,
      },
    });

    // Save as approved candidate
    await prisma.imageSearchCandidate.create({
      data: {
        productId,
        source: 'manual',
        sourceUrl: uploadedUrl,
        thumbnail: uploadedUrl,
        title: 'Uploaded from Device',
        author: admin.email || 'Admin',
        license: 'free',
        status: 'ASSIGNED',
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    }).catch(() => null);

    // Audit log
    await prisma.imageSearchLog.create({
      data: {
        productId,
        source: 'manual',
        action: 'upload',
        adminUser: admin.email,
        confirmedRights: true,
        details: {
          uploadedUrl,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, newUrl: uploadedUrl });
  } catch (error: any) {
    console.error('[AssignUpload API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign uploaded image' }, { status: 500 });
  }
}
