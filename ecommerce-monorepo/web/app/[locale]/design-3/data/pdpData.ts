import { Product } from '../types';

export interface BundleItem {
  name: string;
  price: number;
  oldPrice: number;
  image1: string;
  image2: string;
}

export const PHILIPS_PDP_PRODUCT: Product = {
  id: 'philips-3200-lattego',
  name: 'Philips Series 3200 Fully Automatic Espresso Machine (LatteGo System, EP3246/70)',
  category: 'appliances',
  department: 'Home & Kitchen',
  brand: 'Philips Domestic',
  originOrType: 'Romania (Engineered in Netherlands)',
  article: 'PH-3246-70',
  sku: '94018241',
  rating: 4.9,
  reviewsCount: 348,
  price: 489.00,
  oldPrice: 579.00,
  discountBadge: '-15%',
  tagBadge: {
    text: 'BEST SELLER',
    type: 'hot',
  },
  inStock: true,
  isExpressDelivery: true,
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeAhivWzecPKR-d8wF4R9CQoBVdY4YO4cZ0_08GYF740sictNGDnLe-9sFeFaJhln0X3ytBsf_dr41pLNXHT0PFC1ze6JpWqNetSUtXCn1jRcct8jmhemJPzkeG_5RwkUGHp3YTYjUC_b0qEzbPBEBtLaza8dF0zSZp4jxXRHDZy6XRlN4ugJ_CTyWLwg3FD45g0YRkeUdKk4jlGAnPmLjayH9lZs3N08Ntz7w9PGL4wG2brNDV5CK',
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDeAhivWzecPKR-d8wF4R9CQoBVdY4YO4cZ0_08GYF740sictNGDnLe-9sFeFaJhln0X3ytBsf_dr41pLNXHT0PFC1ze6JpWqNetSUtXCn1jRcct8jmhemJPzkeG_5RwkUGHp3YTYjUC_b0qEzbPBEBtLaza8dF0zSZp4jxXRHDZy6XRlN4ugJ_CTyWLwg3FD45g0YRkeUdKk4jlGAnPmLjayH9lZs3N08Ntz7w9PGL4wG2brNDV5CK',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC_hlDdVvKrOT5-ecW-AIEA2kYh6yq5G05N97DakFJQdstvavEUKCmQMrLHKZmI8LHvu5N6QWYMEKXY6CJqN68PnBScjVViD_QPY4ry44-fB8T3-60BJMprKHmYKHH9x4_04nKOuAe2HLlEVBTZoLfYA9p5AYBqnVrq1YmVplbhc6HiwmC3vVUcWQD376pNJBucTNrM6CyghDCxUcTehWE1yMZIHVcHZYNuYdSiAVV5UQk4r_fDPCbf',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAy5oy8kwe1hNhehcBBTmTIztjM5IZaKbCTgxVftOhjkvc30bOCSjYtYXzBm12md3xi1pBBWYOR6GWXidSB6WUS8wBrQryeVgZifMYX-z9JdbGBLAFiOoQFP4rXVoyTQLZvqq8kB7EIz9Ka75eEv2u4of6cc1tcRuotRC9G5ATG-_hnx7hrl3JSNdQPLeH4ZGQhwYn9RAlQ0t_CySHOG8JBoLnwhaCWQh47RU8RpeP-i0U-ed0HJ3HD',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA0aqm9-tSF85zc1Bqf1oe43SMcQOipL0o2sswLWfREG1q8Ac2jL85HXvPX41njchWaDIQQZs5AT1doJR0jVuzlo-JW_V0H487g-x65aWgh6lUO8xL1FfsvNAKzG7PAkpHp5ogXQIhtMYb19JAFru3qvtiDdTc6tAlxG0LHD3gY0k4LkBPsfZpQi-r6-rR9ERK56r1RANUwqTvrrSIq7SC3f_Mwl0LJVUgjnSrLjG9Slpq-dD2hEC0k',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB3Fl1b2dDx_2NCc1tSHhMGPjeX5Zdk0m383RtESFzmiPgC_O3ZkZxs_chTFflw5awGMwH_MyMPJVUpYXGEZExV631aNBtLD4Izx02VZ3uGtpm83uDRZhCjt7hJVtzYG2kyfWpQniAXA42Rwahfv82tSURdR98-6-EMY-4eE1n7cQ7nFgIjtJxdS6M-lO3A4g1KoonSX77JXZYx0kZCNzcROiRucdSAvqi9P7w62q2kLjwl4a7IhOl3',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuClGQ-thmcTdNc7I7RvneepZYjN9rq1FqSfGsfCTteZmJGIUlgk0sEfxJHom3VuOwo5dEEl7SNzkei-xQeJTr3475hmAA23UBwX0k5W8MqSmenn2i6JQcARPuubkfJELFqE26S6BVKMpwYnl17wRenisTFbc51sPBswCkwIQJop64nIsDv3IW1uRViaw3rdgxspnLgQb4w5sVkIV8eYc6aHbMrQHgMXMbdSW6LZER6srhyBUf59euCL',
  ],
  installmentPrice: '$40.75 / month',
  specs: [
    '15 Bar Italian High Pressure',
    '100% Ceramic Grinder (12-step)',
    'LatteGo 2-Part Milk Carafe (No tubes)',
    '1.8L AquaClean Water Tank',
  ],
  finishVariants: [
    { name: 'Piano Black & Silver Chrome', colorHex: '#0F172A' },
    { name: 'Brushed Stainless Steel', colorHex: '#CBD5E1' },
    { name: 'Matte Satin Black', colorHex: '#44403C' },
  ],
  detailedSpecs: [
    {
      category: 'General Parameters',
      items: [
        { label: 'Type', value: 'Fully Automatic Espresso Machine' },
        { label: 'Model Series', value: 'Series 3200 LatteGo' },
        { label: 'Country of Origin', value: 'Romania (Engineered in Netherlands)' },
        { label: 'Manufacturer Warranty', value: '24 months official' },
      ],
    },
    {
      category: 'Brewing & Performance',
      items: [
        { label: 'Pump Pressure', value: '15 Bar Italian High Pressure' },
        { label: 'Grinder Type', value: 'Ceramic Burrs (12 Adjustment Grades)' },
        { label: 'Coffee Type Used', value: 'Whole Bean, Ground Coffee Compartment' },
        { label: 'Aroma Seal Hopper', value: '275 grams capacity' },
      ],
    },
    {
      category: 'Milk & Drinks',
      items: [
        { label: 'Frothing System', value: 'LatteGo Tube-Free Frother' },
        { label: 'Preset Beverages', value: 'Espresso, Coffee, Cappuccino, Latte Macchiato, Americano' },
        { label: 'Customization Memory', value: 'Aroma strength (3), Volume (3), Temperature (3)' },
      ],
    },
    {
      category: 'Dimensions & Maintenance',
      items: [
        { label: 'Dimensions (W × H × D)', value: '246 × 371 × 433 mm' },
        { label: 'Product Weight', value: '8.0 kg' },
        { label: 'Descaling Frequency', value: 'Up to 5,000 cups with AquaClean Filter' },
      ],
    },
  ],
  customerReviews: [
    {
      id: 'rev-1',
      author: 'Dmitry K.',
      avatarText: 'DK',
      verified: true,
      rating: 5,
      date: 'Purchased 3 weeks ago • Delivery to Minsk',
      content:
        'Best automatic machine in this price segment! The LatteGo system is sheer engineering genius — cleaning milk carafe takes literally 15 seconds under running warm tap water without messy rubber tubes. Espresso extraction has thick hazelnut crema.',
      photos: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuALlahsOrU2DtDGS-NjSgerySJspzQkjSqzeRNatYyhaoACl1H6BQ9-t_VViaG198T-7e5MTjcnvUK25hngwhCxmFbYSsS3VfD-bK-7yaa9HGbEclA98d_h3JKyzAhuTZEInqbngn9T74Tp9aCuaKTk8am5Ji-uQKJAG8rQN05DJCWJ-7DNV3Buw2ht_vlJ85quR25y3Dz_uBxI5gDBVaYVM5xCeqM19tKCIaXnhG76BI1h-dl31hRr',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDug1lEU2PaXbkjxnP1Z56QsD2fbqvz0vtjMJRMc4wwH9beZf0JgEhQ7G01Cw9wptjhnlcr3F_gnOThpZJeycdv5QBGz3MsrbO4nRinJZgVUPhbnhwoLeNbguVJmPYKkPaANL7XZFymWuAQZ8O_3bmMnn2o4KWYyi2xVTWMTS3WVUw7pruk3NXYlcl1q0zM11UzPDwGUHxRw0_D7LcgstBl_mjAr5omZu-93G2taZnobio8lxIpP1-q',
      ],
    },
    {
      id: 'rev-2',
      author: 'Olga Levitskaya',
      avatarText: 'OL',
      verified: true,
      rating: 5,
      date: 'Purchased 1 month ago • Pickup Point #4',
      content:
        'Intuitive touch control panel allows my kids to make hot milk/cocoa foam easily and my husband adjusts coffee strength in 1 tap. Delivery was exact within the promised time frame.',
    },
  ],
};

export const SIMILAR_COFFEE_MACHINES: Product[] = [
  {
    id: 'sim-1',
    name: "De'Longhi Magnifica S Smart ECAM250.23.SB",
    category: 'appliances',
    department: 'Home & Kitchen',
    brand: "De'Longhi",
    originOrType: 'Italy',
    rating: 4.8,
    reviewsCount: 210,
    price: 429.00,
    oldPrice: 489.00,
    discountBadge: '-12%',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGc-_MH5Lswv1dO7GqyLTgnSea0X_j-qGLqJkp72HEnKd6iB71gE2dCCJ-NQ3E3Xdie-LaDWZJtqGaD_wlzZmBjUcSgynU0nUAzgwvGi6BJ02LV2gSEIwJnK1W-51Zcx72ZfZcyckEgC_dhCLEzG2Bfqw-9s9zRsieufs_zVnqf_4WIRVv1gOcRTKYbSDZJTNP_g0ZyQxwJ0Pr2HNwSMPTN6f4Vso-DSK2j6JWAdx-Rfcwg2JUKXs9',
    inStock: true,
    isExpressDelivery: true,
  },
  {
    id: 'sim-2',
    name: 'Philips Series 2200 Classic Milk Frother EP2220/10',
    category: 'appliances',
    department: 'Home & Kitchen',
    brand: 'Philips',
    originOrType: 'Netherlands',
    rating: 4.7,
    reviewsCount: 419,
    price: 369.00,
    oldPrice: 420.00,
    discountBadge: 'HIT',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy8edT7YApWUKWmvFbONWkpF7zcgTDZ0T4qbuxcN-gUF79QJ1-2dk04xzjI6BajU-NrMTVxCDocUYTif2SRlHVIZ6Z1-zGt8yheq_ONmnnxJoh-D7CKFtZN71_YNl8Uchs42I1TwOB5XkXUhao92XnlwgL9HzGKg2pAdE15uWH3Nl1dbZPRgsmz-nfhRXxvF-pgrKAXY5TMb6XUDAB43-TxDVlEmeMqvVLVB2J_98cspkXoCCk4m2n',
    inStock: true,
    isExpressDelivery: true,
  },
  {
    id: 'sim-3',
    name: 'Krups Arabica EA8110 Compact Espresso Maker',
    category: 'appliances',
    department: 'Home & Kitchen',
    brand: 'Krups',
    originOrType: 'Germany',
    rating: 4.6,
    reviewsCount: 96,
    price: 319.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJZKIkD6xv0gthYBqx_8mC6Nqx8YjLdlDQsuEDyICsHMlsS4zKbu4mRCXyW_cxxJ818v-Tc2mdjgsAS6RBAE-kCar9mVeBiiZZAOisvZ9scOFRworeJU_1N3fOaAmFIJjU5Ijxb3RwJpZwQePdo_Fb1uwVKRsAiIzPhsCO7NMfrhJo0B6FMmDW7Uo0YJNpCwaauThycdXVTk4HENuEfBpLKaLUl7o6EN6wYGwDyLI0ZvOdq53bZRW2',
    inStock: true,
    isExpressDelivery: false,
  },
  {
    id: 'sim-4',
    name: 'Siemens EQ.6 Plus s500 Fully Automatic',
    category: 'appliances',
    department: 'Home & Kitchen',
    brand: 'Siemens',
    originOrType: 'Germany',
    rating: 4.9,
    reviewsCount: 184,
    price: 799.00,
    oldPrice: 970.00,
    discountBadge: '-18%',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG6JtaFz37xWurGCXwJGno6FCpEcD9cGy0QNGsgkH8CBtgV2H9AZOnHx89hoJ_pkrSfb9_syprh9EQE7Z-3AWkr8n2V1xQuPm1nN6v-XE8QigFABXdnOvvPxtHoR8gEDVmAWiGnrIFiP32G8NfccxTRJtavZIFICae2VMr07BbE0xol6yO3g_sc2Thl1276MAHPcTOCo4BYD-f3XPFjiz08MSYr32YQREIFao467SEaW8-urDP8XwG',
    inStock: true,
    isExpressDelivery: true,
  },
];
