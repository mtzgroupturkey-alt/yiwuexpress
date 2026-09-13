export type UserRole = 'USER' | 'CUSTOMER' | 'ADMIN' | 'SUPPLIER'

export interface UserAddress {
  id?: string
  userId?: string
  fullName: string
  phone: string
  company?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode: string
  country: string
  isDefault?: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string | null
  companyName?: string | null
  businessType?: string | null
  taxId?: string | null
  country?: string | null
  profilePhoto?: string | null
  isActive: boolean
  isVerified?: boolean
  addresses?: UserAddress[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: number
}
