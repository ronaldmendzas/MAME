const err = { $ref: '#/components/schemas/ErrorResponse' }
const errResp = { description: 'Error', content: { 'application/json': { schema: err } } }
const bearer = [{ bearerAuth: [] }]
const idParam = [
  { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
]
const evidence = { $ref: '#/components/schemas/Evidence' }
const comment = { $ref: '#/components/schemas/Comment' }

export const reportSubPaths = {
  '/reports/{id}/evidence': {
    get: {
      summary: 'List report evidence',
      parameters: idParam,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { data: { type: 'array', items: evidence } } },
            },
          },
        },
        '404': errResp,
      },
    },
    post: {
      summary: 'Upload evidence file',
      security: bearer,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
  '/reports/{id}/evidence/link': {
    post: {
      summary: 'Add evidence URL link',
      security: bearer,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['url'],
              properties: { url: { type: 'string', format: 'uri' } },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
        '401': errResp,
        '403': errResp,
        '404': errResp,
      },
    },
  },
  '/reports/{id}/comments': {
    get: {
      summary: 'List report comments',
      parameters: idParam,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { data: { type: 'array', items: comment } } },
            },
          },
        },
        '404': errResp,
      },
    },
    post: {
      summary: 'Post a comment',
      security: bearer,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['body'],
              properties: {
                body: { type: 'string', minLength: 1, maxLength: 1000 },
                parentId: { type: 'string', format: 'uuid', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
        '401': errResp,
        '404': errResp,
        '422': errResp,
      },
    },
  },
  '/reports/{id}/comments/{commentId}': {
    delete: {
      summary: 'Delete comment',
      security: bearer,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        {
          name: 'commentId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: { '200': { description: 'OK' }, '401': errResp, '403': errResp, '404': errResp },
    },
  },
  '/reports/{id}/vote': {
    post: {
      summary: 'Vote on report',
      security: bearer,
      parameters: idParam,
      responses: { '201': { description: 'Created' }, '401': errResp, '404': errResp },
    },
    delete: {
      summary: 'Remove vote from report',
      security: bearer,
      parameters: idParam,
      responses: { '200': { description: 'OK' }, '401': errResp, '404': errResp },
    },
  },
} as const
