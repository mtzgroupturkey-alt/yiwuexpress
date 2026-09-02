export const checkoutPaths = {
  '/api/checkout': {
    post: {
      tags: ['Checkout'],
      summary: 'Process Checkout',
      description: 'Convert active cart to a confirmed order with shipping and tax calculations.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'customerName',
                'customerEmail',
                'customerPhone',
                'shippingAddress',
                'shippingCity',
                'shippingPostalCode',
                'shippingCountryId',
                'paymentMethod',
              ],
              properties: {
                customerName: { type: 'string', example: 'Jane Doe' },
                customerEmail: { type: 'string', format: 'email', example: 'buyer@example.com' },
                customerPhone: { type: 'string', example: '+1-555-0199' },
                shippingAddress: { type: 'string', example: '123 Harbor Way' },
                shippingCity: { type: 'string', example: 'Metropolis' },
                shippingPostalCode: { type: 'string', example: '90210' },
                shippingCountryId: { type: 'string', example: 'cnt_us_01' },
                paymentMethod: {
                  type: 'string',
                  enum: ['STRIPE', 'PAYPAL', 'BANK_TRANSFER'],
                  example: 'STRIPE',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  order: { $ref: '#/components/schemas/Order' },
                  paymentIntentClientSecret: { type: 'string', example: 'pi_3MtwBwLkdIwHu7ix28A3Y_secret' },
                },
              },
            },
          },
        },
      },
    },
  },
}
