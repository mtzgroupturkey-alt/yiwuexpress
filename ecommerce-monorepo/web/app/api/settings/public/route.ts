export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeSystemSetting } from '@/lib/utils/localize'
import fs from 'fs'
import path from 'path'

// Note: CORS is handled globally by next.config.js

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'en'

    // Get system settings (public information only)
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
      select: {
        companyName: true,
        siteTagline: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        companyDescription: true,
        companyLogo: true,
        companyLogoHeight: true,
        companyFavicon: true,
        primaryColor: true,
        accentColor: true,
        currency: true,
        timezone: true,
        language: true,
        storeMode: true,
        rfqModel: true,
        wholesaleDefaultMoq: true,
        rfqEnabled: true,
        wholesaleEnabled: true,
        retailEnabled: true,
        facebookUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        instagramUrl: true,
        whatsappNumber: true,
        wechatId: true,
        storeHours: true,
        freeShippingThreshold: true,
        announcementTicker: true,
        mapProvider: true,
        yandexMapsApiKey: true,
        yandexGeocoderApiKey: true,
        kitchenSectionEnabled: true,
        kitchenSectionTitle: true,
        kitchenSectionSubtitle: true,
        kitchenSectionBadge: true,
        kitchenSectionViewAllLabel: true,
        kitchenSectionCategoryIds: true,
        kitchenSectionPinnedProductIds: true,
        kitchenSectionMaxProducts: true,
        electronicsSectionEnabled: true,
        electronicsSectionTitle: true,
        electronicsSectionSubtitle: true,
        electronicsSectionBadge: true,
        electronicsSectionViewAllLabel: true,
        electronicsSectionCategoryIds: true,
        electronicsSectionPinnedProductIds: true,
        electronicsSectionMaxProducts: true,
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, key: true, value: true }
        }
      } as any
    })

    // If no settings exist, use defaults
    const effectiveSettings: any = settings ?? {
      companyName: 'Global Trade',
      siteTagline: 'Global Trade & Logistics Platform',
      companyAddress: 'China',
      companyPhone: '+86 579 8555 1234',
      companyEmail: 'info@dromkok.com',
      companyWebsite: 'https://dromkok.com',
      companyDescription: 'Leading logistics and trade services provider connecting China to the world',
      companyLogo: '/logo.png',
      companyLogoHeight: 40,
      companyFavicon: '/favicon.svg',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
      storeMode: 'WHOLESALE',
      rfqModel: 'RFQ',
      wholesaleDefaultMoq: 1,
      rfqEnabled: true,
      wholesaleEnabled: true,
      retailEnabled: true,
      facebookUrl: null,
      twitterUrl: null,
      linkedinUrl: null,
      instagramUrl: null,
      whatsappNumber: null,
      wechatId: null,
      storeHours: '08:00 – 23:00',
      freeShippingThreshold: 35.00,
      announcementTicker: null,
      mapProvider: 'yandex',
      yandexMapsApiKey: '',
      yandexGeocoderApiKey: '',
      kitchenSectionEnabled: true,
      kitchenSectionTitle: 'Kitchenware, Cookware & Dining Essentials',
      kitchenSectionSubtitle: 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
      kitchenSectionBadge: 'KITCHEN & DINING',
      kitchenSectionViewAllLabel: 'View all Kitchen & Dining',
      kitchenSectionCategoryIds: null,
      kitchenSectionPinnedProductIds: null,
      kitchenSectionMaxProducts: 12,
      electronicsSectionEnabled: true,
      electronicsSectionTitle: 'Popular in Electronics & Appliances',
      electronicsSectionSubtitle: 'Official manufacturer equipment with factory guarantee',
      electronicsSectionBadge: 'ELECTRONICS & APPLIANCES',
      electronicsSectionViewAllLabel: 'View all in category',
      electronicsSectionCategoryIds: null,
      electronicsSectionPinnedProductIds: null,
      electronicsSectionMaxProducts: 8,
      translations: []
    }

    // Expand-and-Contract read-path localization for company-facing copy.
    const localizedName = localizeSystemSetting(effectiveSettings.translations, 'companyName', effectiveSettings.companyName, locale)
    const localizedTagline = localizeSystemSetting(effectiveSettings.translations, 'siteTagline', effectiveSettings.siteTagline, locale)
    const localizedDescription = localizeSystemSetting(effectiveSettings.translations, 'companyDescription', effectiveSettings.companyDescription, locale)

    // Localize Homepage Ads & Promo Banners (Weekly Mega Bargains & Member Club)
    const rawWbEnabled = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsEnabled', 'true', locale)
    const weeklyBargainsEnabled = rawWbEnabled !== 'false'
    const weeklyBargainsBadge = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsBadge', 'UP TO -40%', locale)
    const weeklyBargainsTag = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsTag', '', locale)
    const weeklyBargainsTitle = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsTitle', '', locale)
    const weeklyBargainsSubtitle = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsSubtitle', '', locale)
    const weeklyBargainsButtonText = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsButtonText', '', locale)
    const weeklyBargainsButtonLink = localizeSystemSetting(effectiveSettings.translations, 'weeklyBargainsButtonLink', '', locale)

    const rawMcEnabled = localizeSystemSetting(effectiveSettings.translations, 'memberClubEnabled', 'true', locale)
    const memberClubEnabled = rawMcEnabled !== 'false'
    const memberClubBadge = localizeSystemSetting(effectiveSettings.translations, 'memberClubBadge', '', locale)
    const memberClubMembersCount = localizeSystemSetting(effectiveSettings.translations, 'memberClubMembersCount', '', locale)
    const memberClubTitle = localizeSystemSetting(effectiveSettings.translations, 'memberClubTitle', '', locale)
    const memberClubDescription = localizeSystemSetting(effectiveSettings.translations, 'memberClubDescription', '', locale)
    const memberClubActivateBtn = localizeSystemSetting(effectiveSettings.translations, 'memberClubActivateBtn', '', locale)
    const memberClubActivateLink = localizeSystemSetting(effectiveSettings.translations, 'memberClubActivateLink', '', locale)
    const memberClubHowPointsWork = localizeSystemSetting(effectiveSettings.translations, 'memberClubHowPointsWork', '', locale)
    const memberClubHowPointsLink = localizeSystemSetting(effectiveSettings.translations, 'memberClubHowPointsLink', '', locale)

    // Localize Product Badges & Delivery Timings
    const pdpWarrantyTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpWarrantyTitle', locale === 'ru' ? '2 года гарантии' : locale === 'zh' ? '2年原厂质保' : '2-Year Warranty', locale)
    const pdpWarrantySubtitle = localizeSystemSetting(effectiveSettings.translations, 'pdpWarrantySubtitle', locale === 'ru' ? 'Официальная заводская гарантия' : locale === 'zh' ? '官方正品全国联保' : 'Full factory coverage', locale)
    const pdpDeliveryTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliveryTitle', locale === 'ru' ? 'Экспресс-доставка' : locale === 'zh' ? '极速直达物流' : 'Express Delivery', locale)
    const pdpDeliverySubtitle = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliverySubtitle', locale === 'ru' ? 'От $50 бесплатно' : locale === 'zh' ? '满额免费包邮' : 'Free over $50+', locale)
    const pdpReturnsTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpReturnsTitle', locale === 'ru' ? '14 дней возврат' : locale === 'zh' ? '14天无忧退换' : '14-Day Returns', locale)
    const pdpReturnsSubtitle = localizeSystemSetting(effectiveSettings.translations, 'pdpReturnsSubtitle', locale === 'ru' ? 'Легкий и быстрый возврат' : locale === 'zh' ? '支持极速退款换货' : 'Hassle-free guarantee', locale)
    const pdpCutoffHour = localizeSystemSetting(effectiveSettings.translations, 'pdpCutoffHour', '18', locale)
    const pdpDeliveryMinsk = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliveryMinsk', locale === 'ru' ? 'Завтра (1 рабочий день)' : locale === 'zh' ? '次日达（明斯克专线1个工作日）' : 'Tomorrow (1 business day)', locale)
    const pdpDeliveryBelarusRegion = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliveryBelarusRegion', locale === 'ru' ? '1 – 3 рабочих дня' : locale === 'zh' ? '白俄罗斯各州（1 – 3个工作日）' : '1 – 3 business days', locale)
    const pdpDeliveryChinaLocal = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliveryChinaLocal', locale === 'ru' ? '24 – 48 часов' : locale === 'zh' ? '中国核心仓现货（24 – 48小时）' : '24 – 48 hours', locale)
    const pdpDeliveryChinaNationwide = localizeSystemSetting(effectiveSettings.translations, 'pdpDeliveryChinaNationwide', locale === 'ru' ? '2 – 3 дня' : locale === 'zh' ? '中国全国陆运（2 – 3天）' : '2 – 3 days', locale)
    const pdpAirFreightDays = localizeSystemSetting(effectiveSettings.translations, 'pdpAirFreightDays', locale === 'ru' ? '5 – 8 рабочих дней' : locale === 'zh' ? '5 – 8个工作日（空运专线含税到门）' : '5 – 8 business days', locale)
    const pdpRailFreightDays = localizeSystemSetting(effectiveSettings.translations, 'pdpRailFreightDays', locale === 'ru' ? '14 – 20 рабочих дней' : locale === 'zh' ? '14 – 20个工作日（中欧班列铁路集运）' : '14 – 20 business days', locale)
    const pdpSeaFreightDays = localizeSystemSetting(effectiveSettings.translations, 'pdpSeaFreightDays', locale === 'ru' ? '20 – 35 дней' : locale === 'zh' ? '20 – 35天（国际海运整柜/拼箱）' : '20 – 35 days', locale)
    const pdpPickupTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpPickupTitle', locale === 'ru' ? 'Самовывоз из Хаба' : locale === 'zh' ? '枢纽自提' : 'China Central Hub', locale)
    const pdpPickupPrice = localizeSystemSetting(effectiveSettings.translations, 'pdpPickupPrice', locale === 'ru' ? 'Бесплатно' : locale === 'zh' ? '免费' : 'Free', locale)
    const pdpPickupEstimate = localizeSystemSetting(effectiveSettings.translations, 'pdpPickupEstimate', locale === 'ru' ? 'Готов к выдаче через 1 час' : locale === 'zh' ? '下单后1小时可取' : 'Ready for pickup in 1 hour', locale)
    const pdpFactoryTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpFactoryTitle', locale === 'ru' ? 'Прямой производитель' : locale === 'zh' ? '源头工厂直供' : 'Direct Verified Factory', locale)
    const pdpFactoryDesc = localizeSystemSetting(effectiveSettings.translations, 'pdpFactoryDesc', locale === 'ru' ? 'Без наценок посредников напрямую с завода' : locale === 'zh' ? '无中间商一手出厂底价' : 'Zero middleman markup directly from manufacturer', locale)
    const pdpQcTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpQcTitle', locale === 'ru' ? 'Контроль качества (QC)' : locale === 'zh' ? '专业验厂与品控' : 'Rigorous Quality Inspection', locale)
    const pdpQcDesc = localizeSystemSetting(effectiveSettings.translations, 'pdpQcDesc', locale === 'ru' ? 'Проверка товара перед отправкой' : locale === 'zh' ? '出货前实物检测严格把关' : 'Full physical check before shipment', locale)
    const pdpLogisticsTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpLogisticsTitle', locale === 'ru' ? 'Таможенная очистка DDP' : locale === 'zh' ? '双清包税物流专线' : 'Door-to-Door Logistics', locale)
    const pdpLogisticsDesc = localizeSystemSetting(effectiveSettings.translations, 'pdpLogisticsDesc', locale === 'ru' ? 'Авиа, ж/д и морская доставка до двери' : locale === 'zh' ? '海运空运铁路全链路门到门' : 'Air, rail & sea freight with customs clearance', locale)
    const pdpEscrowTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpEscrowTitle', locale === 'ru' ? 'Безопасная сделка' : locale === 'zh' ? '贸易资金担保' : 'Trade Assurance Escrow', locale)
    const pdpEscrowDesc = localizeSystemSetting(effectiveSettings.translations, 'pdpEscrowDesc', locale === 'ru' ? 'Оплата защищена до получения и проверки' : locale === 'zh' ? '验货通过后支付尾款安全有保障' : 'Funds protected until inspection passes', locale)

    // Localize Buyer Q&A / FAQ
    const pdpFaqTitle = localizeSystemSetting(effectiveSettings.translations, 'pdpFaqTitle', locale === 'ru' ? 'Часто задаваемые вопросы' : locale === 'zh' ? '买家常见问答 / FAQ' : 'Frequently Asked Questions', locale)
    const pdpFaqSubtitle = localizeSystemSetting(effectiveSettings.translations, 'pdpFaqSubtitle', locale === 'ru' ? 'Быстрые ответы на распространённые вопросы покупателей' : locale === 'zh' ? '关于起订量、物流运输、定制和质保的常见疑问解答' : 'Get quick answers to common questions', locale)
    const pdpFaqAskBtn = localizeSystemSetting(effectiveSettings.translations, 'pdpFaqAskBtn', locale === 'ru' ? 'Задать вопрос' : locale === 'zh' ? '在线咨询 / 提问' : 'Ask a Question', locale)
    const pdpFaq1Q = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq1Q', locale === 'ru' ? 'Каков минимальный объём заказа (MOQ)?' : locale === 'zh' ? '本商品的最小起订量（MOQ）是多少？' : 'What is the minimum order quantity?', locale)
    const pdpFaq1A = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq1A', locale === 'ru' ? 'Минимальный заказ для этого товара — {moq} шт. Для крупных партий действуют специальные оптовые цены.' : locale === 'zh' ? '该商品最小起订量为 {moq} 件。批量采购可享阶梯批发底价。' : 'The minimum order quantity for this product is {moq} units. Wholesale pricing is available for larger orders.', locale)
    const pdpFaq2Q = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq2Q', locale === 'ru' ? 'Каковы сроки доставки и таможни?' : locale === 'zh' ? '国际运输需要多长时间？' : 'What is the shipping time?', locale)
    const pdpFaq2A = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq2A', locale === 'ru' ? 'Авиа доставка занимает 5–8 дней, ж/д экспресс 14–20 дней. Предоставляется доставка с полной таможенной очисткой.' : locale === 'zh' ? '空运双清包税专线 5–8 个工作日，中欧班列铁路集运 14–20 个工作日，海运 20–35 天。' : 'Standard shipping takes 7-14 business days. Express door-to-door shipping options are available at checkout.', locale)
    const pdpFaq3Q = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq3Q', locale === 'ru' ? 'Предоставляете ли вы оптовые скидки на объем?' : locale === 'zh' ? '大批量采购有阶梯折扣吗？' : 'Do you offer bulk wholesale discounts?', locale)
    const pdpFaq3A = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq3A', locale === 'ru' ? 'Да! Мы предлагаем прогрессивную шкалу скидок для оптовых заказов. Свяжитесь с нами для точного расчета партии.' : locale === 'zh' ? '支持整柜及大批量批发折扣！我们的贸易经理可为您提供实时离岸价（FOB）或到门包税价（DDP）。' : 'Yes! We offer tiered wholesale pricing for bulk orders. Contact our trade managers for custom container rates.', locale)
    const pdpFaq4Q = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq4Q', locale === 'ru' ? 'Каковы условия гарантии и возврата?' : locale === 'zh' ? '售后退换与质检保障政策是怎样的？' : 'What is your return & inspection policy?', locale)
    const pdpFaq4A = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq4A', locale === 'ru' ? 'Все товары проходят проверку качества перед отправкой. Действует 30-дневная гарантия на заводские дефекты.' : locale === 'zh' ? '出货前由专业质检团队进行实物验货并提供检测报告；正品质量问题享受全面售后保障。' : 'We offer full pre-shipment quality inspection and 30-day return coverage for any verified manufacturing defects.', locale)
    const pdpFaq5Q = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq5Q', locale === 'ru' ? 'Возможно ли брендирование и производство под заказ (OEM/ODM)?' : locale === 'zh' ? '是否支持贴牌定制与打样（OEM / ODM）？' : 'Can I customize this product or add my logo (OEM/ODM)?', locale)
    const pdpFaq5A = localizeSystemSetting(effectiveSettings.translations, 'pdpFaq5A', locale === 'ru' ? 'Да, нанесение логотипа и индивидуальная упаковка доступны для партий от 500 шт. Напишите нам детали заказа.' : locale === 'zh' ? '支持定制包装、印刷 Logo 和模具开发。订单量达到定制门槛即可联系客服沟通打样与生产周期。' : 'Yes, OEM packaging, custom branding, and ODM tooling are supported for volume orders. Contact sourcing for specs.', locale)

    const { translations, ...publicSettings } = effectiveSettings


    // Verify companyLogo file exists on disk; if missing, fall back to /logo.png
    let resolvedLogo = publicSettings.companyLogo || '/logo.png'
    if (resolvedLogo.startsWith('/uploads/')) {
      const relative = resolvedLogo.replace(/^\/uploads\//, '')
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relative),
        path.join(process.cwd(), 'web', 'public', 'uploads', relative),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', relative),
      ]
      const exists = possiblePaths.some((p) => {
        try {
          return fs.existsSync(p)
        } catch {
          return false
        }
      })
      if (!exists) {
        resolvedLogo = '/logo.png'
      } else {
        resolvedLogo = `/api${resolvedLogo}`
      }
    } else if (resolvedLogo.startsWith('uploads/')) {
      resolvedLogo = `/api/${resolvedLogo}`
    }

    let resolvedFavicon = publicSettings.companyFavicon || '/favicon.svg'
    if (resolvedFavicon.startsWith('/uploads/')) {
      const relative = resolvedFavicon.replace(/^\/uploads\//, '')
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', relative),
        path.join(process.cwd(), 'web', 'public', 'uploads', relative),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', relative),
      ]
      const exists = possiblePaths.some((p) => {
        try {
          return fs.existsSync(p)
        } catch {
          return false
        }
      })
      if (!exists) {
        resolvedFavicon = '/favicon.ico'
      } else {
        resolvedFavicon = `/api${resolvedFavicon}`
      }
    } else if (resolvedFavicon.startsWith('uploads/')) {
      resolvedFavicon = `/api/${resolvedFavicon}`
    }

    return NextResponse.json({
      settings: {
        ...publicSettings,
        companyLogo: resolvedLogo,
        companyFavicon: resolvedFavicon,
        companyName: localizedName,
        siteTagline: localizedTagline || publicSettings.siteTagline,
        companyDescription: localizedDescription,
        weeklyBargainsEnabled,
        weeklyBargainsBadge: weeklyBargainsBadge || 'UP TO -40%',
        weeklyBargainsTag: weeklyBargainsTag || null,
        weeklyBargainsTitle: weeklyBargainsTitle || null,
        weeklyBargainsSubtitle: weeklyBargainsSubtitle || null,
        weeklyBargainsButtonText: weeklyBargainsButtonText || null,
        weeklyBargainsButtonLink: weeklyBargainsButtonLink || null,
        memberClubEnabled,
        memberClubBadge: memberClubBadge || null,
        memberClubMembersCount: memberClubMembersCount || null,
        memberClubTitle: memberClubTitle || null,
        memberClubDescription: memberClubDescription || null,
        memberClubActivateBtn: memberClubActivateBtn || null,
        memberClubActivateLink: memberClubActivateLink || null,
        memberClubHowPointsWork: memberClubHowPointsWork || null,
        memberClubHowPointsLink: memberClubHowPointsLink || null,
        // Map Provider Configuration
        mapProvider: (effectiveSettings as any)?.mapProvider || 'yandex',
        yandexMapsApiKey: (effectiveSettings as any)?.yandexMapsApiKey || process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || '',
        // Product Badges & Delivery Timings
        pdpWarrantyTitle,
        pdpWarrantySubtitle,
        pdpDeliveryTitle,
        pdpDeliverySubtitle,
        pdpReturnsTitle,
        pdpReturnsSubtitle,
        pdpCutoffHour,
        pdpDeliveryMinsk,
        pdpDeliveryBelarusRegion,
        pdpDeliveryChinaLocal,
        pdpDeliveryChinaNationwide,
        pdpAirFreightDays,
        pdpRailFreightDays,
        pdpSeaFreightDays,
        pdpPickupTitle,
        pdpPickupPrice,
        pdpPickupEstimate,
        pdpFactoryTitle,
        pdpFactoryDesc,
        pdpQcTitle,
        pdpQcDesc,
        pdpLogisticsTitle,
        pdpLogisticsDesc,
        pdpEscrowTitle,
        pdpEscrowDesc,
        // Buyer Q&A / FAQ
        pdpFaqTitle,
        pdpFaqSubtitle,
        pdpFaqAskBtn,
        pdpFaq1Q,
        pdpFaq1A,
        pdpFaq2Q,
        pdpFaq2A,
        pdpFaq3Q,
        pdpFaq3A,
        pdpFaq4Q,
        pdpFaq4A,
        pdpFaq5Q,
        pdpFaq5A,
      }
    })
  } catch (error) {
    console.error('Public settings error:', error)

    // Return default settings on error
    const defaultSettings = {
      companyName: 'Global Trade',
      companyAddress: 'China',
      companyPhone: '+86 579 8555 1234',
      companyEmail: 'info@dromkok.com',
      companyWebsite: 'https://dromkok.com',
      companyDescription: 'Leading logistics and trade services provider connecting China to the world',
      companyLogo: '/logo.png',
      companyLogoHeight: 40,
      companyFavicon: '/favicon.svg',
      primaryColor: '#1a3a5c',
      accentColor: '#c9a84c',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      language: 'en',
      storeMode: 'WHOLESALE',
      rfqModel: 'INSTANT',
      storeHours: '08:00 – 23:00',
      freeShippingThreshold: 35.00,
      announcementTicker: null,
      mapProvider: 'yandex',
      yandexMapsApiKey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || '',
    }

    return NextResponse.json({ settings: defaultSettings })
  }
}