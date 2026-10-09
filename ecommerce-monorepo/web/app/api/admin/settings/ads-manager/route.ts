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

const DEFAULT_TRANSLATIONS = {
  weeklyBargains: {
    en: {
      enabled: true,
      badge: 'UP TO -40%',
      tag: 'Weekly Price Drop',
      title: 'Weekly Mega Bargains & Clearance',
      subtitle: 'Limited stock discounts up to 50% off retail pricing across home and garden collections',
      buttonText: 'View all deals',
      buttonLink: '',
    },
    ru: {
      enabled: true,
      badge: 'СКИДКИ ДО -40%',
      tag: 'Еженедельное снижение цен',
      title: 'Мега-распродажа недели и ликвидация',
      subtitle: 'Ограниченный запас скидок до 50% от розничной цены на товары для дома и сада',
      buttonText: 'Смотреть все скидки',
      buttonLink: '',
    },
    zh: {
      enabled: true,
      badge: '低至6折 (-40%)',
      tag: '每周特惠直降',
      title: '每周清仓超值盛典',
      subtitle: '全场家居与园艺系列限量特惠，低至零售价五折',
      buttonText: '查看全部特惠',
      buttonLink: '',
    },
  },
  memberClub: {
    en: {
      enabled: true,
      badge: 'EXCLUSIVE MEMBER CLUB',
      membersCount: 'Over 420,000 active members',
      title: 'Earn 3% Instant Cashback + Free Express Delivery',
      description: 'Join the {name} Club for free today. Spend points directly at checkout on furniture, kitchenware, and smart home appliances (1 point = $1).',
      activateBtn: 'Activate Free Membership',
      activateLink: '',
      howPointsWork: 'How points work',
      howPointsLink: '',
    },
    ru: {
      enabled: true,
      badge: 'ЭКСКЛЮЗИВНЫЙ КЛУБ ПРИВИЛЕГИЙ',
      membersCount: 'Более 420 000 активных участников',
      title: 'Кэшбэк 3% мгновенно + Бесплатная экспресс-доставка',
      description: 'Вступите в клуб {name} бесплатно уже сегодня. Тратьте баллы прямо при оформлении заказа на мебель, посуду и бытовую технику (1 балл = $1).',
      activateBtn: 'Активировать членство бесплатно',
      activateLink: '',
      howPointsWork: 'Как работают баллы',
      howPointsLink: '',
    },
    zh: {
      enabled: true,
      badge: '尊享会员俱乐部',
      membersCount: '超过 420,000 位活跃会员',
      title: '享3%即时返现 + 免费特快专递',
      description: '立即免费加入 {name} 会员俱乐部。在结账时直接抵扣家具、厨具和智能家居产品（1积分 = $1）。',
      activateBtn: '免费激活会员',
      activateLink: '',
      howPointsWork: '积分规则说明',
      howPointsLink: '',
    },
  },
  trustFeatures: {
    en: {
      enabled: true,
      deliveryTitle: 'Express Home Delivery',
      deliveryDesc: 'Carefully packaged and delivered straight to your apartment or front door.',
      guaranteeTitle: 'Zero Damage Guarantee',
      guaranteeDesc: 'Reinforced protective packaging ensuring ceramics, glass, and mirrors arrive pristine.',
      showroomsTitle: '120+ Pickup Showrooms',
      showroomsDesc: 'Inspect items in person, test furniture materials, and pick up free at your convenience.',
      returnsTitle: 'Instant 14-Day Return',
      returnsDesc: 'Simple exchange or full refund for home decor, cookware, and appliances.',
    },
    ru: {
      enabled: true,
      deliveryTitle: 'Экспресс-доставка на дом',
      deliveryDesc: 'Бережная упаковка и доставка прямо до вашей квартиры или двери.',
      guaranteeTitle: 'Гарантия сохранности 100%',
      guaranteeDesc: 'Усиленная защитная упаковка гарантирует целостность керамики, стекла и зеркал.',
      showroomsTitle: '120+ Шоурумов самовывоза',
      showroomsDesc: 'Осмотрите товары вживую, оцените материалы мебели и заберите заказ бесплатно в удобное время.',
      returnsTitle: 'Быстрый возврат 14 дней',
      returnsDesc: 'Простой обмен или полный возврат средств за декор, посуду и бытовую технику.',
    },
    zh: {
      enabled: true,
      deliveryTitle: '极速送达上门',
      deliveryDesc: '专业防护包装，安全送达至您的公寓或家门口。',
      guaranteeTitle: '100%破损包赔',
      guaranteeDesc: '加固抗震缓冲包装，确保陶瓷、玻璃与镜面完好无损。',
      showroomsTitle: '120+ 线下自提体验馆',
      showroomsDesc: '实地触摸家具材质质感，随时免费自提，安心便捷。',
      returnsTitle: '14天无忧退换',
      returnsDesc: '家居饰品、厨具及家用电器支持便捷换货或全额退款。',
    },
  },
};

const ALL_KEYS = [
  'weeklyBargainsEnabled',
  'weeklyBargainsBadge',
  'weeklyBargainsTag',
  'weeklyBargainsTitle',
  'weeklyBargainsSubtitle',
  'weeklyBargainsButtonText',
  'weeklyBargainsButtonLink',
  'memberClubEnabled',
  'memberClubBadge',
  'memberClubMembersCount',
  'memberClubTitle',
  'memberClubDescription',
  'memberClubActivateBtn',
  'memberClubActivateLink',
  'memberClubHowPointsWork',
  'memberClubHowPointsLink',
  'trustFeaturesEnabled',
  'trustDeliveryTitle',
  'trustDeliveryDesc',
  'trustGuaranteeTitle',
  'trustGuaranteeDesc',
  'trustShowroomsTitle',
  'trustShowroomsDesc',
  'trustReturnsTitle',
  'trustReturnsDesc',
];

// GET /api/admin/settings/ads-manager
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    let settings = await prisma.systemSettings.findFirst({
      select: { id: true, companyName: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { companyName: 'Global Trade' },
        select: { id: true, companyName: true },
      });
    }

    // Fetch existing multilingual translations from system_setting_translations
    const translations = await prisma.systemSettingTranslation.findMany({
      where: {
        systemSettingId: settings.id,
        key: { in: ALL_KEYS },
      },
      select: { locale: true, key: true, value: true },
    });

    // Deep copy defaults
    const result = {
      weeklyBargains: JSON.parse(JSON.stringify(DEFAULT_TRANSLATIONS.weeklyBargains)),
      memberClub: JSON.parse(JSON.stringify(DEFAULT_TRANSLATIONS.memberClub)),
      trustFeatures: JSON.parse(JSON.stringify(DEFAULT_TRANSLATIONS.trustFeatures)),
      companyName: settings.companyName || 'Global Trade',
    };

    // Apply translations from database
    for (const t of translations) {
      const loc = t.locale as 'en' | 'ru' | 'zh';
      if (!['en', 'ru', 'zh'].includes(loc)) continue;

      if (t.key === 'weeklyBargainsEnabled') {
        const val = t.value === 'true';
        result.weeklyBargains.en.enabled = val;
        result.weeklyBargains.ru.enabled = val;
        result.weeklyBargains.zh.enabled = val;
      } else if (t.key === 'weeklyBargainsBadge' && t.value) {
        result.weeklyBargains[loc].badge = t.value;
      } else if (t.key === 'weeklyBargainsTag' && t.value) {
        result.weeklyBargains[loc].tag = t.value;
      } else if (t.key === 'weeklyBargainsTitle' && t.value) {
        result.weeklyBargains[loc].title = t.value;
      } else if (t.key === 'weeklyBargainsSubtitle' && t.value) {
        result.weeklyBargains[loc].subtitle = t.value;
      } else if (t.key === 'weeklyBargainsButtonText' && t.value) {
        result.weeklyBargains[loc].buttonText = t.value;
      } else if (t.key === 'weeklyBargainsButtonLink') {
        result.weeklyBargains[loc].buttonLink = t.value;
      } else if (t.key === 'memberClubEnabled') {
        const val = t.value === 'true';
        result.memberClub.en.enabled = val;
        result.memberClub.ru.enabled = val;
        result.memberClub.zh.enabled = val;
      } else if (t.key === 'memberClubBadge' && t.value) {
        result.memberClub[loc].badge = t.value;
      } else if (t.key === 'memberClubMembersCount' && t.value) {
        result.memberClub[loc].membersCount = t.value;
      } else if (t.key === 'memberClubTitle' && t.value) {
        result.memberClub[loc].title = t.value;
      } else if (t.key === 'memberClubDescription' && t.value) {
        result.memberClub[loc].description = t.value;
      } else if (t.key === 'memberClubActivateBtn' && t.value) {
        result.memberClub[loc].activateBtn = t.value;
      } else if (t.key === 'memberClubActivateLink') {
        result.memberClub[loc].activateLink = t.value;
      } else if (t.key === 'memberClubHowPointsWork' && t.value) {
        result.memberClub[loc].howPointsWork = t.value;
      } else if (t.key === 'memberClubHowPointsLink') {
        result.memberClub[loc].howPointsLink = t.value;
      } else if (t.key === 'trustFeaturesEnabled') {
        const val = t.value === 'true';
        result.trustFeatures.en.enabled = val;
        result.trustFeatures.ru.enabled = val;
        result.trustFeatures.zh.enabled = val;
      } else if (t.key === 'trustDeliveryTitle' && t.value) {
        result.trustFeatures[loc].deliveryTitle = t.value;
      } else if (t.key === 'trustDeliveryDesc' && t.value) {
        result.trustFeatures[loc].deliveryDesc = t.value;
      } else if (t.key === 'trustGuaranteeTitle' && t.value) {
        result.trustFeatures[loc].guaranteeTitle = t.value;
      } else if (t.key === 'trustGuaranteeDesc' && t.value) {
        result.trustFeatures[loc].guaranteeDesc = t.value;
      } else if (t.key === 'trustShowroomsTitle' && t.value) {
        result.trustFeatures[loc].showroomsTitle = t.value;
      } else if (t.key === 'trustShowroomsDesc' && t.value) {
        result.trustFeatures[loc].showroomsDesc = t.value;
      } else if (t.key === 'trustReturnsTitle' && t.value) {
        result.trustFeatures[loc].returnsTitle = t.value;
      } else if (t.key === 'trustReturnsDesc' && t.value) {
        result.trustFeatures[loc].returnsDesc = t.value;
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AdsManager GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ads settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings/ads-manager
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { weeklyBargains, memberClub, trustFeatures } = body;

    let settings = await prisma.systemSettings.findFirst({
      select: { id: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { companyName: 'Global Trade' },
        select: { id: true },
      });
    }

    const systemSettingId = settings.id;
    const locales = ['en', 'ru', 'zh'] as const;

    const upsertRows: Array<{ locale: string; key: string; value: string }> = [];

    // Global toggle values
    const wbEnabled = weeklyBargains?.en?.enabled !== false;
    const mcEnabled = memberClub?.en?.enabled !== false;
    const tfEnabled = trustFeatures?.en?.enabled !== false;

    for (const loc of locales) {
      upsertRows.push({ locale: loc, key: 'weeklyBargainsEnabled', value: String(wbEnabled) });
      upsertRows.push({ locale: loc, key: 'memberClubEnabled', value: String(mcEnabled) });
      upsertRows.push({ locale: loc, key: 'trustFeaturesEnabled', value: String(tfEnabled) });

      const wb = weeklyBargains?.[loc] || DEFAULT_TRANSLATIONS.weeklyBargains[loc];
      if (wb) {
        if (wb.badge !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsBadge', value: String(wb.badge) });
        if (wb.tag !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsTag', value: String(wb.tag) });
        if (wb.title !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsTitle', value: String(wb.title) });
        if (wb.subtitle !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsSubtitle', value: String(wb.subtitle) });
        if (wb.buttonText !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsButtonText', value: String(wb.buttonText) });
        if (wb.buttonLink !== undefined) upsertRows.push({ locale: loc, key: 'weeklyBargainsButtonLink', value: String(wb.buttonLink || '') });
      }

      const mc = memberClub?.[loc] || DEFAULT_TRANSLATIONS.memberClub[loc];
      if (mc) {
        if (mc.badge !== undefined) upsertRows.push({ locale: loc, key: 'memberClubBadge', value: String(mc.badge) });
        if (mc.membersCount !== undefined) upsertRows.push({ locale: loc, key: 'memberClubMembersCount', value: String(mc.membersCount) });
        if (mc.title !== undefined) upsertRows.push({ locale: loc, key: 'memberClubTitle', value: String(mc.title) });
        if (mc.description !== undefined) upsertRows.push({ locale: loc, key: 'memberClubDescription', value: String(mc.description) });
        if (mc.activateBtn !== undefined) upsertRows.push({ locale: loc, key: 'memberClubActivateBtn', value: String(mc.activateBtn) });
        if (mc.activateLink !== undefined) upsertRows.push({ locale: loc, key: 'memberClubActivateLink', value: String(mc.activateLink || '') });
        if (mc.howPointsWork !== undefined) upsertRows.push({ locale: loc, key: 'memberClubHowPointsWork', value: String(mc.howPointsWork) });
        if (mc.howPointsLink !== undefined) upsertRows.push({ locale: loc, key: 'memberClubHowPointsLink', value: String(mc.howPointsLink || '') });
      }

      const tf = trustFeatures?.[loc] || DEFAULT_TRANSLATIONS.trustFeatures[loc];
      if (tf) {
        if (tf.deliveryTitle !== undefined) upsertRows.push({ locale: loc, key: 'trustDeliveryTitle', value: String(tf.deliveryTitle) });
        if (tf.deliveryDesc !== undefined) upsertRows.push({ locale: loc, key: 'trustDeliveryDesc', value: String(tf.deliveryDesc) });
        if (tf.guaranteeTitle !== undefined) upsertRows.push({ locale: loc, key: 'trustGuaranteeTitle', value: String(tf.guaranteeTitle) });
        if (tf.guaranteeDesc !== undefined) upsertRows.push({ locale: loc, key: 'trustGuaranteeDesc', value: String(tf.guaranteeDesc) });
        if (tf.showroomsTitle !== undefined) upsertRows.push({ locale: loc, key: 'trustShowroomsTitle', value: String(tf.showroomsTitle) });
        if (tf.showroomsDesc !== undefined) upsertRows.push({ locale: loc, key: 'trustShowroomsDesc', value: String(tf.showroomsDesc) });
        if (tf.returnsTitle !== undefined) upsertRows.push({ locale: loc, key: 'trustReturnsTitle', value: String(tf.returnsTitle) });
        if (tf.returnsDesc !== undefined) upsertRows.push({ locale: loc, key: 'trustReturnsDesc', value: String(tf.returnsDesc) });
      }
    }

    // Persist all rows into system_setting_translations
    for (const row of upsertRows) {
      await prisma.systemSettingTranslation.upsert({
        where: {
          systemSettingId_locale_key: {
            systemSettingId,
            locale: row.locale,
            key: row.key,
          },
        },
        create: {
          systemSettingId,
          locale: row.locale,
          key: row.key,
          value: row.value,
        },
        update: {
          value: row.value,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Homepage ads and banners updated successfully' });
  } catch (error: any) {
    console.error('[AdsManager PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ads settings' }, { status: 500 });
  }
}
