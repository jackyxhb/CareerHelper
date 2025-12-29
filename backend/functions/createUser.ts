import DynamoDBUtil from '../utils/dynamodb';
import { ErrorHandler, ConflictError } from '../utils/errorHandler';
import {
  RequestHandler,
  ValidationSchemas,
} from '../utils/requestHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

const usersTable = process.env.USERS_TABLE || 'Users';
const dynamodb = new DynamoDBUtil(usersTable);
const requestHandler = new RequestHandler('createUser');

export const handler = requestHandler.createResponse(async (event: APIGatewayProxyEvent) => {
  // Parse and validate request body
  const userData = requestHandler.parseBody(event, ['userId', 'email', 'name']);

  // Validate input against schema
  requestHandler.validateInput(userData, ValidationSchemas.user);

  // Check if user already exists
  const existingUser = await dynamodb.getItem({ userId: userData.userId });
  if (existingUser) {
    throw new ConflictError(`User with ID ${userData.userId} already exists`);
  }

  // Prepare user item
  const userItem = {
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save user to DynamoDB with circuit breaker protection
  await dynamodb.putItem(userItem);

  return ErrorHandler.createSuccessResponse(
    { message: 'User created successfully', userId: userData.userId },
    201
  );
});
