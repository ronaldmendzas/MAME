export const info = {
  openapi: '3.0.3',
  info: {
    title: 'MAME API',
    version: '1.0.0',
    description: 'Anonymous academic misconduct reporting platform API',
  },
  servers: [
    { url: 'https://api.mame.app', description: 'Production' },
    { url: 'https://api.staging.mame.app', description: 'Staging' },
    { url: 'http://localhost:8787', description: 'Local' },
  ],
} as const
