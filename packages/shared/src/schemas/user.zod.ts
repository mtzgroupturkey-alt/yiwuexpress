import { z } from 'zod'

export const UserAddressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  company: z.string().nullable().optional(),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().nullable().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().nullable().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  businessType: z.string().optional(),
  country: z.string().optional(),
})

export const UserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  profilePhoto: z.string().nullable().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type UserAddressInput = z.infer<typeof UserAddressSchema>
export type UserProfileInput = z.infer<typeof UserProfileSchema>
