export const ROLES = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SUPPLIER: 'SUPPLIER',
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSION_RESOURCES = [
  'products',
  'orders',
  'users',
  'quotes',
  'shipments',
  'settings',
  'reports',
] as const

export type PermissionResourceType = (typeof PERMISSION_RESOURCES)[number]
