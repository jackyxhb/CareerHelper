const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const Logger = require('./logger');

/**
 * DynamoDB utility with retry logic and circuit breaker patterns
 */
class DynamoDBUtil {
  constructor(tableName, options = {}) {
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
        ...options.clientConfig
      });
    }

    this.dynamodb = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

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
  _checkCircuitBreaker() {
    const now = Date.now();

    if (this.circuitBreaker.state === 'OPEN') {
      if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.recoveryTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.logger.info('Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }
  }

  /**
   * Record circuit breaker failure
   */
  _recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.logger.warn('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures
      });
    }
  }

  /**
   * Record circuit breaker success
   */
  _recordSuccess() {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      this.logger.info('Circuit breaker closed - service recovered');
    }
  }

  /**
   * Execute DynamoDB operation with circuit breaker and retry logic
   */
  async executeCommand(command, operationName = 'unknown') {
    this._checkCircuitBreaker();

    try {
      this.logger.debug(`Executing ${operationName}`, {
        tableName: this.tableName,
        circuitBreakerState: this.circuitBreaker.state
      });

      const result = await this.dynamodb.send(command);

      this._recordSuccess();
      this.logger.debug(`${operationName} completed successfully`);

      return result;
    } catch (error) {
      this._recordFailure();

      this.logger.error(`${operationName} failed`, {
        error: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        attempts: error.$metadata?.attempts,
        circuitBreakerState: this.circuitBreaker.state
      }, error);

      // Re-throw with additional context
      const enhancedError = new Error(`${operationName} failed: ${error.message}`);
      enhancedError.name = error.name || 'DynamoDBError';
      enhancedError.code = error.code;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * Get item with circuit breaker protection
   */
  async getItem(key) {
    const { GetCommand } = require('@aws-sdk/lib-dynamodb');
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
  async putItem(item) {
    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await this.executeCommand(command, 'putItem');
  }

  /**
   * Query items with circuit breaker protection
   */
  async queryItems(params) {
    const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
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
  async scanItems(params = {}) {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
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
  async updateItem(params) {
    const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    const command = new UpdateCommand({
      TableName: this.tableName,
      ...params,
    });

    return await this.executeCommand(command, 'updateItem');
  }

  /**
   * Delete item with circuit breaker protection
   */
  async deleteItem(key) {
    const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
    });

    return await this.executeCommand(command, 'deleteItem');
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      failureThreshold: this.circuitBreaker.failureThreshold,
      recoveryTimeout: this.circuitBreaker.recoveryTimeout,
    };
  }
}

module.exports = DynamoDBUtil;