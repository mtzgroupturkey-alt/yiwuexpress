import { reusableSchemas } from './components'
import { securitySchemes, defaultSecurity } from './security'
import { authPaths } from './paths/auth'
import { productPaths } from './paths/products'
import { categoryPaths } from './paths/categories'
import { cartPaths } from './paths/cart'
import { checkoutPaths } from './paths/checkout'
import { orderPaths } from './paths/orders'
import { quotePaths } from './paths/quotes'
import { userPaths } from './paths/users'
import { settingPaths } from './paths/settings'

export function getOpenAPISpecification(host = 'https://yiwuexpress.com') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Global Trade E-Commerce & Freight API',
      version: '1.0.0',
      description:
        'REST API documentation for B2B/B2C E-Commerce, Logistics, Sourcing, and Order Management from China.',
      contact: {
        name: 'API Support',
        email: 'support@yiwuexpress.com',
      },
    },
    servers: [
      {
        url: host,
        description: 'Current Environment Server',
      },
      {
        url: 'https://yiwuexpress.com',
        description: 'Production API Gateway',
      },
      {
        url: 'http://localhost:3001',
        description: 'Local Development Server',
      },
    ],
    components: {
      schemas: reusableSchemas,
      securitySchemes,
    },
    security: defaultSecurity,
    paths: {
      ...authPaths,
      ...productPaths,
      ...categoryPaths,
      ...cartPaths,
      ...checkoutPaths,
      ...orderPaths,
      ...quotePaths,
      ...userPaths,
      ...settingPaths,
    },
  }
}
