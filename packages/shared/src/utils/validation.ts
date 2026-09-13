import { ZodSchema, ZodError } from 'zod'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string>
}

export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  if (result.error instanceof ZodError) {
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join('.') || '_root'
      if (!errors[fieldPath]) {
        errors[fieldPath] = issue.message
      }
    }
  }

  return { success: false, errors }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidSku(sku: string): boolean {
  return typeof sku === 'string' && sku.trim().length >= 3 && /^[A-Za-z0-9-_]+$/.test(sku)
}
