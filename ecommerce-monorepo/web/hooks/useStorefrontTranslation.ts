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

function resolveBadge(tFunc: (key: string, values?: any) => string, text?: string, type?: string): string {
  if (!text && !type) return '';
  const raw = (text || '').trim();
  const lower = raw.toLowerCase();

  // 1. Direct lookup by text
  if (lower && BADGE_MAP[lower]) {
    try {
      const res = tFunc(`badges.${BADGE_MAP[lower]}`);
      if (res && res !== `badges.${BADGE_MAP[lower]}` && !res.startsWith('badges.')) return res;
    } catch {}
  }

  // 2. Percentage promo (e.g. "-18% PROMO")
  const promoMatch = raw.match(/^([+-]?\d+%\s*)(.*)$/i);
  if (promoMatch) {
    const prefix = promoMatch[1].trim();
    const suffix = promoMatch[2].trim().toLowerCase();
    if (suffix && BADGE_MAP[suffix]) {
      try {
        const res = tFunc(`badges.${BADGE_MAP[suffix]}`);
        if (res && !res.startsWith('badges.')) return `${prefix} ${res}`;
      } catch {}
    }
    try {
      const res = tFunc('badges.promo');
      if (res && !res.startsWith('badges.')) return `${prefix} ${res}`;
    } catch {}
  }

  // 3. Lookup by badge type
  if (type) {
    const typeLower = type.toLowerCase();
    const mappedKey = BADGE_MAP[typeLower] || (typeLower === 'promo' ? 'promo' : typeLower === 'hot' ? 'hot' : typeLower === 'bestseller' ? 'bestseller' : typeLower === 'warranty' ? 'warranty' : null);
    if (mappedKey) {
      try {
        const res = tFunc(`badges.${mappedKey}`);
        if (res && res !== `badges.${mappedKey}` && !res.startsWith('badges.')) return res;
      } catch {}
    }
  }

  // 4. Fallback: try raw key or return original text
  try {
    const direct = tFunc(`badges.${raw}`);
    if (direct && direct !== `badges.${raw}` && !direct.startsWith('badges.')) return direct;
  } catch {}

  return raw;
}

export function useStorefrontTranslation() {
  try {
    const t = useTranslations('Storefront');
    const tBadges = (key: string, values?: any) => {
      try { return (t as any)(`badges.${key}`, values); } catch { return key; }
    };

    return {
      t,
      tBadges,
      tBadge: (text?: string, type?: string) => resolveBadge((k, v) => (t as any)(k, v), text, type),
      // Helper shortcuts
      tCategories: (key: string, values?: any) => {
        try { return (t as any)(`categories.${key}`, values); } catch { return key; }
      },
      tTrust: (key: string, values?: any) => {
        try { return (t as any)(`trust.${key}`, values); } catch { return key; }
      },
      tFlash: (key: string, values?: any) => {
        try { return (t as any)(`flashDeals.${key}`, values); } catch { return key; }
      },
      tElectronics: (key: string, values?: any) => {
        try { return (t as any)(`electronics.${key}`, values); } catch { return key; }
      },
      tKitchen: (key: string, values?: any) => {
        try { return (t as any)(`kitchen.${key}`, values); } catch { return key; }
      },
      tBestSellers: (key: string, values?: any) => {
        try { return (t as any)(`bestSellers.${key}`, values); } catch { return key; }
      },
      tWeekly: (key: string, values?: any) => {
        try { return (t as any)(`weeklyBargains.${key}`, values); } catch { return key; }
      },
      tBrandZones: (key: string, values?: any) => {
        try { return (t as any)(`brandZones.${key}`, values); } catch { return key; }
      },
      tMemberClub: (key: string, values?: any) => {
        try { return (t as any)(`memberClub.${key}`, values); } catch { return key; }
      },
      tNewsletter: (key: string, values?: any) => {
        try { return (t as any)(`newsletter.${key}`, values); } catch { return key; }
      },
      tCartDrawer: (key: string, values?: any) => {
        try { return (t as any)(`cartDrawer.${key}`, values); } catch { return key; }
      },
      tModals: (key: string, values?: any) => {
        try { return (t as any)(`modals.${key}`, values); } catch { return key; }
      },
      tShop: (key: string, values?: any) => {
        try { return (t as any)(`shop.${key}`, values); } catch { return key; }
      },
      tPdp: (key: string, values?: any) => {
        try { return (t as any)(`pdp.${key}`, values); } catch { return key; }
      },
      tHeroBanner: (key: string, values?: any) => {
        try { return (t as any)(`heroBanner.${key}`, values); } catch { return key; }
      },
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
