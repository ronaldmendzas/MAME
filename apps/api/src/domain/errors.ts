export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class ForbiddenError extends DomainError {
  constructor(reason = 'Access denied') {
    super(reason, 'FORBIDDEN', 403)
  }
}

export class UnauthorizedError extends DomainError {
  constructor(reason = 'Authentication required') {
    super(reason, 'UNAUTHORIZED', 401)
  }
}

export class ConflictError extends DomainError {
  constructor(resource: string) {
    super(`${resource} already exists`, 'CONFLICT', 409)
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}
