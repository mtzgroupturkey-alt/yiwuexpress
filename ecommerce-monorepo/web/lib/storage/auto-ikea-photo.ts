import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { analyzeProductImage, resolveLocalProductImagePath } from './image-analyzer';
import { getCatalogImages } from './catalog-matcher';
import { searchTargetWebsite } from './image-search-service';

export interface AutoFetchIkeaResult {
  success: boolean;
  productId: string;
  name: string;
  newThumbnail?: string;
  sourceIkeaUrl?: string;
  isReal: boolean;
  previousWasPlaceholder: boolean;
  reason?: string;
  error?: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

function generateWebpFilename(sku: string, url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
  const cleanSku = (sku || 'prod').replace(/[^a-zA-Z0-9_-]/g, '').slice(-12);
  return `prod-${cleanSku}-${hash}.webp`;
}

/**
 * Downloads an image from an external URL (e.g. IKEA.com), converts to high-quality WebP,
 * and saves it to public/uploads/products/.
 */
export async function downloadAndSaveWebp(url: string, targetFilename: string): Promise<string> {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const targetPath = path.join(UPLOADS_DIR, targetFilename);

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: 'https://www.ikea.com/',
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch image from IKEA (HTTP ${res.status})`);
  }

  const arrayBuf = await res.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuf);
  if (rawBuffer.length < 500) {
    throw new Error('Downloaded image buffer is too small');
  }

  // Optimize to high-quality WebP
  const webpBuffer = await sharp(rawBuffer)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  await fs.promises.writeFile(targetPath, webpBuffer);
  return `/uploads/products/${targetFilename}`;
}

/**
 * Automatically detects whether a product has a placeholder or missing photo,
 * finds its official online IKEA.com photo, downloads it, converts to WebP,
 * and updates the product record in the database.
 */
export async function autoFetchIkeaProductPhoto(productId: string): Promise<AutoFetchIkeaResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
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
    return {
      success: false,
      productId,
      name: '',
      isReal: false,
      previousWasPlaceholder: true,
      error: 'Product not found',
    };
  }

  // 1. Analyze current photo
  const analysis = await analyzeProductImage(product.thumbnail);
  const previousWasPlaceholder = analysis.isPlaceholder || analysis.isMissing || !product.hasRealImage;

  // 2. Find official IKEA photo URL
  // Strategy A: Check authentic catalog snapshot (exact mapping by id/sku/slug)
  let ikeaUrl: string | null = null;
  const catalog = getCatalogImages({ id: product.id, sku: product.sku, slug: product.slug });
  if (catalog && catalog.thumbnail) {
    ikeaUrl = catalog.thumbnail;
  }

  // Strategy B: If not in snapshot, search ikea.com via Bing/DDG
  if (!ikeaUrl) {
    try {
      const results = await searchTargetWebsite(product.name, 'ikea.com');
      const ikeaResult = results.find(
        (r) => r.sourceUrl && (r.sourceUrl.includes('ikea.com') || r.author?.includes('ikea'))
      );
      if (ikeaResult && ikeaResult.sourceUrl) {
        ikeaUrl = ikeaResult.sourceUrl;
      }
    } catch {
      // Continue
    }
  }

  if (!ikeaUrl) {
    return {
      success: false,
      productId: product.id,
      name: product.name,
      isReal: !previousWasPlaceholder,
      previousWasPlaceholder,
      error: 'No authentic IKEA.com photo could be found for this product.',
    };
  }

  // 3. Download, optimize, and save to local storage
  try {
    const filename = generateWebpFilename(product.sku, ikeaUrl);
    const localUrl = await downloadAndSaveWebp(ikeaUrl, filename);

    // 4. Delete old placeholder file(s) from disk if they were placeholders
    const oldUrls = [product.thumbnail, ...(product.images || [])].filter(Boolean) as string[];
    for (const oldUrl of oldUrls) {
      if (oldUrl !== localUrl) {
        try {
          const oldAnalysis = await analyzeProductImage(oldUrl);
          if (oldAnalysis.isPlaceholder && !oldAnalysis.isMissing) {
            const diskPath = resolveLocalProductImagePath(oldUrl);
            if (diskPath && fs.existsSync(diskPath)) {
              // Only delete if it's not a global static placeholder like product-placeholder.webp
              const baseName = path.basename(diskPath).toLowerCase();
              if (!baseName.includes('placeholder.webp') && !baseName.includes('product-placeholder')) {
                fs.unlinkSync(diskPath);
                console.log(`[AutoIkeaPhoto] Deleted obsolete placeholder from disk: ${diskPath}`);
              }
            }
          }
        } catch {
          // Ignore disk deletion errors
        }
      }
    }

    // 5. Update product in database: replace images array completely if previous was placeholder
    // or keep only valid non-placeholder images
    const existingImages = product.images || [];
    let updatedImages: string[] = [localUrl];

    if (!previousWasPlaceholder) {
      // If previous wasn't a placeholder, keep other non-placeholder, non-duplicate images
      const nonPlaceholders = await Promise.all(
        existingImages.map(async (u) => {
          if (u === localUrl || u.includes('placeholder') || u.includes('ikea.com')) return null;
          const a = await analyzeProductImage(u);
          return a.isPlaceholder ? null : u;
        })
      );
      const validKept = nonPlaceholders.filter(Boolean) as string[];
      updatedImages = [localUrl, ...validKept];
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        thumbnail: localUrl,
        images: updatedImages,
        hasRealImage: true,
      },
    });

    return {
      success: true,
      productId: product.id,
      name: product.name,
      newThumbnail: localUrl,
      sourceIkeaUrl: ikeaUrl,
      isReal: true,
      previousWasPlaceholder,
      reason: `Successfully downloaded and applied official IKEA photo (${ikeaUrl})`,
    };
  } catch (err: any) {
    return {
      success: false,
      productId: product.id,
      name: product.name,
      isReal: !previousWasPlaceholder,
      previousWasPlaceholder,
      error: err.message || 'Failed to download and process IKEA photo',
    };
  }
}
