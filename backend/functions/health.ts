import DynamoDBUtil from '../utils/dynamodb';
import { ErrorHandler } from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';

const usersTable = process.env.USERS_TABLE || 'Users';
const dynamodb = new DynamoDBUtil(usersTable);
const requestHandler = new RequestHandler('health');

export const handler = requestHandler.createResponse(async () => {
  // Check DynamoDB connectivity by attempting to scan users table
  try {
    await dynamodb.scanItems({ Limit: 1 });
  } catch (error: any) {
    throw new Error(`Database health check failed: ${error.message}`);
  }

  // Get circuit breaker status
  const circuitBreakerStatus = dynamodb.getCircuitBreakerStatus();

  return ErrorHandler.createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CareerHelper API',
    version: '0.0.1',
    checks: {
      dynamodb: 'ok',
      circuitBreaker: circuitBreakerStatus.state.toLowerCase(),
    },
    metrics: {
      circuitBreaker: circuitBreakerStatus,
    },
  });
});
