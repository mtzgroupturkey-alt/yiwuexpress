export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { downloadAndSaveWebp } from '@/lib/storage/auto-ikea-photo';
import { analyzeProductImage, resolveLocalProductImagePath } from '@/lib/storage/image-analyzer';

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
    const {
      imageUrl,
      productIds,
      mode = 'replace', // 'thumbnail' | 'replace' | 'gallery'
      confirmRights = false,
    } = body;

    const cleanUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (!cleanUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Invalid Image URL. Must start with http://, https://, or /uploads/' },
        { status: 400 }
      );
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one product ID must be provided' },
        { status: 400 }
      );
    }

    // 1. Download and convert to local WebP once (or reuse existing local path)
    let localWebpUrl: string;

    if (cleanUrl.startsWith('/uploads/')) {
      // Already a local file
      localWebpUrl = cleanUrl;
    } else {
      // Download and optimize external URL to WebP
      const timestamp = Date.now();
      const filename = `batch-assign-${timestamp}.webp`;
      try {
        localWebpUrl = await downloadAndSaveWebp(cleanUrl, filename);
      } catch (dlErr: any) {
        return NextResponse.json(
          { error: `Failed to download and process image: ${dlErr.message}` },
          { status: 400 }
        );
      }
    }

    // 2. Fetch the target products
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        images: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'No matching products found' }, { status: 404 });
    }

    let updatedCount = 0;

    // 3. Apply the image to each product according to mode
    for (const prod of products) {
      try {
        const oldImages = prod.images || [];

        // Delete previous placeholder files from disk if replacing
        if (mode === 'replace') {
          const oldUrls = [prod.thumbnail, ...oldImages].filter(Boolean) as string[];
          for (const oldUrl of oldUrls) {
            if (oldUrl !== localWebpUrl) {
              try {
                const analysis = await analyzeProductImage(oldUrl);
                if (analysis.isPlaceholder && !analysis.isMissing) {
                  const diskPath = resolveLocalProductImagePath(oldUrl);
                  if (diskPath && fs.existsSync(diskPath)) {
                    const baseName = path.basename(diskPath).toLowerCase();
                    if (!baseName.includes('placeholder.webp') && !baseName.includes('product-placeholder')) {
                      fs.unlinkSync(diskPath);
                    }
                  }
                }
              } catch {
                // Ignore unlink errors
              }
            }
          }
        }

        let newImages: string[];
        if (mode === 'replace') {
          newImages = [localWebpUrl];
        } else if (mode === 'gallery') {
          newImages = Array.from(new Set([...oldImages, localWebpUrl]));
        } else {
          // 'thumbnail' mode: make this the first image, keep rest
          newImages = Array.from(new Set([localWebpUrl, ...oldImages]));
        }

        await prisma.product.update({
          where: { id: prod.id },
          data: {
            thumbnail: localWebpUrl,
            images: newImages,
            hasRealImage: true,
          },
        });

        updatedCount++;
      } catch (err) {
        console.error(`Failed to assign image to product ${prod.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned image to ${updatedCount} product(s)!`,
      updatedCount,
      totalCount: products.length,
      assignedImageUrl: localWebpUrl,
    });
  } catch (error: any) {
    console.error('[BatchSetImageUrl API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch assign image URL' },
      { status: 500 }
    );
  }
}
