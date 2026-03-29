import DynamoDBUtil from '../utils/dynamodb';
import {
  ErrorHandler,
  NotFoundError,
  ValidationError,
} from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

const usersTable = process.env.USERS_TABLE || 'Users';
const dynamodb = new DynamoDBUtil(usersTable);
const requestHandler = new RequestHandler('updateUser');

export const handler = requestHandler.createResponse(
  async (event: APIGatewayProxyEvent) => {
    const { userId } = requestHandler.parsePathParameters(event, ['userId']);

    const body = requestHandler.parseBody<{
      preferredName?: string;
      city?: string;
      country?: string;
      jobPreferences?: string[];
    }>(event);

    // Validate field types
    if (
      body.preferredName !== undefined &&
      typeof body.preferredName !== 'string'
    ) {
      throw new ValidationError('preferredName must be a string');
    }
    if (body.city !== undefined && typeof body.city !== 'string') {
      throw new ValidationError('city must be a string');
    }
    if (body.country !== undefined && typeof body.country !== 'string') {
      throw new ValidationError('country must be a string');
    }
    if (
      body.jobPreferences !== undefined &&
      !Array.isArray(body.jobPreferences)
    ) {
      throw new ValidationError('jobPreferences must be an array');
    }

    // Confirm user exists
    const existing = await dynamodb.getItem({ userId });
    if (!existing) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    // Build UpdateExpression from provided fields
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.preferredName !== undefined)
      updates.preferredName = body.preferredName;
    if (body.city !== undefined) updates.city = body.city;
    if (body.country !== undefined) updates.country = body.country;
    if (body.jobPreferences !== undefined)
      updates.jobPreferences = body.jobPreferences;

    const setExpressions: string[] = [];
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(updates)) {
      setExpressions.push(`#${field} = :${field}`);
      ExpressionAttributeNames[`#${field}`] = field;
      ExpressionAttributeValues[`:${field}`] = value;
    }

    await dynamodb.updateItem({
      Key: { userId },
      UpdateExpression: `SET ${setExpressions.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    });

    return ErrorHandler.createSuccessResponse({
      message: 'Profile updated',
      userId,
    });
  }
);
