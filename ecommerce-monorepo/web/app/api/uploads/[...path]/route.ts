export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'image/jpeg';
}

/**
 * Checks candidate paths and returns first matching file on disk.
 * Supports case-insensitive matching on Linux filesystems.
 */
async function findExistingFile(candidates: string[]): Promise<string | null> {
  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isFile()) {
        return c;
      }
    } catch {
      // Continue checking
    }
  }
  return null;
}

/**
 * Case-insensitive file search within a directory.
 */
async function findCaseInsensitiveInDir(dir: string, targetName: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir);
    const targetLower = targetName.toLowerCase();
    
    // Exact match (case-insensitive)
    const exact = entries.find((e) => e.toLowerCase() === targetLower);
    if (exact) return path.join(dir, exact);

    // Prefix/Suffix match (e.g. 1789563604789-name.jpg vs name.jpg)
    const suffix = entries.find(
      (e) => e.toLowerCase().endsWith(`-${targetLower}`) || targetLower.endsWith(`-${e.toLowerCase()}`)
    );
    if (suffix) return path.join(dir, suffix);
  } catch {
    // Directory might not exist
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const rawSegments = params.path || [];
    if (!rawSegments.length) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Security: sanitize path segments
    const sanitizedSegments = rawSegments.map((s) => s.replace(/\.\./g, '').replace(/[/\\]/g, ''));
    const relativeSubPath = sanitizedSegments.join('/');
    const fileName = sanitizedSegments[sanitizedSegments.length - 1] || '';
    const cwd = process.cwd();

    // Potential absolute upload root directories on production and local
    const candidateDirs = [
      path.join(cwd, 'public', 'uploads'),
      path.join(cwd, 'web', 'public', 'uploads'),
      path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'uploads'),
      '/www/wwwroot/www.dromkok.com/web/public/uploads',
      '/www/wwwroot/dromkok.com/web/public/uploads',
      '/www/wwwroot/www.dromkok.com/public/uploads',
      '/www/wwwroot/dromkok.com/public/uploads',
      '/www/wwwroot/www.dromkok.com/uploads',
      '/www/wwwroot/dromkok.com/uploads',
      '/var/www/dromkok/ecommerce-monorepo/web/public/uploads',
      '/var/www/dromkok/uploads',
      '/var/www/uploads',
      path.join(cwd, 'public'),
      path.join(cwd, 'web'),
      path.join(cwd, 'web', 'public'),
    ];

    // 1. Direct candidate paths
    const directCandidates: string[] = [];
    for (const dir of candidateDirs) {
      directCandidates.push(path.join(dir, ...sanitizedSegments));
      if (sanitizedSegments.length === 1) {
        directCandidates.push(path.join(dir, 'products', fileName));
        directCandidates.push(path.join(dir, 'general', fileName));
        directCandidates.push(path.join(dir, 'favicons', fileName));
        directCandidates.push(path.join(dir, 'hero', fileName));
      } else {
        directCandidates.push(path.join(dir, fileName));
        directCandidates.push(path.join(dir, 'products', fileName));
        directCandidates.push(path.join(dir, 'general', fileName));
      }
    }

    let foundFile = await findExistingFile(directCandidates);

    // 2. Case-insensitive search on Linux disk
    if (!foundFile && fileName) {
      for (const dir of candidateDirs) {
        const subdirs = ['', 'products', 'general', 'favicons', 'hero'];
        for (const sub of subdirs) {
          const checkDir = sub ? path.join(dir, sub) : dir;
          foundFile = await findCaseInsensitiveInDir(checkDir, fileName);
          if (foundFile) break;
        }
        if (foundFile) break;
      }
    }

    // 3. Fallback resolution: return a real, beautiful product image instead of 404
    if (!foundFile) {
      const lower = fileName.toLowerCase();
      const isFavicon = lower.includes('favicon');
      const isLogo = lower.includes('logo');
      const isHero = lower.includes('hero');

      if (isFavicon) {
        const faviconCandidates = [
          path.join(cwd, 'public', 'favicon.ico'),
          path.join(cwd, 'web', 'public', 'favicon.ico'),
          path.join(cwd, 'public', 'favicon.png'),
          path.join(cwd, 'web', 'public', 'favicon.png'),
          '/www/wwwroot/www.dromkok.com/web/public/favicon.ico',
        ];
        foundFile = await findExistingFile(faviconCandidates);
      } else if (isLogo) {
        const logoCandidates = [
          path.join(cwd, 'public', 'logo.png'),
          path.join(cwd, 'web', 'public', 'logo.png'),
          path.join(cwd, 'public', 'logo.svg'),
          path.join(cwd, 'web', 'public', 'logo.svg'),
          '/www/wwwroot/www.dromkok.com/web/public/logo.png',
        ];
        foundFile = await findExistingFile(logoCandidates);
      } else if (isHero) {
        const heroCandidates = [
          path.join(cwd, 'public', 'images', 'hero', 'hero-1.jpg'),
          path.join(cwd, 'web', 'public', 'images', 'hero', 'hero-1.jpg'),
          '/www/wwwroot/www.dromkok.com/web/public/images/hero',
        ];
        foundFile = await findExistingFile(heroCandidates);
      } else {
        // Product image fallback: find an existing product image or placeholder
        const productFallbacks = [
          path.join(cwd, 'public', 'images', 'products', 'placeholder.jpg'),
          path.join(cwd, 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'public', 'images', 'placeholder.png'),
          path.join(cwd, 'web', 'public', 'images', 'products', 'placeholder.jpg'),
          path.join(cwd, 'web', 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'products', 'placeholder.jpg'),
          path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'product-placeholder.webp'),
          '/www/wwwroot/www.dromkok.com/web/public/images/products/placeholder.jpg',
          '/www/wwwroot/www.dromkok.com/web/public/images/product-placeholder.webp',
          '/www/wwwroot/dromkok.com/web/public/images/products/placeholder.jpg',
          '/www/wwwroot/dromkok.com/web/public/images/product-placeholder.webp',
        ];
        foundFile = await findExistingFile(productFallbacks);
      }
    }

    if (!foundFile) {
      // Clean SVG fallback returned with 200 OK so images never break or cause layout shifts
      const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="#f8fafc"/><path d="M160 180a20 20 0 100-40 20 20 0 000 40zm80 70H160l40-50 25 31 15-18 40 37z" fill="#cbd5e1"/><text x="200" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">Global Trade</text></svg>`;
      return new NextResponse(svgFallback, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'X-Media-Served-By': 'dromkok-uploads-fallback-svg',
        },
      });
    }

    const fileBuffer = await fs.readFile(foundFile);
    const mimeType = getMimeType(foundFile);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': fileBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
        'X-Media-Served-By': 'dromkok-uploads-api',
      },
    });
  } catch (error) {
    console.error('[api/uploads] Error serving file:', error);
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
    },
  });
}
