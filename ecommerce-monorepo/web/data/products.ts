export interface ProductItem {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  image: string
  badge?: 'SALE' | 'NEW' | 'HIT'
  inStock?: boolean
  description?: string
  specs?: Record<string, string>
}

export const PRODUCTS_DATA: ProductItem[] = [
  // 1. 🔥 Хиты продаж (4 products)
  {
    id: 'hit-1',
    name: 'Apple iPhone 16 Pro Max 256GB Desert Titanium',
    category: 'smartphones',
    price: 139990,
    oldPrice: 154990,
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Флагманский смартфон с титановым корпусом и мощным процессором A18 Pro.',
    specs: { 'Экран': '6.9" OLED 120Hz', 'Память': '256 ГБ', 'Камера': '48+48+12 Мп' }
  },
  {
    id: 'hit-2',
    name: 'Ноутбук Apple MacBook Pro 14" M4 Pro 24GB/512GB Space Black',
    category: 'laptops',
    price: 249990,
    oldPrice: 269990,
    rating: 5.0,
    reviews: 86,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Новое поколение чипов M4 Pro для самых требовательных профессиональных задач.',
    specs: { 'Процессор': 'Apple M4 Pro', 'ОЗУ': '24 ГБ', 'SSD': '512 ГБ' }
  },
  {
    id: 'hit-3',
    name: 'Беспроводные наушники Sony WH-1000XM5 Black',
    category: 'audio',
    price: 34990,
    oldPrice: 39990,
    rating: 4.8,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Лидер в активном шумоподавлении с непревзойденным качеством Hi-Res звучания.',
    specs: { 'Автономность': 'до 30 ч', 'Шумоподавление': 'ANC Auto', 'Вес': '250 г' }
  },
  {
    id: 'hit-4',
    name: 'Телевизор LG OLED65C3RLA 65" 4K Smart TV',
    category: 'tv',
    price: 189990,
    oldPrice: 219990,
    rating: 4.9,
    reviews: 97,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Самоподсвечивающиеся пиксели OLED evo с процессором a9 Gen6 4K.',
    specs: { 'Диагональ': '65"', 'Частота': '120 Гц', 'Звук': 'Dolby Atmos 40W' }
  },

  // 2. 📱 Смартфоны (4 products)
  {
    id: 'phone-1',
    name: 'Samsung Galaxy S24 Ultra 12/512GB Titanium Gray',
    category: 'smartphones',
    price: 114990,
    oldPrice: 129990,
    rating: 4.9,
    reviews: 178,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Galaxy AI в действии: титановый корпус, зум 100x и электронное перо S Pen.',
    specs: { 'Экран': '6.8" Dynamic AMOLED 2X', 'Память': '512 ГБ', 'Камера': '200 Мп' }
  },
  {
    id: 'phone-2',
    name: 'Xiaomi 14 Ultra 16/512GB Black Leica Optical',
    category: 'smartphones',
    price: 99990,
    oldPrice: 119990,
    rating: 4.8,
    reviews: 64,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Профессиональная квадрокамера Leica с переменной диафрагмой.',
    specs: { 'Экран': '6.73" 120Hz AMOLED', 'Процессор': 'Snapdragon 8 Gen 3', 'Камера': '4x50 Мп' }
  },
  {
    id: 'phone-3',
    name: 'Google Pixel 9 Pro 16/256GB Obsidian',
    category: 'smartphones',
    price: 89990,
    oldPrice: 99990,
    rating: 4.7,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Чистый Android и лучшие в классе вычислительные алгоритмы фотографии Google Tensor G4.',
    specs: { 'Экран': '6.3" Super Actua', 'Процессор': 'Google Tensor G4', 'Память': '256 ГБ' }
  },
  {
    id: 'phone-4',
    name: 'Смартфон realme 12 Pro+ 5G 12/512GB Submarine Blue',
    category: 'smartphones',
    price: 36990,
    oldPrice: 44990,
    rating: 4.7,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Премиальный дизайн от часового мастера Оливье Савео с перископическим телеобъективом.',
    specs: { 'Экран': '6.7" 120Hz Curved', 'Камера': '64 Мп Перископ', 'Зарядка': '67W SUPERVOOC' }
  },

  // 3. 💻 Ноутбуки (4 products)
  {
    id: 'laptop-1',
    name: 'Игровой ноутбук ASUS ROG Strix SCAR 16 (i9-14900HX / RTX 4080 / 32GB)',
    category: 'laptops',
    price: 299990,
    oldPrice: 329990,
    rating: 4.9,
    reviews: 42,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Бескомпромиссная игровая мощь с экраном Nebula HDR Mini LED 240 Гц.',
    specs: { 'Экран': '16" 2.5K Mini LED 240Hz', 'Видеокарта': 'RTX 4080 12GB', 'ОЗУ': '32 ГБ DDR5' }
  },
  {
    id: 'laptop-2',
    name: 'Ноутбук Apple MacBook Air 15" M3 16GB/512GB Starlight',
    category: 'laptops',
    price: 154990,
    oldPrice: 169990,
    rating: 5.0,
    reviews: 129,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Невероятно тонкий и легкий ноутбук с большим экраном Liquid Retina 15.3" и автономностью до 18 часов.',
    specs: { 'Чип': 'Apple M3 8-core', 'Память': '16 ГБ / 512 ГБ', 'Батарея': 'до 18 ч' }
  },
  {
    id: 'laptop-3',
    name: 'Ультрабук Lenovo ThinkPad X1 Carbon Gen 12 (Core Ultra 7 / 32GB / 1TB)',
    category: 'laptops',
    price: 219990,
    oldPrice: 239990,
    rating: 4.8,
    reviews: 31,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Эталон корпоративного ультрабука в углепластиковом корпусе весом всего 1.09 кг.',
    specs: { 'Вес': '1.09 кг', 'Процессор': 'Intel Core Ultra 7 155H', 'Экран': '14" 2.8K OLED' }
  },
  {
    id: 'laptop-4',
    name: 'Ноутбук HONOR MagicBook Pro 16 (Ultra 5 / RTX 4060 / 24GB)',
    category: 'laptops',
    price: 129990,
    oldPrice: 144990,
    rating: 4.7,
    reviews: 48,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Универсальная рабочая станция с экраном 3K 165 Гц и алгоритмами AI Smart Office.',
    specs: { 'Экран': '16" 3K 165Hz', 'Видеокарта': 'RTX 4060 8GB', 'ОЗУ': '24 ГБ' }
  },

  // 4. 📺 Телевизоры (4 products)
  {
    id: 'tv-1',
    name: 'Телевизор Samsung QE65QN90DAUXRU 65" Neo QLED 4K 144Hz',
    category: 'tv',
    price: 199990,
    oldPrice: 229990,
    rating: 4.9,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Quantum Mini LED подсветка с нейронным процессором NQ4 AI Gen2.',
    specs: { 'Диагональ': '65"', 'Частота': '144 Гц', 'Яркость': 'Neo Quantum HDR+' }
  },
  {
    id: 'tv-2',
    name: 'Телевизор Sony XR-55A80L 55" 4K Cognitive Processor XR',
    category: 'tv',
    price: 169990,
    oldPrice: 189990,
    rating: 4.8,
    reviews: 39,
    image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'OLED-панель с когнитивным процессором XR и технологией Acoustic Surface Audio+.',
    specs: { 'Диагональ': '55"', 'Матрица': 'OLED', 'Аудио': 'Звук из экрана Acoustic Surface' }
  },
  {
    id: 'tv-3',
    name: 'Телевизор TCL 75C845 75" 4K Mini LED 144Hz Google TV',
    category: 'tv',
    price: 139990,
    oldPrice: 159990,
    rating: 4.7,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1577975882846-431adc8c2009?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Огромный 75-дюймовый Mini LED экран с яркостью до 2000 нит и акустикой Onkyo.',
    specs: { 'Диагональ': '75"', 'Яркость': '2000 нит', 'Акустика': 'Onkyo 2.1 60W' }
  },
  {
    id: 'tv-4',
    name: 'Телевизор Xiaomi TV S Pro 65" Mini LED 144Hz HyperOS',
    category: 'tv',
    price: 79990,
    oldPrice: 89990,
    rating: 4.6,
    reviews: 92,
    image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Флагманский Mini LED по рекордной цене с 896 зонами локального затемнения.',
    specs: { 'Диагональ': '65"', 'Зоны подсветки': '896 зон', 'ОС': 'Xiaomi HyperOS' }
  },

  // 5. 🏠 Бытовая техника (4 products)
  {
    id: 'home-1',
    name: 'Робот-пылесос Roborock S8 Pro Ultra со станцией самоочистки',
    category: 'home-appliances',
    price: 94990,
    oldPrice: 109990,
    rating: 4.9,
    reviews: 184,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Полный автомат: стирка и сушка салфеток горячим воздухом, самоочистка пылесборника.',
    specs: { 'Всасывание': '6000 Па', 'Навигация': 'PreciSense LiDAR + 3D', 'Уборка': 'Сухая и влажная' }
  },
  {
    id: 'home-2',
    name: 'Автоматическая кофемашина DeLonghi PrimaDonna Soul ECAM610.75.MB',
    category: 'home-appliances',
    price: 119990,
    oldPrice: 139990,
    rating: 4.9,
    reviews: 73,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Bean Adapt Technology настраивает помол и температуру под ваш сорт кофейных зерен.',
    specs: { 'Дисплей': '4.3" TFT цветной', 'Давление': '19 бар', 'Рецепты': '21 программа' }
  },
  {
    id: 'home-3',
    name: 'Умный фен Dyson Supersonic HD08 Nickel/Copper',
    category: 'home-appliances',
    price: 42990,
    oldPrice: 47990,
    rating: 4.9,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Интеллектуальный контроль температуры для сохранения естественного блеска волос.',
    specs: { 'Мощность': '1600 Вт', 'Насадки': '5 насадок в комплекте', 'Двигатель': 'Dyson V9' }
  },
  {
    id: 'home-4',
    name: 'Климатический комплекс Philips AC2729/10 2-в-1 Очиститель и увлажнитель',
    category: 'home-appliances',
    price: 34990,
    oldPrice: 39990,
    rating: 4.8,
    reviews: 65,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Удаляет 99.97% аллергенов и увлажняет воздух по гигиеничной технологии NanoCloud.',
    specs: { 'Площадь': 'до 65 м²', 'Фильтрация': 'HEPA NanoProtect', 'Увлажнение': '500 мл/ч' }
  },

  // 6. 🎧 Аудиотехника (4 products)
  {
    id: 'audio-1',
    name: 'Беспроводные наушники Apple AirPods Pro 2 с кейсом MagSafe USB-C',
    category: 'audio',
    price: 22990,
    oldPrice: 25990,
    rating: 4.9,
    reviews: 420,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Чип H2 с адаптивным шумоподавлением и персонализированным пространственным аудио.',
    specs: { 'Разъем': 'USB-C', 'Шумоподавление': 'Active ANC 2x', 'Автономность': 'до 30 ч' }
  },
  {
    id: 'audio-2',
    name: 'Портативная колонка Marshall Stanmore III Bluetooth Black',
    category: 'audio',
    price: 38990,
    oldPrice: 43990,
    rating: 4.8,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Культовый винтажный дизайн с глубоким стереозвучанием мощностью 80 Вт.',
    specs: { 'Мощность': '80 Вт RMS', 'Подключение': 'Bluetooth 5.2 / RCA / AUX', 'Вес': '4.25 кг' }
  },
  {
    id: 'audio-3',
    name: 'Беспроводные наушники Sennheiser Momentum 4 Wireless Denim',
    category: 'audio',
    price: 29990,
    oldPrice: 34990,
    rating: 4.8,
    reviews: 58,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Рекордные 60 часов автономной работы с аудиофильским 42-мм излучателем.',
    specs: { 'Автономность': 'до 60 часов', 'Драйвер': '42 мм', 'Кодеки': 'aptX Adaptive / AAC' }
  },
  {
    id: 'audio-4',
    name: 'Саундбар с сабвуфером JBL Bar 500 Pro Dolby Atmos',
    category: 'audio',
    price: 49990,
    oldPrice: 56990,
    rating: 4.7,
    reviews: 43,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Объемный кинотеатральный звук 5.1 с беспроводным 10-дюймовым сабвуфером 590 Вт.',
    specs: { 'Мощность': '590 Вт', 'Формат': '5.1 Dolby Atmos', 'Сабвуфер': '10" беспроводной' }
  },

  // 7. 🎮 Игровая зона (4 products)
  {
    id: 'game-1',
    name: 'Игровая консоль Sony PlayStation 5 Pro 2TB White',
    category: 'gaming',
    price: 89990,
    oldPrice: 99990,
    rating: 5.0,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'PlayStation Spectral Super Resolution (PSSR), продвинутый Ray Tracing и 2 ТБ SSD.',
    specs: { 'SSD': '2 ТБ', 'Разрешение': 'до 8K / 120 FPS', 'Технология': 'PSSR AI Upscaling' }
  },
  {
    id: 'game-2',
    name: 'Портативная консоль Valve Steam Deck OLED 512GB',
    category: 'gaming',
    price: 64990,
    oldPrice: 72999,
    rating: 4.9,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Яркий 7.4" HDR OLED экран 90 Гц, увеличенная батарея и тихая система охлаждения.',
    specs: { 'Экран': '7.4" HDR OLED 90Hz', 'SSD': '512 ГБ NVMe', 'Автономность': '3-12 часов' }
  },
  {
    id: 'game-3',
    name: 'Беспроводной геймпад Xbox Elite Wireless Controller Series 2 Black',
    category: 'gaming',
    price: 15990,
    oldPrice: 18990,
    rating: 4.7,
    reviews: 104,
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Регулируемое натяжение стиков, сменные лепестки и до 40 часов игры без подзарядки.',
    specs: { 'Кастомизация': 'Сменные стики и лепестки', 'Батарея': 'до 40 часов', 'Корпус': 'Прорезиненные ручки' }
  },
  {
    id: 'game-4',
    name: 'Игровой руль Logitech G29 Driving Force с педалями',
    category: 'gaming',
    price: 27990,
    oldPrice: 32990,
    rating: 4.8,
    reviews: 95,
    image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Двухмоторная силовая обратная связь, угол поворота 900 градусов и кожаная оплетка.',
    specs: { 'Угол поворота': '900 градусов', 'Педали': '3 педали со сцеплением', 'Совместимость': 'PS5 / PS4 / PC' }
  },

  // 8. ⌚ Умные часы и браслеты (4 products)
  {
    id: 'watch-1',
    name: 'Умные часы Apple Watch Ultra 2 49mm Titanium Black Ocean Band',
    category: 'smart-watches',
    price: 86990,
    oldPrice: 94990,
    rating: 4.9,
    reviews: 82,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Самый прочный титановый корпус, экран 3000 нит и точнейший двухчастотный GPS.',
    specs: { 'Корпус': 'Титан 49 мм', 'Яркость': '3000 нит', 'Защита': 'WR100 для дайвинга' }
  },
  {
    id: 'watch-2',
    name: 'Умные часы Samsung Galaxy Watch Ultra 47mm Titanium Gray',
    category: 'smart-watches',
    price: 54990,
    oldPrice: 62990,
    rating: 4.8,
    reviews: 49,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Защита военного стандарта MIL-STD-810H, датчик BioActive и выносливость до 100 часов.',
    specs: { 'Корпус': 'Титан 47 мм', 'Процессор': 'Exynos W1000 3nm', 'Стекло': 'Сапфир' }
  },
  {
    id: 'watch-3',
    name: 'Спортивные часы Garmin Fenix 7 Pro Sapphire Solar Slate Gray',
    category: 'smart-watches',
    price: 79990,
    oldPrice: 89990,
    rating: 4.9,
    reviews: 63,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Подзарядка от солнечной энергии Power Sapphire, фонарик и подробные топографические карты.',
    specs: { 'Батарея': 'до 22 дней с солнцем', 'Стекло': 'Сапфировое с Solar', 'Навигация': 'Multi-GNSS' }
  },
  {
    id: 'watch-4',
    name: 'Фитнес-браслет Xiaomi Smart Band 9 Midnight Black',
    category: 'smart-watches',
    price: 3990,
    oldPrice: 4990,
    rating: 4.8,
    reviews: 340,
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Яркий AMOLED 1.62" с частотой 60 Гц, металлический корпус и до 21 дня работы.',
    specs: { 'Экран': '1.62" AMOLED 60Hz', 'Автономность': 'до 21 дня', 'Вес': '15.8 г' }
  },

  // 9. 📷 Фото и видео (4 products)
  {
    id: 'photo-1',
    name: 'Фотоаппарат Sony Alpha 7 IV Body Black',
    category: 'photo-video',
    price: 219990,
    oldPrice: 239990,
    rating: 4.9,
    reviews: 74,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Полнокадровая матрица 33 Мп Exmor R, видео 4K 60p и автофокус с распознаванием глаз в реальном времени.',
    specs: { 'Матрица': '33 Мп Full-Frame', 'Видео': '4K 60p 10-bit 4:2:2', 'Стабилизация': '5-осевая IBIS' }
  },
  {
    id: 'photo-2',
    name: 'Квадрокоптер DJI Mini 4 Pro Fly More Combo (DJI RC 2)',
    category: 'photo-video',
    price: 104990,
    oldPrice: 116990,
    rating: 5.0,
    reviews: 88,
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Вес менее 249 грамм, всенаправленное обнаружение препятствий и съемка вертикального 4K 60fps HDR.',
    specs: { 'Вес': '< 249 г', 'Видео': '4K 60fps HDR', 'Дальность': 'до 20 км (O4)' }
  },
  {
    id: 'photo-3',
    name: 'Экшн-камера GoPro HERO12 Black Edition',
    category: 'photo-video',
    price: 36990,
    oldPrice: 42990,
    rating: 4.8,
    reviews: 130,
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Съемка 5.3K 60fps, стабилизация HyperSmooth 6.0 и беспроводное аудио через наушники Bluetooth.',
    specs: { 'Видео': '5.3K 60p / 4K 120p', 'Стабилизация': 'HyperSmooth 6.0', 'Защита': 'Водонепроницаемость до 10 м' }
  },
  {
    id: 'photo-4',
    name: 'Стедикам DJI Osmo Pocket 3 Creator Combo',
    category: 'photo-video',
    price: 69990,
    oldPrice: 77990,
    rating: 4.9,
    reviews: 105,
    image: 'https://images.unsplash.com/photo-1502982720700-bfff97f2da6d?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Карманная камера с 1-дюймовой CMOS матрицей и поворотным 2-дюймовым OLED-экраном.',
    specs: { 'Матрица': '1" CMOS', 'Экран': '2" OLED поворотный', 'Аудио': 'DJI Mic 2 в комплекте' }
  },

  // 10. ✨ Новинки — только поступили (6 products)
  {
    id: 'new-1',
    name: 'Беспроводные наушники Bose QuietComfort Ultra Headphones Black',
    category: 'audio',
    price: 43990,
    oldPrice: 48990,
    rating: 4.9,
    reviews: 29,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Пространственный звук Bose Immersive Audio и ведущее в мире шумоподавление.',
    specs: { 'Технология': 'Bose Immersive Audio', 'Автономность': 'до 24 часов', 'Bluetooth': '5.3' }
  },
  {
    id: 'new-2',
    name: 'Планшет Apple iPad Air 13" M2 128GB Wi-Fi Space Gray',
    category: 'laptops',
    price: 89990,
    oldPrice: 97990,
    rating: 4.8,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Огромный дисплей Liquid Retina 13 дюймов и производительность процессора M2.',
    specs: { 'Экран': '13" Liquid Retina', 'Процессор': 'Apple M2', 'Поддержка': 'Apple Pencil Pro' }
  },
  {
    id: 'new-3',
    name: 'Смартфон OnePlus 12 16/512GB Silky Black',
    category: 'smartphones',
    price: 74990,
    oldPrice: 82990,
    rating: 4.8,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Камеры 4-го поколения Hasselblad и рекордный дисплей 2K ProXDR с яркостью 4500 нит.',
    specs: { 'Экран': '6.82" 2K 120Hz', 'Зарядка': '100W SUPERVOOC', 'Батарея': '5400 мАч' }
  },
  {
    id: 'new-4',
    name: 'Умная колонка Яндекс Станция Дуо Макс с Алисой и экраном',
    category: 'audio',
    price: 41990,
    oldPrice: 44990,
    rating: 4.9,
    reviews: 118,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Поворотный сенсорный Full HD экран 10.5", мощный звук 60 Вт и Zigbee хаб умного дома.',
    specs: { 'Экран': '10.5" Full HD поворотный', 'Мощность': '60 Вт', 'Протокол': 'Zigbee 3.0 built-in' }
  },
  {
    id: 'new-5',
    name: 'Электросамокат Ninebot KickScooter Max G2',
    category: 'gaming',
    price: 63990,
    oldPrice: 71990,
    rating: 4.8,
    reviews: 83,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Двойная гидравлическая подвеска, запас хода до 70 км и поддержка Apple Find My.',
    specs: { 'Запас хода': 'до 70 км', 'Скорость': 'до 32 км/ч', 'Мощность': 'макс. 900 Вт' }
  },
  {
    id: 'new-6',
    name: 'Монитор 34" Samsung Odyssey OLED G8 (3440x1440, 175Hz)',
    category: 'laptops',
    price: 99990,
    oldPrice: 114990,
    rating: 4.9,
    reviews: 52,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Изогнутый квантовый OLED дисплей с откликом 0.03 мс и металлическим премиум-корпусом.',
    specs: { 'Матрица': 'QD-OLED 175Hz', 'Отклик': '0.03 мс (GtG)', 'Изгиб': '1800R' }
  },

  // 11. 🔔 Предзаказы (3 products)
  {
    id: 'pre-1',
    name: 'Гарнитура смешанной реальности Apple Vision Pro 512GB',
    category: 'gaming',
    price: 389990,
    oldPrice: 429990,
    rating: 5.0,
    reviews: 14,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Революционный пространственный компьютер, плавно объединяющий цифровой контент с физическим миром.',
    specs: { 'Дисплеи': '2x Micro-OLED 23 млн пикс', 'Чипы': 'M2 + R1 dual-chip', 'Управление': 'Глаза, руки, голос' }
  },
  {
    id: 'pre-2',
    name: 'Смартфон Samsung Galaxy Z Fold6 12/512GB Silver Shadow',
    category: 'smartphones',
    price: 179990,
    oldPrice: 199990,
    rating: 4.9,
    reviews: 21,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Самый тонкий и легкий Fold в истории Galaxy с интеллектуальными функциями Galaxy AI.',
    specs: { 'Экран': '7.6" Dynamic AMOLED 2X', 'Шарнир': 'Dual Rail FlexHinge', 'Вес': '239 г' }
  },
  {
    id: 'pre-3',
    name: 'Игровая портативная консоль ASUS ROG Ally X 24GB/1TB Black',
    category: 'gaming',
    price: 89990,
    oldPrice: 99990,
    rating: 4.8,
    reviews: 36,
    image: 'https://images.unsplash.com/photo-1612287233207-68bcf8aa07e0?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Удвоенный аккумулятор 80 Вт·ч, 24 ГБ оперативной памяти LPDDR5X-7500 и 1 ТБ SSD.',
    specs: { 'Аккумулятор': '80 Вт·ч (2x емкость)', 'ОЗУ': '24 ГБ 7500 МГц', 'Процессор': 'AMD Ryzen Z1 Extreme' }
  }
]

export const BRANDS = [
  { id: 'apple', name: 'Apple', logo: '' },
  { id: 'samsung', name: 'Samsung', logo: 'SAMSUNG' },
  { id: 'sony', name: 'Sony', logo: 'SONY' },
  { id: 'lg', name: 'LG', logo: 'LG' },
  { id: 'xiaomi', name: 'Xiaomi', logo: 'XIAOMI' },
  { id: 'asus', name: 'ASUS ROG', logo: 'ASUS' },
  { id: 'dyson', name: 'Dyson', logo: 'dyson' },
  { id: 'jbl', name: 'JBL', logo: 'JBL' },
  { id: 'dji', name: 'DJI', logo: 'DJI' },
  { id: 'lenovo', name: 'Lenovo', logo: 'Lenovo' },
  { id: 'marshall', name: 'Marshall', logo: 'Marshall' },
  { id: 'garmin', name: 'Garmin', logo: 'GARMIN' }
]

export const CUSTOMER_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Александр Морозов',
    date: '28 февраля 2026',
    productName: 'Apple iPhone 16 Pro Max 256GB',
    rating: 5,
    text: 'Заказывал с самовывозом из пункта выдачи. Доставили точно в срок, коробка в заводских пломбах, гарантийный талон на 2 года в комплекте. Телефон просто пушка, титановый цвет Desert выглядит роскошно!',
    city: 'Москва'
  },
  {
    id: 'rev-2',
    name: 'Екатерина Васильева',
    date: '15 января 2026',
    productName: 'Робот-пылесос Roborock S8 Pro Ultra',
    rating: 5,
    text: 'Это лучшее приобретение для дома за все время! Станция делает абсолютно всё сама: моет тряпку, сушит горячим воздухом, выгружает пыль. Забыла про уборку на месяц. Отдельное спасибо за рассрочку без переплат.',
    city: 'Санкт-Петербург'
  },
  {
    id: 'rev-3',
    name: 'Дмитрий Кузнецов',
    date: '3 февраля 2026',
    productName: 'Ноутбук Apple MacBook Pro 14" M4 Pro',
    rating: 5,
    text: 'Работаю в видеомонтаже в DaVinci Resolve и After Effects. M4 Pro с 24 ГБ памяти просто не замечает тяжелые 4K 10-bit проекты, рендерит мгновенно и абсолютно бесшумно. Магазину 10 из 10 за оперативность.',
    city: 'Минск'
  }
]
