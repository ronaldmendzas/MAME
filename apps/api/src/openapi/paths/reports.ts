const err = { $ref: '#/components/schemas/ErrorResponse' }
const errResp = { description: 'Error', content: { 'application/json': { schema: err } } }
const report = { $ref: '#/components/schemas/Report' }
const bearer = [{ bearerAuth: [] }]
const idParam = [
  { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
]

export const reportPaths = {
  '/reports': {
    get: {
      summary: 'List reports',
      parameters: [
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'faculty', in: 'query', schema: { type: 'string' } },
        { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        '200': {
          description: 'OK',
          headers: { 'Cache-Control': { schema: { type: 'string' } } },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: report },
                  nextCursor: { type: 'string' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create report',
      security: bearer,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'body', 'category', 'faculty'],
              properties: {
                title: { type: 'string', minLength: 10, maxLength: 200 },
                body: { type: 'string', minLength: 100, maxLength: 5000 },
                category: {
                  type: 'string',
                  enum: [
                    'sexual-harassment',
                    'academic-corruption',
                    'faculty-plagiarism',
                    'discrimination',
                    'nepotism',
                    'administrative-irregularities',
                    'fraud',
                    'other',
                  ],
                },
                faculty: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
        '401': errResp,
        '403': errResp,
        '422': errResp,
      },
    },
  },
  '/reports/search': {
    get: {
      summary: 'Search reports',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 2, maxLength: 200 },
        },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'offset', in: 'query', schema: { type: 'integer' } },
      ],
      responses: {
        '200': {
          description: 'OK',
          headers: { 'Cache-Control': { schema: { type: 'string' } } },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { data: { type: 'array', items: report }, meta: { type: 'object' } },
              },
            },
          },
        },
        '400': errResp,
      },
    },
  },
  '/reports/mine': {
    get: {
      summary: 'Get my reports',
      security: bearer,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: report },
                  nextCursor: { type: 'string' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
        '401': errResp,
      },
    },
  },
  '/reports/{id}': {
    get: {
      summary: 'Get report',
      parameters: idParam,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': { schema: { type: 'object', properties: { data: report } } },
          },
        },
        '404': errResp,
      },
    },
    patch: {
      summary: 'Update report',
      security: bearer,
      parameters: idParam,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': { schema: { type: 'object', properties: { data: report } } },
          },
        },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
  '/reports/{id}/history': {
    get: {
      summary: 'Get report status history',
      parameters: idParam,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { data: { type: 'array', items: { type: 'object' } } },
              },
            },
          },
        },
        '404': errResp,
      },
    },
  },
  '/reports/{id}/submit': {
    post: {
      summary: 'Submit report for review',
      security: bearer,
      parameters: idParam,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  outcome: { type: 'string', enum: ['submitted', 'rejected'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
} as const
