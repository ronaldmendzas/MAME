export const components = {
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    Report: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tokenId: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        category: {
          type: 'string',
          enum: ['sexual-harassment', 'academic-corruption', 'faculty-plagiarism', 'discrimination', 'nepotism', 'administrative-irregularities', 'fraud', 'other'],
        },
        faculty: { type: 'string' },
        status: { type: 'string' },
        votes: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        publishedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    Evidence: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        reportId: { type: 'string', format: 'uuid' },
        type: { type: 'string' },
        fileKey: { type: 'string' },
        mimeType: { type: 'string' },
        sizeBytes: { type: 'integer' },
        url: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    Comment: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        reportId: { type: 'string', format: 'uuid' },
        tokenId: { type: 'string' },
        parentId: { type: 'string', format: 'uuid', nullable: true },
        body: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        clerkId: { type: 'string' },
        role: { type: 'string', enum: ['user', 'moderator', 'admin', 'auditor'] },
      },
    },
  },
} as const
