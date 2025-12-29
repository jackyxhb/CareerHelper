import { ValidationError } from './errorHandler';
import Logger from './logger';
import { ApiErrorResponse, ApiSuccessResponse, ErrorHandler } from './errorHandler';

export interface RequestHandlerOptions {
  requestId?: string;
}

export interface ValidationRule {
  type?: 'string' | 'number' | 'array' | 'boolean' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  minItems?: number;
  maxItems?: number;
  validate?: (value: any) => string | null | undefined;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Request handling utility for CareerHelper Lambda functions
 */
export class RequestHandler {
  private functionName: string;
  public logger: Logger;
  private startTime: number;

  constructor(functionName: string, options: RequestHandlerOptions = {}) {
    this.functionName = functionName;
    this.logger = new Logger({
      function: functionName,
      requestId: options.requestId,
    });
    this.startTime = Date.now();
  }

  /**
   * Parse and validate request body
   */
  parseBody<T = any>(event: any, requiredFields: string[] = []): T {
    try {
      if (!event.body) {
        throw new ValidationError('Request body is required');
      }

      const body =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

      // Validate required fields
      for (const field of requiredFields) {
        if (
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ''
        ) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }

      this.logger.debug('Request body parsed successfully', {
        bodySize: JSON.stringify(body).length,
        requiredFields,
      });

      return body as T;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid JSON in request body');
    }
  }

  /**
   * Extract and validate path parameters
   */
  parsePathParameters(event: any, requiredParams: string[] = []): Record<string, string> {
    const params = event.pathParameters || {};

    for (const param of requiredParams) {
      if (!params[param]) {
        throw new ValidationError(`Missing required path parameter: ${param}`);
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
  parseQueryParameters(event: any, validators: Record<string, (val: string) => any> = {}): Record<string, any> {
    const params = event.queryStringParameters || {};

    const validated: Record<string, any> = {};
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
  validateInput(data: Record<string, any>, schema: ValidationSchema): void {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required field check
      if (
        rules.required &&
        (value === undefined || value === null || value === '')
      ) {
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
          errors.push(
            `${field} must be of type ${rules.type}, got ${actualType}`
          );
        }
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters long`
          );
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(
            `${field} must be at most ${rules.maxLength} characters long`
          );
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
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    this.logger.debug('Input validation passed', {
      validatedFields: Object.keys(schema).length,
    });
  }

  /**
   * Log request start
   */
  logRequestStart(event: any): void {
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
  logRequestComplete(statusCode: number, responseSize: number = 0): void {
    const duration = Date.now() - this.startTime;
    this.logger.info('Request completed', {
      statusCode,
      duration,
      responseSize,
      performance:
        duration > 5000 ? 'slow' : duration > 1000 ? 'normal' : 'fast',
    });
  }

  /**
   * Create standardized response wrapper
   * 
   * @param successHandler Function to execute
   * @param errorHandler Optional custom error handler
   */
  createResponse(
    successHandler: (event: any, context: any) => Promise<ApiSuccessResponse>,
    errorHandler: ((error: any, context: any) => ApiErrorResponse) | null = null
  ) {
    return async (event: any, context: any): Promise<ApiSuccessResponse | ApiErrorResponse> => {
      const requestId = context?.awsRequestId || `test-${Date.now()}`;
      this.logger = new Logger({
        function: this.functionName,
        requestId,
      });
      this.startTime = Date.now();

      try {
        this.logRequestStart(event);
        const result = await successHandler(event, context);
        this.logRequestComplete(result.statusCode, result.body?.length || 0);
        return result;
      } catch (error: any) {
        const errorResponse = errorHandler
          ? errorHandler(error, { requestId, function: this.functionName })
          : ErrorHandler.createErrorResponse(error, {
            requestId,
            function: this.functionName,
          });

        this.logRequestComplete(errorResponse.statusCode);
        return errorResponse;
      }
    };
  }
}

// Common validation schemas
export const ValidationSchemas: Record<string, ValidationSchema> = {
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
      validate: (value: any) => {
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
