import { NextRequest, NextResponse } from 'next/server';
import { getOfflineLocationName } from '@/lib/geo/coordinateResolver';

export const dynamic = 'force-dynamic';

export interface ReverseGeocodeResult {
  formattedAddress: string;
  country: string;
  countryCode: string;
  city: string;
  state?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

// In-memory cache for recent reverse geocode lookups to avoid rate limiting
const cache = new Map<string, { data: ReverseGeocodeResult; expiresAt: number }>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const locale = searchParams.get('locale') || 'ru';

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Cache key rounded to ~10 meters precision
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${locale}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, address: cached.data });
    }

    // 1. Fetch system settings for custom Yandex API key & provider preference
    let dbSettings: any = null;
    try {
      const { prisma } = await import('@/lib/db');
      dbSettings = await prisma.systemSettings.findFirst({
        select: { mapProvider: true, yandexMapsApiKey: true, yandexGeocoderApiKey: true } as any,
      });
    } catch {}

    const yandexApiKey =
      dbSettings?.yandexGeocoderApiKey?.trim() ||
      dbSettings?.yandexMapsApiKey?.trim() ||
      process.env.YANDEX_GEOCODER_API_KEY ||
      process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY;

    // Try Yandex Geocoder if provider is yandex (or default) and API key exists
    if (yandexApiKey) {
      try {
        const yandexLang = locale === 'zh' ? 'en_US' : locale === 'en' ? 'en_US' : 'ru_RU';
        const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
          yandexApiKey
        )}&geocode=${lng},${lat}&format=json&lang=${yandexLang}&results=1`;

        const yController = new AbortController();
        const yTimer = setTimeout(() => yController.abort(), 3500);
        const yRes = await fetch(yandexUrl, {
          signal: yController.signal,
          headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
        });
        clearTimeout(yTimer);

        if (yRes.ok) {
          const yData = await yRes.json();
          const member =
            yData?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

          if (member) {
            const meta = member.metaDataProperty?.GeocoderMetaData;
            const addressDetails = meta?.Address;
            const components: Array<{ kind: string; name: string }> =
              addressDetails?.Components || [];

            let country = '';
            let countryCode = '';
            let state = '';
            let city = '';
            let street = '';
            let houseNumber = '';
            let postalCode = addressDetails?.postal_code || '';

            for (const comp of components) {
              if (comp.kind === 'country') country = comp.name;
              else if (comp.kind === 'province' && !state) state = comp.name;
              else if (
                comp.kind === 'locality' ||
                comp.kind === 'area' ||
                comp.kind === 'district'
              ) {
                if (!city) city = comp.name;
              } else if (comp.kind === 'street') {
                street = comp.name;
              } else if (comp.kind === 'house') {
                houseNumber = comp.name;
              }
            }

            if (!countryCode) {
              countryCode =
                addressDetails?.country_code?.toUpperCase() ||
                (country === 'Беларусь' ? 'BY' : country === 'Россия' ? 'RU' : '');
            }

            const formattedAddress =
              meta?.text ||
              [street, houseNumber, city, country].filter(Boolean).join(', ');

            if (city || country) {
              const result: ReverseGeocodeResult = {
                formattedAddress,
                country: country || (locale === 'ru' ? 'Россия' : 'Russia'),
                countryCode: countryCode || 'RU',
                city: city || state || '',
                state: state || undefined,
                street: street || undefined,
                houseNumber: houseNumber || undefined,
                postalCode: postalCode || undefined,
                lat,
                lng,
              };

              cache.set(cacheKey, { data: result, expiresAt: Date.now() + 3600000 });
              return NextResponse.json({ success: true, address: result });
            }
          }
        }
      } catch (yErr) {
        console.warn('Yandex geocoding failed, falling back:', yErr);
      }
    }

    // 2. High-reliability fallback: BigDataCloud Reverse Geocoder
    // Works globally without key and is friendly to cloud hosting IPs
    try {
      const bdcLang = locale === 'ru' ? 'ru' : locale === 'zh' ? 'zh' : 'en';
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${encodeURIComponent(
        bdcLang
      )}`;

      const bdcController = new AbortController();
      const bdcTimer = setTimeout(() => bdcController.abort(), 3500);
      const bdcRes = await fetch(bdcUrl, {
        signal: bdcController.signal,
        headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
      });
      clearTimeout(bdcTimer);

      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const country = bdcData.countryName || (locale === 'ru' ? 'Россия' : 'Russia');
        const countryCode = (bdcData.countryCode || 'RU').toUpperCase();
        const city = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
        const state = bdcData.principalSubdivision || '';
        const locality = bdcData.locality || '';

        const parts: string[] = [];
        if (locality && locality !== city) parts.push(locality);
        if (city) parts.push(city);
        if (country && country !== city) parts.push(country);

        const formattedAddress = parts.length > 0 ? parts.join(', ') : `${city || country}`;

        if (city || country) {
          const result: ReverseGeocodeResult = {
            formattedAddress,
            country,
            countryCode,
            city: city || state || '',
            state: state || undefined,
            street: locality || undefined,
            lat,
            lng,
          };

          cache.set(cacheKey, { data: result, expiresAt: Date.now() + 3600000 });
          return NextResponse.json({ success: true, address: result });
        }
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud geocoding failed, trying secondary fallbacks:', bdcErr);
    }

    // 3. Fallback: OpenStreetMap Nominatim reverse geocoder
    try {
      const acceptLang = locale === 'ru' ? 'ru,en;q=0.8' : locale === 'zh' ? 'zh,en;q=0.8' : 'en';
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=${encodeURIComponent(
        acceptLang
      )}`;

      const osmController = new AbortController();
      const osmTimer = setTimeout(() => osmController.abort(), 3500);
      const osmRes = await fetch(osmUrl, {
        signal: osmController.signal,
        headers: {
          'User-Agent': 'DromkokEcommerce/1.0 (info@dromkok.com)',
        },
      });
      clearTimeout(osmTimer);

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};

        const country = addr.country || '';
        const countryCode = (addr.country_code || '').toUpperCase();
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.county ||
          addr.state_district ||
          '';
        const state = addr.state || addr.region || '';
        const street =
          addr.road ||
          addr.street ||
          addr.pedestrian ||
          addr.residential ||
          addr.suburb ||
          '';
        const houseNumber = addr.house_number || '';
        const postalCode = addr.postcode || '';

        const addressParts: string[] = [];
        if (street) addressParts.push(houseNumber ? `${street}, ${houseNumber}` : street);
        if (city && city !== street) addressParts.push(city);
        if (state && state !== city) addressParts.push(state);
        if (country) addressParts.push(country);

        const formattedAddress = addressParts.join(', ') || osmData.display_name;

        if (city || country) {
          const result: ReverseGeocodeResult = {
            formattedAddress,
            country: country || (locale === 'ru' ? 'Россия' : 'Russia'),
            countryCode: countryCode || 'RU',
            city: city || state || '',
            state: state || undefined,
            street: street || undefined,
            houseNumber: houseNumber || undefined,
            postalCode: postalCode || undefined,
            lat,
            lng,
          };

          cache.set(cacheKey, { data: result, expiresAt: Date.now() + 3600000 });
          return NextResponse.json({ success: true, address: result });
        }
      }
    } catch (osmErr) {
      console.warn('Nominatim geocoding failed, trying offline resolver:', osmErr);
    }

    // 4. Guaranteed offline resolver: Geometric polygon lookup
    // Guarantees that valid coordinates are NEVER returned as raw floats
    const offlineResult = getOfflineLocationName(lat, lng, locale);
    const fallbackResult: ReverseGeocodeResult = {
      formattedAddress: offlineResult.formattedAddress,
      country: offlineResult.country,
      countryCode: offlineResult.countryCode,
      city: offlineResult.city,
      lat,
      lng,
    };

    cache.set(cacheKey, { data: fallbackResult, expiresAt: Date.now() + 3600000 });
    return NextResponse.json({ success: true, address: fallbackResult });
  } catch (error: any) {
    console.error('Error in reverse geocoding API:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reverse geocode location' },
      { status: 500 }
    );
  }
}
