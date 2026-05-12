import type { Context, ErrorHandler as HonoErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { DomainError } from '../../domain/errors.js'

export const errorHandler: HonoErrorHandler = (error: Error, c: Context) => {
  if (error instanceof DomainError) {
    return c.json(
      { success: false, error: error.message, code: error.code },
      error.statusCode as ContentfulStatusCode,
    )
  }

  return c.json({ success: false, error: 'Internal server error', code: 'INTERNAL' }, 500)
}
