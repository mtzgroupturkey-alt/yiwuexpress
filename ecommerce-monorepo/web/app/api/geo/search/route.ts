import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface AddressSearchResult {
  id: string;
  label: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const locale = searchParams.get('locale') || 'ru';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const trimmed = query.trim();
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

    if (yandexApiKey) {
      try {
        const yandexLang = locale === 'zh' ? 'en_US' : locale === 'en' ? 'en_US' : 'ru_RU';
        const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
          yandexApiKey
        )}&geocode=${encodeURIComponent(trimmed)}&format=json&lang=${yandexLang}&results=5`;

        const yRes = await fetch(yandexUrl, {
          headers: { 'User-Agent': 'DromkokEcommerce/1.0' },
        });

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

            return NextResponse.json({ success: true, results });
          }
        }
      } catch (yErr) {
        console.warn('Yandex forward search failed, trying OSM:', yErr);
      }
    }

    // 2. OpenStreetMap Nominatim search fallback
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=5&accept-language=${encodeURIComponent(acceptLang)}`;

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'DromkokEcommerce/1.0 (info@dromkok.com)',
      },
    });

    if (!osmRes.ok) {
      return NextResponse.json({ success: true, results: [] });
    }

    const osmData = await osmRes.json();
    const results: AddressSearchResult[] = (osmData || []).map((item: any) => {
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

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Error in address search API:', err);
    return NextResponse.json({ success: false, results: [] }, { status: 500 });
  }
}
