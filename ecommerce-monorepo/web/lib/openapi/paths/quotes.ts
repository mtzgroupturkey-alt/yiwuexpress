export const quotePaths = {
  '/api/wholesale-inquiry': {
    post: {
      tags: ['Wholesale Quotes'],
      summary: 'Submit Wholesale Quote Inquiry',
      description: 'Submit bulk quotation request for custom manufacturing and freight from China.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['companyName', 'businessType', 'country', 'products'],
              properties: {
                companyName: { type: 'string', example: 'Apex Logistics Inc' },
                businessType: { type: 'string', example: 'Distributor' },
                country: { type: 'string', example: 'Germany' },
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['productId', 'quantity'],
                    properties: {
                      productId: { type: 'string', example: 'prod_9082348923' },
                      quantity: { type: 'integer', minimum: 100, example: 500 },
                      targetPrice: { type: 'number', example: 350.0 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Inquiry submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  inquiryNumber: { type: 'string', example: 'INQ-2026-8821' },
                },
              },
            },
          },
        },
      },
    },
  },
}
