import { z } from 'zod'

export const TieredPriceSchema = z.object({
  id: z.string().optional(),
  minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1'),
  maxQuantity: z.number().int().positive().nullable().optional(),
  price: z.number().positive('Tiered price must be positive'),
})

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  attributes: z.record(z.any()).default({}),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  tieredPrices: z.array(TieredPriceSchema).optional(),
})

export const ProductSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'Product SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().nullable().optional(),
  wholesalePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(10),
  weightKg: z.number().positive().default(0.1),
  images: z.array(z.string()).default([]),
  thumbnail: z.string().nullable().optional(),
  videos: z.array(z.string()).default([]),
  countryOfOrigin: z.string().default('China'),
  minOrderQty: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
  variants: z.array(ProductVariantSchema).optional(),
})

export type ProductInput = z.infer<typeof ProductSchema>
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>
