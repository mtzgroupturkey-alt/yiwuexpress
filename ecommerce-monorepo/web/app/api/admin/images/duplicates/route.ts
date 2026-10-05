export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { addInMemoryLog, cleanProxyUrl, isExternalImageUrl } from '@/lib/storage/image-migrator';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function verifyAdminAuth(request: NextRequest): Promise<{ authorized: boolean; email?: string }> {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return { authorized: false };
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return { authorized: false };
    return { authorized: true, email: payload.email };
  } catch {
    return { authorized: false };
  }
}

interface DuplicateGroup {
  hash: string;
  size: number;
  canonicalFile: string;
  canonicalUrl: string;
  duplicateFiles: string[];
  totalOccurrencesInDb: number;
  productsAffectedCount: number;
}

/**
 * Scan public/uploads/products/ on disk, compute MD5 for files,
 * identify identical duplicates, and find how they are referenced in the Product table.
 */
async function scanDuplicates(): Promise<{
  groups: DuplicateGroup[];
  totalFilesScanned: number;
  totalDuplicateFiles: number;
  redundantBytes: number;
  fileToCanonicalMap: Map<string, string>; // duplicateFilename -> canonicalFilename
}> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  let fileNames: string[] = [];
  try {
    const entries = await fs.readdir(uploadsDir);
    fileNames = entries.filter((f) => !f.startsWith('.'));
  } catch {
    return {
      groups: [],
      totalFilesScanned: 0,
      totalDuplicateFiles: 0,
      redundantBytes: 0,
      fileToCanonicalMap: new Map(),
    };
  }

  // 1. Group files by exact content MD5
  const contentMap = new Map<string, { size: number; files: string[] }>();

  for (const file of fileNames) {
    try {
      const fullPath = path.join(uploadsDir, file);
      const stat = await fs.stat(fullPath);
      if (!stat.isFile() || stat.size < 10) continue;

      const buf = await fs.readFile(fullPath);
      const md5 = crypto.createHash('md5').update(buf).digest('hex');

      const existing = contentMap.get(md5);
      if (existing) {
        existing.files.push(file);
      } else {
        contentMap.set(md5, { size: stat.size, files: [file] });
      }
    } catch {
      // ignore individual unreadable files
    }
  }

  // 2. Query all products from database to see references
  const products = await prisma.product.findMany({
    select: { id: true, thumbnail: true, images: true },
  });

  // Track product references count per filename
  const fileUsageMap = new Map<string, Set<string>>(); // filename -> Set of productIds

  for (const p of products) {
    const urls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
    for (const u of urls) {
      if (u.startsWith('/uploads/products/')) {
        const fname = u.replace('/uploads/products/', '');
        if (!fileUsageMap.has(fname)) {
          fileUsageMap.set(fname, new Set());
        }
        fileUsageMap.get(fname)!.add(p.id);
      }
    }
  }

  const groups: DuplicateGroup[] = [];
  let totalDuplicateFiles = 0;
  let redundantBytes = 0;
  const fileToCanonicalMap = new Map<string, string>();

  for (const [hash, entry] of contentMap.entries()) {
    if (entry.files.length > 1) {
      // Pick canonical file: prefer the one most referenced in DB, or the shortest/first alphabetically
      const sortedFiles = [...entry.files].sort((a, b) => {
        const aCount = fileUsageMap.get(a)?.size || 0;
        const bCount = fileUsageMap.get(b)?.size || 0;
        if (bCount !== aCount) return bCount - aCount;
        return a.localeCompare(b);
      });

      const canonicalFile = sortedFiles[0];
      const canonicalUrl = `/uploads/products/${canonicalFile}`;
      const duplicateFiles = sortedFiles.slice(1);

      const affectedProductIds = new Set<string>();
      let totalDbRefs = 0;

      for (const f of entry.files) {
        const prodIds = fileUsageMap.get(f);
        if (prodIds) {
          totalDbRefs += prodIds.size;
          for (const pid of prodIds) {
            affectedProductIds.add(pid);
          }
        }
      }

      for (const dup of duplicateFiles) {
        fileToCanonicalMap.set(dup, canonicalFile);
      }

      totalDuplicateFiles += duplicateFiles.length;
      redundantBytes += duplicateFiles.length * entry.size;

      groups.push({
        hash,
        size: entry.size,
        canonicalFile,
        canonicalUrl,
        duplicateFiles,
        totalOccurrencesInDb: totalDbRefs,
        productsAffectedCount: affectedProductIds.size,
      });
    }
  }

  // Sort groups by redundant space descending
  groups.sort((a, b) => b.duplicateFiles.length * b.size - a.duplicateFiles.length * a.size);

  return {
    groups,
    totalFilesScanned: fileNames.length,
    totalDuplicateFiles,
    redundantBytes,
    fileToCanonicalMap,
  };
}

// GET /api/admin/images/duplicates - Scan and preview duplicates
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const scan = await scanDuplicates();
    const redundantMb = (scan.redundantBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      totalFilesScanned: scan.totalFilesScanned,
      duplicateGroupsCount: scan.groups.length,
      totalDuplicateFiles: scan.totalDuplicateFiles,
      redundantSpaceMb: redundantMb,
      groups: scan.groups.slice(0, 20), // preview first 20 groups
    });
  } catch (error: any) {
    console.error('[API /admin/images/duplicates GET] Error:', error);
    return NextResponse.json({ error: 'Failed to scan duplicates', details: error.message }, { status: 500 });
  }
}

// POST /api/admin/images/duplicates - Deduplicate in DB and purge duplicate files on disk
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    addInMemoryLog('🔍 Scanning for duplicate downloaded photos...');
    const scan = await scanDuplicates();

    if (scan.totalDuplicateFiles === 0) {
      addInMemoryLog('✅ No duplicate downloaded photos found on storage.');
      return NextResponse.json({
        success: true,
        dryRun,
        message: 'No duplicate images found. Storage is clean.',
        totalFilesScanned: scan.totalFilesScanned,
        cleanedDuplicatesCount: 0,
        updatedProductsCount: 0,
        reclaimedSpaceMb: '0.00',
      });
    }

    addInMemoryLog(
      `Found ${scan.totalDuplicateFiles} duplicate files across ${scan.groups.length} groups (~${(
        scan.redundantBytes /
        (1024 * 1024)
      ).toFixed(2)} MB).`
    );

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        duplicateGroupsCount: scan.groups.length,
        totalDuplicateFiles: scan.totalDuplicateFiles,
        reclaimedSpaceMb: (scan.redundantBytes / (1024 * 1024)).toFixed(2),
        groups: scan.groups.slice(0, 20),
      });
    }

    // 1. Update Database: Replace duplicate URLs with canonical URL for each affected product
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, thumbnail: true, images: true },
    });

    let updatedProductsCount = 0;
    let totalUrlsReplaced = 0;

    for (const p of products) {
      let changed = false;
      let newThumbnail = p.thumbnail;
      let newImages = [...(p.images || [])];

      if (newThumbnail && newThumbnail.startsWith('/uploads/products/')) {
        const fname = newThumbnail.replace('/uploads/products/', '');
        const canonical = scan.fileToCanonicalMap.get(fname);
        if (canonical) {
          newThumbnail = `/uploads/products/${canonical}`;
          changed = true;
          totalUrlsReplaced++;
        }
      }

      // Check gallery images & deduplicate within the product gallery itself
      const updatedGallery: string[] = [];
      const seenInGallery = new Set<string>();

      for (const imgUrl of newImages) {
        let finalUrl = imgUrl;
        if (imgUrl.startsWith('/uploads/products/')) {
          const fname = imgUrl.replace('/uploads/products/', '');
          const canonical = scan.fileToCanonicalMap.get(fname);
          if (canonical) {
            finalUrl = `/uploads/products/${canonical}`;
            changed = true;
            totalUrlsReplaced++;
          }
        }

        // Deduplicate duplicate photos on the same product
        if (!seenInGallery.has(finalUrl)) {
          seenInGallery.add(finalUrl);
          updatedGallery.push(finalUrl);
        } else {
          changed = true;
        }
      }

      if (changed) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            thumbnail: newThumbnail,
            images: updatedGallery,
            updatedAt: new Date(),
          },
        });
        updatedProductsCount++;
      }
    }

    addInMemoryLog(
      `✅ Updated ${updatedProductsCount} product(s) in database. Replaced & unified ${totalUrlsReplaced} duplicate image references with canonical photos.`
    );

    // 2. Delete duplicate files from disk
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    let deletedFilesCount = 0;

    for (const [dupFile] of scan.fileToCanonicalMap.entries()) {
      try {
        const filePath = path.join(uploadsDir, dupFile);
        await fs.unlink(filePath);
        deletedFilesCount++;
      } catch (err: any) {
        console.warn(`[Duplicates] Could not unlink ${dupFile}:`, err.message);
      }
    }

    const reclaimedMb = (scan.redundantBytes / (1024 * 1024)).toFixed(2);
    addInMemoryLog(
      `🗑️ Deleted ${deletedFilesCount} redundant duplicate files from disk. Reclaimed ${reclaimedMb} MB.`
    );

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Successfully deduplicated! Updated ${updatedProductsCount} products, replaced ${totalUrlsReplaced} references, and deleted ${deletedFilesCount} redundant files (${reclaimedMb} MB reclaimed).`,
      totalFilesScanned: scan.totalFilesScanned,
      cleanedDuplicatesCount: deletedFilesCount,
      updatedProductsCount,
      totalUrlsReplaced,
      reclaimedSpaceMb: reclaimedMb,
    });
  } catch (error: any) {
    console.error('[API /admin/images/duplicates POST] Error:', error);
    addInMemoryLog(`❌ Deduplication error: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to process duplicates', details: error.message },
      { status: 500 }
    );
  }
}
