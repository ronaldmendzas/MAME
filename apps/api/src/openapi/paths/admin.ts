const err = { $ref: '#/components/schemas/ErrorResponse' }
const errResp = { description: 'Error', content: { 'application/json': { schema: err } } }
const user = { $ref: '#/components/schemas/User' }
const bearer = [{ bearerAuth: [] }]

export const adminPaths = {
  '/admin/users': {
    get: {
      summary: 'List all users',
      security: bearer,
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: user },
                  meta: {
                    type: 'object',
                    properties: { limit: { type: 'integer' }, count: { type: 'integer' } },
                  },
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
  '/admin/users/{id}/role': {
    patch: {
      summary: 'Update user role',
      security: bearer,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: { type: 'string', enum: ['user', 'moderator', 'admin', 'auditor'] },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': { schema: { type: 'object', properties: { data: user } } },
          },
        },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
  '/moderation/check': {
    post: {
      summary: 'Check content for policy violations',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'body'],
              properties: { title: { type: 'string' }, body: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  flagged: { type: 'boolean' },
                  categories: { type: 'object' },
                  score: { type: 'number' },
                },
              },
            },
          },
        },
        '401': errResp,
      },
    },
  },
  '/moderation/queue': {
    get: {
      summary: 'Get moderation queue',
      security: bearer,
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Report' } },
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
  '/moderation/{id}': {
    patch: {
      summary: 'Action on a report in queue',
      security: bearer,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'moderatorFaculty'],
              properties: {
                action: { type: 'string', enum: ['approve', 'reject', 'escalate'] },
                reason: { type: 'string' },
                moderatorFaculty: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } },
        },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
  '/security/events': {
    get: {
      summary: 'Get security audit events',
      security: bearer,
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { type: 'object' } },
                  meta: { type: 'object' },
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
  '/media/{fileKey}': {
    get: {
      summary: 'Retrieve signed media file',
      parameters: [
        { name: 'fileKey', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'signature', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Binary file content' }, '401': errResp, '404': errResp },
    },
  },
  '/docs': {
    get: {
      summary: 'OpenAPI JSON specification',
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: { type: 'object' } } },
        },
      },
    },
  },
} as const
