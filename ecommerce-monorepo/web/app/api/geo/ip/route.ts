import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GeoLocationResult {
  city?: string;
  country?: string;
  countryCode?: string;
  formatted?: string;
  ip?: string;
  lat?: number;
  lng?: number;
  source: 'cloudflare' | 'vercel' | 'ip-api' | 'fallback';
}

function cleanIp(rawIp: string | null | undefined): string | null {
  if (!rawIp) return null;
  const ip = rawIp.split(',')[0].trim();
  // Filter out loopback / local IPs
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.')
  ) {
    return null;
  }
  return ip;
}

export async function GET(request: NextRequest) {
  try {
    const cfCity = request.headers.get('cf-ipcity');
    const cfCountry = request.headers.get('cf-ipcountry');
    const cfLat = parseFloat(request.headers.get('cf-iplatitude') || '');
    const cfLng = parseFloat(request.headers.get('cf-iplongitude') || '');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelLat = parseFloat(request.headers.get('x-vercel-ip-latitude') || '');
    const vercelLng = parseFloat(request.headers.get('x-vercel-ip-longitude') || '');

    // 1. Check Cloudflare Edge Headers if present
    if (cfCity || cfCountry) {
      const parts = [cfCity, cfCountry].filter(Boolean);
      return NextResponse.json({
        success: true,
        city: cfCity || undefined,
        country: cfCountry || undefined,
        countryCode: cfCountry || undefined,
        formatted: parts.join(', '),
        lat: !isNaN(cfLat) ? cfLat : undefined,
        lng: !isNaN(cfLng) ? cfLng : undefined,
        source: 'cloudflare',
      });
    }

    // 2. Check Vercel Edge Headers if present
    if (vercelCity || vercelCountry) {
      const parts = [vercelCity, vercelCountry].filter(Boolean);
      return NextResponse.json({
        success: true,
        city: vercelCity || undefined,
        country: vercelCountry || undefined,
        countryCode: vercelCountry || undefined,
        formatted: parts.join(', '),
        lat: !isNaN(vercelLat) ? vercelLat : undefined,
        lng: !isNaN(vercelLng) ? vercelLng : undefined,
        source: 'vercel',
      });
    }

    // 3. Resolve client IP from common proxy headers
    const rawIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.ip;

    const publicIp = cleanIp(rawIp);

    // 4. Perform IP-based geo lookup
    // If public IP is available, query ip-api.com (or ipwho.is as fallback)
    const queryUrl = publicIp
      ? `http://ip-api.com/json/${encodeURIComponent(publicIp)}?fields=status,message,country,city,countryCode,lat,lon`
      : 'http://ip-api.com/json/?fields=status,message,country,city,countryCode,lat,lon';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(queryUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && (data.city || data.country)) {
          const parts = [data.city, data.country].filter(Boolean);
          return NextResponse.json({
            success: true,
            city: data.city || undefined,
            country: data.country || undefined,
            countryCode: data.countryCode || undefined,
            formatted: parts.join(', '),
            lat: data.lat,
            lng: data.lon,
            ip: publicIp || undefined,
            source: 'ip-api',
          });
        }
      }
    } catch (apiErr) {
      // Fallback to secondary geo service (ipwho.is)
      try {
        const fallbackUrl = publicIp
          ? `https://ipwho.is/${encodeURIComponent(publicIp)}`
          : 'https://ipwho.is/';

        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 2500);

        const res2 = await fetch(fallbackUrl, { signal: controller2.signal });
        clearTimeout(timeout2);

        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.success && (data2.city || data2.country)) {
            const parts = [data2.city, data2.country].filter(Boolean);
            return NextResponse.json({
              success: true,
              city: data2.city || undefined,
              country: data2.country || undefined,
              countryCode: data2.country_code || undefined,
              formatted: parts.join(', '),
              lat: data2.latitude,
              lng: data2.longitude,
              ip: publicIp || undefined,
              source: 'ipwho.is',
            });
          }
        }
      } catch (fbErr) {
        console.warn('Fallback IP geo failed:', fbErr);
      }
    }

    // Default safe fallback if all geolocation lookups fail
    return NextResponse.json({
      success: true,
      city: 'Central Hub',
      country: 'Global Shipping',
      countryCode: 'CN',
      formatted: 'Central Hub, Global Shipping',
      lat: 29.3069,
      lng: 120.0754,
      source: 'fallback',
    });
  } catch (error) {
    console.error('IP Geolocation error:', error);
    return NextResponse.json({
      success: false,
      formatted: 'Worldwide Shipping',
      source: 'error',
    });
  }
}
