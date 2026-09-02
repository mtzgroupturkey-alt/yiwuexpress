export const authPaths = {
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'User Login',
      description: 'Authenticate user with email and password to receive JWT token and set auth cookie.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'buyer@example.com' },
                password: { type: 'string', example: 'Password123!' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Authentication successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
        },
      },
    },
  },
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register New Account',
      description: 'Create a new customer or buyer account.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'newbuyer@example.com' },
                password: { type: 'string', example: 'SecurePassword123' },
                name: { type: 'string', example: 'Alex Trader' },
                companyName: { type: 'string', example: 'Trader Co.' },
                country: { type: 'string', example: 'United States' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Account successfully registered',
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
  },
  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'User Logout',
      description: 'Clear authentication cookie and terminate active session.',
      responses: {
        200: {
          description: 'Logged out successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
        },
      },
    },
  },
}
