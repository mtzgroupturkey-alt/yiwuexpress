import { prisma } from '@/lib/db'

export type PageLocale = 'en' | 'ru' | 'zh'

export interface PageSectionsData {
  [key: string]: any
}

export interface DynamicPageContent {
  id?: string
  slug: string
  title: string
  subtitle: string
  badge: string
  content: string
  metaTitle: string
  metaDesc: string
  sections: PageSectionsData
  isPublished: boolean
  updatedAt?: string
}

// Built-in default content for standard pages
export const DEFAULT_PAGE_CONTENTS: Record<string, Record<PageLocale, DynamicPageContent>> = {
  'register-b2b': {
    en: {
      slug: 'register-b2b',
      title: 'Apply for B2B Wholesale Account',
      subtitle: 'Register your company to access direct factory wholesale pricing, dedicated procurement managers, and streamlined export logistics.',
      badge: 'B2B Commercial Registration',
      content: '<p>Apply for a corporate business account to request quotations, unlock container-tier pricing, and track sourcing agreements.</p>',
      metaTitle: 'Apply for B2B Wholesale Account',
      metaDesc: 'Register for a corporate business account to access direct factory wholesale pricing, flexible MOQs, and consolidated China export logistics.',
      isPublished: true,
      sections: {
        step1Title: 'Business Information',
        step1Subtitle: 'Company & Registration',
        step2Title: 'Account & Credentials',
        step2Subtitle: 'Contact & License',
        companyNameLabel: 'Company Name',
        companyNamePlaceholder: 'e.g. Acme Global Trading Ltd',
        taxIdLabel: 'Business Registration / Tax ID',
        taxIdPlaceholder: 'e.g. VAT / EIN / Registration #',
        businessTypeLabel: 'Business Type',
        countryLabel: 'Country',
        countryPlaceholder: 'e.g. Germany, Russia, UAE...',
        cityLabel: 'City',
        cityPlaceholder: 'e.g. Hamburg, Moscow, Dubai...',
        addressLabel: 'Registered Business Address',
        addressPlaceholder: 'Registered street address, office suite, postal code',
        contactNameLabel: 'Contact Person Full Name',
        contactNamePlaceholder: 'Authorized Buyer or Procurement Officer',
        emailLabel: 'Business Email Address',
        emailPlaceholder: 'buyer@company.com',
        phoneLabel: 'Phone / WhatsApp',
        phonePlaceholder: '+1 (555) 000-0000',
        passwordLabel: 'Password',
        confirmPasswordLabel: 'Confirm Password',
        licenseLabel: 'Business License / Registration Document',
        licenseUploadTitle: 'Click to upload Business License or Certificate of Incorporation',
        licenseUploadHint: 'PDF, JPG, or PNG (Maximum file size: 5 MB)',
        notesLabel: 'Sourcing Notes & Category Requirements (Optional)',
        notesPlaceholder: 'Specify preferred product categories, container volume requirements, target brands...',
        nextButton: 'Continue to Account Info',
        backButton: 'Back',
        submitButton: 'Submit B2B Application',
        footerPrompt: 'Already have an active B2B account?',
        footerLinkText: 'Sign in to Wholesale Portal',
        trustHighlight1: 'Tier-1 Factory Direct Sourcing',
        trustHighlight2: 'Strict QC Pre-Shipment Inspection',
        trustHighlight3: 'FCL / LCL Sea & Air Logistics'
      }
    },
    ru: {
      slug: 'register-b2b',
      title: 'Заявка на оптовый B2B аккаунт',
      subtitle: 'Зарегистрируйте компанию для доступа к фабричным оптовым ценам, персональному менеджеру и прямой экспортной логистике.',
      badge: 'B2B Коммерческая регистрация',
      content: '<p>Подайте заявку на корпоративный аккаунт для запроса коммерческих предложений и оптовых поставок из Китая.</p>',
      metaTitle: 'Заявка на оптовый B2B аккаунт',
      metaDesc: 'Регистрация корпоративного оптового аккаунта: фабричные оптовые цены, гибкий минимальный заказ и доставка.',
      isPublished: true,
      sections: {
        step1Title: 'Информация о компании',
        step1Subtitle: 'Организация и реквизиты',
        step2Title: 'Учетные данные',
        step2Subtitle: 'Контакты и лицензия',
        companyNameLabel: 'Название компании',
        companyNamePlaceholder: 'например: ООО Трейдинг Глобал',
        taxIdLabel: 'ИНН / Регистрационный номер',
        taxIdPlaceholder: 'например: ИНН / ОГРН / VAT',
        businessTypeLabel: 'Тип бизнеса',
        countryLabel: 'Страна',
        countryPlaceholder: 'например: Россия, Казахстан, ОАЭ...',
        cityLabel: 'Город',
        cityPlaceholder: 'например: Москва, Алматы, Дубай...',
        addressLabel: 'Юридический адрес',
        addressPlaceholder: 'Юридический адрес, офис, индекс',
        contactNameLabel: 'Контактное лицо (ФИО)',
        contactNamePlaceholder: 'Ответственный сотрудник по закупкам',
        emailLabel: 'Рабочий Email',
        emailPlaceholder: 'buyer@company.com',
        phoneLabel: 'Телефон / WhatsApp',
        phonePlaceholder: '+7 (999) 000-00-00',
        passwordLabel: 'Пароль',
        confirmPasswordLabel: 'Подтвердите пароль',
        licenseLabel: 'Свидетельство о регистрации / Лицензия',
        licenseUploadTitle: 'Нажмите для загрузки свидетельства о регистрации компании',
        licenseUploadHint: 'PDF, JPG или PNG (Максимальный размер: 5 МБ)',
        notesLabel: 'Пожелания по закупкам и категориям (необязательно)',
        notesPlaceholder: 'Укажите интересующие товарные категории, объем контейнеров, требования...',
        nextButton: 'Далее к учетным данным',
        backButton: 'Назад',
        submitButton: 'Отправить заявку B2B',
        footerPrompt: 'Уже есть активный B2B аккаунт?',
        footerLinkText: 'Войти в оптовый портал',
        trustHighlight1: 'Прямые поставки от фабрик первого уровня',
        trustHighlight2: 'Строгий контроль качества перед отправкой',
        trustHighlight3: 'Морская и авиалогистика FCL / LCL'
      }
    },
    zh: {
      slug: 'register-b2b',
      title: '申请企业B2B批发采购账户',
      subtitle: '注册您的企业以获取一级源头工厂直供批发价格、专属采购经理和高效的中国出口集运物流。',
      badge: 'B2B商业账户注册',
      content: '<p>申请企业商业采购账户，获取集装箱大宗批发价格并追踪外贸采购协议。</p>',
      metaTitle: '申请企业B2B批发采购账户',
      metaDesc: '注册企业商业批发账户，享受中国源头工厂直供大宗批发价、灵活起订量及海运空运集运服务。',
      isPublished: true,
      sections: {
        step1Title: '企业信息',
        step1Subtitle: '公司与资质执照',
        step2Title: '账户与凭证',
        step2Subtitle: '联系人与资质认证',
        companyNameLabel: '公司法定名称',
        companyNamePlaceholder: '例如：全球商贸进出口有限公司',
        taxIdLabel: '统一社会信用代码 / 税号',
        taxIdPlaceholder: '例如：统一社会信用代码 / 纳税人识别号',
        businessTypeLabel: '企业业务类型',
        countryLabel: '注册国家',
        countryPlaceholder: '例如：德国、俄罗斯、阿联酋...',
        cityLabel: '注册城市',
        cityPlaceholder: '例如：汉堡、莫斯科、迪拜...',
        addressLabel: '企业注册地址',
        addressPlaceholder: '详细办公街道地址、门牌号及邮政编码',
        contactNameLabel: '采购负责人姓名',
        contactNamePlaceholder: '授权采购经理或业务负责人',
        emailLabel: '企业工作邮箱',
        emailPlaceholder: 'buyer@company.com',
        phoneLabel: '联系电话 / 微信',
        phonePlaceholder: '+86 138 0000 0000',
        passwordLabel: '账户密码',
        confirmPasswordLabel: '确认密码',
        licenseLabel: '企业营业执照 / 商业登记证',
        licenseUploadTitle: '点击上传营业执照或商业登记证明文件',
        licenseUploadHint: '支持 PDF、JPG 或 PNG 格式（最大 5 MB）',
        notesLabel: '采购品类与集装箱货量需求（选填）',
        notesPlaceholder: '注明意向采购产品品类、集装箱货量要求、合作品牌等...',
        nextButton: '继续填写联系信息',
        backButton: '返回上一步',
        submitButton: '提交B2B企业开户申请',
        footerPrompt: '已有认证企业账户？',
        footerLinkText: '登录企业批发采购中心',
        trustHighlight1: '一级源头工厂直供货源',
        trustHighlight2: '出厂前严格QC质检验货',
        trustHighlight3: '整柜/拼箱海运与空运专线'
      }
    }
  }
}

// In-memory cache for fast repeated reads (cleared on admin save)
const pageCache = new Map<string, { data: DynamicPageContent; expiresAt: number }>()
const CACHE_TTL_MS = 1000 * 15 // 15 seconds

export function invalidatePageCache(slug?: string) {
  if (slug) {
    for (const key of Array.from(pageCache.keys())) {
      if (key.startsWith(`${slug}:`)) {
        pageCache.delete(key)
      }
    }
  } else {
    pageCache.clear()
  }
}

/**
 * Get dynamic page content from database with fallback to default copy.
 */
export async function getPageContent(
  slug: string,
  rawLocale: string = 'en'
): Promise<DynamicPageContent> {
  const normSlug = slug.toLowerCase().trim()
  const locale = (['en', 'ru', 'zh'].includes(rawLocale) ? rawLocale : 'en') as PageLocale
  const cacheKey = `${normSlug}:${locale}`

  const cached = pageCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const defaultContent = DEFAULT_PAGE_CONTENTS[normSlug]?.[locale] ||
    DEFAULT_PAGE_CONTENTS[normSlug]?.en || {
      slug: normSlug,
      title: normSlug,
      subtitle: '',
      badge: '',
      content: '',
      metaTitle: normSlug,
      metaDesc: '',
      sections: {},
      isPublished: true
    }

  try {
    const page = await prisma.pageContent.findUnique({
      where: { slug: normSlug },
      include: {
        translations: true
      }
    })

    if (!page) {
      // Return default content if no database row yet
      pageCache.set(cacheKey, { data: defaultContent, expiresAt: Date.now() + CACHE_TTL_MS })
      return defaultContent
    }

    // Check if there is a locale-specific translation row
    const translation = page.translations?.find((t) => t.locale === locale)

    // Parse sections JSON safely
    const baseSections = (page.sections && typeof page.sections === 'object' ? page.sections : {}) as PageSectionsData
    const transSections = (translation?.sections && typeof translation.sections === 'object' ? translation.sections : {}) as PageSectionsData

    // Merge sections: default sections -> base DB sections -> locale translation sections
    const mergedSections = {
      ...(defaultContent.sections || {}),
      ...baseSections,
      ...transSections
    }

    const result: DynamicPageContent = {
      id: page.id,
      slug: page.slug,
      title: translation?.title || page.title || defaultContent.title,
      subtitle: translation?.subtitle ?? page.subtitle ?? defaultContent.subtitle,
      badge: translation?.badge ?? page.badge ?? defaultContent.badge,
      content: translation?.content ?? page.content ?? defaultContent.content,
      metaTitle: translation?.metaTitle ?? page.metaTitle ?? defaultContent.metaTitle,
      metaDesc: translation?.metaDesc ?? page.metaDesc ?? defaultContent.metaDesc,
      sections: mergedSections,
      isPublished: page.isPublished,
      updatedAt: page.updatedAt?.toISOString()
    }

    pageCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch (err) {
    console.error(`[getPageContent] Error fetching page content for ${normSlug}:`, err)
    return defaultContent
  }
}
