// Row 1: Top Menu - Static Pages ONLY
export const topMenuItems = [
  { name: 'HOME', path: '/', icon: null, hasDropdown: false },
  { name: 'SHOP', path: '/products', hasDropdown: true, icon: null },
  { name: 'SERVICES', path: '/services', icon: null, hasDropdown: false },
  { name: 'ABOUT', path: '/about', icon: null, hasDropdown: false },
  { name: 'CONTACT', path: '/contact', icon: null, hasDropdown: false },
  { name: 'WHOLESALE', path: '/wholesale', icon: null, hasDropdown: false },
]

// Row 2: Category Menu - Dynamic (from database or static)
export interface CategoryMenuItem {
  id: string
  name: string
  slug: string
  image?: string
  children?: CategoryMenuItem[]
  productCount?: number
  level?: number
  displayOrder?: number
}

// Static categories (fallback if no database)
export const staticCategories: CategoryMenuItem[] = [
  {
    id: '1',
    name: 'COOKWARE',
    slug: 'cookware',
    productCount: 245,
    children: [
      { id: '1-1', name: 'Stainless Steel', slug: 'cookware/stainless-steel', productCount: 45 },
      { id: '1-2', name: 'Non-Stick', slug: 'cookware/non-stick', productCount: 56 },
      { id: '1-3', name: 'Cast Iron', slug: 'cookware/cast-iron', productCount: 32 },
      { id: '1-4', name: 'Copper', slug: 'cookware/copper', productCount: 28 },
      { id: '1-5', name: 'Pressure Cookers', slug: 'cookware/pressure-cookers', productCount: 24 },
      { id: '1-6', name: 'Woks', slug: 'cookware/woks', productCount: 18 },
    ],
  },
  {
    id: '2',
    name: 'BAKEWARE',
    slug: 'bakeware',
    productCount: 156,
    children: [
      { id: '2-1', name: 'Baking Sheets', slug: 'bakeware/baking-sheets', productCount: 28 },
      { id: '2-2', name: 'Muffin Tins', slug: 'bakeware/muffin-tins', productCount: 22 },
      { id: '2-3', name: 'Cake Pans', slug: 'bakeware/cake-pans', productCount: 34 },
      { id: '2-4', name: 'Pizza Pans', slug: 'bakeware/pizza-pans', productCount: 18 },
      { id: '2-5', name: 'Cooling Racks', slug: 'bakeware/cooling-racks', productCount: 14 },
      { id: '2-6', name: 'Bread Pans', slug: 'bakeware/bread-pans', productCount: 18 },
    ],
  },
  {
    id: '3',
    name: 'UTENSILS',
    slug: 'utensils',
    productCount: 189,
    children: [
      { id: '3-1', name: 'Spatulas', slug: 'utensils/spatulas', productCount: 32 },
      { id: '3-2', name: 'Whisks', slug: 'utensils/whisks', productCount: 24 },
      { id: '3-3', name: 'Measuring Tools', slug: 'utensils/measuring', productCount: 38 },
      { id: '3-4', name: 'Graters', slug: 'utensils/graters', productCount: 22 },
      { id: '3-5', name: 'Openers', slug: 'utensils/openers', productCount: 16 },
      { id: '3-6', name: 'Scissors', slug: 'utensils/scissors', productCount: 18 },
    ],
  },
  {
    id: '4',
    name: 'APPLIANCES',
    slug: 'appliances',
    productCount: 134,
    children: [
      { id: '4-1', name: 'Electric Kettles', slug: 'appliances/electric-kettles', productCount: 24 },
      { id: '4-2', name: 'Coffee Makers', slug: 'appliances/coffee-makers', productCount: 21 },
      { id: '4-3', name: 'Blenders', slug: 'appliances/blenders', productCount: 28 },
      { id: '4-4', name: 'Rice Cookers', slug: 'appliances/rice-cookers', productCount: 18 },
      { id: '4-5', name: 'Air Fryers', slug: 'appliances/air-fryers', productCount: 22 },
      { id: '4-6', name: 'Toasters', slug: 'appliances/toasters', productCount: 16 },
    ],
  },
  {
    id: '5',
    name: 'TABLEWARE',
    slug: 'tableware',
    productCount: 178,
    children: [
      { id: '5-1', name: 'Dinner Sets', slug: 'tableware/dinner-sets', productCount: 42 },
      { id: '5-2', name: 'Bowls', slug: 'tableware/bowls', productCount: 36 },
      { id: '5-3', name: 'Cups & Mugs', slug: 'tableware/cups-mugs', productCount: 48 },
      { id: '5-4', name: 'Serveware', slug: 'tableware/serveware', productCount: 31 },
      { id: '5-5', name: 'Cutlery Sets', slug: 'tableware/cutlery', productCount: 35 },
      { id: '5-6', name: 'Glassware', slug: 'tableware/glassware', productCount: 29 },
    ],
  },
]
