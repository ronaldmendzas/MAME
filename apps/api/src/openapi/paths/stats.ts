const err = { $ref: '#/components/schemas/ErrorResponse' }
const errResp = { description: 'Error', content: { 'application/json': { schema: err } } }
const bearer = [{ bearerAuth: [] }]

export const statsPaths = {
  '/admin/stats': {
    get: {
      summary: 'Get admin statistics',
      security: bearer,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Stats' },
                },
              },
            },
          },
        },
        '401': errResp,
        '403': errResp,
      },
    },
  },
} as const
