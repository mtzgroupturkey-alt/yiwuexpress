import { z } from 'zod'

export const CheckoutSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Valid customer email is required'),
  customerPhone: z.string().min(5, 'Valid customer phone is required'),
  companyName: z.string().nullable().optional(),
  shippingAddress: z.string().min(3, 'Shipping address is required'),
  shippingCity: z.string().min(1, 'Shipping city is required'),
  shippingState: z.string().nullable().optional(),
  shippingPostalCode: z.string().min(1, 'Postal code is required'),
  shippingCountryId: z.string().min(1, 'Destination country is required'),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'WECHAT_PAY', 'ALIPAY']),
  customerNotes: z.string().nullable().optional(),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'IN_TRANSIT',
    'CUSTOMS_HOLD',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional(),
})

export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
