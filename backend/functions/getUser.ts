import DynamoDBUtil from '../utils/dynamodb';
import { ErrorHandler, NotFoundError } from '../utils/errorHandler';
import {
  RequestHandler,
  ValidationSchemas,
} from '../utils/requestHandler';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const usersTable = process.env.USERS_TABLE || 'Users';
const dynamodb = new DynamoDBUtil(usersTable);
const requestHandler = new RequestHandler('getUser');

export const handler = requestHandler.createResponse(async (event: APIGatewayProxyEvent) => {
  // Parse and validate path parameters
  const { userId } = requestHandler.parsePathParameters(event, ['userId']);

  // Validate input
  requestHandler.validateInput(
    { userId },
    {
      userId: ValidationSchemas.user.userId,
    }
  );

  // Get user from DynamoDB with circuit breaker protection
  const user = await dynamodb.getItem({ userId });

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`);
  }

  return ErrorHandler.createSuccessResponse(user);
});
