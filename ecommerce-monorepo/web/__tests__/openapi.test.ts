import { describe, it, expect } from 'vitest'
import { getOpenAPISpecification } from '../lib/openapi'

describe('OpenAPI Specification Generator', () => {
  const spec = getOpenAPISpecification('https://yiwuexpress.com')

  it('generates valid OpenAPI 3.0.3 metadata', () => {
    expect(spec.openapi).toBe('3.0.3')
    expect(spec.info.title).toContain('Global Trade')
    expect(spec.info.version).toBe('1.0.0')
  })

  it('includes security schemes for JWT Bearer and Cookies', () => {
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined()
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http')
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
    expect(spec.components.securitySchemes.cookieAuth).toBeDefined()
  })

  it('includes essential reusable entity schemas', () => {
    const { schemas } = spec.components
    expect(schemas.User).toBeDefined()
    expect(schemas.Product).toBeDefined()
    expect(schemas.Category).toBeDefined()
    expect(schemas.Cart).toBeDefined()
    expect(schemas.Order).toBeDefined()
    expect(schemas.ApiResponse).toBeDefined()
    expect(schemas.ApiError).toBeDefined()
  })

  it('documents critical API route paths', () => {
    const { paths } = spec
    expect(paths['/api/auth/login']).toBeDefined()
    expect(paths['/api/auth/register']).toBeDefined()
    expect(paths['/api/products']).toBeDefined()
    expect(paths['/api/products/{id}']).toBeDefined()
    expect(paths['/api/categories']).toBeDefined()
    expect(paths['/api/cart']).toBeDefined()
    expect(paths['/api/checkout']).toBeDefined()
    expect(paths['/api/orders']).toBeDefined()
    expect(paths['/api/wholesale-inquiry']).toBeDefined()
    expect(paths['/api/settings/public']).toBeDefined()
  })
})
