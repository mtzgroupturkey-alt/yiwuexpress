import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seedMultilingualDemo() {
  console.log('🌍 Starting Comprehensive Multilingual (EN, RU, ZH) Demo Data Seeding...\n')

  const passwordHash = await bcrypt.hash('password123', 10)

  // ============================================
  // 1. SYSTEM SETTINGS
  // ============================================
  console.log('⚙️ Seeding System Settings...')
  const setting = await prisma.systemSettings.upsert({
    where: { singletonKey: 'SINGLETON' },
    update: {
      companyName: 'Global Trade',
      companyDescription: 'Leading B2B portal for factory-direct industrial machinery, power tools, and equipment from China.',
      companyEmail: 'contact@yiwuexpress.com',
      companyPhone: '+86 579 8555 8888',
      companyAddress: 'No. 888 Chouzhou North Road, Yiwu International Trade Center, Zhejiang, China',
      currency: 'USD',
      language: 'en',
      storeMode: 'BOTH'
    },
    create: {
      singletonKey: 'SINGLETON',
      companyName: 'Global Trade',
      companyDescription: 'Leading B2B portal for factory-direct industrial machinery, power tools, and equipment from China.',
      companyEmail: 'contact@yiwuexpress.com',
      companyPhone: '+86 579 8555 8888',
      companyAddress: 'No. 888 Chouzhou North Road, Yiwu International Trade Center, Zhejiang, China',
      currency: 'USD',
      language: 'en',
      storeMode: 'BOTH'
    }
  })

  // System Setting Translations
  const settingKeyTranslations = [
    { locale: 'en', key: 'companyName', value: 'Global Trade' },
    { locale: 'en', key: 'companyDescription', value: 'Leading B2B portal for factory-direct industrial machinery, power tools, and equipment from China.' },
    { locale: 'en', key: 'companyAddress', value: 'No. 888 Chouzhou North Road, Yiwu International Trade Center, Zhejiang, China' },

    { locale: 'ru', key: 'companyName', value: 'Global Trade' },
    { locale: 'ru', key: 'companyDescription', value: 'Ведущий B2B портал прямых поставок промышленного оборудования, станков и инструментов из Китая.' },
    { locale: 'ru', key: 'companyAddress', value: '№ 888 Чоучжоу Норт Роуд, Международный торговый центр Иу, Чжэцзян, Китай' },

    { locale: 'zh', key: 'companyName', value: 'Global Trade' },
    { locale: 'zh', key: 'companyDescription', value: '中国领先的工业机械、数控机床与专业五金工具工厂直供B2B全球贸易平台。' },
    { locale: 'zh', key: 'companyAddress', value: '中国浙江省义乌市稠州北路888号国际商贸城' }
  ]

  for (const st of settingKeyTranslations) {
    await prisma.systemSettingTranslation.upsert({
      where: {
        systemSettingId_locale_key: {
          systemSettingId: setting.id,
          locale: st.locale,
          key: st.key
        }
      },
      update: { value: st.value },
      create: {
        systemSettingId: setting.id,
        locale: st.locale,
        key: st.key,
        value: st.value
      }
    })
  }

  // ============================================
  // 2. CURRENCIES & EXCHANGE RATES
  // ============================================
  console.log('💱 Seeding Currencies...')
  const currenciesData = [
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0, isBase: true, isActive: true },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 7.23, isBase: false, isActive: true },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', exchangeRate: 91.5, isBase: false, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isBase: false, isActive: true },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', exchangeRate: 465.0, isBase: false, isActive: true },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', exchangeRate: 3.67, isBase: false, isActive: true },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', exchangeRate: 3.75, isBase: false, isActive: true },
  ]

  for (const c of currenciesData) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: c,
      create: c
    })
  }

  // ============================================
  // 3. COUNTRIES WITH TRANSLATIONS
  // ============================================
  console.log('🌐 Seeding Countries...')
  const countriesData = [
    {
      code: 'US',
      name: 'United States',
      currency: 'USD',
      currencySymbol: '$',
      shippingMethods: ['AIR_EXPRESS', 'SEA_FREIGHT', 'DDP_DOOR'],
      customsRules: { requiresHsCode: true, tariffDutyExemptBelow: 800 },
      paymentMethods: ['STRIPE', 'BANK_TRANSFER', 'PAYPAL'],
      deliverySLA: '12-18 days',
      translations: {
        en: { name: 'United States' },
        ru: { name: 'Соединенные Штаты Америки' },
        zh: { name: '美国' }
      }
    },
    {
      code: 'RU',
      name: 'Russian Federation',
      currency: 'RUB',
      currencySymbol: '₽',
      shippingMethods: ['RAIL_EXPRESS', 'AIR_EXPRESS', 'SEA_FREIGHT', 'DDP_DOOR'],
      customsRules: { requiresHsCode: true, eacCertificateRequired: true },
      paymentMethods: ['BANK_TRANSFER', 'QIWI', 'LOCAL_TRANSFER'],
      deliverySLA: '14-22 days',
      translations: {
        en: { name: 'Russian Federation' },
        ru: { name: 'Российская Федерация' },
        zh: { name: '俄罗斯' }
      }
    },
    {
      code: 'KZ',
      name: 'Kazakhstan',
      currency: 'KZT',
      currencySymbol: '₸',
      shippingMethods: ['RAIL_EXPRESS', 'TRUCK_EXPRESS', 'DDP_DOOR'],
      customsRules: { requiresHsCode: true, eacCertificateRequired: true },
      paymentMethods: ['BANK_TRANSFER', 'KASPI_PAY', 'STRIPE'],
      deliverySLA: '8-14 days',
      translations: {
        en: { name: 'Kazakhstan' },
        ru: { name: 'Казахстан' },
        zh: { name: '哈萨克斯坦' }
      }
    },
    {
      code: 'UZ',
      name: 'Uzbekistan',
      currency: 'USD',
      currencySymbol: '$',
      shippingMethods: ['RAIL_EXPRESS', 'TRUCK_EXPRESS'],
      customsRules: { requiresHsCode: true },
      paymentMethods: ['BANK_TRANSFER', 'PAYME', 'STRIPE'],
      deliverySLA: '10-16 days',
      translations: {
        en: { name: 'Uzbekistan' },
        ru: { name: 'Узбекистан' },
        zh: { name: '乌兹别克斯坦' }
      }
    },
    {
      code: 'CN',
      name: 'China',
      currency: 'CNY',
      currencySymbol: '¥',
      shippingMethods: ['DOMESTIC_EXPRESS', 'WAREHOUSE_PICKUP'],
      customsRules: { originCountry: true },
      paymentMethods: ['ALIPAY', 'WECHAT_PAY', 'BANK_TRANSFER'],
      deliverySLA: '1-3 days',
      translations: {
        en: { name: 'China' },
        ru: { name: 'Китай' },
        zh: { name: '中国' }
      }
    },
    {
      code: 'DE',
      name: 'Germany',
      currency: 'EUR',
      currencySymbol: '€',
      shippingMethods: ['SEA_FREIGHT', 'AIR_EXPRESS', 'RAIL_EXPRESS'],
      customsRules: { requiresHsCode: true, ceCertificateRequired: true },
      paymentMethods: ['STRIPE', 'BANK_TRANSFER', 'PAYPAL'],
      deliverySLA: '16-24 days',
      translations: {
        en: { name: 'Germany' },
        ru: { name: 'Германия' },
        zh: { name: '德国' }
      }
    },
    {
      code: 'AE',
      name: 'United Arab Emirates',
      currency: 'AED',
      currencySymbol: 'AED',
      shippingMethods: ['AIR_EXPRESS', 'SEA_FREIGHT', 'DDP_DOOR'],
      customsRules: { requiresHsCode: true },
      paymentMethods: ['STRIPE', 'BANK_TRANSFER'],
      deliverySLA: '10-15 days',
      translations: {
        en: { name: 'United Arab Emirates' },
        ru: { name: 'Объединенные Арабские Эмираты' },
        zh: { name: '阿联酋' }
      }
    }
  ]

  for (const c of countriesData) {
    const { translations, ...countryBase } = c
    const country = await prisma.country.upsert({
      where: { code: countryBase.code },
      update: countryBase,
      create: countryBase
    })

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.countryTranslation.upsert({
        where: {
          countryId_locale: {
            countryId: country.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          countryId: country.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 4. DEMO USERS
  // ============================================
  console.log('👤 Seeding Users...')
  const usersData = [
    {
      email: 'admin@yiwuexpress.com',
      password: passwordHash,
      name: 'System Administrator',
      companyName: 'Global Trade Operations',
      businessType: 'headquarters',
      role: 'ADMIN',
      country: 'China',
      phone: '+86 579 8555 1234',
      isActive: true
    },
    {
      email: 'user@example.com',
      password: passwordHash,
      name: 'Alexander Volkov',
      companyName: 'Volkov Industrial Tools LLC',
      businessType: 'wholesaler',
      role: 'USER',
      country: 'Russia',
      phone: '+7 916 555-4321',
      isActive: true
    },
    {
      email: 'contractor@example.com',
      password: passwordHash,
      name: 'Robert Miller',
      companyName: 'Miller Heavy Construction Equipment',
      businessType: 'contractor',
      role: 'USER',
      country: 'United States',
      phone: '+1 415 555-7890',
      isActive: true
    }
  ]

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u
    })
  }

  // ============================================
  // 5. SUPPLIERS WITH TRANSLATIONS
  // ============================================
  console.log('🏭 Seeding Verified Suppliers...')
  const suppliersData = [
    {
      id: 'sup-sinomach-cnc',
      name: 'Zhejiang SinoMach CNC Technology Co., Ltd.',
      companyName: 'Zhejiang SinoMach CNC Technology Co., Ltd.',
      contactPerson: 'Wang Jin (Senior Export Director)',
      email: 'export@sinomach-cnc.com',
      phone: '+86 571 8901 2345',
      address: 'No. 128 High-Tech Industrial Zone, Hangzhou, Zhejiang, China',
      notes: 'Tier-1 manufacturer of high-precision fiber laser cutting systems and 5-axis CNC machining centers.',
      isActive: true,
      translations: {
        en: {
          name: 'Zhejiang SinoMach CNC Technology Co., Ltd.',
          description: 'Tier-1 manufacturer of high-precision fiber laser cutting systems and 5-axis CNC machining centers.'
        },
        ru: {
          name: 'Чжэцзян Синомаш ЧПУ Технологии',
          description: 'Ведущий производитель станков лазерной резки и 5-осевых обрабатывающих центров с ЧПУ.'
        },
        zh: {
          name: '浙江国机数控科技有限公司',
          description: '专业生产高精度光纤激光切割机、五轴联动加工中心的一流国家级高新技术企业。'
        }
      }
    },
    {
      id: 'sup-heavymax-tools',
      name: 'Yiwu HeavyMax Industrial Power Tools Ltd.',
      companyName: 'Yiwu HeavyMax Industrial Power Tools Ltd.',
      contactPerson: 'Chen Liang (Sales VP)',
      email: 'sales@heavymax-tools.cn',
      phone: '+86 579 8555 9999',
      address: 'Zone 4, Yiwu International Production Park, Zhejiang, China',
      notes: 'Premier factory specializing in brushless cordless power tools, magnetic drills, and workshop hardware.',
      isActive: true,
      translations: {
        en: {
          name: 'Yiwu HeavyMax Industrial Power Tools Ltd.',
          description: 'Premier factory specializing in brushless cordless power tools, magnetic drills, and workshop hardware.'
        },
        ru: {
          name: 'Иу ХэвиМакс Промышленные Инструменты',
          description: 'Завод по производству бесщеточного аккумуляторного инструмента, магнитных станков и оснастки.'
        },
        zh: {
          name: '义乌市巨力工业工具有限公司',
          description: '专注于无刷锂电电动工具、磁力钻及工业级车间重型五金装备的源头制造企业。'
        }
      }
    }
  ]

  for (const s of suppliersData) {
    const { translations, ...sBase } = s
    const supplier = await prisma.supplier.upsert({
      where: { id: sBase.id },
      update: sBase,
      create: sBase
    })

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.supplierTranslation.upsert({
        where: {
          supplierId_locale: {
            supplierId: supplier.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          supplierId: supplier.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 6. INDUSTRIAL CATEGORIES HIERARCHY
  // ============================================
  console.log('📂 Seeding Industrial Categories...')
  const categoriesData = [
    {
      name: 'CNC & Metalworking Machinery',
      slug: 'cnc-metalworking',
      description: 'High-precision fiber laser cutters, CNC milling machines, hydraulic press brakes, and metal lathes.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 1,
      translations: {
        en: {
          name: 'CNC & Metalworking Machinery',
          description: 'High-precision fiber laser cutters, CNC milling machines, hydraulic press brakes, and metal lathes.'
        },
        ru: {
          name: 'Станки с ЧПУ и металлообработка',
          description: 'Высокоточные оптоволоконные лазеры, фрезерные центры с ЧПУ, листогибочные прессы и токарные станки.'
        },
        zh: {
          name: '数控机床与金属加工机械',
          description: '高精度光纤激光切割机、数控加工中心、液压折弯机及金属车床设备。'
        }
      }
    },
    {
      name: 'Heavy Construction & Handling',
      slug: 'heavy-construction-handling',
      description: 'Electric & diesel forklifts, mini excavators, overhead crane hoists, and warehouse material handling.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 2,
      translations: {
        en: {
          name: 'Heavy Construction & Handling',
          description: 'Electric & diesel forklifts, mini excavators, overhead crane hoists, and warehouse material handling.'
        },
        ru: {
          name: 'Спецтехника и складское оборудование',
          description: 'Вилочные погрузчики, мини-экскаваторы, крановые тали и складская погрузочная техника.'
        },
        zh: {
          name: '重型工程机械与物料搬运',
          description: '电动/柴油叉车、微型挖掘机、工业桥式起重机及仓储物料搬运设备。'
        }
      }
    },
    {
      name: 'Professional Power Tools',
      slug: 'power-tools-workshop',
      description: 'Brushless cordless drills, impact wrenches, rotary hammers, magnetic drills, and workshop gear.',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 3,
      translations: {
        en: {
          name: 'Professional Power Tools',
          description: 'Brushless cordless drills, impact wrenches, rotary hammers, magnetic drills, and workshop gear.'
        },
        ru: {
          name: 'Профессиональный электроинструмент',
          description: 'Бесщеточные дрели, гайковерты, перфораторы, магнитные сверлильные станки и оснастка.'
        },
        zh: {
          name: '专业电动工具与车间装备',
          description: '无刷锂电电钻、大扭矩冲击扳手、重型电锤、磁力钻及工业车间五金工具。'
        }
      }
    },
    {
      name: 'Welding & Plasma Cutting',
      slug: 'welding-cutting-systems',
      description: 'Multi-process MIG/TIG/MMA welding machines, high-frequency plasma cutters, and welding positioners.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 4,
      translations: {
        en: {
          name: 'Welding & Plasma Cutting',
          description: 'Multi-process MIG/TIG/MMA welding machines, high-frequency plasma cutters, and welding positioners.'
        },
        ru: {
          name: 'Сварочное оборудование и плазморезы',
          description: 'Сварочные полуавтоматы MIG/TIG/MMA, аппараты воздушно-плазменной резки и сварочные позиционеры.'
        },
        zh: {
          name: '焊接设备与等离子切割系统',
          description: '多功能MIG/TIG/MMA脉冲气保焊机、高频空气等离子切割机及自动变位机。'
        }
      }
    },
    {
      name: 'Generators & Power Systems',
      slug: 'generators-electrical',
      description: 'Industrial silent diesel generators, solar hybrid inverters, and heavy-duty VFD motor controllers.',
      image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 5,
      translations: {
        en: {
          name: 'Generators & Power Systems',
          description: 'Industrial silent diesel generators, solar hybrid inverters, and heavy-duty VFD motor controllers.'
        },
        ru: {
          name: 'Генераторы и энергосистемы',
          description: 'Промышленные дизельные электростанции, гибридные инверторы и частотные преобразователи.'
        },
        zh: {
          name: '工业发电机组与电力控制系统',
          description: '静音箱式柴油发电机组、工业太阳能混合逆变器及大功率变频驱动系统。'
        }
      }
    },
    {
      name: 'Precision Testing & Safety',
      slug: 'measuring-safety-hardware',
      description: 'Industrial 3D laser levels, digital torque analyzers, infrared thermometers, and certified PPE safety gear.',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80',
      isFeatured: true,
      displayOrder: 6,
      translations: {
        en: {
          name: 'Precision Testing & Safety',
          description: 'Industrial 3D laser levels, digital torque analyzers, infrared thermometers, and certified PPE safety gear.'
        },
        ru: {
          name: 'Измерительные приборы и безопасность',
          description: 'Лазерные 3D нивелиры, цифровые динамометры, тепловизоры и сертифицированные СИЗ.'
        },
        zh: {
          name: '精密检测仪器与工业劳保',
          description: '工业级3D激光水平仪、数字扭矩测试仪、红外热像仪及CE认证劳保防护装备。'
        }
      }
    }
  ]

  const categoryMap = new Map<string, string>()

  for (const cat of categoriesData) {
    const { translations, ...catBase } = cat
    const createdCat = await prisma.category.upsert({
      where: { slug: catBase.slug },
      update: catBase,
      create: catBase
    })
    categoryMap.set(catBase.slug, createdCat.id)

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: createdCat.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          categoryId: createdCat.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 7. INDUSTRIAL PRODUCTS WITH 3-LANGUAGE COPY
  // ============================================
  console.log('🛠️ Seeding Industrial Products with 3-Language Copy...')
  const productsData = [
    {
      sku: 'CNC-FIBER-3000W',
      slug: 'industrial-fiber-laser-cutting-machine-3000w',
      name: 'Industrial 3000W Fiber Laser Cutting Machine (Sheet Metal)',
      categorySlug: 'cnc-metalworking',
      price: 18500.0,
      compareAtPrice: 22000.0,
      wholesalePrice: 16200.0,
      minOrderQty: 1,
      stock: 12,
      weightKg: 3800.0,
      countryOfOrigin: 'China',
      hsCode: '8456110090',
      isFeatured: true,
      isFlashSale: true,
      flashSalePrice: 15999.0,
      thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: 'Industrial 3000W Fiber Laser Cutting Machine (Sheet Metal)',
          description: 'High-speed 3000W Raycus/IPG fiber laser cutting system with dual exchange table and CypCut CNC control. Capable of cutting stainless steel up to 10mm, carbon steel up to 20mm, and aluminum up to 8mm with 0.02mm repositioning accuracy. CE certified with full 2-year warranty.'
        },
        ru: {
          name: 'Промышленный оптоволоконный лазерный станок 3000 Вт',
          description: 'Высокоскоростной оптоволоконный станок лазерной резки металла мощностью 3000 Вт с источником Raycus/IPG, сменным столом и системой ЧПУ CypCut. Раскрой нержавеющей стали до 10 мм, углеродистой стали до 20 мм с точностью 0.02 мм. Гарантия 2 года, сертификат CE.'
        },
        zh: {
          name: '工业级3000W光纤激光切割机（金属板材数控切割）',
          description: '配备锐科/IPG 3000W高功率光纤激光器，双交换工作台与柏楚CypCut专业数控系统。可高精度切割20mm碳钢、10mm不锈钢及8mm铝合金，重复定位精度±0.02mm。通过CE/ISO认证，整机质保2年。'
        }
      }
    },
    {
      sku: 'CNC-PRESS-100T',
      slug: 'electro-hydraulic-cnc-press-brake-100t',
      name: 'Electro-Hydraulic CNC Press Brake 100T / 3200mm',
      categorySlug: 'cnc-metalworking',
      price: 14200.0,
      compareAtPrice: 16800.0,
      wholesalePrice: 12800.0,
      minOrderQty: 1,
      stock: 8,
      weightKg: 6500.0,
      countryOfOrigin: 'China',
      hsCode: '8462291000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: 'Electro-Hydraulic CNC Press Brake 100T / 3200mm',
          description: 'Precision 4+1 axis electro-hydraulic synchronous press brake with Delem DA53T CNC controller. Automatic crowning system, Bosch Rexroth hydraulic valves, and quick clamping for high-efficiency sheet metal bending.'
        },
        ru: {
          name: 'Гидравлический листогибочный пресс с ЧПУ 100т / 3200мм',
          description: 'Синхронный 4+1 осевой электрогидравлический листогиб с ЧПУ Delem DA53T. Автоматическая компенсация прогиба, гидравлика Bosch Rexroth и система быстрой смены пуансонов и матриц.'
        },
        zh: {
          name: '电液同步数控折弯机 100T/3200mm（4+1轴）',
          description: '采用荷兰Delem DA53T数控系统与博世力士乐液压阀组。配备机械挠度自动补偿装置、快夹模具系统，折弯精度高达±0.2度，适用于各类工业机箱机柜钣金加工。'
        }
      }
    },
    {
      sku: 'TOOL-CORDLESS-SET',
      slug: '20v-brushless-cordless-drill-impact-driver-combo-kit',
      name: '20V Brushless Heavy-Duty Cordless Drill & Impact Driver Combo Kit',
      categorySlug: 'power-tools-workshop',
      price: 189.0,
      compareAtPrice: 249.0,
      wholesalePrice: 135.0,
      minOrderQty: 5,
      stock: 350,
      weightKg: 4.8,
      countryOfOrigin: 'China',
      hsCode: '8467210000',
      isFeatured: true,
      isFlashSale: true,
      flashSalePrice: 149.0,
      thumbnail: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: '20V Brushless Heavy-Duty Cordless Drill & Impact Driver Combo Kit',
          description: 'Industrial-grade 20V brushless hammer drill (85Nm max torque) and 1/4" impact driver (220Nm max torque). Includes two 4.0Ah Li-ion batteries, 1-hour fast charger, magnetic bit set, and heavy-duty stackable tool case.'
        },
        ru: {
          name: 'Набор бесщеточного аккумуляторного инструмента 20В (Дрель + Винтоверт)',
          description: 'Промышленный комплект: ударная бесщеточная дрель (85 Нм) и импульсный гайковерт 1/4" (220 Нм). В комплекте два аккумулятора 4.0 Ач, быстрое зарядное устройство и ударопрочный кейс.'
        },
        zh: {
          name: '20V工业级无刷锂电冲击钻与起子机双机组合套装',
          description: '包含85N.m大扭矩无刷冲击钻与220N.m快装六角冲击起子机。标配双4.0Ah高倍率动力锂电池、60分钟智能快充座及加厚防摔工程工具箱。'
        }
      }
    },
    {
      sku: 'TOOL-MAG-DRILL-50',
      slug: 'magnetic-base-core-drill-machine-50mm',
      name: 'Heavy-Duty Industrial Magnetic Core Drill Machine 50mm / 1680W',
      categorySlug: 'power-tools-workshop',
      price: 460.0,
      compareAtPrice: 580.0,
      wholesalePrice: 380.0,
      minOrderQty: 2,
      stock: 85,
      weightKg: 14.5,
      countryOfOrigin: 'China',
      hsCode: '8459290000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: 'Heavy-Duty Industrial Magnetic Core Drill Machine 50mm / 1680W',
          description: '1680W pure copper motor magnetic base drill with 14,500N holding magnetic force. Capable of core drilling up to 50mm diameter and 50mm depth in steel beams and structural fabrication.'
        },
        ru: {
          name: 'Магнитный сверлильный станок 50 мм / 1680 Вт',
          description: 'Промышленный сверлильный станок на магнитном основании с прижимной силой 14 500 Н. Диаметр корончатого сверления до 50 мм в стальных балках и металлоконструкциях.'
        },
        zh: {
          name: '工业重型磁力钻 50mm / 1680W（大吸力磁座钻）',
          description: '1680W全铜电机，具备14500N强劲电磁吸附力。最大空心取芯钻孔直径50mm，适用于钢结构建筑、桥梁施工、造船及管道重型安装。'
        }
      }
    },
    {
      sku: 'HEAVY-FORKLIFT-3T',
      slug: 'electric-counterbalanced-forklift-3-ton-lithium',
      name: '3.0 Ton Electric Counterbalanced Forklift (Lithium Battery)',
      categorySlug: 'heavy-construction-handling',
      price: 13500.0,
      compareAtPrice: 15800.0,
      wholesalePrice: 11900.0,
      minOrderQty: 1,
      stock: 15,
      weightKg: 4200.0,
      countryOfOrigin: 'China',
      hsCode: '8427102000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: '3.0 Ton Electric Counterbalanced Forklift (Lithium Battery)',
          description: 'Eco-friendly 3000kg rated capacity electric warehouse forklift powered by 80V 400Ah CATL lithium battery pack. Triplex mast with 4.5m lifting height, side shifter, and AC dual-drive motors.'
        },
        ru: {
          name: 'Электрический вилочный погрузчик 3.0 тонны (Литиевый)',
          description: 'Электропогрузчик грузоподъемностью 3 тонны с литий-ионной батареей CATL 80В 400Ач. Трехсекционная мачта с подъемом до 4.5 м, функция бокового смещения каретки (Side Shift).'
        },
        zh: {
          name: '3.0吨三支点/四支点锂电平衡重叉车（宁德时代锂电）',
          description: '额定载重3000kg，配备80V 400Ah宁德时代原厂动力锂电池，2小时快充连续作业8小时。三节4.5米全自由门架，标配侧移器，交流双驱系统，整机质保3年。'
        }
      }
    },
    {
      sku: 'WELD-PULSE-MIG-350',
      slug: 'inverter-pulse-mig-mag-tig-welding-machine-350a',
      name: 'Digital Inverter Multi-Process Pulse MIG/MAG/TIG Welder 350A',
      categorySlug: 'welding-cutting-systems',
      price: 1250.0,
      compareAtPrice: 1550.0,
      wholesalePrice: 980.0,
      minOrderQty: 2,
      stock: 40,
      weightKg: 38.0,
      countryOfOrigin: 'China',
      hsCode: '8515390000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: 'Digital Inverter Multi-Process Pulse MIG/MAG/TIG Welder 350A',
          description: 'IGBT 350A synergic double-pulse welding system for aluminum, stainless steel, and carbon steel. Features 60% duty cycle at 350A, digital wire feeder, 4-roller drive, and preset welding database.'
        },
        ru: {
          name: 'Сварочный полуавтомат импульсный MIG/MAG/TIG 350A',
          description: 'Промышленный инверторный аппарат с функцией двойного импульса (Double Pulse) для сварки алюминия, нержавеющей и углеродистой стали. Синергетическое управление, 4-роликовый подающий механизм.'
        },
        zh: {
          name: '工业级全数字双脉冲MIG/MAG/TIG气保焊机 350A',
          description: '采用先进IGBT逆变技术与双脉冲无飞溅熔滴过渡，专焊铝合金、不锈钢与碳钢。数字化协同调节，四轮双驱重型送丝机构，负载持续率60%@350A。'
        }
      }
    },
    {
      sku: 'GEN-SILENT-50KW',
      slug: 'silent-diesel-generator-set-50kw-cummins',
      name: '50kW / 62.5kVA Silent Soundproof Diesel Generator Set',
      categorySlug: 'generators-electrical',
      price: 6800.0,
      compareAtPrice: 8200.0,
      wholesalePrice: 5900.0,
      minOrderQty: 1,
      stock: 18,
      weightKg: 1100.0,
      countryOfOrigin: 'China',
      hsCode: '8502120000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: '50kW / 62.5kVA Silent Soundproof Diesel Generator Set',
          description: 'Three-phase 50kW / 62.5kVA soundproof diesel generator powered by 4-cylinder water-cooled diesel engine and Stamford brushless alternator. SmartGen digital automatic transfer switch (ATS) ready with sound rating ≤68dB(A) at 7 meters.'
        },
        ru: {
          name: 'Дизельный генератор в шумозащитном кожухе 50 кВт / 62.5 кВА',
          description: 'Трехфазная дизельная электростанция 50 кВт с 4-цилиндровым двигателем жидкостного охлаждения и бесщеточным генератором Stamford. Контроллер SmartGen, подготовка под АВР (ATS), уровень шума ≤68 дБ.'
        },
        zh: {
          name: '50kW / 62.5kVA 工业静音防雨箱式柴油发电机组',
          description: '四缸水冷直喷柴油发动机配斯坦福无刷全铜发电机。搭载众智SmartGen数控液晶自启动控制器，预留ATS双电源自动切换接口，7米噪音低于68分贝。'
        }
      }
    },
    {
      sku: 'TEST-LASER-3D-16',
      slug: 'industrial-16-line-3d-green-beam-laser-level',
      name: 'Industrial 16-Line 4D 360° Self-Leveling Green Beam Laser Level',
      categorySlug: 'measuring-safety-hardware',
      price: 129.0,
      compareAtPrice: 179.0,
      wholesalePrice: 85.0,
      minOrderQty: 5,
      stock: 220,
      weightKg: 2.5,
      countryOfOrigin: 'China',
      hsCode: '9015300000',
      isFeatured: true,
      thumbnail: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80'
      ],
      translations: {
        en: {
          name: 'Industrial 16-Line 4D 360° Self-Leveling Green Beam Laser Level',
          description: 'Ultra-bright German Osram green diode 16-line self-leveling laser level for precision construction and mechanical installation. Features ±0.2mm/m accuracy, 50m range, dual high-capacity lithium batteries, remote control, and wall bracket.'
        },
        ru: {
          name: 'Профессиональный лазерный уровень 16 линий 4D (Зеленый луч)',
          description: 'Строительный лазерный нивелир с немецкими диодами Osram, точностью ±0.2 мм/м и дальностью до 50 м. В комплекте 2 литиевых аккумулятора, пульт ДУ, настенный магнитный кронштейн и кейс.'
        },
        zh: {
          name: '工业级16线4D全自动贴墙贴地绿光激光水平仪',
          description: '采用德国欧司朗高亮绿光LD激光模组，室内外清晰可见，精度达±0.2mm/m，工作半径50米。配双高容量锂电、遥控微调开关、升降台及强磁上墙架。'
        }
      }
    }
  ]

  for (const p of productsData) {
    const { translations, categorySlug, ...pBase } = p
    const catId = categoryMap.get(categorySlug)

    const product = await prisma.product.upsert({
      where: { sku: pBase.sku },
      update: {
        ...pBase,
        categoryId: catId,
        prices: {
          USD: pBase.price,
          CNY: Math.round(pBase.price * 7.23),
          RUB: Math.round(pBase.price * 91.5),
          EUR: Number((pBase.price * 0.92).toFixed(2))
        }
      },
      create: {
        ...pBase,
        categoryId: catId,
        prices: {
          USD: pBase.price,
          CNY: Math.round(pBase.price * 7.23),
          RUB: Math.round(pBase.price * 91.5),
          EUR: Number((pBase.price * 0.92).toFixed(2))
        }
      }
    })

    // Product Translations for EN, RU, ZH
    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.productTranslation.upsert({
        where: {
          productId_locale: {
            productId: product.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          productId: product.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 8. HERO SLIDES WITH TRANSLATIONS
  // ============================================
  console.log('📸 Seeding Hero Slides with Multilingual Support...')
  const heroSlidesData = [
    {
      id: 'hero-slide-machinery',
      title: 'Industrial Machinery & Precision Engineering',
      subtitle: 'FACTORY-DIRECT B2B WHOLESALE & RETAIL',
      description: 'Direct procurement from Tier-1 Chinese manufacturers. High-precision CNC centers, hydraulic presses, automation machinery, and industrial production lines with full CE & ISO certification.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=85',
      productImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      badgeText: 'PREMIUM INDUSTRIAL SELECTION',
      badgeColor: '#c9a84c',
      ctaText: 'Explore Machinery Catalog',
      ctaLink: '/products?category=cnc-metalworking',
      secondaryCtaText: 'Request Wholesale RFQ',
      secondaryCtaLink: '/wholesale',
      displayOrder: 1,
      isActive: true,
      slideDuration: 6,
      alignment: 'left',
      motionType: 'fade',
      translations: {
        en: {
          title: 'Industrial Machinery & Precision Engineering',
          subtitle: 'FACTORY-DIRECT B2B WHOLESALE & RETAIL',
          description: 'Direct procurement from Tier-1 Chinese manufacturers. High-precision CNC centers, hydraulic presses, automation machinery, and industrial production lines with full CE & ISO certification.',
          badgeText: 'PREMIUM INDUSTRIAL SELECTION',
          ctaText: 'Explore Machinery Catalog',
          secondaryCtaText: 'Request Wholesale RFQ'
        },
        ru: {
          title: 'Промышленное оборудование и станки с ЧПУ',
          subtitle: 'ПРЯМЫЕ ПОСТАВКИ С ЗАВОДОВ КИТАЯ ОПТОМ И В РОЗНИЦУ',
          description: 'Высокоточные оптоволоконные лазеры, листогибы, обрабатывающие центры и производственные линии с сертификатами CE и EAC по ценам производителей.',
          badgeText: 'ПРЕМИАЛЬНОЕ ОБОРУДОВАНИЕ',
          ctaText: 'Каталог оборудования',
          secondaryCtaText: 'Запросить оптовый прайс'
        },
        zh: {
          title: '工业级数控机床与精密制造装备',
          subtitle: '源头工厂直销 · 支持大宗批发与全球集运',
          description: '严选中国一流制造工厂直供，涵盖高功率光纤激光切割机、数控折弯机、重型加工中心及自动化产线，全系通过CE与ISO认证。',
          badgeText: '精选工业级装备',
          ctaText: '浏览机械产品目录',
          secondaryCtaText: '提交大宗采购询价'
        }
      }
    },
    {
      id: 'hero-slide-tools',
      title: 'Heavy-Duty Power Tools & Workshop Hardware',
      subtitle: 'ENGINEERED FOR EXTREME DURABILITY',
      description: 'Equip your workshop with professional brushless cordless tools, pneumatic equipment, precision measuring systems, and industrial hardware backed by manufacturer warranties.',
      imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1920&q=85',
      productImageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
      badgeText: 'PRO TOOLS & EQUIPMENT',
      badgeColor: '#c9a84c',
      ctaText: 'Shop Power Tools',
      ctaLink: '/products?category=power-tools-workshop',
      secondaryCtaText: 'Download Wholesale List',
      secondaryCtaLink: '/wholesale',
      displayOrder: 2,
      isActive: true,
      slideDuration: 6,
      alignment: 'left',
      motionType: 'slide',
      translations: {
        en: {
          title: 'Heavy-Duty Power Tools & Workshop Hardware',
          subtitle: 'ENGINEERED FOR EXTREME DURABILITY',
          description: 'Equip your workshop with professional brushless cordless tools, pneumatic equipment, precision measuring systems, and industrial hardware backed by manufacturer warranties.',
          badgeText: 'PRO TOOLS & EQUIPMENT',
          ctaText: 'Shop Power Tools',
          secondaryCtaText: 'Download Wholesale List'
        },
        ru: {
          title: 'Профессиональный электроинструмент и оснастка',
          subtitle: 'МАКСИМАЛЬНАЯ НАДЕЖНОСТЬ И ДОЛГОВЕЧНОСТЬ',
          description: 'Бесщеточные аккумуляторные инструменты, магнитные станки, компрессоры и измерительные приборы с гарантией качества.',
          badgeText: 'ПРОФЕССИОНАЛЬНЫЙ ИНСТРУМЕНТ',
          ctaText: 'Купить инструменты',
          secondaryCtaText: 'Оптовый каталог'
        },
        zh: {
          title: '重型专业电动工具与工业车间装备',
          subtitle: '工业级耐久性设计 · 现货直发全球',
          description: '汇集全系无刷锂电电钻、工业磁座钻、重型气动工具及精密检测仪器，为车间与工程施工提供强劲动力保障。',
          badgeText: '专业五金与电动工具',
          ctaText: '选购电动工具',
          secondaryCtaText: '下载批发价目表'
        }
      }
    }
  ]

  for (const slide of heroSlidesData) {
    const { translations, ...slideBase } = slide
    const createdSlide = await prisma.heroSlide.upsert({
      where: { id: slideBase.id },
      update: slideBase,
      create: slideBase
    })

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.heroSlideTranslation.upsert({
        where: {
          heroSlideId_locale: {
            heroSlideId: createdSlide.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          heroSlideId: createdSlide.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 9. LOGISTICS & TRADE SERVICES WITH TRANSLATIONS
  // ============================================
  console.log('🚢 Seeding Logistics & Sourcing Services...')
  const servicesData = [
    {
      slug: 'ocean-air-freight-logistics',
      name: 'Ocean & Air Freight Logistics',
      description: 'Full container load (FCL) and consolidated less-than-container (LCL) freight from Ningbo, Shanghai, and Shenzhen ports to 180+ global seaports.',
      price: 120.0,
      duration: '12-18 Days Express',
      coverage: 'Global Seaports (180+ Countries)',
      type: 'shipping',
      isActive: true,
      translations: {
        en: {
          name: 'Ocean & Air Freight Logistics',
          description: 'Full container load (FCL) and consolidated less-than-container (LCL) freight from Ningbo, Shanghai, and Shenzhen ports to 180+ global seaports.',
          duration: '12-18 Days Express',
          coverage: 'Global Seaports (180+ Countries)'
        },
        ru: {
          name: 'Морские и авиаперевозки грузов',
          description: 'Контейнерные перевозки (FCL) и сборные грузы (LCL) из портов Нинбо, Шанхай и Шэньчжэнь в более чем 180 стран мира.',
          duration: '12-18 дней (Экспресс)',
          coverage: '180+ стран и портов мира'
        },
        zh: {
          name: '国际海运集装箱与空运物流服务',
          description: '提供宁波、上海、深圳直发全球180多个主要港口的整柜（FCL）与拼箱（LCL）一站式海空运集运服务。',
          duration: '12-18天极速直达',
          coverage: '全球180+个港口及国家'
        }
      }
    },
    {
      slug: 'customs-clearance-ddp',
      name: 'Customs Brokerage & Dual-Clearance DDP',
      description: 'Export customs filing in China, HS-code tariff optimization, and door-to-door tax-paid (DDP) delivery with zero hidden customs surcharges.',
      price: 250.0,
      duration: '24-48h Expedited',
      coverage: 'US, EU, Russia, Middle East, Central Asia',
      type: 'customs',
      isActive: true,
      translations: {
        en: {
          name: 'Customs Brokerage & Dual-Clearance DDP',
          description: 'Export customs filing in China, HS-code tariff optimization, and door-to-door tax-paid (DDP) delivery with zero hidden customs surcharges.',
          duration: '24-48h Expedited',
          coverage: 'US, EU, Russia, Middle East, Central Asia'
        },
        ru: {
          name: 'Таможенное оформление и доставка под ключ (DDP)',
          description: 'Экспортное декларирование в Китае, оптимизация ТН ВЭД кодов, оплата пошлин и доставка грузов «до двери» без скрытых платежей.',
          duration: '24-48 часов',
          coverage: 'РФ, ЕАЭС, США, ЕС, Ближний Восток'
        },
        zh: {
          name: '出口报关与双清包税到门（DDP专线）',
          description: '中国海关正规出口报关、退税协助、HS编码合规审核及目的港双清含税派送到门服务，全程无隐形费用。',
          duration: '24-48小时通关',
          coverage: '欧美、俄罗斯中亚、中东全境'
        }
      }
    },
    {
      slug: 'china-warehouse-consolidation',
      name: 'China Warehouse Consolidation & Inspection',
      description: 'Free 15-day storage at our 30,000+ sqm automated hubs in Yiwu, Ningbo, and Shenzhen. Multi-supplier order consolidation and pre-shipment quality audit.',
      price: 80.0,
      duration: 'Same-Day Receiving',
      coverage: 'Yiwu, Ningbo, Shenzhen, Guangzhou Hubs',
      type: 'warehousing',
      isActive: true,
      translations: {
        en: {
          name: 'China Warehouse Consolidation & Inspection',
          description: 'Free 15-day storage at our 30,000+ sqm automated hubs in Yiwu, Ningbo, and Shenzhen. Multi-supplier order consolidation and pre-shipment quality audit.',
          duration: 'Same-Day Receiving',
          coverage: 'Yiwu, Ningbo, Shenzhen, Guangzhou Hubs'
        },
        ru: {
          name: 'Складская консолидация и проверка качества в Китае',
          description: 'Бесплатное 15-дневное хранение на складах в Иу, Нинбо и Шэньчжэне (более 30 000 кв.м). Сборка грузов от разных фабрик в один контейнер.',
          duration: 'Приемка в день прибытия',
          coverage: 'Склады в Иу, Нинбо, Шэньчжэне, Гуанчжоу'
        },
        zh: {
          name: '中国国内集货仓储与验货整合服务',
          description: '在义乌、宁波、深圳自营3万平米现代化智能仓库提供15天免费仓储，多供应商货物集中装箱、验货打托与加固包装。',
          duration: '到货即时入库打单',
          coverage: '义乌、宁波、深圳、广州国内仓储枢纽'
        }
      }
    },
    {
      slug: 'factory-sourcing-audit',
      name: 'Direct Factory Sourcing & Supplier Audit',
      description: 'Boots on the ground in Yiwu and Guangdong industrial belts. Factory verification, contract negotiation, and on-site production line quality auditing.',
      price: 300.0,
      duration: '48h Supplier Match',
      coverage: 'All China Manufacturing Provinces',
      type: 'sourcing',
      isActive: true,
      translations: {
        en: {
          name: 'Direct Factory Sourcing & Supplier Audit',
          description: 'Boots on the ground in Yiwu and Guangdong industrial belts. Factory verification, contract negotiation, and on-site production line quality auditing.',
          duration: '48h Supplier Match',
          coverage: 'All China Manufacturing Provinces'
        },
        ru: {
          name: 'Поиск прямых производителей и аудит фабрик',
          description: 'Штатные инспекторы в промышленных кластерах Иу и Гуандуна. Проверка надежности фабрик, аудит линий и согласование лучших цен.',
          duration: 'Подбор за 48 часов',
          coverage: 'Все производственные провинции Китая'
        },
        zh: {
          name: '源头工厂采购对接与验厂风控服务',
          description: '专业验厂团队常驻义乌商贸城及广东各产业带，提供供应商背景审查、大宗价格谈判、生产进度把控及出厂检验。',
          duration: '48小时极速精准匹配',
          coverage: '中国所有主要工业制造省份'
        }
      }
    }
  ]

  for (const srv of servicesData) {
    const { translations, ...srvBase } = srv
    const service = await prisma.service.upsert({
      where: { slug: srvBase.slug },
      update: srvBase,
      create: srvBase
    })

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.serviceTranslation.upsert({
        where: {
          serviceId_locale: {
            serviceId: service.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          serviceId: service.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  // ============================================
  // 10. TESTIMONIALS WITH MULTILINGUAL TRANSLATIONS
  // ============================================
  console.log('💬 Seeding Verified Customer Testimonials...')
  const testimonialsData = [
    {
      id: 'test-vance',
      name: 'Marcus Vance',
      role: 'Procurement Director',
      company: 'Vance Industrial Systems Ltd (USA)',
      quote: 'Global Trade transformed our equipment sourcing from China. The 3000W fiber laser cutter arrived in pristine condition, fully CE certified and ready for operation. Outstanding quality assurance and transparent pricing.',
      rating: 5,
      isFeatured: true,
      translations: {
        en: {
          quote: 'Global Trade transformed our equipment sourcing from China. The 3000W fiber laser cutter arrived in pristine condition, fully CE certified and ready for operation. Outstanding quality assurance and transparent pricing.',
          role: 'Procurement Director',
          company: 'Vance Industrial Systems Ltd (USA)'
        },
        ru: {
          quote: 'Global Trade полностью изменил наш подход к закупке станков из Китая. Лазерный резак мощностью 3000 Вт прибыл в идеальном состоянии со всеми сертификатами. Отличный контроль качества и честные цены.',
          role: 'Директор по закупкам',
          company: 'Vance Industrial Systems Ltd (США)'
        },
        zh: {
          quote: 'Global Trade彻底优化了我们从中国采购工业设备的流程。采购的3000W光纤激光切割机准时安全交付，CE证书齐全，现场安装即可运行。品控极为严谨，价格完全透明！',
          role: '采购总监',
          company: 'Vance工业系统有限公司 (美国)'
        }
      }
    },
    {
      id: 'test-sokolov',
      name: 'Dmitry Sokolov',
      role: 'Chief Technical Officer',
      company: 'Sokolov Heavy Workshop & Fabrication (Russia)',
      quote: 'We regularly source 20V cordless power tool sets and magnetic drills in bulk. Delivery to Moscow took only 16 days with complete DDP customs clearance. Zero hassle with customs paperwork.',
      rating: 5,
      isFeatured: true,
      translations: {
        en: {
          quote: 'We regularly source 20V cordless power tool sets and magnetic drills in bulk. Delivery to Moscow took only 16 days with complete DDP customs clearance. Zero hassle with customs paperwork.',
          role: 'Chief Technical Officer',
          company: 'Sokolov Heavy Workshop & Fabrication (Russia)'
        },
        ru: {
          quote: 'Регулярно заказываем оптом аккумуляторный инструмент и магнитные станки. Доставка в Москву заняла всего 16 дней с полной таможенной очисткой DDP. Никаких хлопот с оформлением.',
          role: 'Главный инженер',
          company: 'Соколов Хэви Воркшоп (Россия)'
        },
        zh: {
          quote: '我们定期批量采购20V无刷锂电工具和重型磁座钻。发往莫斯科仅耗时16天，双清包税门到门，完全不需要我们处理繁琐的清关报税手续，非常省心。',
          role: '首席技术官',
          company: 'Sokolov重型制造工厂 (俄罗斯)'
        }
      }
    },
    {
      id: 'test-alfarooq',
      name: 'Ahmed Al-Farooq',
      role: 'Managing Partner',
      company: 'Al-Farooq General Trading (UAE)',
      quote: 'Their multi-supplier warehouse consolidation in Yiwu saved us over $12,000 on our last shipment. We collected generators, laser levels, and welding gear into a single 40ft container.',
      rating: 5,
      isFeatured: true,
      translations: {
        en: {
          quote: 'Their multi-supplier warehouse consolidation in Yiwu saved us over $12,000 on our last shipment. We collected generators, laser levels, and welding gear into a single 40ft container.',
          role: 'Managing Partner',
          company: 'Al-Farooq General Trading (UAE)'
        },
        ru: {
          quote: 'Складская консолидация в Иу сэкономила нам более 12 000 долларов на прошлой поставке. Мы собрали генераторы, уровни и сварочные аппараты в один 40-футовый контейнер.',
          role: 'Управляющий партнер',
          company: 'Аль-Фарук Дженерал Трейдинг (ОАЭ)'
        },
        zh: {
          quote: '他们在义乌的自营集货仓为我们上一批货物节省了超过12,000美元运费。我们将发电机、激光水平仪和焊机集中拼装进同一个40尺高柜，验货专业，装箱非常紧凑安全！',
          role: '执行合伙人',
          company: 'Al-Farooq通用贸易公司 (阿联酋)'
        }
      }
    }
  ]

  for (const t of testimonialsData) {
    const { translations, ...tBase } = t
    const testimonial = await prisma.testimonial.upsert({
      where: { id: tBase.id },
      update: tBase,
      create: tBase
    })

    for (const [loc, tData] of Object.entries(translations)) {
      await prisma.testimonialTranslation.upsert({
        where: {
          testimonialId_locale: {
            testimonialId: testimonial.id,
            locale: loc
          }
        },
        update: tData,
        create: {
          testimonialId: testimonial.id,
          locale: loc,
          ...tData
        }
      })
    }
  }

  console.log('\n✨ Multilingual Demo Seeding Completed Successfully! All 3 languages (EN, RU, ZH) fully populated.')
}

seedMultilingualDemo()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
