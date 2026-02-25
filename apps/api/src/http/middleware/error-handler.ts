import type { Context, Next } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { DomainError } from '../../domain/errors.js'

export async function errorHandler(c: Context, next: Next): Promise<Response | void> {
  try {
    await next()
  } catch (error) {
    if (error instanceof DomainError) {
      return c.json(
        { success: false, error: error.message, code: error.code },
        error.statusCode as ContentfulStatusCode,
      )
    }

    return c.json({ success: false, error: 'Internal server error', code: 'INTERNAL' }, 500)
  }
}
