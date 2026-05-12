const err = { $ref: '#/components/schemas/ErrorResponse' }
const errResp = { description: 'Error', content: { 'application/json': { schema: err } } }

export const systemPaths = {
  '/health': {
    get: { summary: 'Health check', responses: { '200': { description: 'OK' } } },
  },
  '/webhooks/clerk': {
    post: {
      summary: 'Clerk webhook',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/auth/local/register': {
    post: {
      summary: 'Register local user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['login', 'password'],
              properties: { login: { type: 'string' }, password: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  mfaEnabled: { type: 'boolean' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        '400': errResp,
        '422': errResp,
      },
    },
  },
  '/auth/local/login': {
    post: {
      summary: 'Login local user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['login', 'password'],
              properties: { login: { type: 'string' }, password: { type: 'string' } },
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
                  userId: { type: 'string', format: 'uuid' },
                  status: { type: 'string' },
                  mfaRequired: { type: 'boolean' },
                },
              },
            },
          },
        },
        '401': errResp,
        '423': errResp,
      },
    },
  },
  '/auth/local/mfa/begin': {
    post: {
      summary: 'Begin MFA setup',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'accountName'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                accountName: { type: 'string' },
                issuer: { type: 'string' },
              },
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
                properties: { secret: { type: 'string' }, otpAuthUrl: { type: 'string' } },
              },
            },
          },
        },
        '400': errResp,
      },
    },
  },
  '/auth/local/mfa/confirm': {
    post: {
      summary: 'Confirm MFA setup',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'code'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                code: { type: 'string', pattern: '^[0-9]{6}$' },
              },
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
                properties: { status: { type: 'string', enum: ['mfa_enabled'] } },
              },
            },
          },
        },
        '400': errResp,
      },
    },
  },
  '/auth/local/mfa/verify': {
    post: {
      summary: 'Verify MFA code',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'code'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                code: { type: 'string', pattern: '^[0-9]{6}$' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { status: { type: 'string' } } },
            },
          },
        },
        '401': errResp,
      },
    },
  },
  '/me': {
    get: {
      summary: 'Get current user',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  tokenId: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        '401': errResp,
      },
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
