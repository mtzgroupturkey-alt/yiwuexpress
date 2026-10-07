export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export const PRODUCT_BADGE_KEYS = [
  // Warranty
  'pdpWarrantyTitle',
  'pdpWarrantySubtitle',
  // Delivery
  'pdpDeliveryTitle',
  'pdpDeliverySubtitle',
  // Returns
  'pdpReturnsTitle',
  'pdpReturnsSubtitle',
  // Cutoff hour (e.g. "18" for 18:00)
  'pdpCutoffHour',
  // Delivery timing rules
  'pdpDeliveryMinsk',
  'pdpDeliveryBelarusRegion',
  'pdpDeliveryChinaLocal',
  'pdpDeliveryChinaNationwide',
  'pdpAirFreightDays',
  'pdpRailFreightDays',
  'pdpSeaFreightDays',
  // Trust Badges (Mobile & Desktop)
  'pdpFactoryTitle',
  'pdpFactoryDesc',
  'pdpQcTitle',
  'pdpQcDesc',
  'pdpLogisticsTitle',
  'pdpLogisticsDesc',
  'pdpEscrowTitle',
  'pdpEscrowDesc',
] as const;

export type ProductBadgeKey = (typeof PRODUCT_BADGE_KEYS)[number];

export const DEFAULT_PRODUCT_BADGES: Record<'en' | 'ru' | 'zh', Record<ProductBadgeKey, string>> = {
  en: {
    pdpWarrantyTitle: '2-Year Warranty',
    pdpWarrantySubtitle: 'Full factory coverage',
    pdpDeliveryTitle: 'Express Delivery',
    pdpDeliverySubtitle: 'Free over $50+',
    pdpReturnsTitle: '14-Day Returns',
    pdpReturnsSubtitle: 'Hassle-free guarantee',
    pdpCutoffHour: '18',
    pdpDeliveryMinsk: 'Tomorrow (1 business day)',
    pdpDeliveryBelarusRegion: '1 – 3 business days',
    pdpDeliveryChinaLocal: '24 – 48 hours',
    pdpDeliveryChinaNationwide: '2 – 3 days',
    pdpAirFreightDays: '5 – 8 business days',
    pdpRailFreightDays: '14 – 20 business days',
    pdpSeaFreightDays: '20 – 35 days',
    pdpFactoryTitle: 'Direct Verified Factory',
    pdpFactoryDesc: 'Zero middleman markup directly from manufacturer',
    pdpQcTitle: 'Rigorous Quality Inspection',
    pdpQcDesc: 'Full physical check before shipment',
    pdpLogisticsTitle: 'Door-to-Door Logistics',
    pdpLogisticsDesc: 'Air, rail & sea freight with customs clearance',
    pdpEscrowTitle: 'Trade Assurance Escrow',
    pdpEscrowDesc: 'Funds protected until inspection passes',
  },
  ru: {
    pdpWarrantyTitle: '2 года гарантии',
    pdpWarrantySubtitle: 'Официальная заводская гарантия',
    pdpDeliveryTitle: 'Экспресс-доставка',
    pdpDeliverySubtitle: 'От $50 бесплатно',
    pdpReturnsTitle: '14 дней возврат',
    pdpReturnsSubtitle: 'Легкий и быстрый возврат',
    pdpCutoffHour: '18',
    pdpDeliveryMinsk: 'Завтра (1 рабочий день)',
    pdpDeliveryBelarusRegion: '1 – 3 рабочих дня',
    pdpDeliveryChinaLocal: '24 – 48 часов',
    pdpDeliveryChinaNationwide: '2 – 3 дня',
    pdpAirFreightDays: '5 – 8 рабочих дней',
    pdpRailFreightDays: '14 – 20 рабочих дней',
    pdpSeaFreightDays: '20 – 35 дней',
    pdpFactoryTitle: 'Прямой производитель',
    pdpFactoryDesc: 'Без наценок посредников напрямую с завода',
    pdpQcTitle: 'Контроль качества (QC)',
    pdpQcDesc: 'Проверка товара перед отправкой',
    pdpLogisticsTitle: 'Таможенная очистка DDP',
    pdpLogisticsDesc: 'Авиа, ж/д и морская доставка до двери',
    pdpEscrowTitle: 'Безопасная сделка',
    pdpEscrowDesc: 'Оплата защищена до получения и проверки',
  },
  zh: {
    pdpWarrantyTitle: '2年原厂质保',
    pdpWarrantySubtitle: '官方正品全国联保',
    pdpDeliveryTitle: '极速直达物流',
    pdpDeliverySubtitle: '满额免费包邮',
    pdpReturnsTitle: '14天无忧退换',
    pdpReturnsSubtitle: '支持极速退款换货',
    pdpCutoffHour: '18',
    pdpDeliveryMinsk: '次日达（明斯克专线1个工作日）',
    pdpDeliveryBelarusRegion: '白俄罗斯各州（1 – 3个工作日）',
    pdpDeliveryChinaLocal: '中国核心仓现货（24 – 48小时）',
    pdpDeliveryChinaNationwide: '中国全国陆运（2 – 3天）',
    pdpAirFreightDays: '5 – 8个工作日（空运专线含税到门）',
    pdpRailFreightDays: '14 – 20个工作日（中欧班列铁路集运）',
    pdpSeaFreightDays: '20 – 35天（国际海运整柜/拼箱）',
    pdpFactoryTitle: '源头工厂直供',
    pdpFactoryDesc: '无中间商一手出厂底价',
    pdpQcTitle: '专业验厂与品控',
    pdpQcDesc: '出货前实物检测严格把关',
    pdpLogisticsTitle: '双清包税物流专线',
    pdpLogisticsDesc: '海运空运铁路全链路门到门',
    pdpEscrowTitle: '贸易资金担保',
    pdpEscrowDesc: '验货通过后支付尾款安全有保障',
  },
};

// GET /api/admin/settings/product-badges
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    let settings = await prisma.systemSettings.findFirst({
      select: { id: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
        },
        select: { id: true },
      });
    }

    const translations = await prisma.systemSettingTranslation.findMany({
      where: {
        systemSettingId: settings.id,
        key: { in: [...PRODUCT_BADGE_KEYS] },
      },
      select: {
        locale: true,
        key: true,
        value: true,
      },
    });

    // Assemble dictionary by locale
    const result: Record<'en' | 'ru' | 'zh', Record<string, string>> = {
      en: { ...DEFAULT_PRODUCT_BADGES.en },
      ru: { ...DEFAULT_PRODUCT_BADGES.ru },
      zh: { ...DEFAULT_PRODUCT_BADGES.zh },
    };

    for (const row of translations) {
      const loc = row.locale as 'en' | 'ru' | 'zh';
      if (result[loc] && row.key) {
        result[loc][row.key] = row.value;
      }
    }

    return NextResponse.json({
      success: true,
      badges: result,
      keys: PRODUCT_BADGE_KEYS,
    });
  } catch (error: any) {
    console.error('Error fetching product badges:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/product-badges
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const badges: Record<string, Record<string, string>> = body.badges || {};

    let settings = await prisma.systemSettings.findFirst({
      select: { id: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
        },
        select: { id: true },
      });
    }

    const upserts: any[] = [];
    const supportedLocales: Array<'en' | 'ru' | 'zh'> = ['en', 'ru', 'zh'];

    for (const locale of supportedLocales) {
      const localeBadges = badges[locale] || {};
      for (const key of PRODUCT_BADGE_KEYS) {
        const val = localeBadges[key] ?? DEFAULT_PRODUCT_BADGES[locale][key];
        upserts.push(
          prisma.systemSettingTranslation.upsert({
            where: {
              systemSettingId_locale_key: {
                systemSettingId: settings.id,
                locale,
                key,
              },
            },
            create: {
              systemSettingId: settings.id,
              locale,
              key,
              value: String(val).trim(),
            },
            update: {
              value: String(val).trim(),
            },
          })
        );
      }
    }

    if (upserts.length > 0) {
      await prisma.$transaction(upserts);
    }

    return NextResponse.json({
      success: true,
      message: 'Product badges and delivery timings updated successfully',
    });
  } catch (error: any) {
    console.error('Error saving product badges:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save product badges' },
      { status: 500 }
    );
  }
}
