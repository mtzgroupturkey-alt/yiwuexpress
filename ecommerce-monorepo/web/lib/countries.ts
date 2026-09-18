export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'CN', name: 'China' },
  { code: 'BY', name: 'Belarus' },
  { code: 'RU', name: 'Russia' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'VN', name: 'Vietnam' },
];

/**
 * Common shipping ports and trade cities mapped by country ISO code
 */
export const COUNTRY_CITIES: Record<string, string[]> = {
  CN: ['Yiwu', 'Ningbo', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Qingdao', 'Tianjin', 'Xiamen', 'Dalian', 'Hangzhou', 'Foshan', 'Dongguan', 'Beijing'],
  BY: ['Minsk', 'Brest', 'Grodno', 'Gomel', 'Mogilev', 'Vitebsk', 'Baranovichi', 'Borisov'],
  RU: ['Moscow', 'Saint Petersburg', 'Vladivostok', 'Novorossiysk', 'Yekaterinburg', 'Novosibirsk', 'Kazan', 'Nizhny Novgorod', 'Samara', 'Rostov-on-Don'],
  KZ: ['Almaty', 'Astana', 'Aktau', 'Shymkent', 'Karaganda', 'Atyrau', 'Aktobe'],
  TR: ['Istanbul', 'Izmir', 'Mersin', 'Ankara', 'Bursa', 'Antalya', 'Gaziantep', 'Kocaeli', 'Tekirdag'],
  UZ: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Fergana', 'Namangan'],
  PL: ['Warsaw', 'Gdansk', 'Gdynia', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Szczecin'],
  DE: ['Hamburg', 'Bremen', 'Frankfurt', 'Berlin', 'Munich', 'Cologne', 'Dusseldorf', 'Duisburg', 'Stuttgart'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Jebel Ali', 'Ajman', 'Ras Al Khaimah'],
  US: ['Los Angeles', 'Long Beach', 'New York', 'Houston', 'Seattle', 'Chicago', 'Miami', 'Savannah', 'Oakland', 'Atlanta'],
  GB: ['London', 'Southampton', 'Felixstowe', 'Liverpool', 'Manchester', 'Birmingham', 'Leeds'],
  IN: ['Mumbai', 'Nhava Sheva', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad', 'Mundra', 'Cochin'],
  VN: ['Ho Chi Minh City', 'Hai Phong', 'Da Nang', 'Hanoi', 'Quy Nhon'],
  KR: ['Busan', 'Incheon', 'Seoul', 'Gwangyang', 'Ulsan', 'Pyeongtaek'],
  JP: ['Tokyo', 'Yokohama', 'Osaka', 'Kobe', 'Nagoya', 'Fukuoka', 'Kitakyushu'],
  NL: ['Rotterdam', 'Amsterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  IT: ['Genoa', 'Milan', 'Rome', 'Naples', 'Trieste', 'Venice', 'La Spezia'],
  ES: ['Valencia', 'Barcelona', 'Madrid', 'Algeciras', 'Bilbao'],
  FR: ['Le Havre', 'Marseille', 'Paris', 'Lyon', 'Dunkirk', 'Bordeaux'],
  CA: ['Vancouver', 'Montreal', 'Toronto', 'Halifax', 'Calgary', 'Prince Rupert'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Fremantle (Perth)', 'Adelaide'],
  BR: ['Santos', 'Sao Paulo', 'Rio de Janeiro', 'Paranagua', 'Itajai'],
  EG: ['Alexandria', 'Port Said', 'Damietta', 'Cairo', 'Suez'],
  SA: ['Jeddah', 'Dammam', 'Riyadh', 'King Abdullah Port', 'Jubail'],
  TH: ['Bangkok', 'Laem Chabang', 'Chiang Mai', 'Songkhla'],
  MY: ['Port Klang', 'Penang', 'Johor Bahru', 'Kuala Lumpur', 'Tanjung Pelepas'],
  ID: ['Jakarta (Tanjung Priok)', 'Surabaya', 'Medan (Belawan)', 'Semarang'],
  SG: ['Singapore (Port of Singapore)', 'Jurong'],
  HK: ['Hong Kong (Kwai Tsing)'],
  TW: ['Kaohsiung', 'Taipei', 'Taichung', 'Keelung'],
  GE: ['Tbilisi', 'Batumi', 'Poti'],
  AZ: ['Baku', 'Ganja', 'Sumqayit'],
  AM: ['Yerevan', 'Gyumri'],
  KG: ['Bishkek', 'Osh'],
  TJ: ['Dushanbe', 'Khujand'],
  TM: ['Ashgabat', 'Turkmenbashi'],
  UA: ['Odesa', 'Chornomorsk', 'Kyiv', 'Lviv', 'Dnipro'],
  MX: ['Manzanillo', 'Veracruz', 'Mexico City', 'Lazaro Cardenas', 'Monterrey', 'Altamira'],
  ZA: ['Durban', 'Cape Town', 'Johannesburg', 'Port Elizabeth', 'Coega'],
  QA: ['Doha', 'Hamad Port', 'Ras Laffan'],
  KW: ['Kuwait City', 'Shuwaikh', 'Shuaiba'],
  PK: ['Karachi', 'Port Qasim', 'Lahore', 'Islamabad'],
  PH: ['Manila', 'Cebu', 'Davao', 'Subic Bay', 'Batangas'],
  AR: ['Buenos Aires', 'Rosario', 'Cordoba', 'Zarate'],
  CL: ['Valparaiso', 'San Antonio', 'Santiago'],
  CO: ['Buenaventura', 'Cartagena', 'Bogota', 'Barranquilla'],
  BD: ['Chittagong', 'Dhaka', 'Mongla'],
  BE: ['Antwerp', 'Zeebrugge', 'Brussels'],
  SE: ['Gothenburg', 'Stockholm', 'Helsingborg'],
  NO: ['Oslo', 'Bergen', 'Stavanger'],
  DK: ['Copenhagen', 'Aarhus'],
  FI: ['Helsinki', 'Kotka', 'Turku'],
  PT: ['Lisbon', 'Sines', 'Leixoes (Porto)'],
  GR: ['Piraeus', 'Thessaloniki', 'Athens'],
  AT: ['Vienna', 'Linz', 'Salzburg'],
  CH: ['Zurich', 'Basel', 'Geneva'],
  CZ: ['Prague', 'Brno', 'Ostrava'],
  HU: ['Budapest', 'Debrecen'],
  RO: ['Constanta', 'Bucharest'],
  BG: ['Varna', 'Burgas', 'Sofia'],
  RS: ['Belgrade', 'Novi Sad'],
  IL: ['Haifa', 'Ashdod', 'Tel Aviv'],
  IQ: ['Umm Qasr', 'Basra', 'Baghdad'],
  IR: ['Bandar Abbas', 'Tehran', 'Bushehr'],
  NZ: ['Auckland', 'Tauranga', 'Lyttelton (Christchurch)'],
  MA: ['Tanger Med', 'Casablanca', 'Rabat'],
  DZ: ['Algiers', 'Oran', 'Bejaia'],
  TN: ['Rades (Tunis)', 'Sfax'],
  KE: ['Mombasa', 'Nairobi'],
  NG: ['Lagos (Apapa)', 'Tin Can Island', 'Onne', 'Port Harcourt'],
};

/**
 * Generate flag emoji from 2-letter ISO country code
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

/**
 * Returns list of shipping/trade cities for a given country code or name
 */
export function getCitiesForCountry(countryCodeOrName: string): string[] {
  if (!countryCodeOrName) return [];
  const normalized = countryCodeOrName.trim().toLowerCase();

  // Find country code if name or code is passed
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === normalized || c.code.toLowerCase() === normalized
  );

  const code = found ? found.code : countryCodeOrName.toUpperCase();
  return COUNTRY_CITIES[code] || [];
}

/**
 * Parse combined location string (e.g. "Yiwu, China" or "China" or "Minsk, Belarus") into country & city
 */
export function parseLocationString(loc: string): { country: string; city: string; countryCode: string } {
  if (!loc || !loc.trim()) return { country: '', city: '', countryCode: '' };
  
  const raw = loc.trim();
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 1) {
    const single = parts[0];
    // Check if it directly matches a country
    const matchCountry = COUNTRIES.find(
      (c) => c.name.toLowerCase() === single.toLowerCase() || c.code.toLowerCase() === single.toLowerCase()
    );
    if (matchCountry) {
      return { country: matchCountry.name, city: '', countryCode: matchCountry.code };
    }

    // Check if it matches a known city in any country
    for (const [code, cities] of Object.entries(COUNTRY_CITIES)) {
      const matchedCity = cities.find((c) => c.toLowerCase() === single.toLowerCase());
      if (matchedCity) {
        const countryMatch = COUNTRIES.find((c) => c.code === code);
        return {
          country: countryMatch ? countryMatch.name : code,
          city: matchedCity,
          countryCode: code,
        };
      }
    }

    return { country: single, city: '', countryCode: '' };
  }

  if (parts.length >= 2) {
    // Format is "City, Country"
    const city = parts[0];
    const countryPart = parts.slice(1).join(', ').trim();
    const matchCountry = COUNTRIES.find(
      (c) => c.name.toLowerCase() === countryPart.toLowerCase() || c.code.toLowerCase() === countryPart.toLowerCase()
    );

    return {
      country: matchCountry ? matchCountry.name : countryPart,
      city: city,
      countryCode: matchCountry ? matchCountry.code : '',
    };
  }

  return { country: '', city: '', countryCode: '' };
}

/**
 * Format country and city into standardized "City, Country" or "Country"
 */
export function formatLocationString(country: string, city?: string): string {
  if (!country && !city) return '';
  if (!country) return city || '';
  if (!city || !city.trim() || city.trim().toLowerCase() === 'all' || city.trim().toLowerCase() === 'all cities' || city.trim().toLowerCase() === 'any') {
    return country.trim();
  }
  return `${city.trim()}, ${country.trim()}`;
}

