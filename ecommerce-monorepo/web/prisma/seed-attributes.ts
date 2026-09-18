import { PrismaClient, AttributeType } from '@prisma/client'

const prisma = new PrismaClient()

interface AttributeDefinition {
  name: string
  slug: string
  type: AttributeType
  options?: string[]
  colorOptions?: Array<{ label: string; value: string }>
  placeholder?: string
  helperText?: string
  isRequired?: boolean
  isFilterable?: boolean
  isVariant?: boolean
  translations?: {
    en?: string
    ru?: string
    zh?: string
  }
}

interface CategoryMapping {
  categorySlugs: string[]
  attributes: Array<{
    slug: string
    displayOrder: number
    isRequired?: boolean
  }>
}

const COLOR_PALETTE = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Silver / Grey', value: '#9E9E9E' },
  { label: 'Navy Blue', value: '#001F3F' },
  { label: 'Royal Blue', value: '#2196F3' },
  { label: 'Red / Burgundy', value: '#C62828' },
  { label: 'Green / Olive', value: '#2E7D32' },
  { label: 'Beige / Cream', value: '#F5F5DC' },
  { label: 'Brown / Walnut', value: '#5D4037' },
  { label: 'Gold / Champagne', value: '#D4AF37' },
  { label: 'Rose Gold / Pink', value: '#E91E63' },
  { label: 'Space Gray', value: '#4A4A4A' },
]

// 1. All Master Attributes Definitions
const MASTER_ATTRIBUTES: AttributeDefinition[] = [
  // --- Universal / Core Attributes ---
  {
    name: 'Brand',
    slug: 'brand',
    type: AttributeType.TEXT,
    placeholder: 'e.g., Apple, Nike, Tefal, Bosch',
    helperText: 'Manufacturer or brand name',
    isFilterable: true,
    translations: { en: 'Brand', ru: 'Бренд', zh: '品牌' },
  },
  {
    name: 'Color',
    slug: 'color',
    type: AttributeType.COLOR,
    colorOptions: COLOR_PALETTE,
    isFilterable: true,
    isVariant: true,
    helperText: 'Primary color variant of the item',
    translations: { en: 'Color', ru: 'Цвет', zh: '颜色' },
  },
  {
    name: 'Country of Origin',
    slug: 'country_of_origin',
    type: AttributeType.SELECT,
    options: ['China', 'Germany', 'United States', 'Japan', 'South Korea', 'Italy', 'France', 'Turkey', 'Vietnam', 'Other'],
    placeholder: 'Select origin',
    helperText: 'Country where product was manufactured',
    isFilterable: true,
    translations: { en: 'Country of Origin', ru: 'Страна производства', zh: '原产国' },
  },
  {
    name: 'Warranty Period',
    slug: 'warranty',
    type: AttributeType.SELECT,
    options: ['No Warranty', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '10 Years', 'Lifetime'],
    placeholder: 'Select warranty duration',
    isFilterable: true,
    translations: { en: 'Warranty Period', ru: 'Гарантийный срок', zh: '保修期限' },
  },
  {
    name: 'Weight (kg)',
    slug: 'weight',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 1.25',
    helperText: 'Gross product weight in kilograms',
    isFilterable: true,
    translations: { en: 'Weight (kg)', ru: 'Вес (кг)', zh: '重量 (kg)' },
  },
  {
    name: 'Dimensions (L x W x H cm)',
    slug: 'dimensions',
    type: AttributeType.TEXT,
    placeholder: 'e.g., 40 x 30 x 15 cm',
    helperText: 'Package or item dimensions in centimeters',
    isFilterable: false,
    translations: { en: 'Dimensions (L x W x H)', ru: 'Габариты (Д x Ш x В)', zh: '外形尺寸' },
  },

  // --- Clothing & Apparel Attributes ---
  {
    name: 'Clothing Size',
    slug: 'size',
    type: AttributeType.SELECT,
    options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Free Size', 'Custom Size'],
    placeholder: 'Select size',
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Clothing Size', ru: 'Размер одежды', zh: '服装尺码' },
  },
  {
    name: 'Fabric / Material',
    slug: 'material',
    type: AttributeType.SELECT,
    options: ['100% Cotton', 'Cotton Blend', 'Polyester', 'Wool', 'Cashmere', 'Linen', 'Silk', 'Denim', 'Fleece', 'Nylon', 'Spandex / Elastane'],
    placeholder: 'Select primary fabric',
    isFilterable: true,
    translations: { en: 'Material / Fabric', ru: 'Материал / Ткань', zh: '材质 / 面料' },
  },
  {
    name: 'Gender / Department',
    slug: 'clothing_gender',
    type: AttributeType.SELECT,
    options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls', 'Baby & Toddler'],
    placeholder: 'Select target gender',
    isFilterable: true,
    translations: { en: 'Gender / Department', ru: 'Пол / Категория', zh: '适用人群' },
  },
  {
    name: 'Pattern / Print',
    slug: 'clothing_pattern',
    type: AttributeType.SELECT,
    options: ['Solid Plain', 'Striped', 'Plaid / Checkered', 'Floral Print', 'Graphic Print', 'Camouflage', 'Geometric', 'Polka Dot'],
    placeholder: 'Select pattern style',
    isFilterable: true,
    translations: { en: 'Pattern / Print', ru: 'Узор / Рисунок', zh: '图案 / 花纹' },
  },
  {
    name: 'Seasonality',
    slug: 'clothing_season',
    type: AttributeType.SELECT,
    options: ['All Season', 'Spring / Summer', 'Autumn / Winter', 'Summer Lightweight', 'Winter Thermal'],
    isFilterable: true,
    translations: { en: 'Season', ru: 'Сезонность', zh: '适用季节' },
  },
  {
    name: 'Care Instructions',
    slug: 'clothing_care',
    type: AttributeType.SELECT,
    options: ['Machine Washable', 'Hand Wash Only', 'Dry Clean Only', 'Cold Wash / Hang Dry'],
    isFilterable: false,
    translations: { en: 'Care Instructions', ru: 'Уход за изделием', zh: '洗涤与保养' },
  },

  // --- Shoes Attributes ---
  {
    name: 'Shoe Size (EU)',
    slug: 'shoe_size_eu',
    type: AttributeType.SELECT,
    options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Shoe Size (EU)', ru: 'Размер обуви (EU)', zh: '鞋码 (EU)' },
  },
  {
    name: 'Shoe Upper Material',
    slug: 'shoe_upper_material',
    type: AttributeType.SELECT,
    options: ['Full-Grain Leather', 'Genuine Suede', 'Breathable Flyknit Mesh', 'Heavy Canvas', 'Synthetic PU Leather', 'Waterproof Membrane'],
    isFilterable: true,
    translations: { en: 'Upper Material', ru: 'Материал верха обуви', zh: '鞋面材质' },
  },
  {
    name: 'Outsole Material',
    slug: 'shoe_outsole_material',
    type: AttributeType.SELECT,
    options: ['Anti-Slip Rubber', 'Cushioned EVA', 'Polyurethane (PU)', 'Thermoplastic (TPR)', 'Vibram Traction Rubber'],
    isFilterable: true,
    translations: { en: 'Outsole Material', ru: 'Материал подошвы', zh: '鞋底材质' },
  },
  {
    name: 'Closure Type',
    slug: 'shoe_closure_type',
    type: AttributeType.SELECT,
    options: ['Lace-Up', 'Slip-On Elastic', 'Velcro Hook & Loop', 'Side Zipper', 'Dial Boa System'],
    isFilterable: true,
    translations: { en: 'Closure Type', ru: 'Тип застежки', zh: '闭合方式' },
  },

  // --- Bags & Purses ---
  {
    name: 'Bag Style / Type',
    slug: 'bag_type',
    type: AttributeType.SELECT,
    options: ['Backpack', 'Tote Bag', 'Crossbody Bag', 'Shoulder Bag', 'Clutch', 'Travel Duffel', 'Business Messenger'],
    isFilterable: true,
    translations: { en: 'Bag Type', ru: 'Тип сумки', zh: '箱包类型' },
  },
  {
    name: 'Bag Capacity (Liters)',
    slug: 'bag_capacity_liters',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 24',
    isFilterable: true,
    translations: { en: 'Capacity (Liters)', ru: 'Вместимость (л)', zh: '容量 (升)' },
  },
  {
    name: 'Laptop Compartment',
    slug: 'bag_laptop_fit',
    type: AttributeType.SELECT,
    options: ['No Compartment', 'Fits up to 13.3"', 'Fits up to 14.0"', 'Fits up to 15.6"', 'Fits up to 17.3"'],
    isFilterable: true,
    translations: { en: 'Laptop Compartment', ru: 'Отсек для ноутбука', zh: '笔记本电脑隔层' },
  },

  // --- Dresses & Skirts ---
  {
    name: 'Dress Length',
    slug: 'dress_length',
    type: AttributeType.SELECT,
    options: ['Mini (Above Knee)', 'Knee Length', 'Midi (Calf Length)', 'Maxi (Floor Length)'],
    isFilterable: true,
    translations: { en: 'Dress Length', ru: 'Длина платья', zh: '裙长' },
  },
  {
    name: 'Neckline',
    slug: 'dress_neckline',
    type: AttributeType.SELECT,
    options: ['Crew Neck', 'V-Neck', 'Square Neck', 'Off-Shoulder', 'Collared', 'Sweetheart', 'Boat Neck', 'Turtleneck'],
    isFilterable: true,
    translations: { en: 'Neckline', ru: 'Вырез горловины', zh: '领型' },
  },
  {
    name: 'Sleeve Length',
    slug: 'dress_sleeve_length',
    type: AttributeType.SELECT,
    options: ['Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve', 'Cap Sleeve'],
    isFilterable: true,
    translations: { en: 'Sleeve Length', ru: 'Длина рукава', zh: '袖长' },
  },

  // --- Electronics Common ---
  {
    name: 'Power Consumption (W)',
    slug: 'power_watts',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 65',
    helperText: 'Maximum power consumption in watts',
    isFilterable: true,
    translations: { en: 'Power (Watts)', ru: 'Мощность (Вт)', zh: '功率 (W)' },
  },
  {
    name: 'Operating Voltage',
    slug: 'voltage_spec',
    type: AttributeType.SELECT,
    options: ['100-240V Universal', '220-240V (EU/UK/CN)', '110-120V (US)', 'USB 5V DC', 'Battery Powered (DC)'],
    isFilterable: true,
    translations: { en: 'Operating Voltage', ru: 'Рабочее напряжение', zh: '工作电压' },
  },
  {
    name: 'Wireless Connectivity',
    slug: 'wireless_connectivity',
    type: AttributeType.MULTISELECT,
    options: ['Wi-Fi 6E/7', 'Wi-Fi 5', 'Bluetooth 5.3', 'Bluetooth 5.0', 'NFC', '5G Mobile', '4G LTE', 'Zigbee / Matter'],
    isFilterable: true,
    translations: { en: 'Wireless Connectivity', ru: 'Беспроводная связь', zh: '无线连接方式' },
  },

  // --- Smartphones ---
  {
    name: 'Internal Storage (ROM)',
    slug: 'phone_storage',
    type: AttributeType.SELECT,
    options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Internal Storage', ru: 'Встроенная память', zh: '机身存储' },
  },
  {
    name: 'RAM Memory',
    slug: 'phone_ram',
    type: AttributeType.SELECT,
    options: ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'RAM Memory', ru: 'Оперативная память', zh: '运行内存' },
  },
  {
    name: 'Screen Size (Inches)',
    slug: 'phone_screen_size',
    type: AttributeType.SELECT,
    options: ['5.8"', '6.1"', '6.3"', '6.5"', '6.7"', '6.8"', '7.6" Foldable'],
    isFilterable: true,
    translations: { en: 'Screen Size', ru: 'Диагональ экрана', zh: '屏幕尺寸' },
  },
  {
    name: 'Battery Capacity (mAh)',
    slug: 'phone_battery_mah',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 5000',
    isFilterable: true,
    translations: { en: 'Battery (mAh)', ru: 'Емкость аккумулятора (мАч)', zh: '电池容量 (mAh)' },
  },
  {
    name: 'Main Camera Resolution',
    slug: 'phone_camera_mp',
    type: AttributeType.SELECT,
    options: ['12 MP Dual', '48 MP Triple', '50 MP Triple OIS', '108 MP Quad', '200 MP Ultra Sensor'],
    isFilterable: true,
    translations: { en: 'Main Camera', ru: 'Основная камера', zh: '主摄像头参数' },
  },
  {
    name: 'Operating System',
    slug: 'phone_os',
    type: AttributeType.SELECT,
    options: ['Android 14', 'Android 15', 'iOS 18', 'HarmonyOS NEXT'],
    isFilterable: true,
    translations: { en: 'Operating System', ru: 'Операционная система', zh: '操作系统' },
  },

  // --- Laptops & Tablets ---
  {
    name: 'Processor (CPU)',
    slug: 'laptop_cpu',
    type: AttributeType.SELECT,
    options: [
      'Intel Core i5',
      'Intel Core i7',
      'Intel Core i9',
      'Intel Core Ultra 7',
      'AMD Ryzen 5',
      'AMD Ryzen 7',
      'AMD Ryzen 9',
      'Apple M3',
      'Apple M3 Pro / Max',
      'Apple M4'
    ],
    isFilterable: true,
    translations: { en: 'Processor (CPU)', ru: 'Процессор (CPU)', zh: '处理器 (CPU)' },
  },
  {
    name: 'Laptop RAM',
    slug: 'laptop_ram',
    type: AttributeType.SELECT,
    options: ['8GB LPDDR5', '16GB DDR5', '32GB DDR5', '64GB DDR5'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'RAM Capacity', ru: 'Объем ОЗУ', zh: '内存规格' },
  },
  {
    name: 'SSD Storage',
    slug: 'laptop_ssd',
    type: AttributeType.SELECT,
    options: ['256GB NVMe SSD', '512GB NVMe SSD', '1TB NVMe SSD', '2TB NVMe SSD', '4TB NVMe SSD'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'SSD Storage', ru: 'Накопитель SSD', zh: '固态硬盘容量' },
  },
  {
    name: 'Dedicated Graphics (GPU)',
    slug: 'laptop_gpu',
    type: AttributeType.SELECT,
    options: [
      'Integrated Graphics',
      'NVIDIA RTX 4050 6GB',
      'NVIDIA RTX 4060 8GB',
      'NVIDIA RTX 4070 8GB',
      'NVIDIA RTX 4080 12GB',
      'NVIDIA RTX 4090 16GB',
      'Apple Integrated 10-core GPU'
    ],
    isFilterable: true,
    translations: { en: 'Graphics Card (GPU)', ru: 'Видеокарта (GPU)', zh: '独立显卡 (GPU)' },
  },
  {
    name: 'Display Screen Size',
    slug: 'laptop_screen_size',
    type: AttributeType.SELECT,
    options: ['10.9" Tablet', '12.9" Tablet', '13.3"', '14.0"', '15.6"', '16.0"', '17.3"'],
    isFilterable: true,
    translations: { en: 'Display Size', ru: 'Диагональ экрана', zh: '屏幕尺寸' },
  },
  {
    name: 'Screen Refresh Rate',
    slug: 'display_refresh_rate',
    type: AttributeType.SELECT,
    options: ['60Hz Standard', '90Hz Smooth', '120Hz ProMotion', '144Hz Gaming', '165Hz', '240Hz Esports'],
    isFilterable: true,
    translations: { en: 'Refresh Rate', ru: 'Частота обновления', zh: '屏幕刷新率' },
  },

  // --- Smart TVs ---
  {
    name: 'TV Diagonal Size',
    slug: 'tv_screen_size',
    type: AttributeType.SELECT,
    options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"', '98"'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Screen Diagonal Size', ru: 'Диагональ экрана ТВ', zh: '电视屏幕尺寸' },
  },
  {
    name: 'Display Technology',
    slug: 'tv_display_tech',
    type: AttributeType.SELECT,
    options: ['OLED Self-Lit', 'QD-OLED', 'Mini-LED Local Dimming', 'QLED Quantum Dot', '4K Crystal UHD'],
    isFilterable: true,
    translations: { en: 'Panel Technology', ru: 'Технология панели', zh: '面板显示技术' },
  },
  {
    name: 'TV Resolution',
    slug: 'tv_resolution',
    type: AttributeType.SELECT,
    options: ['4K Ultra HD (3840x2160)', '8K Ultra HD (7680x4320)', 'Full HD (1920x1080)'],
    isFilterable: true,
    translations: { en: 'Resolution', ru: 'Разрешение экрана', zh: '屏幕分辨率' },
  },
  {
    name: 'Smart Platform',
    slug: 'tv_smart_system',
    type: AttributeType.SELECT,
    options: ['Google TV / Android TV', 'LG webOS', 'Samsung Tizen OS', 'Apple AirPlay 2 Built-in'],
    isFilterable: true,
    translations: { en: 'Smart TV System', ru: 'Операционная система ТВ', zh: '智能电视系统' },
  },

  // --- Audio ---
  {
    name: 'Audio Form Factor',
    slug: 'audio_type',
    type: AttributeType.SELECT,
    options: ['True Wireless Earbuds (TWS)', 'Over-Ear ANC Headphones', 'On-Ear Headphones', 'TV Soundbar with Subwoofer', 'Portable Bluetooth Speaker'],
    isFilterable: true,
    translations: { en: 'Audio Device Type', ru: 'Тип аудиоустройства', zh: '音频设备类型' },
  },
  {
    name: 'Active Noise Cancellation',
    slug: 'audio_anc',
    type: AttributeType.CHECKBOX,
    helperText: 'Equipped with Active Noise Cancellation (ANC)',
    isFilterable: true,
    translations: { en: 'Active Noise Cancelling', ru: 'Активное шумоподавление', zh: '主动降噪 (ANC)' },
  },
  {
    name: 'Battery Life (Hours)',
    slug: 'audio_battery_hours',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 30',
    isFilterable: true,
    translations: { en: 'Battery Playtime (Hours)', ru: 'Автономность (часов)', zh: '续航时间 (小时)' },
  },
  {
    name: 'Waterproof Protection',
    slug: 'water_resistance_ip',
    type: AttributeType.SELECT,
    options: ['Not Rated', 'IPX4 Sweat/Splash Resistant', 'IPX5 Water Jet Resistant', 'IPX7 Submersible', 'IP68 Dust & Water Proof'],
    isFilterable: true,
    translations: { en: 'Water Protection (IP Rating)', ru: 'Степень влагозащиты', zh: '防水防尘等级' },
  },

  // --- Robot Vacuums ---
  {
    name: 'Suction Power (Pa)',
    slug: 'vacuum_suction_pa',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 6000',
    isFilterable: true,
    translations: { en: 'Suction Power (Pa)', ru: 'Сила всасывания (Па)', zh: '吸力大小 (Pa)' },
  },
  {
    name: 'Mopping System',
    slug: 'vacuum_mopping',
    type: AttributeType.SELECT,
    options: ['Vacuum Only', 'Static Damping Mop', 'Sonic Vibration Mop', 'Dual Spinning Pressured Mops'],
    isFilterable: true,
    translations: { en: 'Mopping Function', ru: 'Влажная уборка', zh: '拖地系统' },
  },
  {
    name: 'Navigation & Obstacle Avoidance',
    slug: 'vacuum_navigation',
    type: AttributeType.SELECT,
    options: ['LiDAR Laser Radar', '3D Structured Light + AI Vision', 'vSLAM Camera', 'Gyroscope Smart Grid'],
    isFilterable: true,
    translations: { en: 'Navigation Technology', ru: 'Система навигации', zh: '导航与避障' },
  },
  {
    name: 'Docking Station Features',
    slug: 'vacuum_dock_type',
    type: AttributeType.SELECT,
    options: ['Standard Charging Station', 'Auto-Empty Dust Station', 'All-in-One Auto Clean, Mop Wash & Hot Air Dry'],
    isFilterable: true,
    translations: { en: 'Base Station Features', ru: 'Функции станции очистки', zh: '基站自清洁功能' },
  },

  // --- Cameras ---
  {
    name: 'Sensor Format',
    slug: 'camera_sensor',
    type: AttributeType.SELECT,
    options: ['35mm Full Frame', 'APS-C Crop Sensor', 'Micro Four Thirds (MFT)', '1-Inch Compact Sensor'],
    isFilterable: true,
    translations: { en: 'Sensor Size', ru: 'Формат матрицы', zh: '传感器画幅' },
  },
  {
    name: 'Sensor Megapixels (MP)',
    slug: 'camera_megapixels',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 33',
    isFilterable: true,
    translations: { en: 'Resolution (MP)', ru: 'Разрешение (Мп)', zh: '有效像素 (MP)' },
  },
  {
    name: 'Max Video Recording',
    slug: 'camera_video_res',
    type: AttributeType.SELECT,
    options: ['8K 30fps Cinema', '4K 120fps High Frame Rate', '4K 60fps 10-Bit', 'Full HD 120fps Slow-Mo'],
    isFilterable: true,
    translations: { en: 'Max Video Spec', ru: 'Максимальное видео', zh: '最高视频录制规格' },
  },

  // --- Coffee Machines ---
  {
    name: 'Coffee Machine Type',
    slug: 'coffee_machine_type',
    type: AttributeType.SELECT,
    options: ['Automatic Bean-to-Cup', 'Espresso Semi-Automatic Pump', 'Capsule / Pod Machine', 'Drip Filter Coffee Maker', 'Cold Brew Dripper'],
    isFilterable: true,
    translations: { en: 'Machine Type', ru: 'Тип кофемашины', zh: '咖啡机类型' },
  },
  {
    name: 'Pump Pressure (Bar)',
    slug: 'coffee_pressure_bar',
    type: AttributeType.SELECT,
    options: ['15 Bar Standard', '19 Bar High Pressure', '20 Bar Commercial Italian Pump'],
    isFilterable: true,
    translations: { en: 'Pump Pressure', ru: 'Давление помпы (Бар)', zh: '泵浦压力 (Bar)' },
  },
  {
    name: 'Water Tank Volume (L)',
    slug: 'coffee_water_tank_l',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 1.8',
    isFilterable: true,
    translations: { en: 'Water Tank Volume', ru: 'Емкость резервуара (л)', zh: '水箱容量 (升)' },
  },

  // --- Cookware & Dining ---
  {
    name: 'Cookware Body Material',
    slug: 'cookware_material',
    type: AttributeType.SELECT,
    options: [
      'Tri-Ply 18/10 Stainless Steel',
      'Pre-Seasoned Cast Iron',
      'Enameled Cast Iron',
      'Hard-Anodized Aluminum',
      'Blue Carbon Steel',
      'Food-Grade Silicone',
      'High-Heat Borosilicate Glass'
    ],
    isFilterable: true,
    translations: { en: 'Cookware Material', ru: 'Материал посуды', zh: '锅具材质' },
  },
  {
    name: 'Induction Cooktop Safe',
    slug: 'induction_ready',
    type: AttributeType.CHECKBOX,
    helperText: 'Fully compatible with induction stovetops',
    isFilterable: true,
    translations: { en: 'Induction Compatible', ru: 'Для индукционных плит', zh: '兼容电磁炉' },
  },
  {
    name: 'Dishwasher Safe',
    slug: 'dishwasher_safe',
    type: AttributeType.CHECKBOX,
    helperText: 'Safe for automatic dishwasher cleaning',
    isFilterable: true,
    translations: { en: 'Dishwasher Safe', ru: 'Можно мыть в посудомойке', zh: '洗碗机安全' },
  },
  {
    name: 'Oven Safe Maximum Temp',
    slug: 'oven_safe_temp',
    type: AttributeType.SELECT,
    options: ['Not Oven Safe', 'Up to 180°C (350°F)', 'Up to 220°C (425°F)', 'Up to 260°C (500°F)', 'Up to 300°C (575°F)'],
    isFilterable: true,
    translations: { en: 'Oven Safe Temperature', ru: 'Максимальная температура духовки', zh: '烤箱最高耐温' },
  },
  {
    name: 'Diameter (cm)',
    slug: 'pan_diameter_cm',
    type: AttributeType.SELECT,
    options: ['16 cm', '20 cm', '24 cm', '26 cm', '28 cm', '30 cm', '32 cm'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Diameter (cm)', ru: 'Диаметр (см)', zh: '锅具口径 (cm)' },
  },
  {
    name: 'Non-Stick Coating Type',
    slug: 'pan_coating',
    type: AttributeType.SELECT,
    options: ['Diamond / Titanium Non-Stick', 'Mineral Ceramic Coating', 'Enamel Glazed', 'Uncoated Pure Steel', 'Natural Oil Seasoning'],
    isFilterable: true,
    translations: { en: 'Coating Technology', ru: 'Тип антипригарного покрытия', zh: '涂层工艺' },
  },
  {
    name: 'Pieces in Set',
    slug: 'cutlery_set_pieces',
    type: AttributeType.SELECT,
    options: ['Single Piece', '3-Piece Prep Set', '6-Piece Knife Block Set', '24-Piece Table Cutlery', '30-Piece Luxury Set', '72-Piece Banquet Canteen'],
    isFilterable: true,
    translations: { en: 'Pieces in Set', ru: 'Количество предметов', zh: '餐具套装件数' },
  },
  {
    name: 'Small Appliance Capacity',
    slug: 'kitchen_appliance_cap',
    type: AttributeType.SELECT,
    options: ['0.8 - 1.5 Liters (Single)', '2.0 - 4.0 Liters (Standard)', '5.0 - 6.5 Liters (Family)', '7.0 - 9.5 Liters (Dual Basket XL)', '10+ Liters (Commercial)'],
    isFilterable: true,
    translations: { en: 'Appliance Capacity', ru: 'Вместимость прибора', zh: '小家电容量规格' },
  },

  // --- Furniture & Living ---
  {
    name: 'Design Style',
    slug: 'furniture_style',
    type: AttributeType.SELECT,
    options: ['Modern Minimalist', 'Scandinavian Nordic', 'Japandi Harmony', 'Industrial Loft', 'Mid-Century Modern', 'Contemporary Italian', 'Classic European'],
    isFilterable: true,
    translations: { en: 'Design Style', ru: 'Стиль дизайна', zh: '设计风格' },
  },
  {
    name: 'Structural Frame Material',
    slug: 'furniture_frame_material',
    type: AttributeType.SELECT,
    options: [
      'Solid White Oak Wood',
      'Solid American Walnut',
      'Solid Beech & Ash',
      'Heavy-Duty Powder Coated Metal',
      'Engineered Wood / E0 MDF',
      'Natural Marble / Sintered Stone',
      'Weather-Resistant Aluminum'
    ],
    isFilterable: true,
    translations: { en: 'Primary Frame Material', ru: 'Материал каркаса', zh: '主体框架材质' },
  },
  {
    name: 'Upholstery Fabric',
    slug: 'upholstery_fabric',
    type: AttributeType.SELECT,
    options: ['Textured Warm Bouclé', 'Top-Grain Italian Leather', 'Soft Plush Velvet', 'Breathable Linen Weave', 'Stain-Resistant Microfiber', 'Chenille Fabric'],
    isFilterable: true,
    translations: { en: 'Upholstery Fabric', ru: 'Материал обивки', zh: '软包面料材质' },
  },
  {
    name: 'Seating Capacity',
    slug: 'sofa_seating_capacity',
    type: AttributeType.SELECT,
    options: ['1-Seater Armchair', '2-Seater Loveseat', '3-Seater Sofa', '4-Seater Large Sofa', 'L-Shaped Corner Sectional', 'Modular U-Shaped'],
    isFilterable: true,
    isVariant: true,
    translations: { en: 'Seating Capacity', ru: 'Количество мест', zh: '座位数' },
  },
  {
    name: 'Assembly Required',
    slug: 'assembly_required',
    type: AttributeType.CHECKBOX,
    helperText: 'Requires customer assembly upon delivery',
    isFilterable: true,
    translations: { en: 'Assembly Required', ru: 'Требуется сборка', zh: '需要自行组装' },
  },
  {
    name: 'Maximum Weight Capacity (kg)',
    slug: 'furniture_max_load_kg',
    type: AttributeType.NUMBER,
    placeholder: 'e.g. 150',
    isFilterable: true,
    translations: { en: 'Max Load Capacity (kg)', ru: 'Максимальная нагрузка (кг)', zh: '最大承重 (kg)' },
  },
  {
    name: 'Office Ergonomic Adjustments',
    slug: 'office_ergonomics',
    type: AttributeType.MULTISELECT,
    options: ['Adaptive Lumbar Support', '4D Adjustable Armrests', 'Pneumatic Height Gas Lift', 'Synchronized Recline & Tilt Lock', 'Seat Depth Sliding Adjustment'],
    isFilterable: true,
    translations: { en: 'Ergonomic Features', ru: 'Эргономические регулировки', zh: '人体工学功能' },
  },
  {
    name: 'Outdoor Weatherproof Rating',
    slug: 'outdoor_weather_rating',
    type: AttributeType.SELECT,
    options: ['All-Weather UV & Waterproof', 'Water-Repellent Fabric', 'Rustproof Powder-Coated Metal', 'Cover Recommended in Rain'],
    isFilterable: true,
    translations: { en: 'Weather Resistance', ru: 'Устойчивость к осадкам и УФ', zh: '户外耐候防护' },
  },

  // --- Beauty & Personal Care ---
  {
    name: 'Skin Type Suitability',
    slug: 'skin_type',
    type: AttributeType.MULTISELECT,
    options: ['All Skin Types', 'Sensitive Skin', 'Dry & Dehydrated', 'Oily & Blemish-Prone', 'Combination Skin', 'Mature & Aging Skin'],
    isFilterable: true,
    translations: { en: 'Skin Type', ru: 'Тип кожи', zh: '适用肤质' },
  },
  {
    name: 'Formulation / Texture',
    slug: 'cosmetic_formulation',
    type: AttributeType.SELECT,
    options: ['Concentrated Serum', 'Hydrating Cream', 'Refreshing Gel', 'Gentle Foam Cleanser', 'Lightweight Emulsion', 'Solid Balm', 'Sheet Mask'],
    isFilterable: true,
    translations: { en: 'Texture / Form', ru: 'Текстура продукта', zh: '产品剂型与质地' },
  },
  {
    name: 'Net Content / Volume',
    slug: 'net_content_volume',
    type: AttributeType.TEXT,
    placeholder: 'e.g., 50 ml / 1.7 fl. oz.',
    isFilterable: false,
    translations: { en: 'Volume / Net Weight', ru: 'Объем / Вес нетто', zh: '净含量 / 规格' },
  },
  {
    name: 'Key Active Ingredient',
    slug: 'active_ingredient',
    type: AttributeType.SELECT,
    options: [
      'Hyaluronic Acid Multi-Complex',
      'Encapsulated Retinol (Vitamin A)',
      'Niacinamide (Vitamin B3)',
      'Stable Vitamin C (Ascorbic Acid)',
      'Centella Asiatica (Cica)',
      'Ceramide Barrier Complex',
      'Salicylic Acid (BHA)',
      'Peptide & Collagen Complex'
    ],
    isFilterable: true,
    translations: { en: 'Key Active Ingredient', ru: 'Активный компонент', zh: '核心有效成分' },
  },
  {
    name: 'Cruelty-Free & Vegan',
    slug: 'cruelty_free',
    type: AttributeType.CHECKBOX,
    helperText: 'Not tested on animals, 100% vegan formula',
    isFilterable: true,
    translations: { en: 'Cruelty-Free & Vegan', ru: 'Веганский состав (Cruelty-Free)', zh: '纯素与零残忍认证' },
  },

  // --- Sports & Outdoors ---
  {
    name: 'Sport / Activity',
    slug: 'sport_activity',
    type: AttributeType.SELECT,
    options: [
      'Gym & Strength Training',
      'Running & Marathon',
      'Cycling & Mountain Biking',
      'Hiking & Trekking',
      'Yoga & Pilates',
      'Swimming & Water Sports',
      'Football & Basketball',
      'Camping & Survival'
    ],
    isFilterable: true,
    translations: { en: 'Sport Activity', ru: 'Вид спорта', zh: '运动类型' },
  },
  {
    name: 'Resistance / Tension Level',
    slug: 'fitness_resistance_level',
    type: AttributeType.SELECT,
    options: ['Light (5-15 lbs)', 'Medium (20-35 lbs)', 'Heavy (40-60 lbs)', 'Extra Heavy (70+ lbs)', 'Adjustable Set'],
    isFilterable: true,
    translations: { en: 'Resistance Level', ru: 'Уровень нагрузки', zh: '阻力 / 重量级别' },
  },

  // --- Home & Garden ---
  {
    name: 'Usage Environment',
    slug: 'garden_placement',
    type: AttributeType.SELECT,
    options: ['Indoor Living Space', 'Balcony & Terrace', 'Outdoor Garden & Lawn', 'Greenhouse', 'Indoor & Outdoor'],
    isFilterable: true,
    translations: { en: 'Environment Placement', ru: 'Зона применения', zh: '使用环境' },
  },
  {
    name: 'Power Source',
    slug: 'garden_power_source',
    type: AttributeType.SELECT,
    options: ['Solar Powered', 'Rechargeable Battery (Lithium)', 'Plug-in 220V Electric', 'Manual / Non-Electric'],
    isFilterable: true,
    translations: { en: 'Power Source', ru: 'Источник питания', zh: '供电方式' },
  },
  {
    name: 'Weather & Frost Proof',
    slug: 'garden_weatherproof',
    type: AttributeType.CHECKBOX,
    helperText: 'Weatherproof against rain, frost, and direct sun',
    isFilterable: true,
    translations: { en: 'Weatherproof', ru: 'Морозо- и влагостойкость', zh: '耐候防冻防雨' },
  },

  // --- Automotive ---
  {
    name: 'Vehicle Compatibility',
    slug: 'auto_vehicle_fit',
    type: AttributeType.SELECT,
    options: ['Universal Passenger Cars', 'SUV & Crossovers', 'Heavy Commercial Trucks & Vans', 'Motorcycles & Scooters'],
    isFilterable: true,
    translations: { en: 'Vehicle Compatibility', ru: 'Совместимость с авто', zh: '适用车型' },
  },
  {
    name: 'Installation Position',
    slug: 'auto_placement',
    type: AttributeType.SELECT,
    options: ['Dashboard & Windshield', 'Air Conditioning Vent', 'Headrest & Seat Back', 'Trunk Cargo Space', 'Under Hood / Battery', 'Exterior Body'],
    isFilterable: true,
    translations: { en: 'Installation Position', ru: 'Место установки', zh: '安装位置' },
  },
  {
    name: 'Automotive Voltage',
    slug: 'auto_voltage',
    type: AttributeType.SELECT,
    options: ['12V Car DC', '24V Truck DC', 'Universal 12V-24V DC', '5V USB Powered'],
    isFilterable: true,
    translations: { en: 'Vehicle Voltage', ru: 'Бортовое напряжение', zh: '车载工作电压' },
  },

  // --- Office Supplies ---
  {
    name: 'Paper / Item Format',
    slug: 'office_paper_format',
    type: AttributeType.SELECT,
    options: ['A4 (210 x 297 mm)', 'A3 (297 x 420 mm)', 'A5 (148 x 210 mm)', 'US Letter', 'Standard Desk Size'],
    isFilterable: true,
    translations: { en: 'Paper / Item Size', ru: 'Формат изделия', zh: '规格尺寸' },
  },
  {
    name: 'Package Quantity (Units)',
    slug: 'office_pack_qty',
    type: AttributeType.SELECT,
    options: ['1 Piece (Single)', 'Pack of 5', 'Pack of 10', 'Box of 50', 'Pack of 100', 'Ream of 500 Sheets'],
    isFilterable: true,
    translations: { en: 'Pack Quantity', ru: 'Количество в упаковке', zh: '包装规格' },
  },

  // --- Toys & Games ---
  {
    name: 'Recommended Age Group',
    slug: 'toys_age_group',
    type: AttributeType.SELECT,
    options: ['0 - 12 Months', '1 - 3 Years (Toddlers)', '4 - 7 Years (Preschool)', '8 - 12 Years (Kids)', '14+ Years (Teens & Adults)', 'All Ages Family'],
    isFilterable: true,
    translations: { en: 'Recommended Age', ru: 'Рекомендуемый возраст', zh: '适用年龄段' },
  },
  {
    name: 'Safety Standards & Certification',
    slug: 'toys_safety_cert',
    type: AttributeType.MULTISELECT,
    options: ['CE Certified', 'BPA-Free Food Grade', 'Non-Toxic Water Paint', 'EN71 European Safety', 'ASTM F963 Compliant'],
    isFilterable: true,
    translations: { en: 'Safety Standards', ru: 'Сертификаты безопасности', zh: '安全认证标准' },
  },
  {
    name: 'Number of Players',
    slug: 'games_players_count',
    type: AttributeType.SELECT,
    options: ['Single Player (Solo)', '2 Players (Versus)', '2 - 4 Players', '3 - 6 Players', 'Party Game (6+ Players)'],
    isFilterable: true,
    translations: { en: 'Number of Players', ru: 'Количество игроков', zh: '适合游玩人数' },
  },
]

// 2. Mapping of categories to attributes
const CATEGORY_ATTRIBUTE_MAPPINGS: CategoryMapping[] = [
  // --- CLOTHING FAMILY ---
  {
    categorySlugs: ['clothing', 'mens-clothing', 'womens-clothing', 'kids-clothing', 'tshirts-polos'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'size', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3, isRequired: true },
      { slug: 'material', displayOrder: 4, isRequired: true },
      { slug: 'clothing_gender', displayOrder: 5 },
      { slug: 'clothing_pattern', displayOrder: 6 },
      { slug: 'clothing_season', displayOrder: 7 },
      { slug: 'clothing_care', displayOrder: 8 },
      { slug: 'country_of_origin', displayOrder: 9 },
    ],
  },
  {
    categorySlugs: ['accessories-clothing'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'color', displayOrder: 2, isRequired: true },
      { slug: 'material', displayOrder: 3, isRequired: true },
      { slug: 'clothing_gender', displayOrder: 4 },
      { slug: 'dimensions', displayOrder: 5 },
      { slug: 'country_of_origin', displayOrder: 6 },
    ],
  },
  {
    categorySlugs: ['shoes'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'shoe_size_eu', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3, isRequired: true },
      { slug: 'shoe_upper_material', displayOrder: 4, isRequired: true },
      { slug: 'shoe_outsole_material', displayOrder: 5 },
      { slug: 'shoe_closure_type', displayOrder: 6 },
      { slug: 'clothing_gender', displayOrder: 7 },
      { slug: 'country_of_origin', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['bags-purses'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'bag_type', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3, isRequired: true },
      { slug: 'material', displayOrder: 4 },
      { slug: 'bag_capacity_liters', displayOrder: 5 },
      { slug: 'bag_laptop_fit', displayOrder: 6 },
      { slug: 'dimensions', displayOrder: 7 },
      { slug: 'country_of_origin', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['dresses-skirts'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'size', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3, isRequired: true },
      { slug: 'material', displayOrder: 4, isRequired: true },
      { slug: 'dress_length', displayOrder: 5, isRequired: true },
      { slug: 'dress_neckline', displayOrder: 6 },
      { slug: 'dress_sleeve_length', displayOrder: 7 },
      { slug: 'clothing_pattern', displayOrder: 8 },
      { slug: 'clothing_season', displayOrder: 9 },
      { slug: 'clothing_care', displayOrder: 10 },
    ],
  },

  // --- ELECTRONICS FAMILY ---
  {
    categorySlugs: ['electronics'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'color', displayOrder: 2 },
      { slug: 'warranty', displayOrder: 3, isRequired: true },
      { slug: 'voltage_spec', displayOrder: 4 },
      { slug: 'power_watts', displayOrder: 5 },
      { slug: 'wireless_connectivity', displayOrder: 6 },
      { slug: 'weight', displayOrder: 7 },
      { slug: 'country_of_origin', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['smartphones'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'color', displayOrder: 2, isRequired: true },
      { slug: 'phone_storage', displayOrder: 3, isRequired: true },
      { slug: 'phone_ram', displayOrder: 4, isRequired: true },
      { slug: 'phone_screen_size', displayOrder: 5 },
      { slug: 'phone_battery_mah', displayOrder: 6 },
      { slug: 'phone_camera_mp', displayOrder: 7 },
      { slug: 'phone_os', displayOrder: 8 },
      { slug: 'wireless_connectivity', displayOrder: 9 },
      { slug: 'warranty', displayOrder: 10 },
    ],
  },
  {
    categorySlugs: ['laptops', 'gaming-laptops', 'ultrabooks', 'tablets'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'laptop_cpu', displayOrder: 2, isRequired: true },
      { slug: 'laptop_ram', displayOrder: 3, isRequired: true },
      { slug: 'laptop_ssd', displayOrder: 4, isRequired: true },
      { slug: 'laptop_gpu', displayOrder: 5 },
      { slug: 'laptop_screen_size', displayOrder: 6 },
      { slug: 'display_refresh_rate', displayOrder: 7 },
      { slug: 'color', displayOrder: 8 },
      { slug: 'weight', displayOrder: 9 },
      { slug: 'warranty', displayOrder: 10 },
    ],
  },
  {
    categorySlugs: ['smart-tvs'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'tv_screen_size', displayOrder: 2, isRequired: true },
      { slug: 'tv_display_tech', displayOrder: 3, isRequired: true },
      { slug: 'tv_resolution', displayOrder: 4, isRequired: true },
      { slug: 'tv_smart_system', displayOrder: 5 },
      { slug: 'display_refresh_rate', displayOrder: 6 },
      { slug: 'wireless_connectivity', displayOrder: 7 },
      { slug: 'warranty', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['audio'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'audio_type', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3 },
      { slug: 'audio_anc', displayOrder: 4 },
      { slug: 'audio_battery_hours', displayOrder: 5 },
      { slug: 'water_resistance_ip', displayOrder: 6 },
      { slug: 'wireless_connectivity', displayOrder: 7 },
      { slug: 'warranty', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['robot-vacuums'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'vacuum_suction_pa', displayOrder: 2, isRequired: true },
      { slug: 'vacuum_mopping', displayOrder: 3 },
      { slug: 'vacuum_navigation', displayOrder: 4 },
      { slug: 'vacuum_dock_type', displayOrder: 5 },
      { slug: 'wireless_connectivity', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },
  {
    categorySlugs: ['cameras'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'camera_sensor', displayOrder: 2, isRequired: true },
      { slug: 'camera_megapixels', displayOrder: 3, isRequired: true },
      { slug: 'camera_video_res', displayOrder: 4 },
      { slug: 'wireless_connectivity', displayOrder: 5 },
      { slug: 'warranty', displayOrder: 6 },
    ],
  },
  {
    categorySlugs: ['coffee-machines'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'coffee_machine_type', displayOrder: 2, isRequired: true },
      { slug: 'coffee_pressure_bar', displayOrder: 3 },
      { slug: 'coffee_water_tank_l', displayOrder: 4 },
      { slug: 'power_watts', displayOrder: 5 },
      { slug: 'color', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },
  {
    categorySlugs: ['smart-appliances'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'power_watts', displayOrder: 2, isRequired: true },
      { slug: 'voltage_spec', displayOrder: 3 },
      { slug: 'dishwasher_safe', displayOrder: 4 },
      { slug: 'color', displayOrder: 5 },
      { slug: 'warranty', displayOrder: 6, isRequired: true },
    ],
  },

  // --- COOKWARE & DINING FAMILY ---
  {
    categorySlugs: ['cookware'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'cookware_material', displayOrder: 2, isRequired: true },
      { slug: 'induction_ready', displayOrder: 3 },
      { slug: 'dishwasher_safe', displayOrder: 4 },
      { slug: 'oven_safe_temp', displayOrder: 5 },
      { slug: 'color', displayOrder: 6 },
      { slug: 'country_of_origin', displayOrder: 7 },
      { slug: 'warranty', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['pots-pans', 'bakeware'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'pan_diameter_cm', displayOrder: 2, isRequired: true },
      { slug: 'cookware_material', displayOrder: 3, isRequired: true },
      { slug: 'pan_coating', displayOrder: 4 },
      { slug: 'induction_ready', displayOrder: 5 },
      { slug: 'dishwasher_safe', displayOrder: 6 },
      { slug: 'oven_safe_temp', displayOrder: 7 },
      { slug: 'color', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['cutlery'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'cutlery_set_pieces', displayOrder: 2, isRequired: true },
      { slug: 'cookware_material', displayOrder: 3, isRequired: true },
      { slug: 'dishwasher_safe', displayOrder: 4 },
      { slug: 'color', displayOrder: 5 },
      { slug: 'country_of_origin', displayOrder: 6 },
    ],
  },
  {
    categorySlugs: ['kitchen-utensils'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'cookware_material', displayOrder: 2, isRequired: true },
      { slug: 'dishwasher_safe', displayOrder: 3 },
      { slug: 'oven_safe_temp', displayOrder: 4 },
      { slug: 'color', displayOrder: 5 },
      { slug: 'country_of_origin', displayOrder: 6 },
    ],
  },
  {
    categorySlugs: ['small-appliances'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'kitchen_appliance_cap', displayOrder: 2, isRequired: true },
      { slug: 'power_watts', displayOrder: 3 },
      { slug: 'voltage_spec', displayOrder: 4 },
      { slug: 'dishwasher_safe', displayOrder: 5 },
      { slug: 'color', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },

  // --- FURNITURE FAMILY ---
  {
    categorySlugs: ['furniture', 'bedroom', 'dining-room'],
    attributes: [
      { slug: 'furniture_style', displayOrder: 1 },
      { slug: 'furniture_frame_material', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3, isRequired: true },
      { slug: 'dimensions', displayOrder: 4, isRequired: true },
      { slug: 'assembly_required', displayOrder: 5 },
      { slug: 'furniture_max_load_kg', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },
  {
    categorySlugs: ['living-room', 'sofas-couches'],
    attributes: [
      { slug: 'sofa_seating_capacity', displayOrder: 1, isRequired: true },
      { slug: 'upholstery_fabric', displayOrder: 2, isRequired: true },
      { slug: 'furniture_style', displayOrder: 3 },
      { slug: 'furniture_frame_material', displayOrder: 4 },
      { slug: 'color', displayOrder: 5, isRequired: true },
      { slug: 'dimensions', displayOrder: 6 },
      { slug: 'assembly_required', displayOrder: 7 },
      { slug: 'furniture_max_load_kg', displayOrder: 8 },
    ],
  },
  {
    categorySlugs: ['coffee-tables'],
    attributes: [
      { slug: 'furniture_style', displayOrder: 1 },
      { slug: 'furniture_frame_material', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3 },
      { slug: 'dimensions', displayOrder: 4, isRequired: true },
      { slug: 'assembly_required', displayOrder: 5 },
      { slug: 'furniture_max_load_kg', displayOrder: 6 },
    ],
  },
  {
    categorySlugs: ['office-furniture'],
    attributes: [
      { slug: 'office_ergonomics', displayOrder: 1 },
      { slug: 'furniture_frame_material', displayOrder: 2, isRequired: true },
      { slug: 'color', displayOrder: 3 },
      { slug: 'furniture_max_load_kg', displayOrder: 4 },
      { slug: 'assembly_required', displayOrder: 5 },
      { slug: 'dimensions', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },
  {
    categorySlugs: ['outdoor-furniture'],
    attributes: [
      { slug: 'outdoor_weather_rating', displayOrder: 1, isRequired: true },
      { slug: 'furniture_frame_material', displayOrder: 2, isRequired: true },
      { slug: 'furniture_style', displayOrder: 3 },
      { slug: 'color', displayOrder: 4 },
      { slug: 'dimensions', displayOrder: 5 },
      { slug: 'assembly_required', displayOrder: 6 },
      { slug: 'warranty', displayOrder: 7 },
    ],
  },

  // --- BEAUTY & PERSONAL CARE ---
  {
    categorySlugs: ['beauty-personal-care'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'skin_type', displayOrder: 2, isRequired: true },
      { slug: 'cosmetic_formulation', displayOrder: 3, isRequired: true },
      { slug: 'net_content_volume', displayOrder: 4, isRequired: true },
      { slug: 'active_ingredient', displayOrder: 5 },
      { slug: 'cruelty_free', displayOrder: 6 },
      { slug: 'country_of_origin', displayOrder: 7 },
    ],
  },

  // --- SPORTS & OUTDOORS ---
  {
    categorySlugs: ['sports-outdoors'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'sport_activity', displayOrder: 2, isRequired: true },
      { slug: 'size', displayOrder: 3 },
      { slug: 'color', displayOrder: 4 },
      { slug: 'fitness_resistance_level', displayOrder: 5 },
      { slug: 'weight', displayOrder: 6 },
      { slug: 'water_resistance_ip', displayOrder: 7 },
    ],
  },

  // --- HOME & GARDEN ---
  {
    categorySlugs: ['home-garden'],
    attributes: [
      { slug: 'garden_placement', displayOrder: 1, isRequired: true },
      { slug: 'garden_power_source', displayOrder: 2 },
      { slug: 'garden_weatherproof', displayOrder: 3 },
      { slug: 'color', displayOrder: 4 },
      { slug: 'material', displayOrder: 5 },
      { slug: 'dimensions', displayOrder: 6 },
    ],
  },

  // --- AUTOMOTIVE ---
  {
    categorySlugs: ['automotive'],
    attributes: [
      { slug: 'brand', displayOrder: 1, isRequired: true },
      { slug: 'auto_vehicle_fit', displayOrder: 2, isRequired: true },
      { slug: 'auto_placement', displayOrder: 3, isRequired: true },
      { slug: 'auto_voltage', displayOrder: 4 },
      { slug: 'warranty', displayOrder: 5 },
      { slug: 'country_of_origin', displayOrder: 6 },
    ],
  },

  // --- OFFICE SUPPLIES ---
  {
    categorySlugs: ['office-supplies'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'office_paper_format', displayOrder: 2 },
      { slug: 'office_pack_qty', displayOrder: 3, isRequired: true },
      { slug: 'color', displayOrder: 4 },
      { slug: 'country_of_origin', displayOrder: 5 },
    ],
  },

  // --- TOYS & GAMES ---
  {
    categorySlugs: ['toys-games'],
    attributes: [
      { slug: 'brand', displayOrder: 1 },
      { slug: 'toys_age_group', displayOrder: 2, isRequired: true },
      { slug: 'toys_safety_cert', displayOrder: 3, isRequired: true },
      { slug: 'games_players_count', displayOrder: 4 },
      { slug: 'material', displayOrder: 5 },
      { slug: 'country_of_origin', displayOrder: 6 },
    ],
  },
]

async function main() {
  console.log('🚀 Starting Category Attributes Seeding...')

  // Step 1: Query all categories from DB
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
  })
  const categoryBySlug = new Map(allCategories.map(c => [c.slug, c]))
  console.log(`📌 Found ${allCategories.length} categories in database.`)

  // Step 2: Create or update master attributes
  console.log(`\n📦 Upserting ${MASTER_ATTRIBUTES.length} master attributes...`)
  const attributeBySlug = new Map<string, any>()

  for (const attr of MASTER_ATTRIBUTES) {
    const existing = await prisma.attribute.findUnique({
      where: { slug: attr.slug },
    })

    let attributeRecord
    if (existing) {
      attributeRecord = await prisma.attribute.update({
        where: { id: existing.id },
        data: {
          name: attr.name,
          type: attr.type,
          options: attr.options ?? (existing.options as any) ?? null,
          colorOptions: attr.colorOptions ?? (existing.colorOptions as any) ?? null,
          placeholder: attr.placeholder ?? existing.placeholder,
          helperText: attr.helperText ?? existing.helperText,
          isFilterable: attr.isFilterable ?? existing.isFilterable,
          isVariant: attr.isVariant ?? existing.isVariant,
          isActive: true,
        },
      })
    } else {
      attributeRecord = await prisma.attribute.create({
        data: {
          name: attr.name,
          slug: attr.slug,
          type: attr.type,
          options: attr.options ?? null,
          colorOptions: attr.colorOptions ?? null,
          placeholder: attr.placeholder ?? null,
          helperText: attr.helperText ?? null,
          isRequired: attr.isRequired ?? false,
          isFilterable: attr.isFilterable ?? true,
          isVariant: attr.isVariant ?? false,
          isActive: true,
        },
      })
    }

    // Upsert translations (en, ru, zh)
    if (attr.translations) {
      const locales: Array<'en' | 'ru' | 'zh'> = ['en', 'ru', 'zh']
      for (const loc of locales) {
        const trName = attr.translations[loc] || attr.name
        await prisma.attributeTranslation.upsert({
          where: {
            attributeId_locale: {
              attributeId: attributeRecord.id,
              locale: loc,
            },
          },
          update: { name: trName },
          create: {
            attributeId: attributeRecord.id,
            locale: loc,
            name: trName,
          },
        })
      }
    }

    attributeBySlug.set(attr.slug, attributeRecord)
  }
  console.log(`✅ Master attributes ready (${attributeBySlug.size} total).`)

  // Step 3: Link attributes to categories via CategoryAttribute
  console.log('\n🔗 Linking attributes to categories according to database tree...')
  let totalLinksCreated = 0

  for (const mapping of CATEGORY_ATTRIBUTE_MAPPINGS) {
    for (const catSlug of mapping.categorySlugs) {
      const category = categoryBySlug.get(catSlug)
      if (!category) {
        console.warn(`⚠️ Warning: Category slug '${catSlug}' not found in database. Skipping...`)
        continue
      }

      for (const item of mapping.attributes) {
        const attribute = attributeBySlug.get(item.slug)
        if (!attribute) {
          console.warn(`⚠️ Warning: Attribute slug '${item.slug}' not found. Skipping...`)
          continue
        }

        await prisma.categoryAttribute.upsert({
          where: {
            categoryId_attributeId: {
              categoryId: category.id,
              attributeId: attribute.id,
            },
          },
          update: {
            displayOrder: item.displayOrder,
            isRequired: item.isRequired ?? false,
            isVisible: true,
          },
          create: {
            categoryId: category.id,
            attributeId: attribute.id,
            displayOrder: item.displayOrder,
            isRequired: item.isRequired ?? false,
            isVisible: true,
          },
        })
        totalLinksCreated++
      }
    }
  }

  console.log(`\n🎉 Successfully established category attribute relationships!`)
  console.log(`📊 Total Category-Attribute links processed: ${totalLinksCreated}`)

  // Step 4: Verify and print summary
  const summary = await prisma.category.findMany({
    select: {
      name: true,
      slug: true,
      parent: { select: { name: true } },
      _count: { select: { attributes: true } },
      attributes: {
        select: {
          displayOrder: true,
          isRequired: true,
          attribute: { select: { name: true, type: true, slug: true } },
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  })

  console.log('\n=============================================')
  console.log('📋 CURRENT CATEGORIES & THEIR ATTRIBUTES')
  console.log('=============================================')
  for (const cat of summary) {
    const parentTag = cat.parent ? ` (Sub of ${cat.parent.name})` : ' [PARENT]'
    console.log(`\n📁 ${cat.name}${parentTag} [${cat._count.attributes} attributes]:`)
    cat.attributes.forEach((ca, idx) => {
      const req = ca.isRequired ? ' *REQUIRED*' : ''
      console.log(`   ${idx + 1}. ${ca.attribute.name} (${ca.attribute.type}, slug: ${ca.attribute.slug})${req}`)
    })
  }
}

main()
  .catch((err) => {
    console.error('❌ Error during attribute seeding:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
