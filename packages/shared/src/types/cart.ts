import { Product, ProductVariant } from './product'

export interface CartItem {
  id: string
  cartId?: string
  productId: string
  variantId?: string | null
  quantity: number
  product: Product
  variant?: ProductVariant | null
}

export interface CartSummary {
  itemCount: number
  totalQuantity: number
  subtotal: number
  totalWeight: number
  shippingEstimate?: number
  taxEstimate?: number
  discountTotal?: number
  grandTotal?: number
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  summary?: CartSummary
  updatedAt?: string | Date
}
