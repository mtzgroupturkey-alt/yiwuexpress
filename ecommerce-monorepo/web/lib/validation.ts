import { z } from 'zod'

// Business Registration Schema
export const registerSchema = z.object({
  email: z.string().email('Valid business email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['IMPORTER', 'EXPORTER', 'MANUFACTURER', 'DISTRIBUTOR', 'OTHER']),
  taxId: z.string().optional(),
  phone: z.string().min(10, 'Valid phone number is required'),
})

// Business Login Schema
export const loginSchema = z.object({
  email: z.string().email('Valid business email is required'),
  password: z.string().min(1, 'Password is required'),
})

// Service Schema (Logistics Services)
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().min(10, 'Service description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  duration: z.string().min(1, 'Duration estimate is required'),
  coverage: z.string().min(1, 'Coverage area is required'),
  type: z.enum(['shipping', 'customs', 'warehousing', 'sourcing']),
})

// Quote Request Schema
export const quoteRequestSchema = z.object({
  serviceId: z.string().min(1, 'Service selection is required'),
  weight: z.number().positive('Weight must be positive').optional(),
  dimensions: z.string().optional(),
  origin: z.string().min(3, 'Origin is required'),
  destination: z.string().min(3, 'Destination is required'),
  description: z.string().min(10, 'Package description is required'),
  specialRequirements: z.string().optional(),
})

// Shipment Tracking Schema
export const trackingSchema = z.object({
  trackingNumber: z.string().min(10, 'Valid tracking number is required'),
})

// Company Information Schema
export const companyInfoSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  address: z.string().min(10, 'Complete address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid business email is required'),
  licenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url('Valid website URL is required').optional(),
})

// Shipping Calculator Schema
export const shippingCalculatorSchema = z.object({
  origin: z.string().min(3, 'Origin is required'),
  destination: z.string().min(3, 'Destination is required'),
  weight: z.number().positive('Weight must be positive'),
  dimensions: z.object({
    length: z.number().positive('Length must be positive'),
    width: z.number().positive('Width must be positive'),
    height: z.number().positive('Height must be positive'),
  }),
  serviceType: z.enum(['AIR', 'SEA', 'EXPRESS']),
  insuranceRequired: z.boolean().default(false),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>
export type TrackingInput = z.infer<typeof trackingSchema>
export type CompanyInfoInput = z.infer<typeof companyInfoSchema>
export type ShippingCalculatorInput = z.infer<typeof shippingCalculatorSchema>