export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  icon?: string | null
  parentId?: string | null
  level?: number
  displayOrder?: number
  isActive: boolean
}

export interface TieredPrice {
  id?: string
  minQuantity: number
  maxQuantity?: number | null
  price: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  price: number
  comparePrice?: number | null
  stock: number
  attributes: Record<string, any>
  images?: string[]
  isActive?: boolean
  tieredPrices?: TieredPrice[]
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description?: string | null
  price: number
  compareAtPrice?: number | null
  wholesalePrice?: number | null
  costPrice?: number | null
  stock: number
  lowStockThreshold?: number
  weightKg?: number
  images: string[]
  thumbnail?: string | null
  videos?: string[]
  countryOfOrigin?: string
  minOrderQty?: number
  isActive: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  isFlashSale?: boolean
  categoryId?: string | null
  category?: Category | null
  variants?: ProductVariant[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface ProductFilterParams {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sort?: string
  storeMode?: 'WHOLESALE' | 'RETAIL' | 'BOTH'
}
