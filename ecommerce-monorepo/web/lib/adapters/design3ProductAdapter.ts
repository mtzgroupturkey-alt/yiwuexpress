import { Product, Category } from '@/app/[locale]/design-3/types';
import { normalizeProductImageUrl } from '@/lib/image-utils';

export function mapDbProductToDesign3(dbItem: any): Product {
  const price = typeof dbItem.price === 'number' ? dbItem.price : parseFloat(dbItem.price || '0');
  const compareAtPrice = dbItem.compareAtPrice 
    ? (typeof dbItem.compareAtPrice === 'number' ? dbItem.compareAtPrice : parseFloat(dbItem.compareAtPrice))
    : undefined;

  let discountBadge: string | undefined = undefined;
  if (compareAtPrice && compareAtPrice > price) {
    const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    discountBadge = `-${pct}%`;
  }

  const categoryName = dbItem.category?.name || dbItem.categoryName || 'General';
  const departmentName = dbItem.category?.parent?.name || categoryName;
  const categoryId = dbItem.categoryId || dbItem.category?.id || undefined;
  const categorySlug = dbItem.category?.slug || undefined;
  const departmentId = dbItem.category?.parent?.id || dbItem.category?.parentId || undefined;
  const departmentSlug = dbItem.category?.parent?.slug || undefined;

  const rawImage = dbItem.thumbnail || 
    (Array.isArray(dbItem.images) && dbItem.images.length > 0 ? dbItem.images[0] : null);
  const image = normalizeProductImageUrl(rawImage, categoryName, dbItem.name);

  const stock = typeof dbItem.stock === 'number' ? dbItem.stock : 10;

  const wholesalePrice = dbItem.wholesalePrice != null
    ? (typeof dbItem.wholesalePrice === 'number' ? dbItem.wholesalePrice : parseFloat(dbItem.wholesalePrice))
    : undefined;
  const minOrderQty = dbItem.minOrderQty ? Number(dbItem.minOrderQty) : (dbItem.moq ? Number(dbItem.moq) : undefined);

  return {
    id: dbItem.id || String(Math.random()),
    slug: dbItem.slug || undefined,
    name: dbItem.name || 'Industrial Product',
    category: categoryName,
    department: departmentName,
    categoryId,
    categorySlug,
    departmentId,
    departmentSlug,
    brand: dbItem.brand || 'Official Sourcing',
    originOrType: dbItem.countryOfOrigin || 'China Factory',
    rating: dbItem.rating || 4.9,
    reviewsCount: dbItem.reviewsCount || Math.floor(Math.random() * 40) + 5,
    price: price,
    oldPrice: compareAtPrice,
    wholesalePrice: wholesalePrice,
    moq: minOrderQty,
    discountBadge: discountBadge,
    tagBadge: dbItem.isFeatured 
      ? { text: 'BESTSELLER', type: 'bestseller' } 
      : dbItem.isNewArrival 
      ? { text: 'NEW', type: 'promo' } 
      : undefined,
    claimedPercent: dbItem.isFlashSale ? Math.floor(Math.random() * 40) + 50 : undefined,
    stockLeft: stock,
    image: image,
    images: Array.isArray(dbItem.images) && dbItem.images.length > 0
      ? dbItem.images.map((img: string) => normalizeProductImageUrl(img, categoryName, dbItem.name))
      : [image],
    inStock: stock > 0,
    isExpressDelivery: Boolean(dbItem.isFeatured || stock > 15),
    description: dbItem.description || '',
    country: dbItem.countryOfOrigin || 'China',
    sku: dbItem.sku || undefined,
    minOrderQty: minOrderQty,
    material: dbItem.material || undefined,
    weightKg: dbItem.weightKg || undefined,
    dimensions: dbItem.dimensions || undefined,
    attributes: dbItem.attributes || undefined,
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  clothing: 'Shirt',
  electronics: 'Cpu',
  machinery: 'Cog',
  tools: 'Wrench',
  hardware: 'Hammer',
  home: 'Home',
  kitchen: 'Utensils',
  lighting: 'Lightbulb',
  beauty: 'Sparkles',
  automotive: 'Car',
  textiles: 'Layers',
  default: 'ShoppingBag',
};

export function mapDbCategoryToDesign3(dbCat: any): Category {
  const slug = (dbCat.slug || '').toLowerCase();
  
  // Prioritize icon configured directly in admin panel / database
  let iconName = dbCat.icon && typeof dbCat.icon === 'string' && dbCat.icon.trim() ? dbCat.icon.trim() : null;

  if (!iconName) {
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (slug.includes(key)) {
        iconName = icon;
        break;
      }
    }
  }

  const rawCount = typeof dbCat.itemCount === 'number'
    ? dbCat.itemCount
    : typeof dbCat.productCount === 'number'
    ? dbCat.productCount
    : dbCat._count?.products;
  const itemCount = typeof rawCount === 'number' ? rawCount : 0;

  const children = Array.isArray(dbCat.children) && dbCat.children.length > 0
    ? dbCat.children.map(mapDbCategoryToDesign3)
    : undefined;

  return {
    id: dbCat.id,
    name: dbCat.name,
    slug: dbCat.slug,
    itemCount,
    icon: iconName || 'ShoppingBag',
    image: dbCat.image || null,
    parentId: dbCat.parentId || null,
    level: typeof dbCat.level === 'number' ? dbCat.level : (dbCat.parentId ? 2 : 1),
    isFeatured: Boolean(dbCat.isFeatured),
    showInMenu: dbCat.showInMenu !== false,
    menuOrder: typeof dbCat.menuOrder === 'number' ? dbCat.menuOrder : 0,
    displayOrder: typeof dbCat.displayOrder === 'number' ? dbCat.displayOrder : 0,
    children,
  };
}
