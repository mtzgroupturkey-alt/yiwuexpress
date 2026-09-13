export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'CUSTOMS_HOLD'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'WECHAT_PAY' | 'ALIPAY'

export interface OrderItem {
  id: string
  orderId?: string
  productId: string
  variantId?: string | null
  productName: string
  productSku: string
  productImage?: string | null
  variantAttributes?: Record<string, any> | null
  quantity: number
  price: number
  total: number
  status?: string
}

export interface TrackingCheckpoint {
  status: string
  timestamp: string
  location: string
  description?: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName?: string | null
  shippingAddress: string
  shippingCity: string
  shippingState?: string | null
  shippingPostalCode: string
  shippingCountryId: string
  status: OrderStatus
  paymentMethod: PaymentMethod | string
  paymentStatus: PaymentStatus
  paidAt?: string | Date | null
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  total: number
  currency: string
  carrier?: string | null
  trackingNumber?: string | null
  shippedAt?: string | Date | null
  trackingHistory?: TrackingCheckpoint[]
  items: OrderItem[]
  createdAt: string | Date
  updatedAt: string | Date
}
