export const productPaths = {
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'List Products',
      description: 'Fetch paginated product catalog with search, category filtering, and sorting.',
      parameters: [
        { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category slug or ID' },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for product name/SKU' },
        { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Minimum price filter' },
        { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Maximum price filter' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
      ],
      responses: {
        200: {
          description: 'List of matching products',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 140 },
                      page: { type: 'integer', example: 1 },
                      totalPages: { type: 'integer', example: 7 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get Product Details',
      description: 'Fetch full product details by ID or slug including variants and tiered pricing.',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Product ID or SKU' },
      ],
      responses: {
        200: {
          description: 'Product details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  product: { $ref: '#/components/schemas/Product' },
                },
              },
            },
          },
        },
        404: {
          description: 'Product not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
        },
      },
    },
  },
}
