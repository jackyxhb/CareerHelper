"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ErrorHandler = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Error handling utility for CareerHelper Lambda functions
 */
class ErrorHandler {
    static createErrorResponse(error, context = {}) {
        // Default error mappings
        const errorMappings = {
            ValidationError: { statusCode: 400, message: 'Invalid input data' },
            NotFoundError: { statusCode: 404, message: 'Resource not found' },
            UnauthorizedError: { statusCode: 401, message: 'Unauthorized access' },
            ForbiddenError: { statusCode: 403, message: 'Access forbidden' },
            ConflictError: { statusCode: 409, message: 'Resource conflict' },
            DynamoDBError: { statusCode: 500, message: 'Database operation failed' },
            NetworkError: {
                statusCode: 502,
                message: 'External service unavailable',
            },
        };
        // Determine error type and status code
        let statusCode = 500;
        let message = 'Internal server error';
        let errorType = 'InternalError';
        if (error.name && errorMappings[error.name]) {
            const mapping = errorMappings[error.name];
            statusCode = mapping.statusCode;
            // Use the error's message if it's a custom error class, otherwise use the mapping
            message =
                error instanceof Error && error.constructor !== Error
                    ? error.message
                    : mapping.message;
            errorType = error.name;
        }
        else if (error.code) {
            // AWS SDK errors
            switch (error.code) {
                case 'ValidationException':
                    statusCode = 400;
                    message = 'Invalid request parameters';
                    errorType = 'ValidationError';
                    break;
                case 'ResourceNotFoundException':
                    statusCode = 404;
                    message = 'Resource not found';
                    errorType = 'NotFoundError';
                    break;
                case 'ConditionalCheckFailedException':
                    statusCode = 409;
                    message = 'Resource conflict';
                    errorType = 'ConflictError';
                    break;
                case 'ThrottlingException':
                    statusCode = 429;
                    message = 'Too many requests';
                    errorType = 'ThrottlingError';
                    break;
                case 'ServiceUnavailableException':
                case 'InternalServerError':
                    statusCode = 503;
                    message = 'Service temporarily unavailable';
                    errorType = 'ServiceUnavailableError';
                    break;
                default:
                    statusCode = 500;
                    message = 'Internal server error';
                    errorType = 'InternalError';
            }
        }
        else if (error.message) {
            // Custom error messages
            if (error.message.includes('not found')) {
                statusCode = 404;
                message = error.message;
                errorType = 'NotFoundError';
            }
            else if (error.message.includes('already exists')) {
                statusCode = 409;
                message = error.message;
                errorType = 'ConflictError';
            }
        }
        // Log the error
        const log = new logger_1.default(context);
        log.error('Request failed', {
            errorType,
            statusCode,
            originalMessage: error.message,
            stack: error.stack,
        }, error);
        // Return consistent error response
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            body: JSON.stringify({
                error: {
                    type: errorType,
                    message,
                    timestamp: new Date().toISOString(),
                    requestId: context.requestId || 'unknown',
                },
            }),
        };
    }
    static createSuccessResponse(data, statusCode = 200, headers = {}) {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                ...headers,
            },
            body: JSON.stringify(data),
        };
    }
}
exports.ErrorHandler = ErrorHandler;
// Custom error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class DynamoDBError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DynamoDBError';
    }
}
exports.DynamoDBError = DynamoDBError;
