export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="#f8fafc"/><path d="M160 180a20 20 0 100-40 20 20 0 000 40zm80 70H160l40-50 25 31 15-18 40 37z" fill="#cbd5e1"/><text x="200" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">Global Trade</text></svg>`;

/**
 * SSRF Defense: Validates that the requested target URL is a safe, routable public address.
 * Strictly rejects loopback (127.0.0.0/8), RFC1918 private subnets, cloud metadata (169.254.169.254),
 * and local hostnames.
 */
function isSafePublicUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  // Block localhost and internal names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    return false;
  }

  // Block IPv4 private/loopback/cloud-metadata addresses
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const o1 = Number(ipv4Match[1]);
    const o2 = Number(ipv4Match[2]);
    if (o1 === 127) return false; // 127.0.0.0/8 (Loopback)
    if (o1 === 10) return false; // 10.0.0.0/8 (Private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return false; // 172.16.0.0/12 (Private)
    if (o1 === 192 && o2 === 168) return false; // 192.168.0.0/16 (Private)
    if (o1 === 169 && o2 === 254) return false; // 169.254.0.0/16 (Cloud metadata)
    if (o1 === 0 || o1 >= 224) return false; // 0.0.0.0, Multicast, Reserved
  }

  // Block IPv6 addresses (loopback, link-local, unique local)
  if (hostname.includes(':') || hostname.startsWith('[') || hostname === '::1') {
    return false;
  }

  return true;
}

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
    if (!isSafePublicUrl(targetUrl)) {
      return NextResponse.json({ error: 'Prohibited target address' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 });
  }

  try {
    const isIkea = /ikea\.com$/i.test(targetUrl.hostname);
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    if (isIkea) {
      headers['Referer'] = 'https://www.ikea.com/';
      headers['Origin'] = 'https://www.ikea.com';
    }

    const response = await fetch(targetUrl.toString(), {
      headers,
      signal: AbortSignal.timeout(8000),
      redirect: 'error', // Security: Do NOT follow redirects to prevent redirect-based SSRF into private IP space
    });

    if (!response.ok) {
      return getFallbackImageResponse();
    }

    const contentType = response.headers.get('content-type') || '';
    // Security: Validate that returned MIME type is strictly an image
    if (!contentType.toLowerCase().startsWith('image/')) {
      return getFallbackImageResponse();
    }

    const buffer = await response.arrayBuffer();
    // Enforce 10MB maximum image size to prevent memory exhaustion
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return getFallbackImageResponse();
    }

    const nodeBuffer = Buffer.from(buffer);

    return new NextResponse(nodeBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': nodeBuffer.length.toString(),
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'X-Proxy-Cache': 'HIT',
      },
    });
  } catch {
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
