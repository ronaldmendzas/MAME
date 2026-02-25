import { describe, expect, it } from 'vitest'

import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/domain/errors.js'

describe('DomainError', () => {
  it('creates error with message, code, and default statusCode', () => {
    const error = new DomainError('Something failed', 'TEST_ERROR')
    expect(error.message).toBe('Something failed')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('DomainError')
  })

  it('creates error with custom statusCode', () => {
    const error = new DomainError('Custom', 'CUSTOM', 418)
    expect(error.statusCode).toBe(418)
  })

  it('is an instance of Error', () => {
    const error = new DomainError('test', 'TEST')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DomainError)
  })
})

describe('NotFoundError', () => {
  it('has correct message, code 404', () => {
    const error = new NotFoundError('Report')
    expect(error.message).toBe('Report not found')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.name).toBe('NotFoundError')
  })

  it('is instanceof DomainError', () => {
    expect(new NotFoundError('X')).toBeInstanceOf(DomainError)
  })
})

describe('ForbiddenError', () => {
  it('has correct defaults', () => {
    const error = new ForbiddenError()
    expect(error.message).toBe('Access denied')
    expect(error.code).toBe('FORBIDDEN')
    expect(error.statusCode).toBe(403)
  })

  it('accepts custom reason', () => {
    const error = new ForbiddenError('IP blocked')
    expect(error.message).toBe('IP blocked')
  })
})

describe('UnauthorizedError', () => {
  it('has correct defaults', () => {
    const error = new UnauthorizedError()
    expect(error.message).toBe('Authentication required')
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.statusCode).toBe(401)
  })

  it('accepts custom reason', () => {
    const error = new UnauthorizedError('Token expired')
    expect(error.message).toBe('Token expired')
  })
})

describe('ConflictError', () => {
  it('has correct message and code 409', () => {
    const error = new ConflictError('User')
    expect(error.message).toBe('User already exists')
    expect(error.code).toBe('CONFLICT')
    expect(error.statusCode).toBe(409)
  })
})

describe('ValidationError', () => {
  it('has correct message and code 422', () => {
    const error = new ValidationError('Invalid email format')
    expect(error.message).toBe('Invalid email format')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(422)
  })
})
