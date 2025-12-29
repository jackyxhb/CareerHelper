"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchemas = exports.RequestHandler = void 0;
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("./logger"));
const errorHandler_2 = require("./errorHandler");
/**
 * Request handling utility for CareerHelper Lambda functions
 */
class RequestHandler {
    functionName;
    logger;
    startTime;
    constructor(functionName, options = {}) {
        this.functionName = functionName;
        this.logger = new logger_1.default({
            function: functionName,
            requestId: options.requestId,
        });
        this.startTime = Date.now();
    }
    /**
     * Parse and validate request body
     */
    parseBody(event, requiredFields = []) {
        try {
            if (!event.body) {
                throw new errorHandler_1.ValidationError('Request body is required');
            }
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            // Validate required fields
            for (const field of requiredFields) {
                if (body[field] === undefined ||
                    body[field] === null ||
                    body[field] === '') {
                    throw new errorHandler_1.ValidationError(`Missing required field: ${field}`);
                }
            }
            this.logger.debug('Request body parsed successfully', {
                bodySize: JSON.stringify(body).length,
                requiredFields,
            });
            return body;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ValidationError) {
                throw error;
            }
            throw new errorHandler_1.ValidationError('Invalid JSON in request body');
        }
    }
    /**
     * Extract and validate path parameters
     */
    parsePathParameters(event, requiredParams = []) {
        const params = event.pathParameters || {};
        for (const param of requiredParams) {
            if (!params[param]) {
                throw new errorHandler_1.ValidationError(`Missing required path parameter: ${param}`);
            }
        }
        this.logger.debug('Path parameters validated', {
            params: Object.keys(params),
            requiredParams,
        });
        return params;
    }
    /**
     * Extract and validate query parameters
     */
    parseQueryParameters(event, validators = {}) {
        const params = event.queryStringParameters || {};
        const validated = {};
        for (const [key, validator] of Object.entries(validators)) {
            const value = params[key];
            if (value !== undefined) {
                validated[key] = validator(value);
            }
        }
        this.logger.debug('Query parameters processed', {
            paramCount: Object.keys(params).length,
            validatedCount: Object.keys(validated).length,
        });
        return validated;
    }
    /**
     * Validate input data against schema
     */
    validateInput(data, schema) {
        const errors = [];
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            // Required field check
            if (rules.required &&
                (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            // Skip validation if field is not required and not provided
            if (!rules.required && (value === undefined || value === null)) {
                continue;
            }
            // Type validation
            if (rules.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== rules.type) {
                    errors.push(`${field} must be of type ${rules.type}, got ${actualType}`);
                }
            }
            // String validations
            if (rules.type === 'string' && typeof value === 'string') {
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters long`);
                }
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(`${field} must be at most ${rules.maxLength} characters long`);
                }
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(`${field} format is invalid`);
                }
            }
            // Number validations
            if (rules.type === 'number' && typeof value === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`${field} must be at least ${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`${field} must be at most ${rules.max}`);
                }
            }
            // Array validations
            if (rules.type === 'array' && Array.isArray(value)) {
                if (rules.minItems && value.length < rules.minItems) {
                    errors.push(`${field} must have at least ${rules.minItems} items`);
                }
                if (rules.maxItems && value.length > rules.maxItems) {
                    errors.push(`${field} must have at most ${rules.maxItems} items`);
                }
            }
            // Custom validation
            if (rules.validate && typeof rules.validate === 'function') {
                const customError = rules.validate(value);
                if (customError) {
                    errors.push(customError);
                }
            }
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
        }
        this.logger.debug('Input validation passed', {
            validatedFields: Object.keys(schema).length,
        });
    }
    /**
     * Log request start
     */
    logRequestStart(event) {
        this.logger.info('Request started', {
            method: event.httpMethod,
            path: event.path,
            userAgent: event.headers?.['User-Agent'],
            sourceIp: event.requestContext?.identity?.sourceIp,
        });
    }
    /**
     * Log request completion
     */
    logRequestComplete(statusCode, responseSize = 0) {
        const duration = Date.now() - this.startTime;
        this.logger.info('Request completed', {
            statusCode,
            duration,
            responseSize,
            performance: duration > 5000 ? 'slow' : duration > 1000 ? 'normal' : 'fast',
        });
    }
    /**
     * Create standardized response wrapper
     *
     * @param successHandler Function to execute
     * @param errorHandler Optional custom error handler
     */
    createResponse(successHandler, errorHandler = null) {
        return async (event, context) => {
            const requestId = context?.awsRequestId || `test-${Date.now()}`;
            this.logger = new logger_1.default({
                function: this.functionName,
                requestId,
            });
            this.startTime = Date.now();
            try {
                this.logRequestStart(event);
                const result = await successHandler(event, context);
                this.logRequestComplete(result.statusCode, result.body?.length || 0);
                return result;
            }
            catch (error) {
                const errorResponse = errorHandler
                    ? errorHandler(error, { requestId, function: this.functionName })
                    : errorHandler_2.ErrorHandler.createErrorResponse(error, {
                        requestId,
                        function: this.functionName,
                    });
                this.logRequestComplete(errorResponse.statusCode);
                return errorResponse;
            }
        };
    }
}
exports.RequestHandler = RequestHandler;
// Common validation schemas
exports.ValidationSchemas = {
    user: {
        userId: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        email: {
            type: 'string',
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 254,
        },
        name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    },
    job: {
        jobId: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
        company: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        description: { type: 'string', maxLength: 5000 },
        location: { type: 'string', maxLength: 200 },
        salary: { type: 'number', min: 0 },
    },
    experience: {
        userId: { type: 'string', required: true },
        experienceId: { type: 'string', required: true },
        title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
        company: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        startDate: { type: 'string', required: true },
        description: { type: 'string', maxLength: 2000 },
    },
    application: {
        userId: { type: 'string', required: true },
        applicationId: { type: 'string', required: true },
        jobId: { type: 'string', required: true },
        status: {
            type: 'string',
            required: true,
            validate: (value) => {
                const validStatuses = [
                    'APPLIED',
                    'INTERVIEWING',
                    'OFFERED',
                    'REJECTED',
                    'WITHDRAWN',
                ];
                return validStatuses.includes(value) ? null : 'Invalid status value';
            },
        },
    },
    resumeUpload: {
        fileName: {
            type: 'string',
            required: true,
            minLength: 1,
            maxLength: 255,
        },
        contentType: {
            type: 'string',
            required: true,
            minLength: 3,
            maxLength: 120,
        },
        fileSize: {
            type: 'number',
            min: 1,
            max: 15 * 1024 * 1024,
        },
    },
};
