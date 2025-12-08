const DynamoDBUtil = require('../utils/dynamodb');
const { ErrorHandler } = require('../utils/errorHandler');
const { RequestHandler } = require('../utils/requestHandler');

const dynamodb = new DynamoDBUtil(process.env.USERS_TABLE);
const requestHandler = new RequestHandler('health');

exports.handler = requestHandler.createResponse(async () => {
  // Check DynamoDB connectivity by attempting to scan users table
  try {
    await dynamodb.scanItems({ Limit: 1 });
  } catch (error) {
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
