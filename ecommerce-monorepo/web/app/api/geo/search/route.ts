import { NextRequest, NextResponse } from 'next/server';
import { searchOfflineCities } from '@/lib/geo/coordinateResolver';

export const dynamic = 'force-dynamic';

export interface AddressSearchResult {
  id: string;
  label: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
}

// In-memory cache for recent search queries to provide sub-millisecond responses
const searchCache = new Map<string, { results: AddressSearchResult[]; expiresAt: number }>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const locale = searchParams.get('locale') || 'ru';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const trimmed = query.trim();
    const cacheKey = `${trimmed.toLowerCase()}_${locale}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, results: cached.results });
    }

    const acceptLang = locale === 'ru' ? 'ru,en;q=0.8' : locale === 'zh' ? 'zh,en;q=0.8' : 'en';

    // 1. Fetch system settings for custom Yandex API key
    let dbSettings: any = null;
    try {
      const { prisma } = await import('@/lib/db');
      dbSettings = await prisma.systemSettings.findFirst({
        select: { mapProvider: true, yandexMapsApiKey: true, yandexGeocoderApiKey: true } as any
      });
    } catch {}

    const yandexApiKey =
      dbSettings?.yandexGeocoderApiKey?.trim() ||
      dbSettings?.yandexMapsApiKey?.trim() ||
      process.env.YANDEX_GEOCODER_API_KEY ||
      process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY;

    // --- TIER 1: Yandex Geocoder API (if key available) ---
    if (yandexApiKey) {
      try {
        const yandexLang = locale === 'zh' ? 'en_US' : locale === 'en' ? 'en_US' : 'ru_RU';
        const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
          yandexApiKey
        )}&geocode=${encodeURIComponent(trimmed)}&format=json&lang=${yandexLang}&results=5`;

        const yController = new AbortController();
        const yTimer = setTimeout(() => yController.abort(), 2500);
        const yRes = await fetch(yandexUrl, {
          signal: yController.signal,
          headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
        });
        clearTimeout(yTimer);

        if (yRes.ok) {
          const yData = await yRes.json();
          const members = yData?.response?.GeoObjectCollection?.featureMember || [];
          if (members.length > 0) {
            const results: AddressSearchResult[] = members.map((m: any, i: number) => {
              const geoObj = m.GeoObject;
              const pos = (geoObj?.Point?.pos || '').split(' ');
              const lng = parseFloat(pos[0]);
              const lat = parseFloat(pos[1]);
              const label = geoObj?.metaDataProperty?.GeocoderMetaData?.text || geoObj?.name || trimmed;
              const details = geoObj?.metaDataProperty?.GeocoderMetaData?.Address;

              return {
                id: `yandex-${i}-${lat}-${lng}`,
                label,
                city: details?.Components?.find((c: any) => c.kind === 'locality')?.name,
                country: details?.country,
                lat,
                lng,
              };
            });

            // Prepend relevant offline cities if matching
            const offlineCities = searchOfflineCities(trimmed, locale, 2);
            for (const off of offlineCities) {
              if (!results.some((r) => Math.abs(r.lat - off.lat) < 0.1 && Math.abs(r.lng - off.lng) < 0.1)) {
                results.unshift(off);
              }
            }

            searchCache.set(cacheKey, { results, expiresAt: Date.now() + 600000 });
            return NextResponse.json({ success: true, results });
          }
        }
      } catch (yErr) {
        console.warn('Yandex forward search failed, trying secondary providers:', yErr);
      }
    }

    // --- TIER 2: Photon Komoot Geocoder API (OSM-based, high performance, does NOT block cloud VPS IPs) ---
    try {
      const photonLang = locale === 'ru' ? 'ru' : locale === 'zh' ? 'default' : 'en';
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6&lang=${photonLang}`;

      const pController = new AbortController();
      const pTimer = setTimeout(() => pController.abort(), 3000);
      const pRes = await fetch(photonUrl, {
        signal: pController.signal,
        headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
      });
      clearTimeout(pTimer);

      if (pRes.ok) {
        const pData = await pRes.json();
        const features = pData?.features || [];
        if (features.length > 0) {
          const results: AddressSearchResult[] = features.map((f: any, idx: number) => {
            const coords = f.geometry?.coordinates || [0, 0];
            const lng = coords[0];
            const lat = coords[1];
            const props = f.properties || {};

            const name = props.name || '';
            const street = props.street
              ? `${props.street}${props.housenumber ? ' ' + props.housenumber : ''}`
              : '';
            const city = props.city || props.town || props.village || props.district || '';
            const state = props.state || '';
            const country = props.country || '';

            const parts: string[] = [];
            if (name) parts.push(name);
            if (street && street !== name) parts.push(street);
            if (city && city !== name) parts.push(city);
            if (state && state !== name && state !== city) parts.push(state);
            if (country && country !== name) parts.push(country);

            const label = parts.length > 0 ? parts.join(', ') : (name || trimmed);

            return {
              id: `photon-${props.osm_id || idx}-${lat}-${lng}`,
              label,
              city: city || name,
              country,
              lat,
              lng,
            };
          });

          // Check if any top offline city can supplement
          const offlineCities = searchOfflineCities(trimmed, locale, 2);
          for (const off of offlineCities) {
            if (!results.some((r) => Math.abs(r.lat - off.lat) < 0.1 && Math.abs(r.lng - off.lng) < 0.1)) {
              results.unshift(off);
            }
          }

          searchCache.set(cacheKey, { results, expiresAt: Date.now() + 600000 });
          return NextResponse.json({ success: true, results });
        }
      }
    } catch (pErr) {
      console.warn('Photon forward search failed, trying OSM Nominatim:', pErr);
    }

    // --- TIER 3: OpenStreetMap Nominatim search fallback ---
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=5&accept-language=${encodeURIComponent(acceptLang)}`;

      const osmController = new AbortController();
      const osmTimer = setTimeout(() => osmController.abort(), 2500);
      const osmRes = await fetch(osmUrl, {
        signal: osmController.signal,
        headers: {
          'User-Agent': 'DromkokEcommerce/1.0 (info@dromkok.com)',
          Referer: 'https://dromkok.com',
        },
      });
      clearTimeout(osmTimer);

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData) && osmData.length > 0) {
          const results: AddressSearchResult[] = osmData.map((item: any) => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const country = addr.country || '';

            return {
              id: `osm-${item.place_id}`,
              label: item.display_name,
              city,
              country,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          searchCache.set(cacheKey, { results, expiresAt: Date.now() + 600000 });
          return NextResponse.json({ success: true, results });
        }
      }
    } catch (osmErr) {
      console.warn('OSM Nominatim forward search failed:', osmErr);
    }

    // --- TIER 4: Guaranteed Offline Major Cities Directory ---
    const offlineResults = searchOfflineCities(trimmed, locale, 6);
    if (offlineResults.length > 0) {
      searchCache.set(cacheKey, { results: offlineResults, expiresAt: Date.now() + 600000 });
      return NextResponse.json({ success: true, results: offlineResults });
    }

    return NextResponse.json({ success: true, results: [] });
  } catch (err: any) {
    console.error('Error in address search API:', err);
    // On unexpected error, return offline matches safely instead of 500
    const query = req.nextUrl?.searchParams?.get('q') || '';
    const locale = req.nextUrl?.searchParams?.get('locale') || 'ru';
    const fallback = searchOfflineCities(query, locale, 5);
    return NextResponse.json({ success: true, results: fallback });
  }
}
