import { NextRequest, NextResponse } from 'next/server';

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
        select: { mapProvider: true, yandexMapsApiKey: true, yandexGeocoderApiKey: true } as any
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

        const yRes = await fetch(yandexUrl, {
          headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
        });

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
              countryCode = addressDetails?.country_code?.toUpperCase() || (country === 'Беларусь' ? 'BY' : country === 'Россия' ? 'RU' : '');
            }

            const formattedAddress =
              meta?.text ||
              [street, houseNumber, city, country].filter(Boolean).join(', ');

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
      } catch (yErr) {
        console.warn('Yandex geocoding failed, falling back to OSM:', yErr);
      }
    }

    // 2. Fallback: OpenStreetMap Nominatim reverse geocoder
    const acceptLang = locale === 'ru' ? 'ru,en;q=0.8' : locale === 'zh' ? 'zh,en;q=0.8' : 'en';
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=${encodeURIComponent(
      acceptLang
    )}`;

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'DromkokEcommerce/1.0 (info@dromkok.com)',
      },
    });

    if (!osmRes.ok) {
      throw new Error(`Nominatim error: ${osmRes.status}`);
    }

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

    // Clean human readable line
    const addressParts: string[] = [];
    if (street) addressParts.push(houseNumber ? `${street}, ${houseNumber}` : street);
    if (city && city !== street) addressParts.push(city);
    if (state && state !== city) addressParts.push(state);
    if (country) addressParts.push(country);

    const formattedAddress = addressParts.join(', ') || osmData.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

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
  } catch (error: any) {
    console.error('Error in reverse geocoding API:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reverse geocode location' },
      { status: 500 }
    );
  }
}
