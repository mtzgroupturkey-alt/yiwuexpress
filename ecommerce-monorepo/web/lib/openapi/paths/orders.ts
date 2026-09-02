export const orderPaths = {
  '/api/orders': {
    get: {
      tags: ['Orders'],
      summary: 'List User Orders',
      description: 'Get paginated orders for the logged-in customer or all orders if admin.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by order status' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: {
          description: 'List of orders',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Get Order by ID',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Order details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  order: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
        },
      },
    },
  },
}
