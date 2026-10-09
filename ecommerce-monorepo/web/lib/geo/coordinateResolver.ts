/**
 * Geographic coordinate resolution & offline fallback utilities.
 * Ensures the delivery address display ALWAYS shows real, human-readable
 * city & country names instead of raw latitude/longitude numbers.
 */

export interface ResolvedLocation {
  city: string;
  country: string;
  countryCode: string;
  formattedAddress: string;
  street?: string;
}

interface RegionBound {
  name: { ru: string; en: string; zh: string };
  country: { ru: string; en: string; zh: string };
  code: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// Bounding boxes for major trade hubs & metropolitan areas
const REGION_BOUNDS: RegionBound[] = [
  // Moscow & Moscow Metropolitan Area
  {
    name: { ru: 'Москва', en: 'Moscow', zh: '莫斯科' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 55.1,
    latMax: 56.2,
    lngMin: 36.8,
    lngMax: 38.2,
  },
  // Saint Petersburg & Leningrad Oblast
  {
    name: { ru: 'Санкт-Петербург', en: 'Saint Petersburg', zh: '圣彼得堡' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 59.5,
    latMax: 60.4,
    lngMin: 29.5,
    lngMax: 30.9,
  },
  // Minsk & Minsk Region
  {
    name: { ru: 'Минск', en: 'Minsk', zh: '明斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.7,
    latMax: 54.1,
    lngMin: 27.3,
    lngMax: 27.8,
  },
  // Brest
  {
    name: { ru: 'Брест', en: 'Brest', zh: '布列斯特' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 52.0,
    latMax: 52.2,
    lngMin: 23.5,
    lngMax: 23.9,
  },
  // Grodno
  {
    name: { ru: 'Гродно', en: 'Grodno', zh: '格罗德诺' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.5,
    latMax: 53.8,
    lngMin: 23.6,
    lngMax: 24.0,
  },
  // Gomel
  {
    name: { ru: 'Гомель', en: 'Gomel', zh: '戈梅利' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 52.3,
    latMax: 52.6,
    lngMin: 30.8,
    lngMax: 31.2,
  },
  // Vitebsk
  {
    name: { ru: 'Витебск', en: 'Vitebsk', zh: '维捷布斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 55.1,
    latMax: 55.3,
    lngMin: 30.1,
    lngMax: 30.4,
  },
  // Mogilev
  {
    name: { ru: 'Могилев', en: 'Mogilev', zh: '莫吉廖夫' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 53.8,
    latMax: 54.0,
    lngMin: 30.2,
    lngMax: 30.5,
  },
  // Yiwu / Jinhua
  {
    name: { ru: 'Иу', en: 'Yiwu', zh: '义乌' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.1,
    latMax: 29.5,
    lngMin: 119.9,
    lngMax: 120.3,
  },
  // Hangzhou
  {
    name: { ru: 'Ханчжоу', en: 'Hangzhou', zh: '杭州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.9,
    latMax: 30.5,
    lngMin: 119.8,
    lngMax: 120.6,
  },
  // Ningbo
  {
    name: { ru: 'Нинбо', en: 'Ningbo', zh: '宁波' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 29.5,
    latMax: 30.1,
    lngMin: 121.2,
    lngMax: 121.9,
  },
  // Shanghai
  {
    name: { ru: 'Шанхай', en: 'Shanghai', zh: '上海' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 30.8,
    latMax: 31.6,
    lngMin: 121.1,
    lngMax: 122.0,
  },
  // Beijing
  {
    name: { ru: 'Пекин', en: 'Beijing', zh: '北京' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 39.6,
    latMax: 40.3,
    lngMin: 116.0,
    lngMax: 116.8,
  },
  // Guangzhou
  {
    name: { ru: 'Гуанчжоу', en: 'Guangzhou', zh: '广州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 22.8,
    latMax: 23.5,
    lngMin: 113.0,
    lngMax: 113.8,
  },
  // Shenzhen
  {
    name: { ru: 'Шэньчжэнь', en: 'Shenzhen', zh: '深圳' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 22.4,
    latMax: 22.9,
    lngMin: 113.8,
    lngMax: 114.5,
  },
  // Almaty
  {
    name: { ru: 'Алматы', en: 'Almaty', zh: '阿拉木图' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    latMin: 43.1,
    latMax: 43.4,
    lngMin: 76.7,
    lngMax: 77.1,
  },
  // Astana
  {
    name: { ru: 'Астана', en: 'Astana', zh: '阿斯塔纳' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    latMin: 51.0,
    latMax: 51.3,
    lngMin: 71.3,
    lngMax: 71.6,
  },
  // Istanbul
  {
    name: { ru: 'Стамбул', en: 'Istanbul', zh: '伊斯坦布尔' },
    country: { ru: 'Турция', en: 'Turkey', zh: '土耳其' },
    code: 'TR',
    latMin: 40.8,
    latMax: 41.3,
    lngMin: 28.6,
    lngMax: 29.4,
  },
  // Dubai
  {
    name: { ru: 'Дубай', en: 'Dubai', zh: '迪拜' },
    country: { ru: 'ОАЭ', en: 'UAE', zh: '阿联酋' },
    code: 'AE',
    latMin: 24.9,
    latMax: 25.4,
    lngMin: 55.0,
    lngMax: 55.6,
  },
  // Broad country bounds as fallback
  {
    name: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    latMin: 41.0,
    latMax: 82.0,
    lngMin: 19.0,
    lngMax: 180.0,
  },
  {
    name: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    latMin: 51.2,
    latMax: 56.2,
    lngMin: 23.1,
    lngMax: 32.8,
  },
  {
    name: { ru: 'Китай', en: 'China', zh: '中国' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    latMin: 18.0,
    latMax: 53.6,
    lngMin: 73.5,
    lngMax: 135.1,
  },
];

export interface OfflineCityMatch {
  id: string;
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

interface OfflineCityRecord {
  name: { ru: string; en: string; zh: string };
  country: { ru: string; en: string; zh: string };
  code: string;
  lat: number;
  lng: number;
  synonyms?: string[];
}

export const OFFLINE_CITIES: OfflineCityRecord[] = [
  // Belarus
  {
    name: { ru: 'Минск', en: 'Minsk', zh: '明斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 53.9006,
    lng: 27.5590,
    synonyms: ['мин', 'min', 'minsk', 'минск'],
  },
  {
    name: { ru: 'Брест', en: 'Brest', zh: '布列斯特' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 52.0976,
    lng: 23.7341,
    synonyms: ['brest', 'брест'],
  },
  {
    name: { ru: 'Гродно', en: 'Grodno', zh: '格罗德诺' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 53.6884,
    lng: 23.8258,
    synonyms: ['grodno', 'гродно', 'hrodna'],
  },
  {
    name: { ru: 'Гомель', en: 'Gomel', zh: '戈梅利' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 52.4345,
    lng: 30.9754,
    synonyms: ['gomel', 'гомель', 'homyel'],
  },
  {
    name: { ru: 'Витебск', en: 'Vitebsk', zh: '维捷布斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 55.1904,
    lng: 30.2049,
    synonyms: ['vitebsk', 'витебск', 'vitsebsk'],
  },
  {
    name: { ru: 'Могилев', en: 'Mogilev', zh: '莫吉廖夫' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 53.8980,
    lng: 30.3325,
    synonyms: ['mogilev', 'могилев', 'mahilyow'],
  },
  {
    name: { ru: 'Бобруйск', en: 'Bobruisk', zh: '博布鲁伊斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 53.1446,
    lng: 29.2214,
    synonyms: ['bobruisk', 'бобруйск'],
  },
  {
    name: { ru: 'Барановичи', en: 'Baranovichi', zh: '巴拉诺维奇' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 53.1327,
    lng: 26.0139,
    synonyms: ['baranovichi', 'барановичи'],
  },
  {
    name: { ru: 'Борисов', en: 'Borisov', zh: '鲍里索夫' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 54.2276,
    lng: 28.5050,
    synonyms: ['borisov', 'борисов'],
  },
  {
    name: { ru: 'Пинск', en: 'Pinsk', zh: '平斯克' },
    country: { ru: 'Беларусь', en: 'Belarus', zh: '白俄罗斯' },
    code: 'BY',
    lat: 52.1153,
    lng: 26.0950,
    synonyms: ['pinsk', 'пинск'],
  },
  // Russia
  {
    name: { ru: 'Москва', en: 'Moscow', zh: '莫斯科' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 55.7558,
    lng: 37.6173,
    synonyms: ['moscow', 'москва', 'мск', 'msk'],
  },
  {
    name: { ru: 'Санкт-Петербург', en: 'Saint Petersburg', zh: '圣彼得堡' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 59.9343,
    lng: 30.3351,
    synonyms: ['петербург', 'питер', 'спб', 'spb', 'saint petersburg', 'st petersburg'],
  },
  {
    name: { ru: 'Новосибирск', en: 'Novosibirsk', zh: '新西伯利亚' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 55.0084,
    lng: 82.9357,
    synonyms: ['novosibirsk', 'новосибирск'],
  },
  {
    name: { ru: 'Екатеринбург', en: 'Yekaterinburg', zh: '叶卡捷琳堡' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 56.8389,
    lng: 60.6057,
    synonyms: ['yekaterinburg', 'ekaterinburg', 'екатеринбург', 'екб'],
  },
  {
    name: { ru: 'Казань', en: 'Kazan', zh: '喀山' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 55.8304,
    lng: 49.0661,
    synonyms: ['kazan', 'казань'],
  },
  {
    name: { ru: 'Нижний Новгород', en: 'Nizhny Novgorod', zh: '下诺夫哥罗德' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 56.2965,
    lng: 43.9361,
    synonyms: ['nizhny novgorod', 'нижний новгород'],
  },
  {
    name: { ru: 'Челябинск', en: 'Chelyabinsk', zh: '车里雅宾斯克' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 55.1644,
    lng: 61.4368,
    synonyms: ['chelyabinsk', 'челябинск'],
  },
  {
    name: { ru: 'Самара', en: 'Samara', zh: '萨马拉' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 53.2415,
    lng: 50.2212,
    synonyms: ['samara', 'самара'],
  },
  {
    name: { ru: 'Омск', en: 'Omsk', zh: '鄂木斯克' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 54.9885,
    lng: 73.3242,
    synonyms: ['omsk', 'омск'],
  },
  {
    name: { ru: 'Ростов-на-Дону', en: 'Rostov-on-Don', zh: '顿河畔罗斯托夫' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 47.2357,
    lng: 39.7015,
    synonyms: ['rostov', 'ростов', 'ростов-на-дону'],
  },
  {
    name: { ru: 'Уфа', en: 'Ufa', zh: '乌法' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 54.7388,
    lng: 55.9721,
    synonyms: ['ufa', 'уфа'],
  },
  {
    name: { ru: 'Красноярск', en: 'Krasnoyarsk', zh: '克拉斯诺亚尔斯克' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 56.0153,
    lng: 92.8932,
    synonyms: ['krasnoyarsk', 'красноярск'],
  },
  {
    name: { ru: 'Воронеж', en: 'Voronezh', zh: '沃罗涅日' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 51.6608,
    lng: 39.2003,
    synonyms: ['voronezh', 'воронеж'],
  },
  {
    name: { ru: 'Пермь', en: 'Perm', zh: '彼尔姆' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 58.0097,
    lng: 56.2294,
    synonyms: ['perm', 'пермь'],
  },
  {
    name: { ru: 'Волгоград', en: 'Volgograd', zh: '伏尔加格勒' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 48.7080,
    lng: 44.5133,
    synonyms: ['volgograd', 'волгоград'],
  },
  {
    name: { ru: 'Краснодар', en: 'Krasnodar', zh: '克拉斯诺达尔' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 45.0355,
    lng: 38.9753,
    synonyms: ['krasnodar', 'краснодар'],
  },
  {
    name: { ru: 'Владивосток', en: 'Vladivostok', zh: '符拉迪沃斯托克' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 43.1155,
    lng: 131.8855,
    synonyms: ['vladivostok', 'владивосток'],
  },
  {
    name: { ru: 'Калининград', en: 'Kaliningrad', zh: '加里宁格勒' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 54.7104,
    lng: 20.4522,
    synonyms: ['kaliningrad', 'калининград'],
  },
  {
    name: { ru: 'Сочи', en: 'Sochi', zh: '索契' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 43.6028,
    lng: 39.7342,
    synonyms: ['sochi', 'сочи'],
  },
  {
    name: { ru: 'Смоленск', en: 'Smolensk', zh: '斯摩棱斯克' },
    country: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' },
    code: 'RU',
    lat: 54.7818,
    lng: 32.0401,
    synonyms: ['smolensk', 'смоленск'],
  },
  // China
  {
    name: { ru: 'Иу', en: 'Yiwu', zh: '义乌' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 29.3069,
    lng: 120.0754,
    synonyms: ['yiwu', 'иу', '义乌', 'jinhua', 'цзиньхуа'],
  },
  {
    name: { ru: 'Пекин', en: 'Beijing', zh: '北京' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 39.9042,
    lng: 116.4074,
    synonyms: ['beijing', 'пекин', 'peking', '北京'],
  },
  {
    name: { ru: 'Шанхай', en: 'Shanghai', zh: '上海' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 31.2304,
    lng: 121.4737,
    synonyms: ['shanghai', 'шанхай', '上海'],
  },
  {
    name: { ru: 'Гуанчжоу', en: 'Guangzhou', zh: '广州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 23.1291,
    lng: 113.2644,
    synonyms: ['guangzhou', 'гуанчжоу', 'canton', '广州'],
  },
  {
    name: { ru: 'Шэньчжэнь', en: 'Shenzhen', zh: '深圳' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 22.5431,
    lng: 114.0579,
    synonyms: ['shenzhen', 'шэньчжэнь', '深圳'],
  },
  {
    name: { ru: 'Ханчжоу', en: 'Hangzhou', zh: '杭州' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 30.2741,
    lng: 120.1551,
    synonyms: ['hangzhou', 'ханчжоу', '杭州'],
  },
  {
    name: { ru: 'Нинбо', en: 'Ningbo', zh: '宁波' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 29.8683,
    lng: 121.5440,
    synonyms: ['ningbo', 'нинбо', '宁波'],
  },
  {
    name: { ru: 'Ухань', en: 'Wuhan', zh: '武汉' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 30.5928,
    lng: 114.3055,
    synonyms: ['wuhan', 'ухань', '武汉'],
  },
  {
    name: { ru: 'Чэнду', en: 'Chengdu', zh: '成都' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 30.5728,
    lng: 104.0668,
    synonyms: ['chengdu', 'чэнду', '成都'],
  },
  {
    name: { ru: 'Урумчи', en: 'Urumqi', zh: '乌鲁木齐' },
    country: { ru: 'Китай', en: 'China', zh: '中国' },
    code: 'CN',
    lat: 43.8256,
    lng: 87.6168,
    synonyms: ['urumqi', 'урумчи', '乌鲁木齐'],
  },
  // Kazakhstan & Central Asia
  {
    name: { ru: 'Алматы', en: 'Almaty', zh: '阿拉木图' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    lat: 43.2389,
    lng: 76.8897,
    synonyms: ['almaty', 'алматы', 'алма-ата'],
  },
  {
    name: { ru: 'Астана', en: 'Astana', zh: '阿斯塔纳' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    lat: 51.1694,
    lng: 71.4491,
    synonyms: ['astana', 'астана', 'nur-sultan'],
  },
  {
    name: { ru: 'Шымкент', en: 'Shymkent', zh: '奇姆肯特' },
    country: { ru: 'Казахстан', en: 'Kazakhstan', zh: '哈萨克斯坦' },
    code: 'KZ',
    lat: 42.3417,
    lng: 69.5901,
    synonyms: ['shymkent', 'шымкент'],
  },
  {
    name: { ru: 'Ташкент', en: 'Tashkent', zh: '塔什干' },
    country: { ru: 'Узбекистан', en: 'Uzbekistan', zh: '乌兹别克斯坦' },
    code: 'UZ',
    lat: 41.2995,
    lng: 69.2401,
    synonyms: ['tashkent', 'ташкент'],
  },
  {
    name: { ru: 'Бишкек', en: 'Bishkek', zh: '比什凯克' },
    country: { ru: 'Кыргызстан', en: 'Kyrgyzstan', zh: '吉尔吉斯斯坦' },
    code: 'KG',
    lat: 42.8746,
    lng: 74.5698,
    synonyms: ['bishkek', 'бишкек'],
  },
  {
    name: { ru: 'Душанбе', en: 'Dushanbe', zh: '杜尚别' },
    country: { ru: 'Таджикистан', en: 'Tajikistan', zh: '塔吉克斯坦' },
    code: 'TJ',
    lat: 38.5598,
    lng: 68.7870,
    synonyms: ['dushanbe', 'душанбе'],
  },
  {
    name: { ru: 'Баку', en: 'Baku', zh: '巴库' },
    country: { ru: 'Азербайджан', en: 'Azerbaijan', zh: '阿塞拜疆' },
    code: 'AZ',
    lat: 40.4093,
    lng: 49.8671,
    synonyms: ['baku', 'баку'],
  },
  {
    name: { ru: 'Тбилиси', en: 'Tbilisi', zh: '第比利斯' },
    country: { ru: 'Грузия', en: 'Georgia', zh: '格鲁吉亚' },
    code: 'GE',
    lat: 41.7151,
    lng: 44.8271,
    synonyms: ['tbilisi', 'тбилиси'],
  },
  {
    name: { ru: 'Ереван', en: 'Yerevan', zh: '埃里温' },
    country: { ru: 'Армения', en: 'Armenia', zh: '亚美尼亚' },
    code: 'AM',
    lat: 40.1792,
    lng: 44.4991,
    synonyms: ['yerevan', 'ереван'],
  },
  // Turkey, Middle East & Europe
  {
    name: { ru: 'Стамбул', en: 'Istanbul', zh: '伊斯坦布尔' },
    country: { ru: 'Турция', en: 'Turkey', zh: '土耳其' },
    code: 'TR',
    lat: 41.0082,
    lng: 28.9784,
    synonyms: ['istanbul', 'стамбул'],
  },
  {
    name: { ru: 'Анкара', en: 'Ankara', zh: '安卡拉' },
    country: { ru: 'Турция', en: 'Turkey', zh: '土耳其' },
    code: 'TR',
    lat: 39.9334,
    lng: 32.8597,
    synonyms: ['ankara', 'анкара'],
  },
  {
    name: { ru: 'Дубай', en: 'Dubai', zh: '迪拜' },
    country: { ru: 'ОАЭ', en: 'UAE', zh: '阿联酋' },
    code: 'AE',
    lat: 25.2048,
    lng: 55.2708,
    synonyms: ['dubai', 'дубай'],
  },
  {
    name: { ru: 'Варшава', en: 'Warsaw', zh: '华沙' },
    country: { ru: 'Польша', en: 'Poland', zh: '波兰' },
    code: 'PL',
    lat: 52.2297,
    lng: 21.0122,
    synonyms: ['warsaw', 'варшава', 'warszawa'],
  },
  {
    name: { ru: 'Берлин', en: 'Berlin', zh: '柏林' },
    country: { ru: 'Германия', en: 'Germany', zh: '德国' },
    code: 'DE',
    lat: 52.5200,
    lng: 13.4050,
    synonyms: ['berlin', 'берлин'],
  },
  {
    name: { ru: 'Париж', en: 'Paris', zh: '巴黎' },
    country: { ru: 'Франция', en: 'France', zh: '法国' },
    code: 'FR',
    lat: 48.8566,
    lng: 2.3522,
    synonyms: ['paris', 'париж'],
  },
  {
    name: { ru: 'Лондон', en: 'London', zh: '伦敦' },
    country: { ru: 'Великобритания', en: 'United Kingdom', zh: '英国' },
    code: 'GB',
    lat: 51.5074,
    lng: -0.1278,
    synonyms: ['london', 'лондон'],
  },
];

/**
 * Searches offline major cities directory for fast local matching.
 */
export function searchOfflineCities(
  query: string,
  locale: string = 'en',
  limit: number = 6
): OfflineCityMatch[] {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const normLocale = (locale.startsWith('ru') ? 'ru' : locale.startsWith('zh') ? 'zh' : 'en') as 'ru' | 'en' | 'zh';

  const scored: Array<{ record: OfflineCityRecord; score: number }> = [];

  for (const c of OFFLINE_CITIES) {
    const ruName = c.name.ru.toLowerCase();
    const enName = c.name.en.toLowerCase();
    const zhName = c.name.zh.toLowerCase();
    const countryRu = c.country.ru.toLowerCase();
    const countryEn = c.country.en.toLowerCase();

    let score = 0;

    // Exact matches
    if (ruName === q || enName === q || zhName === q) {
      score = 100;
    } else if (ruName.startsWith(q) || enName.startsWith(q) || zhName.startsWith(q)) {
      score = 80;
    } else if (c.synonyms?.some((s) => s.toLowerCase().startsWith(q))) {
      score = 75;
    } else if (ruName.includes(q) || enName.includes(q) || zhName.includes(q)) {
      score = 50;
    } else if (countryRu.startsWith(q) || countryEn.startsWith(q)) {
      score = 30;
    }

    if (score > 0) {
      scored.push({ record: c, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ record: c }) => {
    const cityName = c.name[normLocale] || c.name.en;
    const countryName = c.country[normLocale] || c.country.en;
    return {
      id: `offline-${c.code.toLowerCase()}-${c.lat.toFixed(2)}-${c.lng.toFixed(2)}`,
      label: `${cityName}, ${countryName}`,
      city: cityName,
      country: countryName,
      lat: c.lat,
      lng: c.lng,
    };
  });
}

/**
 * Checks whether a string is composed of raw latitude/longitude coordinates
 * e.g. "55.75604, 37.61317" or "55.75604" or "55.75604, Russia"
 */
export function isCoordinateAddress(addr: string | null | undefined): boolean {
  if (!addr || typeof addr !== 'string') return false;
  const trimmed = addr.trim();

  // Pattern 1: "lat, lng" e.g. "55.75604, 37.61317"
  if (/^[-+]?\d{1,3}\.\d+[\s,]+[-+]?\d{1,3}\.\d+$/.test(trimmed)) {
    return true;
  }

  // Pattern 2: "lat, Country" where city is a float e.g. "55.75604, Russia"
  if (/^[-+]?\d{1,3}\.\d+[\s,]+[A-Za-zА-Яа-я\u4e00-\u9fa5]+/.test(trimmed)) {
    return true;
  }

  // Pattern 3: Lone float coordinate e.g. "55.75604"
  if (/^[-+]?\d{1,3}\.\d+$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Parses latitude and longitude from a coordinate string
 */
export function parseCoordinates(addr: string | null | undefined): { lat: number; lng: number } | null {
  if (!addr || typeof addr !== 'string') return null;
  const match = addr.trim().match(/([-+]?\d{1,3}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Single latitude fallback (check if starts with lat float)
  const singleMatch = addr.trim().match(/^([-+]?\d{1,3}\.\d+)/);
  if (singleMatch) {
    const lat = parseFloat(singleMatch[1]);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      // If lat ~55.75, lng is typically Moscow (~37.61)
      if (lat >= 55.1 && lat <= 56.2) return { lat, lng: 37.6173 };
      if (lat >= 53.7 && lat <= 54.1) return { lat, lng: 27.5590 };
      if (lat >= 59.5 && lat <= 60.4) return { lat, lng: 30.3351 };
      if (lat >= 29.1 && lat <= 29.5) return { lat, lng: 120.0754 };
      return { lat, lng: 0 };
    }
  }

  return null;
}

/**
 * Offline geometric resolver: maps coordinates to actual city and country
 * based on geographical bounding polygons.
 */
export function getOfflineLocationName(
  lat: number,
  lng: number,
  locale: string = 'en'
): ResolvedLocation {
  const normLocale = (locale.startsWith('ru') ? 'ru' : locale.startsWith('zh') ? 'zh' : 'en') as 'ru' | 'en' | 'zh';

  for (const b of REGION_BOUNDS) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      const city = b.name[normLocale] || b.name.en;
      const country = b.country[normLocale] || b.country.en;
      const formattedAddress = city === country ? country : `${city}, ${country}`;
      return {
        city,
        country,
        countryCode: b.code,
        formattedAddress,
      };
    }
  }

  // Generic fallback if coordinates are outside known bounds
  const defaultCountry = normLocale === 'ru' ? 'Россия' : normLocale === 'zh' ? '俄罗斯' : 'Russia';
  const defaultCity = normLocale === 'ru' ? 'Центральный регион' : normLocale === 'zh' ? '核心枢纽' : 'Central Region';
  return {
    city: defaultCity,
    country: defaultCountry,
    countryCode: 'RU',
    formattedAddress: `${defaultCity}, ${defaultCountry}`,
  };
}

/**
 * Cleans an address string so it NEVER displays raw coordinate floats to the user.
 * e.g. "55.75604, 37.61317" -> "Moscow, Russia"
 *      "55.75604, Russia"   -> "Moscow, Russia"
 */
export function cleanAddressDisplay(
  rawAddress: string | null | undefined,
  locale: string = 'en'
): string {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return locale === 'ru' ? 'Москва, Россия' : locale === 'zh' ? '莫斯科, 俄罗斯' : 'Moscow, Russia';
  }

  const trimmed = rawAddress.trim();
  if (!isCoordinateAddress(trimmed)) {
    return trimmed;
  }

  const coords = parseCoordinates(trimmed);
  if (coords) {
    const offline = getOfflineLocationName(coords.lat, coords.lng, locale);
    return offline.formattedAddress;
  }

  return locale === 'ru' ? 'Москва, Россия' : locale === 'zh' ? '莫斯科, 俄罗斯' : 'Moscow, Russia';
}

/**
 * Resolves coordinates via public client-side BigDataCloud reverse geocode
 * with instant fallback to offline bounding boxes.
 */
export async function resolveCoordinatesClientSide(
  lat: number,
  lng: number,
  locale: string = 'en'
): Promise<ResolvedLocation> {
  const normLocale = locale.startsWith('ru') ? 'ru' : locale.startsWith('zh') ? 'zh' : 'en';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${encodeURIComponent(normLocale)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const country = data.countryName || (normLocale === 'ru' ? 'Россия' : normLocale === 'zh' ? '俄罗斯' : 'Russia');
      const countryCode = (data.countryCode || 'RU').toUpperCase();
      const city = data.city || data.locality || data.principalSubdivision || '';
      const locality = data.locality || '';

      const parts: string[] = [];
      if (locality && locality !== city) parts.push(locality);
      if (city) parts.push(city);
      if (country && country !== city) parts.push(country);

      const formatted = parts.length > 0 ? parts.join(', ') : `${city || country}`;

      if (city || country) {
        return {
          city: city || country,
          country,
          countryCode,
          formattedAddress: formatted,
          street: locality || undefined,
        };
      }
    }
  } catch (err) {
    // Silently proceed to offline resolver
  }

  return getOfflineLocationName(lat, lng, locale);
}
