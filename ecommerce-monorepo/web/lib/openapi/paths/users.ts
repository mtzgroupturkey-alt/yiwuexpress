export const userPaths = {
  '/api/user/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get Current User Profile',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Profile data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update Profile',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Jane Doe' },
                phone: { type: 'string', example: '+1-555-0199' },
                companyName: { type: 'string', example: 'Global Trading Co.' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
      },
    },
  },
}
