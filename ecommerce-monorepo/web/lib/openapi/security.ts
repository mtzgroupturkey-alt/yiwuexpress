export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from /api/auth/login or /api/auth/register',
  },
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'auth_token',
    description: 'HTTP-only session cookie for authenticated browser requests',
  },
}

export const defaultSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }]
