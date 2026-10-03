export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="#f8fafc"/><path d="M160 180a20 20 0 100-40 20 20 0 000 40zm80 70H160l40-50 25 31 15-18 40 37z" fill="#cbd5e1"/><text x="200" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">Global Trade</text></svg>`;

async function getFallbackImageResponse(): Promise<NextResponse> {
  const cwd = process.cwd();
  const candidatePaths = [
    path.join(cwd, 'public', 'images', 'product-placeholder.webp'),
    path.join(cwd, 'web', 'public', 'images', 'product-placeholder.webp'),
    path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'product-placeholder.webp'),
    '/www/wwwroot/www.dromkok.com/web/public/images/product-placeholder.webp',
    '/www/wwwroot/dromkok.com/web/public/images/product-placeholder.webp',
  ];

  for (const candidate of candidatePaths) {
    try {
      const buffer = await fs.readFile(candidate);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*',
          'X-Image-Fallback': 'true',
        },
      });
    } catch {
      // Continue to next candidate
    }
  }

  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'X-Image-Fallback': 'svg',
    },
  });
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');

  if (!urlParam) {
    return getFallbackImageResponse();
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return getFallbackImageResponse();
    }
  } catch {
    return getFallbackImageResponse();
  }

  try {
    const isIkea = /ikea\.com$/i.test(targetUrl.hostname);
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    // If target is IKEA, use IKEA itself as Referer to bypass hotlink protection
    if (isIkea) {
      headers['Referer'] = 'https://www.ikea.com/';
      headers['Origin'] = 'https://www.ikea.com';
    }

    const response = await fetch(targetUrl.toString(), {
      headers,
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return getFallbackImageResponse();
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'X-Proxy-Cache': 'HIT',
      },
    });
  } catch (error) {
    console.warn('[proxy/image] Error fetching remote image:', targetUrl.toString(), error instanceof Error ? error.message : error);
    return getFallbackImageResponse();
  }
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}
