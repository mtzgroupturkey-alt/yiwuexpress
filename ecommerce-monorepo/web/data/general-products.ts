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

export const GENERAL_PRODUCTS_DATA: ProductItem[] = [
  // 1. 🔥 Хиты продаж (Общий маркетплейс - 4 товара)
  {
    id: 'gen-hit-1',
    name: 'Фрезерно-гравировальный станок с ЧПУ CNC 3018 Pro Max Metal',
    category: 'machinery',
    price: 38990,
    oldPrice: 45990,
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Настольный фрезерный станок по металлу, дереву и пластику с автономным контроллером GRBL.',
    specs: { 'Рабочая зона': '300x180x45 мм', 'Шпиндель': '500 Вт 12000 об/мин', 'Материал': 'Цельный алюминий' }
  },
  {
    id: 'gen-hit-2',
    name: 'Кофемашина автоматическая DeLonghi Magnifica S Smart',
    category: 'home',
    price: 39990,
    oldPrice: 48990,
    rating: 5.0,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Итальянское качество эспрессо и капучино. Встроенная жерновая кофемолка с 13 степенями помола.',
    specs: { 'Давление': '15 бар', 'Капучинатор': 'Ручной панарелло', 'Управление': 'Кнопочное с дисплеем' }
  },
  {
    id: 'gen-hit-3',
    name: 'Горный велосипед гидравлический GT Avalanche Elite 29"',
    category: 'sports',
    price: 54990,
    oldPrice: 65990,
    rating: 4.8,
    reviews: 86,
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Легкая баттированная рама Triple Triangle, трансмиссия Shimano Deore 1x11 и пневматическая вилка.',
    specs: { 'Колеса': '29 дюймов', 'Тормоза': 'Дисковая гидравлика', 'Скорости': '11 ск. Shimano' }
  },
  {
    id: 'gen-hit-4',
    name: 'Набор профессионального автоинструмента Ombra 94 предмета',
    category: 'auto',
    price: 11990,
    oldPrice: 14500,
    rating: 4.9,
    reviews: 520,
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Хром-ванадиевая легированная сталь с пожизненной гарантией производителя. Усиленный кейс.',
    specs: { 'Количество': '94 предмета', 'Посадка': '1/4" и 1/2"', 'Сталь': 'Cr-V легированная' }
  },

  // 2. 🏠 Товары для дома и уюта (4 товара)
  {
    id: 'home-1',
    name: 'Робот-пылесос с влажной уборкой и станцией Roborock Q Revo',
    category: 'home',
    price: 64990,
    oldPrice: 74990,
    rating: 4.9,
    reviews: 184,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Вращающиеся швабры с автоматическим подъемом на коврах и сушкой горячим воздухом на док-станции.',
    specs: { 'Всасывание': '5500 Па', 'Навигация': 'PreciSense LiDAR', 'Станция': 'Самоочистка и стирка' }
  },
  {
    id: 'home-2',
    name: 'Ортопедический матрас премиум Askona Sleep Expert 160x200',
    category: 'home',
    price: 28990,
    oldPrice: 38990,
    rating: 4.8,
    reviews: 95,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: '7-зональный независимый пружинный блок с натуральным латексом и пеной с памятью формы.',
    specs: { 'Размер': '160x200 см', 'Жесткость': 'Средняя / Выше средней', 'Нагрузка': 'до 140 кг/место' }
  },
  {
    id: 'home-3',
    name: 'Набор дизайнерской посуды из каменной керамики 24 предмета',
    category: 'home',
    price: 12490,
    oldPrice: 16990,
    rating: 4.7,
    reviews: 62,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Ударопрочная глазурованная керамика ручной формовки. Подходит для СВЧ и посудомоечных машин.',
    specs: { 'Комплект': 'На 6 персон (24 шт)', 'Материал': 'Stoneware керамика', 'Цвет': 'Нордический графит' }
  },
  {
    id: 'home-4',
    name: 'Увлажнитель воздуха ультразвуковой Xiaomi Smart Humidifier 2',
    category: 'home',
    price: 4490,
    oldPrice: 5990,
    rating: 4.8,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Антибактериальная обработка воды УФ-излучением и бесшумная работа до 32 часов на одной заправке.',
    specs: { 'Объем бака': '4.5 л', 'Расход воды': '350 мл/ч', 'Управление': 'Wi-Fi / Mi Home' }
  },

  // 3. 👗 Одежда, обувь и аксессуары (4 товара)
  {
    id: 'fashion-1',
    name: 'Мужская мембранная штормовая куртка Gore-Tex Pro Alpine',
    category: 'fashion',
    price: 18990,
    oldPrice: 24990,
    rating: 4.9,
    reviews: 73,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Полная защита от проливного дождя и штормового ветра с превосходной паропроницаемостью.',
    specs: { 'Мембрана': 'Gore-Tex 28 000 мм', 'Швы': 'Полностью проклеены', 'Фурнитура': 'YKK AquaGuard' }
  },
  {
    id: 'fashion-2',
    name: 'Кроссовки оригинальные New Balance 990v6 Made in USA Grey',
    category: 'fashion',
    price: 24990,
    oldPrice: 29990,
    rating: 5.0,
    reviews: 140,
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Культовая премиальная модель из натуральной замши со сверхкомфортной амортизацией FuelCell.',
    specs: { 'Материал': 'Натуральная замша / Mesh', 'Подошва': 'FuelCell + ENCAP', 'Страна': 'США' }
  },
  {
    id: 'fashion-3',
    name: 'Женское пальто из 100% шерсти альпаки двубортное Camel',
    category: 'fashion',
    price: 32990,
    oldPrice: 42000,
    rating: 4.8,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Элегантный свободный крой оверсайз из нежнейшей перуанской шерсти альпаки премиум-класса.',
    specs: { 'Состав': '80% Альпака, 20% Шерсть', 'Подкладка': '100% вискоза', 'Сезон': 'Демисезон / Зима' }
  },
  {
    id: 'fashion-4',
    name: 'Кожаный дорожный рюкзак для ноутбука BANGE Business Premium',
    category: 'fashion',
    price: 6990,
    oldPrice: 8990,
    rating: 4.7,
    reviews: 168,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Водоотталкивающая экокожа, кодовый TSA замок, USB-порт для зарядки и отсек для ноутбука 17.3".',
    specs: { 'Отсек для ПК': 'до 17.3"', 'Объем': '35 литров', 'Замок': 'Встроенный кодовый TSA' }
  },

  // 4. 🛠️ Ремонт, стройка и инструменты (4 товара)
  {
    id: 'tools-1',
    name: 'Аккумуляторный бесщеточный перфоратор DeWALT DCH133N 18V XR',
    category: 'tools',
    price: 19490,
    oldPrice: 23990,
    rating: 4.9,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Энергия удара 2.6 Дж, 3 режима работы и надежный бесщеточный двигатель Brushless.',
    specs: { 'Энергия удара': '2.6 Дж', 'Патрон': 'SDS-Plus', 'Двигатель': 'Бесщеточный 18В' }
  },
  {
    id: 'tools-2',
    name: 'Лазерный уровень 4D 16 линий с зеленым лучом Huepar 904DG',
    category: 'tools',
    price: 13990,
    oldPrice: 17490,
    rating: 4.8,
    reviews: 154,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Японские лазерные диоды Osram с дальностью до 40 метров и пультом дистанционного управления.',
    specs: { 'Линии': '16 линий (4x360°)', 'Точность': '±2 мм на 10 м', 'Диоды': 'Osram зеленый луч' }
  },
  {
    id: 'tools-3',
    name: 'Инверторный сварочный аппарат полуавтомат Ресанта САИПА-200',
    category: 'tools',
    price: 24990,
    oldPrice: 29990,
    rating: 4.7,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Сварка порошковой проволокой без газа (FCAW) и в среде защитных газов (MIG/MAG) + MMA.',
    specs: { 'Ток': 'до 200 А', 'Проволока': '0.8 - 1.0 мм', 'ПВ': '70% при 200А' }
  },
  {
    id: 'tools-4',
    name: 'Торцовочная пила с протяжкой Makita LS1019L 1510 Вт',
    category: 'tools',
    price: 68990,
    oldPrice: 79990,
    rating: 5.0,
    reviews: 44,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Лазерный маркер линии реза, плавный пуск, электронный тормоз и диск диаметром 260 мм.',
    specs: { 'Мощность': '1510 Вт', 'Диск': '260 мм', 'Глубина пропила': '91x279 мм' }
  },

  // 5. 🚗 Автотовары и автоэлектроника (4 товара)
  {
    id: 'auto-1',
    name: 'Видеорегистратор с радар-детектором 3-в-1 70mai A810 4K HDR',
    category: 'auto',
    price: 16990,
    oldPrice: 20990,
    rating: 4.9,
    reviews: 320,
    image: 'https://images.unsplash.com/photo-1502982720700-bfff97f2da6d?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Матрица Sony Starvis 2 IMX678 с ночной съемкой Night Owl Vision и встроенным GPS модулем.',
    specs: { 'Съемка': 'Реальное 4K UHD 60fps', 'Матрица': 'Sony Starvis 2', 'Дисплей': '3.0" IPS' }
  },
  {
    id: 'auto-2',
    name: 'Пуско-зарядное устройство бустер для авто BASEUS Super Energy Pro',
    category: 'auto',
    price: 6490,
    oldPrice: 7990,
    rating: 4.8,
    reviews: 190,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Пусковой ток 1600А. Заводит бензиновые двигатели до 8.0 л и дизельные до 4.0 л даже при -20°C.',
    specs: { 'Пиковый ток': '1600 А', 'Емкость': '16 000 мАч', 'Фонарик': 'LED 3 режима' }
  },
  {
    id: 'auto-3',
    name: 'Автомобильный компрессор портативный аккумуляторный 70mai Air Compressor',
    category: 'auto',
    price: 3890,
    oldPrice: 4890,
    rating: 4.8,
    reviews: 245,
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Автоматическая накачка до заданного давления с точностью до 0.1 бар. Работает от прикуривателя.',
    specs: { 'Давление': 'до 10 бар', 'Производительность': '32 л/мин', 'Кабель': '3.7 метра' }
  },
  {
    id: 'auto-4',
    name: 'Накидки на сиденья автомобиля из натуральной овчины Premium',
    category: 'auto',
    price: 8990,
    oldPrice: 11990,
    rating: 4.7,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Комплект из 2 накидок из отборного австралийского меха овчины. Не линяют и греют в мороз.',
    specs: { 'Материал': '100% натуральная овчина', 'Комплект': '2 передние накидки', 'Крепление': 'Универсальное' }
  },

  // 6. ⚽ Спорт, туризм и активный отдых (4 товара)
  {
    id: 'sports-1',
    name: 'Беговая дорожка складная электрическая Yamaguchi Runway PRO-X',
    category: 'sports',
    price: 69990,
    oldPrice: 84990,
    rating: 4.9,
    reviews: 82,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Ультратонкая алюминиевая дорожка толщиной 4.7 см с интеллектуальным сенсорным управлением.',
    specs: { 'Скорость': 'до 8 км/ч', 'Толщина в сложенном виде': '4.7 см', 'Вес пользователя': 'до 100 кг' }
  },
  {
    id: 'sports-2',
    name: 'Туристическая двухслойная палатка автомат 3-местная Tramp Cave',
    category: 'sports',
    price: 14990,
    oldPrice: 18990,
    rating: 4.8,
    reviews: 115,
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Большой тамбур для снаряжения, алюминиевые дуги и водостойкость тента 8000 мм в.ст.',
    specs: { 'Вместимость': '3 человека', 'Водостойкость тента': '8000 мм', 'Каркас': 'Авиационный алюминий' }
  },
  {
    id: 'sports-3',
    name: 'Сапборд надувной надувная SUP-доска Gladiator PRO 10\'6" Комплект',
    category: 'sports',
    price: 34990,
    oldPrice: 42990,
    rating: 4.9,
    reviews: 140,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Двухслойный ПВХ Dropstitch с веслом из карбона, двухходовым насосом, лишем и сумкой на колесах.',
    specs: { 'Длина': '323 см (10\'6")', 'Грузоподъемность': 'до 150 кг', 'Весло': 'Карбоновое' }
  },
  {
    id: 'sports-4',
    name: 'Набор регулируемых гантелей 2x24 кг со стойкой Bowflex SelectTech',
    category: 'sports',
    price: 29990,
    oldPrice: 36990,
    rating: 4.8,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Заменяет 15 пар традиционных гантелей простым поворотом дискового регулятора веса от 2.5 до 24 кг.',
    specs: { 'Вес каждой': 'от 2.5 до 24 кг', 'Шаг регулировки': '15 градаций', 'Покрытие': 'Бесшумный полимер' }
  },

  // 7. 💄 Красота, здоровье и уход (4 товара)
  {
    id: 'beauty-1',
    name: 'Стайлер для волос мультистайлер Dyson Airwrap Complete Long',
    category: 'beauty',
    price: 54990,
    oldPrice: 64990,
    rating: 5.0,
    reviews: 430,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Эффект Коанда для создания локонов без экстремального перегрева волос. 6 насадок в кожаном кейсе.',
    specs: { 'Мощность': '1300 Вт', 'Насадки': '6 насадок Airwrap', 'Чехол': 'Берлинская лазурь' }
  },
  {
    id: 'beauty-2',
    name: 'Электрическая звуковая зубная щетка Oral-B iO Series 9 Black Onyx',
    category: 'beauty',
    price: 18990,
    oldPrice: 23990,
    rating: 4.9,
    reviews: 165,
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Магнитный бесшумный привод, 3D-отслеживание чистки с искусственным интеллектом и цветной дисплей.',
    specs: { 'Режимы чистки': '7 программ', 'Датчик давления': 'Умный световой', 'Кейс': 'Зарядный дорожный' }
  },
  {
    id: 'beauty-3',
    name: 'Массажер перкуссионный пистолет Theragun PRO 5th Gen',
    category: 'beauty',
    price: 46990,
    oldPrice: 53990,
    rating: 4.9,
    reviews: 88,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Глубокая проработка мышц с амплитудой 16 мм и силой давления до 27 кг для спортсменов.',
    specs: { 'Амплитуда': '16 мм', 'Сила удара': 'до 27 кг', 'Мотор': 'Бесщеточный QuietForce' }
  },
  {
    id: 'beauty-4',
    name: 'Аппарат для ультразвуковой чистки лица и лифтинга ReadySkin Glory',
    category: 'beauty',
    price: 6490,
    oldPrice: 8490,
    rating: 4.8,
    reviews: 195,
    image: 'https://images.unsplash.com/photo-1512290900672-1f55a1532cb1?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: '5 салонных процедур дома: пилинг, ионизация, микротоки EMS и светотерапия LED.',
    specs: { 'Частота УЗ': '28 кГц', 'Функции': 'УЗ-пилинг, EMS, Ионы', 'Корпус': 'Влагозащищенный IPX5' }
  },

  // 8. 📱 Смартфоны и цифровая техника (4 товара)
  {
    id: 'digital-1',
    name: 'Apple iPhone 16 128GB Black (2 физические SIM-карты)',
    category: 'smartphones',
    price: 84990,
    oldPrice: 94990,
    rating: 4.9,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Новая сенсорная кнопка Camera Control, процессор A18 и поддержка Apple Intelligence.',
    specs: { 'Экран': '6.1" Super Retina XDR', 'Память': '128 ГБ', 'Камера': '48 Мп Fusion' }
  },
  {
    id: 'digital-2',
    name: 'Планшет Samsung Galaxy Tab S9 FE 6/128GB Wi-Fi со стилусом S Pen',
    category: 'smartphones',
    price: 36990,
    oldPrice: 42990,
    rating: 4.8,
    reviews: 145,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Защита от воды и пыли IP68, 10.9" экран 90 Гц и перо S Pen в комплекте без доплат.',
    specs: { 'Экран': '10.9" 90Hz', 'Защита': 'IP68', 'Перо': 'S Pen в комплекте' }
  },
  {
    id: 'digital-3',
    name: 'Беспроводные полноразмерные наушники Sony WH-1000XM5 Black',
    category: 'audio',
    price: 34990,
    oldPrice: 39990,
    rating: 4.9,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Лучшее в мире активное шумоподавление с 8 микрофонами и двумя процессорами V1 и QN1.',
    specs: { 'Автономность': 'до 30 ч', 'Кодеки': 'LDAC / Hi-Res Audio', 'Вес': '250 г' }
  },
  {
    id: 'digital-4',
    name: 'Умные часы Huawei Watch GT 4 46mm Classic Brown Leather',
    category: 'smartphones',
    price: 15990,
    oldPrice: 19990,
    rating: 4.8,
    reviews: 180,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'SALE',
    inStock: true,
    description: 'Стальной корпус с кожаным ремешком, двухдиапазонный GPS и до 14 дней автономной работы.',
    specs: { 'Автономность': 'до 14 дней', 'Экран': '1.43" AMOLED', 'Корпус': 'Нержавеющая сталь 46мм' }
  },

  // 9. 🌳 Дача, сад и генераторы (4 товара)
  {
    id: 'garden-1',
    name: 'Инверторный бензиновый генератор Huter DN4400i 3.8 кВт бесшумный',
    category: 'garden',
    price: 39990,
    oldPrice: 47990,
    rating: 4.8,
    reviews: 94,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Чистая синусоида для чувствительной электроники и котлов. Низкий уровень шума в закрытом кожухе.',
    specs: { 'Мощность': '3.8 кВт', 'Тип': 'Инверторный бесшумный', 'Бак': '10 л (до 8 ч работы)' }
  },
  {
    id: 'garden-2',
    name: 'Робот-газонокосилка аккумуляторная Gardena Sileno City 500',
    category: 'garden',
    price: 79990,
    oldPrice: 92990,
    rating: 4.9,
    reviews: 58,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Автоматический уход за газоном в любую погоду без следов на траве. Управление со смартфона.',
    specs: { 'Площадь газона': 'до 500 м²', 'Уклон': 'до 35%', 'Уровень шума': '57 дБ (тихий)' }
  },
  {
    id: 'garden-3',
    name: 'Мойка высокого давления Karcher K 5 Compact 145 бар 2100 Вт',
    category: 'garden',
    price: 33990,
    oldPrice: 39990,
    rating: 4.9,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Двигатель водяного охлаждения, алюминиевая помпа и шланг высокого давления Quick Connect 8 м.',
    specs: { 'Давление': '145 бар', 'Производительность': '500 л/ч', 'Помпа': 'Алюминиевая' }
  },
  {
    id: 'garden-4',
    name: 'Гриль угольный премиум Weber Master-Touch GBS E-5750 57 см',
    category: 'garden',
    price: 42990,
    oldPrice: 49990,
    rating: 5.0,
    reviews: 125,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'HIT',
    inStock: true,
    description: 'Легендарный сферический гриль из фарфоровой эмали со съемной решеткой Gourmet BBQ System.',
    specs: { 'Диаметр котла': '57 см', 'Решетка': 'GBS хромированная', 'Очистка': 'Система One-Touch' }
  },

  // 10. ✨ Новинки — только поступили (6 товаров из разных категорий)
  {
    id: 'new-1',
    name: 'Комплект умного дома Яндекс с Хабом Zigbee и датчиками',
    category: 'home',
    price: 11990,
    oldPrice: 14990,
    rating: 4.8,
    reviews: 82,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Управление освещением, климатом и безопасностью голосом через Алису.',
    specs: { 'Протокол': 'Zigbee 3.0 / Wi-Fi', 'Комплект': 'Хаб + 4 датчика', 'Голос': 'Алиса' }
  },
  {
    id: 'new-2',
    name: 'Электросамокат складной Segway Ninebot KickScooter Max G2',
    category: 'sports',
    price: 64990,
    oldPrice: 72990,
    rating: 4.9,
    reviews: 114,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Двойная подвеска, запас хода до 70 км и поддержка трекинга Apple Find My.',
    specs: { 'Запас хода': 'до 70 км', 'Скорость': 'до 32 км/ч', 'Мощность': 'макс. 900 Вт' }
  },
  {
    id: 'new-3',
    name: 'Профессиональный сварочный полуавтомат Aurora PRO SPEEDWAY 180',
    category: 'tools',
    price: 36990,
    oldPrice: 41990,
    rating: 4.8,
    reviews: 48,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Синергетическое управление одним регулятором, плавная настройка индуктивности.',
    specs: { 'Сварка': 'MIG/MAG, MMA, TIG', 'Ток': 'до 180 А', 'Вес': '8 кг' }
  },
  {
    id: 'new-4',
    name: 'Премиальный чемодан поликарбонат на колесах Samsonite Lite-Shock 75 см',
    category: 'fashion',
    price: 38990,
    oldPrice: 45990,
    rating: 5.0,
    reviews: 35,
    image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Сверхлегкий материал Curv весом всего 2.5 кг при объеме 98.5 литров. Сделан в Европе.',
    specs: { 'Объем': '98.5 л', 'Вес': '2.5 кг', 'Материал': 'Патент Curv' }
  },
  {
    id: 'new-5',
    name: 'Карманная 4K камера со стабилизатором DJI Osmo Pocket 3',
    category: 'digital',
    price: 59990,
    oldPrice: 67990,
    rating: 4.9,
    reviews: 92,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Матрица 1" CMOS, съемка 4K 120fps и поворотный 2-дюймовый сенсорный экран.',
    specs: { 'Матрица': '1" CMOS', 'Видео': '4K 120fps 10-bit', 'Экран': '2" OLED поворотный' }
  },
  {
    id: 'new-6',
    name: 'Автомобильный бокс на крышу Thule Force XT L 450 литров',
    category: 'auto',
    price: 68990,
    oldPrice: 77990,
    rating: 4.9,
    reviews: 64,
    image: 'https://images.unsplash.com/photo-1502982720700-bfff97f2da6d?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: true,
    description: 'Аэродинамический дизайн, двустороннее открытие DualSide и грузоподъемность 75 кг.',
    specs: { 'Объем': '450 л', 'Грузоподъемность': 'до 75 кг', 'Размеры': '190 x 84 x 46 см' }
  },

  // 11. 🔔 Предзаказы (3 товара)
  {
    id: 'pre-1',
    name: 'Промышленный волоконный лазерный станок оптоволоконный 3000 Вт',
    category: 'machinery',
    price: 1890000,
    oldPrice: 2150000,
    rating: 5.0,
    reviews: 12,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Высокоскоростная прецизионная резка листовой стали и алюминия до 20 мм с ЧПУ CypCut.',
    specs: { 'Мощность лазера': 'Raycus 3000W', 'Рабочее поле': '3000x1500 мм', 'Точность': '0.02 мм' }
  },
  {
    id: 'pre-2',
    name: 'Электроквадроцикл полноприводный 4x4 Segway Villain SX10',
    category: 'auto',
    price: 1450000,
    oldPrice: 1650000,
    rating: 4.9,
    reviews: 18,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Мощность 105 л.с., адаптивная интеллектуальная подвеска и полный привод с блокировками.',
    specs: { 'Мощность': '105 л.с.', 'Клиренс': '360 мм', 'Привод': 'Полный подключаемый 4WD' }
  },
  {
    id: 'pre-3',
    name: 'Гарнитура смешанной реальности Apple Vision Pro 512GB',
    category: 'digital',
    price: 389990,
    oldPrice: 429990,
    rating: 5.0,
    reviews: 14,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=600&h=600&q=80',
    badge: 'NEW',
    inStock: false,
    description: 'Революционный пространственный компьютер с 23 миллионами пикселей на дисплеях Micro-OLED.',
    specs: { 'Дисплеи': '2x Micro-OLED 4K', 'Чипы': 'M2 + R1', 'Интерфейс': 'VisionOS' }
  }
]

export const GENERAL_BRANDS = [
  { id: 'bosch', name: 'Bosch', logo: 'BOSCH' },
  { id: 'makita', name: 'Makita', logo: 'MAKITA' },
  { id: 'delonghi', name: 'DeLonghi', logo: 'DeLonghi' },
  { id: 'dewalt', name: 'DeWALT', logo: 'DeWALT' },
  { id: 'karcher', name: 'Kärcher', logo: 'KÄRCHER' },
  { id: 'xiaomi', name: 'Xiaomi', logo: 'XIAOMI' },
  { id: 'samsung', name: 'Samsung', logo: 'SAMSUNG' },
  { id: 'apple', name: 'Apple', logo: '' },
  { id: 'dyson', name: 'Dyson', logo: 'dyson' },
  { id: 'roborock', name: 'Roborock', logo: 'roborock' },
  { id: 'huter', name: 'Huter', logo: 'HÜTER' },
  { id: 'tramo', name: 'Tramp', logo: 'TRAMP' }
]

export const GENERAL_CUSTOMER_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Сергей Николаев',
    date: '3 марта 2026',
    productName: 'Фрезерный станок с ЧПУ CNC 3018 Pro Max',
    rating: 5,
    text: 'Заказывал станок для домашней мастерской. Доставили до двери за 3 дня в идеальной упаковке. Собрал за 2 часа, контроллер подключился сразу. Для гравировки и мелких деталей из дюрали — находка!',
    city: 'Екатеринбург'
  },
  {
    id: 'rev-2',
    name: 'Анна Смирнова',
    date: '20 февраля 2026',
    productName: 'Кофемашина DeLonghi Magnifica S Smart',
    rating: 5,
    text: 'Покупали в подарок родителям. Очень простая в уходе, готовит настоящий густой эспрессо с пенкой. Оформили рассрочку 0% прямо на сайте без визита в банк, все честно и прозрачно.',
    city: 'Москва'
  },
  {
    id: 'rev-3',
    name: 'Игорь Мельников',
    date: '14 февраля 2026',
    productName: 'Набор автоинструмента Ombra 94 предмета',
    rating: 5,
    text: 'Работаю в автосервисе более 8 лет. Трещотки крепкие, металл не слизывается на закисших болтах, кейс выдерживает падения. Лучшее соотношение цены и долговечности.',
    city: 'Новосибирск'
  }
]
