export const settingPaths = {
  '/api/settings/public': {
    get: {
      tags: ['Settings'],
      summary: 'Get Public Brand & System Settings',
      description: 'Fetch dynamic company name, branding colors, and currency settings.',
      parameters: [
        { name: 'locale', in: 'query', schema: { type: 'string', default: 'en' }, description: 'Target translation locale' },
      ],
      responses: {
        200: {
          description: 'Public system settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  settings: { $ref: '#/components/schemas/SystemSettings' },
                },
              },
            },
          },
        },
      },
    },
  },
}
