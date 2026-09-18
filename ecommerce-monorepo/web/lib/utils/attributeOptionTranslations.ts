/**
 * Comprehensive translation mappings for category attribute dropdown options and colors
 * across English (en), Russian (ru), and Simplified Chinese (zh).
 */

export interface ColorTranslationEntry {
  en: string
  ru: string
  zh: string
}

/**
 * Standard and extended color hex code translations
 */
export const COLOR_TRANSLATIONS: Record<string, ColorTranslationEntry> = {
  '#000000': { en: 'Black', ru: 'Чёрный', zh: '黑色' },
  '#FFFFFF': { en: 'White', ru: 'Белый', zh: '白色' },
  '#6B7280': { en: 'Gray', ru: 'Серый', zh: '灰色' },
  '#9E9E9E': { en: 'Silver / Grey', ru: 'Серебристый / Серый', zh: '银色 / 灰色' },
  '#4A4A4A': { en: 'Space Gray', ru: 'Серый космос', zh: '深空灰' },
  '#4B5563': { en: 'Dark Gray', ru: 'Тёмно-серый', zh: '深灰色' },
  '#D1D5DB': { en: 'Light Gray', ru: 'Светло-серый', zh: '浅灰色' },
  '#E5E7EB': { en: 'Silver', ru: 'Серебристый', zh: '银色' },
  '#94A3B8': { en: 'Silver', ru: 'Серебристый', zh: '银色' },
  '#EF4444': { en: 'Red', ru: 'Красный', zh: '红色' },
  '#C62828': { en: 'Red / Burgundy', ru: 'Красный / Бордовый', zh: '红色 / 酒红' },
  '#7F1D1D': { en: 'Burgundy', ru: 'Бордовый', zh: '勃艮第红' },
  '#991B1B': { en: 'Crimson', ru: 'Тёмно-красный', zh: '深红' },
  '#EC4899': { en: 'Pink', ru: 'Розовый', zh: '粉色' },
  '#E91E63': { en: 'Rose Gold / Pink', ru: 'Розовое золото / Розовый', zh: '玫瑰金 / 粉色' },
  '#F43F5E': { en: 'Rose', ru: 'Ярко-розовый', zh: '玫瑰粉' },
  '#F97316': { en: 'Orange', ru: 'Оранжевый', zh: '橙色' },
  '#F59E0B': { en: 'Amber', ru: 'Янтарный', zh: '琥珀黄' },
  '#EAB308': { en: 'Yellow', ru: 'Жёлтый', zh: '黄色' },
  '#D97706': { en: 'Gold', ru: 'Золотой', zh: '金色' },
  '#D4AF37': { en: 'Gold / Champagne', ru: 'Золотой / Шампань', zh: '金色 / 香槟金' },
  '#D4B996': { en: 'Beige', ru: 'Бежевый', zh: '米色' },
  '#F5F5DC': { en: 'Beige / Cream', ru: 'Бежевый / Кремовый', zh: '米色 / 奶油白' },
  '#78350F': { en: 'Brown', ru: 'Коричневый', zh: '棕色' },
  '#5D4037': { en: 'Brown / Walnut', ru: 'Коричневый / Орех', zh: '棕色 / 胡桃木' },
  '#10B981': { en: 'Green', ru: 'Зелёный', zh: '绿色' },
  '#2E7D32': { en: 'Green / Olive', ru: 'Зелёный / Оливковый', zh: '绿色 / 橄榄绿' },
  '#064E3B': { en: 'Dark Green', ru: 'Тёмно-зелёный', zh: '墨绿色' },
  '#059669': { en: 'Emerald', ru: 'Изумрудный', zh: '祖母绿' },
  '#65A30D': { en: 'Olive', ru: 'Оливковый', zh: '橄榄绿' },
  '#84CC16': { en: 'Lime', ru: 'Лаймовый', zh: '青柠色' },
  '#14B8A6': { en: 'Teal', ru: 'Бирюзовый', zh: '青碧色' },
  '#06B6D4': { en: 'Cyan', ru: 'Голубой', zh: '青色' },
  '#0EA5E9': { en: 'Sky Blue', ru: 'Небесно-голубой', zh: '天蓝色' },
  '#3B82F6': { en: 'Blue', ru: 'Синий', zh: '蓝色' },
  '#2196F3': { en: 'Royal Blue', ru: 'Королевский синий', zh: '品蓝 / 皇家蓝' },
  '#1E3A8A': { en: 'Navy', ru: 'Тёмно-синий', zh: '藏青色' },
  '#001F3F': { en: 'Navy Blue', ru: 'Морской синий', zh: '海军蓝' },
  '#6366F1': { en: 'Indigo', ru: 'Индиго', zh: '靛蓝色' },
  '#8B5CF6': { en: 'Purple', ru: 'Фиолетовый', zh: '紫色' },
  '#7C3AED': { en: 'Violet', ru: 'Сиреневый', zh: '紫罗兰' },
  '#5B21B6': { en: 'Deep Violet', ru: 'Тёмно-фиолетовый', zh: '深紫罗兰' },
}

/**
 * Direct option dictionary: exact English option value -> { ru, zh }
 */
export const OPTION_TRANSLATIONS: Record<string, { ru: string; zh: string }> = {
  // Quantity & pieces
  'Single Piece': { ru: '1 шт (Один)', zh: '单件' },
  'Pack of 5': { ru: 'Упаковка 5 шт', zh: '5件装' },
  'Pack of 10': { ru: 'Упаковка 10 шт', zh: '10件装' },
  'Box of 50': { ru: 'Коробка 50 шт', zh: '50件一盒' },
  'Pack of 100': { ru: 'Упаковка 100 шт', zh: '100件装' },
  'Ream of 500 Sheets': { ru: 'Пачка 500 листов', zh: '500张一包' },
  '3-Piece Prep Set': { ru: 'Набор из 3 предметов', zh: '备餐3件套' },
  '6-Piece Knife Block Set': { ru: 'Набор ножей с подставкой (6 предм.)', zh: '刀架6件套' },
  '24-Piece Table Cutlery': { ru: 'Столовые приборы 24 предмета', zh: '西餐24件餐具套装' },
  '30-Piece Luxury Set': { ru: 'Премиум набор 30 предметов', zh: '轻奢30件套' },
  '72-Piece Banquet Canteen': { ru: 'Банкетный набор 72 предмета в кейсе', zh: '宴会豪华72件套礼盒' },

  // Clothing & apparel
  'Men': { ru: 'Мужской', zh: '男士' },
  'Women': { ru: 'Женский', zh: '女士' },
  'Unisex': { ru: 'Унисекс', zh: '通用' },
  'Kids': { ru: 'Детский', zh: '儿童' },
  'Solid / Plain': { ru: 'Однотонный', zh: '纯色' },
  'Striped': { ru: 'В полоску', zh: '条纹' },
  'Plaid / Check': { ru: 'В клетку', zh: '格子' },
  'Printed / Graphic': { ru: 'С принтом', zh: '印花' },
  'Floral': { ru: 'Цветочный', zh: '碎花' },
  'Spring / Summer': { ru: 'Весна / Лето', zh: '春夏' },
  'Autumn / Winter': { ru: 'Осень / Зима', zh: '秋冬' },
  'All Seasons': { ru: 'Всесезонный', zh: '四季' },
  'Machine Wash Cold': { ru: 'Машинная стирка в холодной воде', zh: '冷水机洗' },
  'Hand Wash Only': { ru: 'Только ручная стирка', zh: '仅限手洗' },
  'Dry Clean Only': { ru: 'Только химчистка', zh: '仅限干洗' },
  'Do Not Tumble Dry': { ru: 'Не сушить в барабане', zh: '不可烘干' },
  'Lace-Up': { ru: 'На шнурках', zh: '系带' },
  'Slip-On': { ru: 'Без застежки (слипоны)', zh: '套脚' },
  'Zipper': { ru: 'Молния', zh: '拉链' },
  'Buckle / Strap': { ru: 'Пряжка / Ремешок', zh: '搭扣 / 魔术贴' },
  'Backpack': { ru: 'Рюкзак', zh: '双肩包' },
  'Tote / Handbag': { ru: 'Сумка тоут / ручная', zh: '托特包 / 手提包' },
  'Crossbody / Messenger': { ru: 'Сумка через плечо', zh: '斜挎包 / 邮差包' },
  'Briefcase / Business': { ru: 'Портфель / Деловая сумка', zh: '公文包 / 商务包' },
  'Clutch / Evening': { ru: 'Клатч / Вечерняя сумочка', zh: '手拿包 / 晚宴包' },
  'Luggage / Duffle': { ru: 'Чемодан / Дорожная сумка', zh: '行李箱 / 旅行包' },
  'Up to 13-Inch': { ru: 'До 13 дюймов', zh: '13英寸及以下' },
  'Up to 15.6-Inch': { ru: 'До 15.6 дюймов', zh: '15.6英寸及以下' },
  'Up to 17.3-Inch': { ru: 'До 17.3 дюймов', zh: '17.3英寸及以下' },
  'No Laptop Compartment': { ru: 'Без отделения для ноутбука', zh: '无电脑仓' },
  'Mini (Above Knee)': { ru: 'Мини (выше колена)', zh: '迷你 (膝盖以上)' },
  'Knee-Length': { ru: 'До колена', zh: '及膝' },
  'Midi (Calf-Length)': { ru: 'Миди (до икры)', zh: '中长 (及小腿)' },
  'Maxi (Floor-Length)': { ru: 'Макси (в пол)', zh: '长款 (及地)' },
  'Round / Crew Neck': { ru: 'Круглый вырез', zh: '圆领' },
  'V-Neck': { ru: 'V-образный вырез', zh: 'V领' },
  'Collared / Shirt': { ru: 'Воротник рубашечный', zh: '衬衫翻领' },
  'Off-Shoulder': { ru: 'Открытые плечи', zh: '一字领 / 露肩' },
  'High Neck / Turtleneck': { ru: 'Высокий ворот', zh: '高领' },
  'Sleeveless': { ru: 'Без рукавов', zh: '无袖' },
  'Short Sleeve': { ru: 'Короткий рукав', zh: '短袖' },
  '3/4 Sleeve': { ru: 'Рукав 3/4', zh: '七分袖' },
  'Long Sleeve': { ru: 'Длинный рукав', zh: '长袖' },

  // Electronics & Audio
  'Wi-Fi 6 / 6E & Bluetooth 5.3': { ru: 'Wi-Fi 6 / 6E и Bluetooth 5.3', zh: 'Wi-Fi 6 / 6E 及蓝牙 5.3' },
  'Bluetooth Only': { ru: 'Только Bluetooth', zh: '仅蓝牙' },
  'Wi-Fi Only': { ru: 'Только Wi-Fi', zh: '仅Wi-Fi' },
  'Zigbee / Thread Smart Home': { ru: 'Zigbee / Thread умный дом', zh: 'Zigbee / Thread 智能家居' },
  'Android': { ru: 'Android', zh: '安卓' },
  'iOS / iPadOS': { ru: 'iOS / iPadOS', zh: '苹果系统' },
  'Windows 11': { ru: 'Windows 11', zh: 'Windows 11' },
  'macOS': { ru: 'macOS', zh: 'macOS' },
  'Integrated Graphics': { ru: 'Встроенная графика', zh: '集成显卡' },
  'Apple Integrated 10-core GPU': { ru: 'Apple 10-ядерный GPU', zh: 'Apple 10核集成图形处理器' },
  '35mm Full Frame': { ru: 'Полнокадровый 35 мм', zh: '全画幅 35mm' },
  'APS-C Crop Sensor': { ru: 'Матрица APS-C', zh: 'APS-C 画幅' },
  'Micro Four Thirds (MFT)': { ru: 'Micro 4/3 (MFT)', zh: 'M4/3 画幅' },
  '1-Inch Compact Sensor': { ru: '1-дюймовый сенсор', zh: '1英寸传感器' },
  '8K 30fps Cinema': { ru: '8K 30 кадров/с Кино', zh: '8K 30帧 电影级' },
  '4K 120fps High Frame Rate': { ru: '4K 120 кадров/с Высокая частота', zh: '4K 120帧 高帧率' },
  '4K 60fps 10-Bit': { ru: '4K 60 кадров/с 10 бит', zh: '4K 60帧 10-Bit' },
  'Full HD 120fps Slow-Mo': { ru: 'Full HD 120 кадров/с Замедление', zh: '全高清 120帧 慢动作' },
  'LiDAR + 3D ToF Obstacle Avoidance': { ru: 'LiDAR + 3D ToF избегание препятствий', zh: 'LiDAR + 3D ToF 避障' },
  'Camera AI Vision Navigation': { ru: 'AI камера визуальная навигация', zh: 'AI 视觉导航' },
  'Gyroscope + Bumper Basic': { ru: 'Гироскоп + бампер базовый', zh: '陀螺仪惯性导航' },
  'Auto-Empty Dust Station': { ru: 'Станция автовыгрузки пыли', zh: '自动集尘基站' },
  'All-in-One Auto Clean, Mop Wash & Hot Air Dry': { ru: 'Все-в-одном: автоочистка, мойка швабр и сушка горячим воздухом', zh: '全能全自动基站 (洗烘拖布)' },
  'Charging Dock Only': { ru: 'Только зарядная станция', zh: '仅充电座' },

  // Kitchen & Home Appliances
  'Automatic Bean-to-Cup': { ru: 'Автоматическая зерновая', zh: '全自动现磨咖啡机' },
  'Espresso Semi-Automatic Pump': { ru: 'Полуавтоматическая рожковая эспрессо', zh: '半自动意式浓缩咖啡机' },
  'Capsule / Pod Machine': { ru: 'Капсульная кофемашина', zh: '胶囊咖啡机' },
  'Drip Filter Coffee Maker': { ru: 'Капельная фильтр-кофеварка', zh: '美式滴滤咖啡机' },
  'Cold Brew Dripper': { ru: 'Прибор для колд-брю', zh: '冷萃滴滤机' },
  '15 Bar Standard': { ru: '15 Бар стандарт', zh: '15 Bar 标准压力' },
  '19 Bar High Pressure': { ru: '19 Бар высокое давление', zh: '19 Bar 高压' },
  '20 Bar Commercial Italian Pump': { ru: '20 Бар коммерческая итальянская помпа', zh: '20 Bar 意大利商用泵' },
  'Tri-Ply 18/10 Stainless Steel': { ru: 'Трехслойная нержавеющая сталь 18/10', zh: '三层18/10不锈钢' },
  'Pre-Seasoned Cast Iron': { ru: 'Чугун с заводской закалкой', zh: '预开锅熟铁/铸铁' },
  'Enameled Cast Iron': { ru: 'Эмалированный чугун', zh: '珐琅铸铁' },
  'Hard-Anodized Aluminum': { ru: 'Анодированный алюминий высокой прочности', zh: '硬质阳极氧化铝' },
  'Blue Carbon Steel': { ru: 'Вороненая углеродистая сталь', zh: '蓝碳钢' },
  'Food-Grade Silicone': { ru: 'Пищевой силикон', zh: '食品级硅胶' },
  'High-Heat Borosilicate Glass': { ru: 'Термостойкое боросиликатное стекло', zh: '耐热高硼硅玻璃' },
  'Not Oven Safe': { ru: 'Не подходит для духовки', zh: '不可进烤箱' },
  'Up to 180°C (350°F)': { ru: 'До 180°C (350°F)', zh: '最高耐热 180°C' },
  'Up to 220°C (425°F)': { ru: 'До 220°C (425°F)', zh: '最高耐热 220°C' },
  'Up to 260°C (500°F)': { ru: 'До 260°C (500°F)', zh: '最高耐热 260°C' },
  'Up to 300°C (575°F)': { ru: 'До 300°C (575°F)', zh: '最高耐热 300°C' },
  'Diamond / Titanium Non-Stick': { ru: 'Алмазное / титановое антипригарное', zh: '钻石 / 钛金不粘涂层' },
  'Mineral Ceramic Coating': { ru: 'Минеральное керамическое покрытие', zh: '矿物陶瓷涂层' },
  'Enamel Glazed': { ru: 'Эмалированная глазурь', zh: '珐琅釉面' },
  'Uncoated Pure Steel': { ru: 'Чистая сталь без покрытия', zh: '无涂层纯钢' },
  'Natural Oil Seasoning': { ru: 'Натуральное масляное воронение', zh: '天然油膜开锅' },
  '0.8 - 1.5 Liters (Single)': { ru: '0.8 - 1.5 л (Компактный)', zh: '0.8 - 1.5 升 (单人款)' },
  '2.0 - 4.0 Liters (Standard)': { ru: '2.0 - 4.0 л (Стандартный)', zh: '2.0 - 4.0 升 (标准款)' },
  '5.0 - 6.5 Liters (Family)': { ru: '5.0 - 6.5 л (Семейный)', zh: '5.0 - 6.5 升 (家庭装)' },
  '7.0 - 9.5 Liters (Dual Basket XL)': { ru: '7.0 - 9.5 л (Двойная корзина XL)', zh: '7.0 - 9.5 升 (双仓XL大容量)' },
  '10+ Liters (Commercial)': { ru: '10+ л (Коммерческий)', zh: '10升以上 (商用大容量)' },

  // Furniture & Decor
  'Modern Minimalist': { ru: 'Современный минимализм', zh: '现代极简' },
  'Scandinavian Nordic': { ru: 'Скандинавский нордик', zh: '北欧风情' },
  'Japandi Harmony': { ru: 'Джапанди (гармония Японии и Скандинавии)', zh: '日式原木风 / 侘寂' },
  'Industrial Loft': { ru: 'Индустриальный лофт', zh: '工业轻奢 Loft' },
  'Mid-Century Modern': { ru: 'Мид-сенчури модерн', zh: '中古摩登' },
  'Contemporary Italian': { ru: 'Современный итальянский', zh: '意式现代' },
  'Classic European': { ru: 'Европейская классика', zh: '欧式经典' },
  'Solid White Oak Wood': { ru: 'Массив белого дуба', zh: '北美白橡木原木' },
  'Solid American Walnut': { ru: 'Массив американского ореха', zh: '北美黑胡桃木' },
  'Solid Beech & Ash': { ru: 'Массив бука и ясеня', zh: '实木榉木与白蜡木' },
  'Heavy-Duty Powder Coated Metal': { ru: 'Прочный металл с порошковым покрытием', zh: '高承重碳素金属喷塑' },
  'Engineered Wood / E0 MDF': { ru: 'Экологичный МДФ E0', zh: 'E0级环保板材' },
  'Natural Marble / Sintered Stone': { ru: 'Натуральный мрамор / керамогранит', zh: '天然大理石 / 岩板' },
  'Weather-Resistant Aluminum': { ru: 'Погодостойкий алюминий', zh: '耐候防锈铝合金' },
  'Textured Warm Bouclé': { ru: 'Фактурное теплое букле', zh: '质感羊羔绒 / 羊圈绒' },
  'Top-Grain Italian Leather': { ru: 'Натуральная итальянская кожа', zh: '进口头层牛皮' },
  'Soft Plush Velvet': { ru: 'Мягкий бархат / велюр', zh: '亲肤短毛绒 / 天鹅绒' },
  'Breathable Linen Weave': { ru: 'Дышащий лен', zh: '透气亚麻织物' },
  'Stain-Resistant Microfiber': { ru: 'Грязеотталкивающая микрофибра', zh: '防污纳米科技布' },
  'Chenille Fabric': { ru: 'Шенилл', zh: '雪尼尔面料' },
  '1-Seater Armchair': { ru: '1-местное кресло', zh: '单人扶手椅' },
  '2-Seater Loveseat': { ru: '2-местный диван', zh: '双人沙发' },
  '3-Seater Sofa': { ru: '3-местный диван', zh: '三人座沙发' },
  '4-Seater Large Sofa': { ru: '4-местный просторный диван', zh: '大四人位沙发' },
  'L-Shaped Corner Sectional': { ru: 'Г-образный угловой диван', zh: 'L型贵妃榻转角沙发' },
  'Modular U-Shaped': { ru: 'Модульный П-образный', zh: 'U型多功能组合模块' },

  // Office & Ergonomics
  'Adaptive Lumbar Support': { ru: 'Адаптивная поддержка поясницы', zh: '自适应腰托支撑' },
  '4D Adjustable Armrests': { ru: '4D регулируемые подлокотники', zh: '4D多维调节扶手' },
  'Pneumatic Height Gas Lift': { ru: 'Пневмолифт регулировки высоты', zh: 'SGS认证气压升降' },
  'Synchronized Recline & Tilt Lock': { ru: 'Синхронный механизм качания с фиксацией', zh: '线控同步倾仰锁定' },
  'Seat Depth Sliding Adjustment': { ru: 'Регулировка глубины сиденья', zh: '座垫前后座深滑动调节' },
  'All-Weather UV & Waterproof': { ru: 'Всепогодная защита от УФ и влаги', zh: '全天候抗UV防雨防晒' },
  'Water-Repellent Fabric': { ru: 'Водоотталкивающая ткань', zh: '防泼水速干织物' },
  'Rustproof Powder-Coated Metal': { ru: 'Антикоррозийный металл', zh: '防锈防腐静电喷塑' },
  'Cover Recommended in Rain': { ru: 'Рекомендуется защитный чехол в дождь', zh: '暴雨建议使用防雨罩' },

  // Beauty & Skincare
  'All Skin Types': { ru: 'Для всех типов кожи', zh: '适合所有肤质' },
  'Sensitive Skin': { ru: 'Для чувствительной кожи', zh: '敏感肌适用' },
  'Dry & Dehydrated': { ru: 'Для сухой и обезвоженной кожи', zh: '干燥缺水肌' },
  'Oily & Blemish-Prone': { ru: 'Для жирной и проблемной кожи', zh: '油性及痘痘肌' },
  'Combination Skin': { ru: 'Для комбинированной кожи', zh: '混合性肤质' },
  'Mature & Aging Skin': { ru: 'Для зрелой кожи', zh: '抗衰初老肌' },
  'Concentrated Serum': { ru: 'Концентрированная сыворотка', zh: '浓缩精华原液' },
  'Hydrating Cream': { ru: 'Увлажняющий крем', zh: '高保湿润肤面霜' },
  'Refreshing Gel': { ru: 'Освежающий гель', zh: '清爽水凝啫喱' },
  'Gentle Foam Cleanser': { ru: 'Мягкая очищающая пенка', zh: '温和氨基酸洁面泡泡' },
  'Lightweight Emulsion': { ru: 'Легкая эмульсия', zh: '清透柔润乳液' },
  'Solid Balm': { ru: 'Твердый бальзам', zh: '修护固体膏 / 油膏' },
  'Sheet Mask': { ru: 'Тканевая маска', zh: '补水贴片面膜' },
  'Hyaluronic Acid Multi-Complex': { ru: 'Мультикомплекс гиалуроновой кислоты', zh: '多重透明质酸钠' },
  'Encapsulated Retinol (Vitamin A)': { ru: 'Инкапсулированный ретинол (Вит А)', zh: '微胶囊视黄醇 (A醇)' },
  'Niacinamide (Vitamin B3)': { ru: 'Ниацинамид (Вит B3)', zh: '高纯烟酰胺 (B3)' },
  'Stable Vitamin C (Ascorbic Acid)': { ru: 'Стабильный витамин C', zh: '高活性维生素C' },
  'Centella Asiatica (Cica)': { ru: 'Центелла азиатская (Cica)', zh: '积雪草提取物 (Cica)' },
  'Ceramide Barrier Complex': { ru: 'Комплекс керамидов для барьера кожи', zh: '神经酰胺屏障修护复合物' },
  'Salicylic Acid (BHA)': { ru: 'Салициловая кислота (BHA)', zh: '水杨酸 (BHA)' },
  'Peptide & Collagen Complex': { ru: 'Комплекс пептидов и коллагена', zh: '多重寡肽及重组胶原蛋白' },

  // Sports & Outdoor
  'Gym & Strength Training': { ru: 'Тренажерный зал и силовые', zh: '健身与力量训练' },
  'Running & Marathon': { ru: 'Бег и марафон', zh: '跑步与马拉松' },
  'Cycling & Mountain Biking': { ru: 'Велоспорт и маунтинбайк', zh: '公路骑行与山地越野' },
  'Hiking & Trekking': { ru: 'Хайкинг и треккинг', zh: '徒步越野与登山' },
  'Yoga & Pilates': { ru: 'Йога и пилатес', zh: '瑜伽与普拉提' },
  'Swimming & Water Sports': { ru: 'Плавание и водный спорт', zh: '游泳与水上运动' },
  'Football & Basketball': { ru: 'Футбол и баскетбол', zh: '足球与篮球' },
  'Camping & Survival': { ru: 'Кемпинг и выживание', zh: '户外露营与野外生存' },
  'Light (5-15 lbs)': { ru: 'Легкий (2.5 - 7 кг)', zh: '轻度阻力 (5-15磅)' },
  'Medium (20-35 lbs)': { ru: 'Средний (9 - 16 кг)', zh: '中度阻力 (20-35磅)' },
  'Heavy (40-60 lbs)': { ru: 'Тяжелый (18 - 27 кг)', zh: '高强阻力 (40-60磅)' },
  'Extra Heavy (70+ lbs)': { ru: 'Экстра тяжелый (32+ кг)', zh: '极限爆发级 (70磅+)' },
  'Adjustable Set': { ru: 'Регулируемый набор', zh: '多档组合调节套装' },
  'Indoor Living Space': { ru: 'Внутри помещений', zh: '室内生活空间' },
  'Balcony & Terrace': { ru: 'Балкон и терраса', zh: '阳台与露台' },
  'Outdoor Garden & Lawn': { ru: 'Сад и газон', zh: '户外花园与草坪' },
  'Greenhouse': { ru: 'Теплица', zh: '温室花房' },
  'Indoor & Outdoor': { ru: 'Внутри и на улице', zh: '室内外通用' },
  'Solar Powered': { ru: 'На солнечной энергии', zh: '太阳能光伏供电' },
  'Rechargeable Battery (Lithium)': { ru: 'Литиевый аккумулятор', zh: '可充电大容量锂电池' },
  'Plug-in 220V Electric': { ru: 'От сети 220V', zh: '220V 插电直供' },
  'Manual / Non-Electric': { ru: 'Механический / ручной', zh: '纯手动 / 免接电' },

  // Automotive
  'Universal Passenger Cars': { ru: 'Универсальный для легковых авто', zh: '乘用家用小轿车通用' },
  'SUV & Crossovers': { ru: 'Для кроссоверов и внедорожников', zh: 'SUV 越野车及城市SUV' },
  'Heavy Commercial Trucks & Vans': { ru: 'Для грузовиков и микроавтобусов', zh: '重卡及商用客货车' },
  'Motorcycles & Scooters': { ru: 'Для мотоциклов и скутеров', zh: '摩托车及电摩通用' },
  'Dashboard & Windshield': { ru: 'Торпедо и лобовое стекло', zh: '仪表台与前挡风玻璃' },
  'Air Conditioning Vent': { ru: 'Дефлектор кондиционера', zh: '空调出风口格栅' },
  'Headrest & Seat Back': { ru: 'Подголовник и спинка сиденья', zh: '座椅头枕及椅背后方' },
  'Trunk Cargo Space': { ru: 'Багажное отделение', zh: '后备箱储物区域' },
  'Under Hood / Battery': { ru: 'Подкапотное пространство / АКБ', zh: '发动机舱及电瓶区域' },
  'Exterior Body': { ru: 'Кузов / наружная установка', zh: '车身外部固定' },
  '12V Car DC': { ru: '12V Автомобильный DC', zh: '12V 车载直流' },
  '24V Truck DC': { ru: '24V Грузовой DC', zh: '24V 卡车直流' },
  'Universal 12V-24V DC': { ru: 'Универсальный 12V-24V DC', zh: '12V-24V 宽压通用' },
  '5V USB Powered': { ru: '5V от USB', zh: '5V USB 取电供电' },

  // Office & Toys
  'A4 (210 x 297 mm)': { ru: 'A4 (210 x 297 мм)', zh: 'A4 (210 x 297 毫米)' },
  'A3 (297 x 420 mm)': { ru: 'A3 (297 x 420 мм)', zh: 'A3 (297 x 420 毫米)' },
  'A5 (148 x 210 mm)': { ru: 'A5 (148 x 210 мм)', zh: 'A5 (148 x 210 毫米)' },
  'US Letter': { ru: 'US Letter (Американский формат)', zh: '美标信纸 (US Letter)' },
  'Standard Desk Size': { ru: 'Стандартный настольный', zh: '标准桌面尺寸' },
  '0 - 12 Months': { ru: '0 - 12 месяцев', zh: '0 - 12 个月 (婴幼儿)' },
  '1 - 3 Years (Toddlers)': { ru: '1 - 3 года (малыши)', zh: '1 - 3 岁 (幼童)' },
  '4 - 7 Years (Preschool)': { ru: '4 - 7 лет (дошкольники)', zh: '4 - 7 岁 (学龄前)' },
  '8 - 12 Years (Kids)': { ru: '8 - 12 лет (школьники)', zh: '8 - 12 岁 (儿童少儿)' },
  '14+ Years (Teens & Adults)': { ru: '14+ лет (подростки и взрослые)', zh: '14岁以上 (青少年与成人)' },
  'All Ages Family': { ru: 'Для любого возраста (семейный)', zh: '全年龄段家庭同乐' },
  'CE Certified': { ru: 'Сертификат CE', zh: '欧盟 CE 安全认证' },
  'BPA-Free Food Grade': { ru: 'Пищевой пластик без BPA', zh: '食品级无双酚A安全材质' },
  'Non-Toxic Water Paint': { ru: 'Нетоксичная краска на водной основе', zh: '环保无毒水性漆' },
  'EN71 European Safety': { ru: 'Европейский стандарт безопасности EN71', zh: '欧洲玩具安全标准 EN71' },
  'ASTM F963 Compliant': { ru: 'Стандарт США ASTM F963', zh: '美国玩具安全认证 ASTM F963' },
  'Single Player (Solo)': { ru: 'Одиночная игра', zh: '单人沉浸游玩' },
  '2 Players (Versus)': { ru: '2 игрока (дуэль)', zh: '双人对战' },
  '2 - 4 Players': { ru: '2 - 4 игрока', zh: '2 - 4 人对决' },
  '3 - 6 Players': { ru: '3 - 6 игроков', zh: '3 - 6 人欢乐组局' },
  'Party Game (6+ Players)': { ru: 'Для вечеринок (6+ игроков)', zh: '大型派对狂欢 (6人以上)' },

  // Warranty options
  '1 Year': { ru: '1 год', zh: '1年' },
  '2 Years': { ru: '2 года', zh: '2年' },
  '3 Years': { ru: '3 года', zh: '3年' },
  '5 Years': { ru: '5 лет', zh: '5年' },
  '10 Years': { ru: '10 лет', zh: '10年' },
  'Lifetime': { ru: 'Пожизненная', zh: '终身保修' },
}

/**
 * Returns the localized display label for a given attribute dropdown option.
 * Falls back gracefully to English if no translation is found.
 */
export function getLocalizedOptionLabel(
  _attributeSlug: string,
  optionValue: string,
  locale: 'en' | 'ru' | 'zh' | string
): string {
  if (!optionValue) return ''

  // Boolean handling
  const lowerVal = optionValue.toLowerCase().trim()
  if (lowerVal === 'true' || lowerVal === 'yes' || lowerVal === 'требуется' || lowerVal === 'да') {
    if (_attributeSlug === 'assembly_required') {
      return locale === 'ru' ? 'Требуется' : locale === 'zh' ? '需要组装' : 'Yes'
    }
    return locale === 'ru' ? 'Да' : locale === 'zh' ? '是' : 'Yes'
  }
  if (lowerVal === 'false' || lowerVal === 'no' || lowerVal === 'не требуется' || lowerVal === 'нет') {
    if (_attributeSlug === 'assembly_required') {
      return locale === 'ru' ? 'Не требуется' : locale === 'zh' ? '无需组装' : 'No'
    }
    return locale === 'ru' ? 'Нет' : locale === 'zh' ? '否' : 'No'
  }

  if (locale === 'en') return optionValue

  const entry = OPTION_TRANSLATIONS[optionValue]
  if (entry) {
    if (locale === 'ru' && entry.ru) return entry.ru
    if (locale === 'zh' && entry.zh) return entry.zh
  }

  return optionValue
}

/**
 * Returns the localized color name for a given hex code.
 * Falls back to default label or hex code if unknown.
 */
export function getLocalizedColorName(
  hex: string,
  defaultLabel?: string,
  locale: 'en' | 'ru' | 'zh' | string = 'en'
): string {
  if (!hex) return ''
  const cleanHex = hex.toUpperCase()
  const entry = COLOR_TRANSLATIONS[cleanHex]

  if (entry) {
    if (locale === 'ru' && entry.ru) return entry.ru
    if (locale === 'zh' && entry.zh) return entry.zh
    if (locale === 'en' && entry.en) return entry.en
  }

  return defaultLabel || hex
}

/**
 * Formats an array of color hex codes into a comma-separated localized string list.
 * e.g. ["#000000", "#EF4444"] -> "Чёрный, Красный" (ru) or "黑色, 红色" (zh)
 */
export function getLocalizedColorList(
  hexList: string[],
  locale: 'en' | 'ru' | 'zh' | string = 'en'
): string {
  if (!Array.isArray(hexList) || hexList.length === 0) return ''
  return hexList
    .map((hex) => getLocalizedColorName(hex, undefined, locale))
    .filter(Boolean)
    .join(', ')
}

const COUNTRY_TRANSLATIONS: Record<string, { en: string; ru: string; zh: string }> = {
  china: { en: 'China', ru: 'Китай', zh: '中国' },
  cn: { en: 'China', ru: 'Китай', zh: '中国' },
  germany: { en: 'Germany', ru: 'Германия', zh: '德国' },
  de: { en: 'Germany', ru: 'Германия', zh: '德国' },
  'united states': { en: 'United States', ru: 'США', zh: '美国' },
  usa: { en: 'United States', ru: 'США', zh: '美国' },
  us: { en: 'United States', ru: 'США', zh: '美国' },
  japan: { en: 'Japan', ru: 'Япония', zh: '日本' },
  jp: { en: 'Japan', ru: 'Япония', zh: '日本' },
  'south korea': { en: 'South Korea', ru: 'Южная Корея', zh: '韩国' },
  korea: { en: 'South Korea', ru: 'Южная Корея', zh: '韩国' },
  kr: { en: 'South Korea', ru: 'Южная Корея', zh: '韩国' },
  italy: { en: 'Italy', ru: 'Италия', zh: '意大利' },
  it: { en: 'Italy', ru: 'Италия', zh: '意大利' },
  france: { en: 'France', ru: 'Франция', zh: '法国' },
  fr: { en: 'France', ru: 'Франция', zh: '法国' },
  turkey: { en: 'Turkey', ru: 'Турция', zh: '土耳其' },
  tr: { en: 'Turkey', ru: 'Турция', zh: '土耳其' },
  vietnam: { en: 'Vietnam', ru: 'Вьетнам', zh: '越南' },
  vn: { en: 'Vietnam', ru: 'Вьетнам', zh: '越南' },
}

export function getLocalizedCountry(
  country: string,
  locale: 'en' | 'ru' | 'zh' | string = 'en'
): string {
  if (!country) return ''
  const key = country.trim().toLowerCase()
  const entry = COUNTRY_TRANSLATIONS[key]
  if (entry) {
    if (locale === 'ru' && entry.ru) return entry.ru
    if (locale === 'zh' && entry.zh) return entry.zh
    if (locale === 'en' && entry.en) return entry.en
  }
  return country
}

const MATERIAL_TRANSLATIONS: Record<string, { en: string; ru: string; zh: string }> = {
  'tempered glass and steel': { en: 'Tempered Glass & Steel', ru: 'Закаленное стекло и сталь', zh: '钢化玻璃与钢材' },
  'tempered glass': { en: 'Tempered Glass', ru: 'Закаленное стекло', zh: '钢化玻璃' },
  'glass and steel': { en: 'Glass & Steel', ru: 'Стекло и сталь', zh: '玻璃与钢材' },
  'plastic, metal': { en: 'Plastic, Metal', ru: 'Пластик, металл', zh: '塑料、金属' },
  'plastic': { en: 'Plastic', ru: 'Пластик', zh: '塑料' },
  'metal': { en: 'Metal', ru: 'Металл', zh: '金属' },
  'cotton': { en: 'Cotton', ru: 'Хлопок', zh: '纯棉' },
  '100% cotton': { en: '100% Cotton', ru: '100% Хлопок', zh: '100% 纯棉' },
  'nylon, copper': { en: 'Nylon, Copper', ru: 'Нейлон, медь', zh: '尼龙、铜' },
  'stainless steel': { en: 'Stainless Steel', ru: 'Нержавеющая сталь', zh: '不锈钢' },
  'carbon steel': { en: 'Carbon Steel', ru: 'Углеродистая сталь', zh: '碳钢' },
  'cast iron': { en: 'Cast Iron', ru: 'Чугун', zh: '铸铁' },
  'aluminum': { en: 'Aluminum', ru: 'Алюминий', zh: '铝合金' },
  'ceramic': { en: 'Ceramic', ru: 'Керамика', zh: '陶瓷' },
  'porcelain': { en: 'Porcelain', ru: 'Фарфор', zh: '骨瓷/陶瓷' },
  'titanium': { en: 'Titanium', ru: 'Титан', zh: '钛金属' },
  'solid wood': { en: 'Solid Wood', ru: 'Массив дерева', zh: '实木' },
  'solid beech & ash': { en: 'Solid Beech & Ash', ru: 'Массив бука и ясеня', zh: '实木榉木与白蜡木' },
  'silicone': { en: 'Silicone', ru: 'Силикон', zh: '硅胶' },
  'fabric': { en: 'Fabric', ru: 'Ткань', zh: '面料' },
  'leather': { en: 'Leather', ru: 'Натуральная кожа', zh: '真皮' },
}

export function getLocalizedMaterial(
  material: string,
  locale: 'en' | 'ru' | 'zh' | string = 'en'
): string {
  if (!material) return ''
  const key = material.trim().toLowerCase()
  const entry = MATERIAL_TRANSLATIONS[key]
  if (entry) {
    if (locale === 'ru' && entry.ru) return entry.ru
    if (locale === 'zh' && entry.zh) return entry.zh
    if (locale === 'en' && entry.en) return entry.en
  }
  return material
}

