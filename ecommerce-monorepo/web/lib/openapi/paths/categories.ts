export const categoryPaths = {
  '/api/categories': {
    get: {
      tags: ['Categories'],
      summary: 'List Categories',
      description: 'Fetch all product categories with hierarchy and display order.',
      responses: {
        200: {
          description: 'List of active categories',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  categories: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
