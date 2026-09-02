export const cartPaths = {
  '/api/cart': {
    get: {
      tags: ['Cart'],
      summary: "Get User's Cart",
      description: 'Retrieve the active cart for the authenticated user.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Active shopping cart',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      cart: { $ref: '#/components/schemas/Cart' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
        },
      },
    },
    post: {
      tags: ['Cart'],
      summary: 'Add Item to Cart',
      description: 'Add a product or variant with quantity to the user cart.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string', example: 'prod_9082348923' },
                variantId: { type: 'string', nullable: true, example: null },
                quantity: { type: 'integer', minimum: 1, example: 2 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Item added successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
      },
    },
  },
  '/api/cart/items/{id}': {
    put: {
      tags: ['Cart'],
      summary: 'Update Cart Item Quantity',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['quantity'],
              properties: {
                quantity: { type: 'integer', minimum: 1, example: 5 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Quantity updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
      },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Remove Item From Cart',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Item removed from cart',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
      },
    },
  },
}
