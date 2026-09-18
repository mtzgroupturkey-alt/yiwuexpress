export interface ProductReview {
  id: string;
  author: string;
  avatarText?: string;
  verified: boolean;
  rating: number;
  date: string;
  content: string;
  photos?: string[];
}

export interface ProductSpecGroup {
  category: string;
  items: { label: string; value: string }[];
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  category: string;
  department?: string;
  categoryId?: string;
  categorySlug?: string;
  departmentId?: string;
  departmentSlug?: string;
  brand: string;
  originOrType?: string;
  rating: number;
  reviewsCount: number;
  price: number;
  oldPrice?: number;
  unitPrice?: string;
  discountBadge?: string;
  tagBadge?: {
    text: string;
    type: 'hot' | 'bestseller' | 'warranty' | 'promo' | 'spec';
  };
  claimedPercent?: number;
  stockLeft?: number;
  image: string;
  images?: string[];
  inStock: boolean;
  isExpressDelivery?: boolean;
  specs?: string[];
  detailedSpecs?: ProductSpecGroup[];
  installmentPrice?: string;
  description?: string;
  country?: string;
  sku?: string;
  article?: string;
  minOrderQty?: number;
  dietaryTag?: string;
  finishVariants?: { name: string; colorHex: string }[];
  customerReviews?: ProductReview[];
}

export interface FilterState {
  category: string;
  department: string;
  brand: string[];
  minPrice: number;
  maxPrice: number;
  rating: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  expressOnly: boolean;
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
  viewMode: 'grid' | 'list';
}

export interface Category {
  id: string;
  name: string;
  itemCount: number;
  icon: string;
  image?: string | null;
  slug: string;
  parentId?: string | null;
  level?: number;
  isFeatured?: boolean;
  showInMenu?: boolean;
  menuOrder?: number;
  displayOrder?: number;
  subcategories?: string[];
  children?: Category[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Department {
  id: string;
  name: string;
  itemCount: number;
  subcategories: string[];
}

export interface Order {
  id: string;
  date: string;
  status: 'courier_dispatch' | 'delivered' | 'processing';
  statusText: string;
  itemsCount: number;
  total: number;
  eta: string;
  address: string;
}
