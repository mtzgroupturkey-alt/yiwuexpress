/**
 * Geographic coordinate resolution & offline fallback utilities.
 * Ensures the delivery address display ALWAYS shows real, human-readable
 * city & country names instead of raw latitude/longitude numbers.
 */

export interface ResolvedLocation {
  city: string;
  country: string;
  countryCode: string;
  formattedAddress: string;
  street?: string;
}

interface RegionBound {
  name: { ru: string; en: string; zh: string };
  country: { ru: string; en: string; zh: string };
  code: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// Bounding boxes for major trade hubs & metropolitan areas
const REGION_BOUNDS: RegionBound[] = [
  // Moscow & Moscow Metropolitan Area
  {
    name: { ru: 'Москва', en: 'Moscow', zh: '莫斯科' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 55.1,
    latMax: 56.2,
    lngMin: 36.8,
    lngMax: 38.2,
  },
  // Saint Petersburg & Leningrad Oblast
  {
    name: { ru: 'Санкт-Петербург', en: 'Saint Petersburg', zh: '圣彼得堡' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 59.5,
    latMax: 60.4,
    lngMin: 29.5,
    lngMax: 30.9,
  },
  // Minsk & Minsk Region
  {
    name: { ru: 'Минск', en: 'Minsk', zh: '明斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.7,
    latMax: 54.1,
    lngMin: 27.3,
    lngMax: 27.8,
  },
  // Brest
  {
    name: { ru: 'Брест', en: 'Brest', zh: '布列斯特' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 52.0,
    latMax: 52.2,
    lngMin: 23.5,
    lngMax: 23.9,
  },
  // Grodno
  {
    name: { ru: 'Гродно', en: 'Grodno', zh: '格罗德诺' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.5,
    latMax: 53.8,
    lngMin: 23.6,
    lngMax: 24.0,
  },
  // Gomel
  {
    name: { ru: 'Гомель', en: 'Gomel', zh: '戈梅利' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 52.3,
    latMax: 52.6,
    lngMin: 30.8,
    lngMax: 31.2,
  },
  // Vitebsk
  {
    name: { ru: 'Витебск', en: 'Vitebsk', zh: '维捷布斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 55.1,
    latMax: 55.3,
    lngMin: 30.1,
    lngMax: 30.4,
  },
  // Mogilev
  {
    name: { ru: 'Могилев', en: 'Mogilev', zh: '莫吉廖夫' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.8,
    latMax: 54.0,
    lngMin: 30.2,
    lngMax: 30.5,
  },
  // Yiwu / Jinhua
  {
    name: { ru: 'Иу', en: 'Yiwu', zh: '义乌' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.1,
    latMax: 29.5,
    lngMin: 119.9,
    lngMax: 120.3,
  },
  // Hangzhou
  {
    name: { ru: 'Ханчжоу', en: 'Hangzhou', zh: '杭州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.9,
    latMax: 30.5,
    lngMin: 119.8,
    lngMax: 120.6,
  },
  // Ningbo
  {
    name: { ru: 'Нинбо', en: 'Ningbo', zh: '宁波' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.5,
    latMax: 30.1,
    lngMin: 121.2,
    lngMax: 121.9,
  },
  // Shanghai
  {
    name: { ru: 'Шанхай', en: 'Shanghai', zh: '上海' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 30.8,
    latMax: 31.6,
    lngMin: 121.1,
    lngMax: 122.0,
  },
  // Beijing
  {
    name: { ru: 'Пекин', en: 'Beijing', zh: '北京' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 39.6,
    latMax: 40.3,
    lngMin: 116.0,
    lngMax: 116.8,
  },
  // Guangzhou
  {
    name: { ru: 'Гуанчжоу', en: 'Guangzhou', zh: '广州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 22.8,
    latMax: 23.5,
    lngMin: 113.0,
    lngMax: 113.8,
  },
  // Shenzhen
  {
    name: { ru: 'Шэньчжэнь', en: 'Shenzhen', zh: '深圳' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 22.4,
    latMax: 22.9,
    lngMin: 113.8,
    lngMax: 114.5,
  },
  // Almaty
  {
    name: { ru: 'Алматы', en: 'Almaty', zh: '阿拉木图' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    latMin: 43.1,
    latMax: 43.4,
    lngMin: 76.7,
    lngMax: 77.1,
  },
  // Astana
  {
    name: { ru: 'Астана', en: 'Astana', zh: '阿斯塔纳' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    latMin: 51.0,
    latMax: 51.3,
    lngMin: 71.3,
    lngMax: 71.6,
  },
  // Istanbul
  {
    name: { ru: 'Стамбул', en: 'Istanbul', zh: '伊斯坦布尔' },
    country: { ru: 'Турция', en: 'Turkey', zh: '土耳其' },
    code: 'TR',
    latMin: 40.8,
    latMax: 41.3,
    lngMin: 28.6,
    lngMax: 29.4,
  },
  // Dubai
  {
    name: { ru: 'Дубай', en: 'Dubai', zh: '迪拜' },
    country: { ru: 'ОАЭ', en: 'UAE', zh: '阿联酋' },
    code: 'AE',
    latMin: 24.9,
    latMax: 25.4,
    lngMin: 55.0,
    lngMax: 55.6,
  },
  // Broad country bounds as fallback
  {
    name: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 41.0,
    latMax: 82.0,
    lngMin: 19.0,
    lngMax: 180.0,
  },
  {
    name: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 51.2,
    latMax: 56.2,
    lngMin: 23.1,
    lngMax: 32.8,
  },
  {
    name: { ru: 'Китай', en: 'China', zh: '中国' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 18.0,
    latMax: 53.6,
    lngMin: 73.5,
    lngMax: 135.1,
  },
];

/**
 * Checks whether a string is composed of raw latitude/longitude coordinates
 * e.g. "55.75604, 37.61317" or "55.75604" or "55.75604, Russia"
 */
export function isCoordinateAddress(addr: string | null | undefined): boolean {
  if (!addr || typeof addr !== 'string') return false;
  const trimmed = addr.trim();

  // Pattern 1: "lat, lng" e.g. "55.75604, 37.61317"
  if (/^[-+]?\d{1,3}\.\d+[\s,]+[-+]?\d{1,3}\.\d+$/.test(trimmed)) {
    return true;
  }

  // Pattern 2: "lat, Country" where city is a float e.g. "55.75604, Russia"
  if (/^[-+]?\d{1,3}\.\d+[\s,]+[A-Za-zА-Яа-я\u4e00-\u9fa5]+/.test(trimmed)) {
    return true;
  }

  // Pattern 3: Lone float coordinate e.g. "55.75604"
  if (/^[-+]?\d{1,3}\.\d+$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Parses latitude and longitude from a coordinate string
 */
export function parseCoordinates(addr: string | null | undefined): { lat: number; lng: number } | null {
  if (!addr || typeof addr !== 'string') return null;
  const match = addr.trim().match(/([-+]?\d{1,3}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Single latitude fallback (check if starts with lat float)
  const singleMatch = addr.trim().match(/^([-+]?\d{1,3}\.\d+)/);
  if (singleMatch) {
    const lat = parseFloat(singleMatch[1]);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      // If lat ~55.75, lng is typically Moscow (~37.61)
      if (lat >= 55.1 && lat <= 56.2) return { lat, lng: 37.6173 };
      if (lat >= 53.7 && lat <= 54.1) return { lat, lng: 27.5590 };
      if (lat >= 59.5 && lat <= 60.4) return { lat, lng: 30.3351 };
      if (lat >= 29.1 && lat <= 29.5) return { lat, lng: 120.0754 };
      return { lat, lng: 0 };
    }
  }

  return null;
}

/**
 * Offline geometric resolver: maps coordinates to actual city and country
 * based on geographical bounding polygons.
 */
export function getOfflineLocationName(
  lat: number,
  lng: number,
  locale: string = 'en'
): ResolvedLocation {
  const normLocale = (locale.startsWith('ru') ? 'ru' : locale.startsWith('zh') ? 'zh' : 'en') as 'ru' | 'en' | 'zh';

  for (const b of REGION_BOUNDS) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      const city = b.name[normLocale] || b.name.en;
      const country = b.country[normLocale] || b.country.en;
      const formattedAddress = city === country ? country : `${city}, ${country}`;
      return {
        city,
        country,
        countryCode: b.code,
        formattedAddress,
      };
    }
  }

  // Generic fallback if coordinates are outside known bounds
  const defaultCountry = normLocale === 'ru' ? 'Россия' : normLocale === 'zh' ? '俄罗斯' : 'Russia';
  const defaultCity = normLocale === 'ru' ? 'Центральный регион' : normLocale === 'zh' ? '核心枢纽' : 'Central Region';
  return {
    city: defaultCity,
    country: defaultCountry,
    countryCode: 'RU',
    formattedAddress: `${defaultCity}, ${defaultCountry}`,
  };
}

/**
 * Cleans an address string so it NEVER displays raw coordinate floats to the user.
 * e.g. "55.75604, 37.61317" -> "Moscow, Russia"
 *      "55.75604, Russia"   -> "Moscow, Russia"
 */
export function cleanAddressDisplay(
  rawAddress: string | null | undefined,
  locale: string = 'en'
): string {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return locale === 'ru' ? 'Москва, Россия' : locale === 'zh' ? '莫斯科, 俄罗斯' : 'Moscow, Russia';
  }

  const trimmed = rawAddress.trim();
  if (!isCoordinateAddress(trimmed)) {
    return trimmed;
  }

  const coords = parseCoordinates(trimmed);
  if (coords) {
    const offline = getOfflineLocationName(coords.lat, coords.lng, locale);
    return offline.formattedAddress;
  }

  return locale === 'ru' ? 'Москва, Россия' : locale === 'zh' ? '莫斯科, 俄罗斯' : 'Moscow, Russia';
}

/**
 * Resolves coordinates via public client-side BigDataCloud reverse geocode
 * with instant fallback to offline bounding boxes.
 */
export async function resolveCoordinatesClientSide(
  lat: number,
  lng: number,
  locale: string = 'en'
): Promise<ResolvedLocation> {
  const normLocale = locale.startsWith('ru') ? 'ru' : locale.startsWith('zh') ? 'zh' : 'en';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${encodeURIComponent(normLocale)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const country = data.countryName || (normLocale === 'ru' ? 'Россия' : normLocale === 'zh' ? '俄罗斯' : 'Russia');
      const countryCode = (data.countryCode || 'RU').toUpperCase();
      const city = data.city || data.locality || data.principalSubdivision || '';
      const locality = data.locality || '';

      const parts: string[] = [];
      if (locality && locality !== city) parts.push(locality);
      if (city) parts.push(city);
      if (country && country !== city) parts.push(country);

      const formatted = parts.length > 0 ? parts.join(', ') : `${city || country}`;

      if (city || country) {
        return {
          city: city || country,
          country,
          countryCode,
          formattedAddress: formatted,
          street: locality || undefined,
        };
      }
    }
  } catch (err) {
    // Silently proceed to offline resolver
  }

  return getOfflineLocationName(lat, lng, locale);
}
