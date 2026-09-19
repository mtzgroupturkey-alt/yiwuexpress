'use client';

import { useTranslations } from 'next-intl';

const BADGE_MAP: Record<string, string> = {
  // Express delivery
  'express': 'express',
  'express delivery': 'express',

  // Bestseller & Top sellers
  'bestseller': 'bestseller',
  'best seller': 'bestseller',
  'best_seller': 'bestseller',
  'hit': 'bestseller',
  'хит': 'bestseller',
  'хит продаж': 'bestseller',
  'top seller': 'topSeller',
  'top_seller': 'topSeller',
  'top rated': 'topSeller',
  'popular': 'bestseller',

  // New
  'new': 'new',
  'new arrival': 'new',
  'новинка': 'new',
  '新品': 'new',
  '新品上市': 'new',

  // Hot
  'hot': 'hot',
  'hot deal': 'hot',
  'hot sale': 'hot',
  'горячая цена': 'hot',
  'горячее': 'hot',

  // Sale / Promo
  'sale': 'sale',
  'flash sale': 'sale',
  'flash deal': 'sale',
  'promo': 'promo',
  'special offer': 'specialOffer',

  // Limited
  'limited': 'limited',
  'limited quantity': 'limited',
  'limited stock': 'limitedStock',

  // Featured
  'featured': 'featured',
  'рекомендуем': 'featured',
  '官方精选': 'featured',

  // Warranty
  'warranty': 'warranty',
  'official warranty': 'warranty',
  '2-yr wty': 'twoYrWarranty',
  '2-year warranty': 'twoYrWarranty',
  'official 1yr': 'official1Yr',
  '1-yr warranty': 'official1Yr',

  // Wholesale
  'wholesale': 'wholesale',
  'moq': 'wholesale',

  // Special tags from catalog/database
  'local fresh': 'localFresh',
  'farm direct': 'farmDirect',
  'natural minerals': 'naturalMinerals',
  'flagship anc': 'flagshipAnc',
  'mega pack': 'megaPack',
  'barrier repair': 'barrierRepair',
  'derma choice': 'dermaChoice',
  'genuine eac': 'genuineEac',
  'fresh today': 'freshToday',
  'omega 3 rich': 'omega3Rich',
  'italian espresso': 'italianEspresso',
  'super 4k uhd': 'super4kUhd',
  'laser lidar 5300pa': 'laserLidar',
  'flexiarm dock': 'flexiarmDock',
  'dual zone 9.5l': 'dualZone',
  'p.e.p. system': 'pepSystem',
  'alpha 9 ai gen7': 'alpha9Gen7',
};

function resolveBadge(
  tFunc: (key: string, values?: any) => string,
  text?: string,
  type?: string,
  hasKey?: (key: string) => boolean
): string {
  if (!text && !type) return '';
  const raw = (text || '').trim();
  const lower = raw.toLowerCase();

  const safeTranslate = (key: string): string | null => {
    if (hasKey && !hasKey(key)) return null;
    try {
      const res = tFunc(key);
      if (res && res !== key && !res.startsWith('badges.')) return res;
    } catch {}
    return null;
  };

  // 1. Direct lookup by text in known BADGE_MAP
  if (lower && BADGE_MAP[lower]) {
    const res = safeTranslate(`badges.${BADGE_MAP[lower]}`);
    if (res) return res;
  }

  // 2. Percentage promo (e.g. "-18% PROMO")
  const promoMatch = raw.match(/^([+-]?\d+%\s*)(.*)$/i);
  if (promoMatch) {
    const prefix = promoMatch[1].trim();
    const suffix = promoMatch[2].trim().toLowerCase();
    if (suffix && BADGE_MAP[suffix]) {
      const res = safeTranslate(`badges.${BADGE_MAP[suffix]}`);
      if (res) return `${prefix} ${res}`;
    }
    const promoRes = safeTranslate('badges.promo');
    if (promoRes) return `${prefix} ${promoRes}`;
  }

  // 3. Lookup by badge type
  if (type) {
    const typeLower = type.toLowerCase();
    const mappedKey = BADGE_MAP[typeLower] || (typeLower === 'promo' ? 'promo' : typeLower === 'hot' ? 'hot' : typeLower === 'bestseller' ? 'bestseller' : typeLower === 'warranty' ? 'warranty' : null);
    if (mappedKey) {
      const res = safeTranslate(`badges.${mappedKey}`);
      if (res) return res;
    }
  }

  // 4. Fallback: only check badges dictionary if raw looks like a valid alphanumeric identifier
  if (/^[a-zA-Z0-9_-]+$/.test(raw)) {
    const direct = safeTranslate(`badges.${raw}`);
    if (direct) return direct;
  }

  return raw;
}

export function useStorefrontTranslation() {
  try {
    const t = useTranslations('Storefront');

    const hasKey = (fullKey: string): boolean => {
      try {
        if (typeof (t as any)?.has === 'function') {
          return (t as any).has(fullKey);
        }
      } catch {}
      return false;
    };

    const safeTranslateWithPrefix = (prefix: string) => (key: string, values?: any) => {
      const fullKey = `${prefix}.${key}`;
      if (typeof (t as any)?.has === 'function' && !(t as any).has(fullKey)) {
        return key;
      }
      try {
        return (t as any)(fullKey, values);
      } catch {
        return key;
      }
    };

    const tBadges = safeTranslateWithPrefix('badges');

    return {
      t,
      tBadges,
      tBadge: (text?: string, type?: string) => resolveBadge((k, v) => (t as any)(k, v), text, type, hasKey),
      // Helper shortcuts with key existence check
      tCategories: safeTranslateWithPrefix('categories'),
      tTrust: safeTranslateWithPrefix('trust'),
      tFlash: safeTranslateWithPrefix('flashDeals'),
      tElectronics: safeTranslateWithPrefix('electronics'),
      tKitchen: safeTranslateWithPrefix('kitchen'),
      tBestSellers: safeTranslateWithPrefix('bestSellers'),
      tWeekly: safeTranslateWithPrefix('weeklyBargains'),
      tBrandZones: safeTranslateWithPrefix('brandZones'),
      tMemberClub: safeTranslateWithPrefix('memberClub'),
      tNewsletter: safeTranslateWithPrefix('newsletter'),
      tCartDrawer: safeTranslateWithPrefix('cartDrawer'),
      tModals: safeTranslateWithPrefix('modals'),
      tShop: safeTranslateWithPrefix('shop'),
      tPdp: safeTranslateWithPrefix('pdp'),
      tHeroBanner: safeTranslateWithPrefix('heroBanner'),
    };
  } catch (error) {
    // Graceful fallback for non-intl contexts
    const fallbackFn = (key: string, values?: any) => {
      if (values?.count !== undefined) return key.replace('{count}', String(values.count));
      return key;
    };
    return {
      t: fallbackFn,
      tBadges: fallbackFn,
      tBadge: (text?: string) => text || '',
      tCategories: fallbackFn,
      tTrust: fallbackFn,
      tFlash: fallbackFn,
      tElectronics: fallbackFn,
      tKitchen: fallbackFn,
      tBestSellers: fallbackFn,
      tWeekly: fallbackFn,
      tBrandZones: fallbackFn,
      tMemberClub: fallbackFn,
      tNewsletter: fallbackFn,
      tCartDrawer: fallbackFn,
      tModals: fallbackFn,
      tShop: fallbackFn,
      tPdp: fallbackFn,
      tHeroBanner: fallbackFn,
    };
  }
}
