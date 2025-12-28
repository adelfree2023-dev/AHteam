/**
 * Base Domain Error Class
 * 
 * All domain-specific errors should extend this class.
 * Provides structured error handling for the domain layer.
 */
export abstract class DomainError extends Error {
    public readonly code: string;
    public readonly timestamp: Date;

    constructor(message: string, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * Validation Error
 */
export class ValidationError extends DomainError {
    public readonly field: string;

    constructor(message: string, field: string) {
        super(message, 'VALIDATION_ERROR');
        this.field = field;
    }
}

/**
 * Not Found Error
 */
export class NotFoundError extends DomainError {
    public readonly entityType: string;
    public readonly entityId: string;

    constructor(entityType: string, entityId: string) {
        super(`${entityType} with id ${entityId} not found`, 'NOT_FOUND');
        this.entityType = entityType;
        this.entityId = entityId;
    }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends DomainError {
    constructor(message: string = 'Not authorized to perform this action') {
        super(message, 'AUTHORIZATION_ERROR');
    }
}
