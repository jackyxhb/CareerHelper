import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  TranslateConfig,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import Logger from './logger';

export interface DynamoDBUtilOptions {
  client?: DynamoDBClient;
  maxAttempts?: number;
  requestTimeout?: number;
  clientConfig?: any;
  failureThreshold?: number;
  recoveryTimeout?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureThreshold: number;
  recoveryTimeout: number;
}

/**
 * DynamoDB utility with retry logic and circuit breaker patterns
 */
export default class DynamoDBUtil {
  private tableName: string;
  private logger: Logger;
  private client: DynamoDBClient;
  private dynamodb: DynamoDBDocumentClient;
  private circuitBreaker: CircuitBreakerState;

  constructor(tableName: string, options: DynamoDBUtilOptions = {}) {
    this.tableName = tableName;
    this.logger = new Logger({ component: 'DynamoDBUtil', table: tableName });

    // Allow injecting client for testing
    if (options.client) {
      this.client = options.client;
    } else {
      // Configure DynamoDB client with retry logic
      this.client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        maxAttempts: options.maxAttempts || 3,
        retryMode: 'adaptive', // Use adaptive retry strategy
        requestTimeout: options.requestTimeout || 5000,
        ...options.clientConfig,
      });
    }

    const translateConfig: TranslateConfig = {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    };

    this.dynamodb = DynamoDBDocumentClient.from(this.client, translateConfig);

    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
    };
  }

  /**
   * Check circuit breaker state
   */
  private _checkCircuitBreaker(): void {
    const now = Date.now();

    if (this.circuitBreaker.state === 'OPEN') {
      if (
        this.circuitBreaker.lastFailureTime &&
        now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.recoveryTimeout
      ) {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.logger.info('Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error(
          'Circuit breaker is OPEN - service temporarily unavailable'
        );
      }
    }
  }

  /**
   * Record circuit breaker failure
   */
  private _recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.logger.warn('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures,
      });
    }
  }

  /**
   * Record circuit breaker success
   */
  private _recordSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      this.logger.info('Circuit breaker closed - service recovered');
    }
  }

  /**
   * Execute DynamoDB operation with circuit breaker and retry logic
   */
  async executeCommand(command: any, operationName: string = 'unknown'): Promise<any> {
    this._checkCircuitBreaker();

    try {
      this.logger.debug(`Executing ${operationName}`, {
        tableName: this.tableName,
        circuitBreakerState: this.circuitBreaker.state,
      });

      const result = await this.dynamodb.send(command);

      this._recordSuccess();
      this.logger.debug(`${operationName} completed successfully`);

      return result;
    } catch (error: any) {
      this._recordFailure();

      this.logger.error(
        `${operationName} failed`,
        {
          error: error.message,
          code: error.code,
          statusCode: error.$metadata?.httpStatusCode,
          attempts: error.$metadata?.attempts,
          circuitBreakerState: this.circuitBreaker.state,
        },
        error
      );

      // Re-throw with additional context
      const enhancedError: any = new Error(
        `${operationName} failed: ${error.message}`
      );
      enhancedError.name = error.name || 'DynamoDBError';
      enhancedError.code = error.code;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * Get item with circuit breaker protection
   */
  async getItem(key: Record<string, any>): Promise<Record<string, any> | undefined> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: key,
    });

    const result = await this.executeCommand(command, 'getItem');
    return result.Item;
  }

  /**
   * Put item with circuit breaker protection
   */
  async putItem(item: Record<string, any>): Promise<any> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await this.executeCommand(command, 'putItem');
  }

  /**
   * Query items with circuit breaker protection
   */
  async queryItems(params: Record<string, any>): Promise<Record<string, any>[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      ...params,
    });

    const result = await this.executeCommand(command, 'queryItems');
    return result.Items || [];
  }

  /**
   * Scan items with circuit breaker protection
   */
  async scanItems(params: Record<string, any> = {}): Promise<Record<string, any>[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      ...params,
    });

    const result = await this.executeCommand(command, 'scanItems');
    return result.Items || [];
  }

  /**
   * Update item with circuit breaker protection
   */
  async updateItem(params: Record<string, any>): Promise<any> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      ...params,
    } as UpdateCommandInput);

    return await this.executeCommand(command, 'updateItem');
  }

  /**
   * Delete item with circuit breaker protection
   */
  async deleteItem(key: Record<string, any>): Promise<any> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
    });

    return await this.executeCommand(command, 'deleteItem');
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): CircuitBreakerState {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      failureThreshold: this.circuitBreaker.failureThreshold,
      recoveryTimeout: this.circuitBreaker.recoveryTimeout,
    };
  }
}
