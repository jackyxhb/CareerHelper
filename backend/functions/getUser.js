const DynamoDBUtil = require('../utils/dynamodb');
const { ErrorHandler, NotFoundError } = require('../utils/errorHandler');
const { RequestHandler, ValidationSchemas } = require('../utils/requestHandler');

const dynamodb = new DynamoDBUtil(process.env.USERS_TABLE);
const requestHandler = new RequestHandler('getUser');

exports.handler = requestHandler.createResponse(async (event) => {
  // Parse and validate path parameters
  const { userId } = requestHandler.parsePathParameters(event, ['userId']);

  // Validate input
  requestHandler.validateInput({ userId }, {
    userId: ValidationSchemas.user.userId
  });

  // Get user from DynamoDB with circuit breaker protection
  const user = await dynamodb.getItem({ userId });

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`);
  }

  return ErrorHandler.createSuccessResponse(user);
});
