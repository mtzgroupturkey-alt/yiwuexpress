import { z } from 'zod'

export const WholesaleInquiryItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be positive'),
  targetPrice: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const WholesaleInquirySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(2, 'Business type is required'),
  country: z.string().min(2, 'Country is required'),
  products: z.array(WholesaleInquiryItemSchema).min(1, 'At least one product is required'),
  paymentTerms: z.string().default('T/T'),
  shippingTerms: z.string().default('FOB'),
  preferredShipping: z.string().default('SEA_FREIGHT'),
  targetPrice: z.number().positive().optional(),
  estimatedOrderValue: z.number().positive().optional(),
  customerNotes: z.string().optional(),
})

export type WholesaleInquiryInput = z.infer<typeof WholesaleInquirySchema>
