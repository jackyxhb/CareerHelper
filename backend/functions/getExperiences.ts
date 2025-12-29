import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import Logger from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  const { userId } = event.pathParameters || {};

  if (!userId) {
    return ErrorHandler.createErrorResponse(new Error('Missing userId'), {
      component: 'getExperiences',
      requestId: event?.requestContext?.requestId,
    });
  }

  const logger = new Logger({
    component: 'getExperiences',
    requestId: event?.requestContext?.requestId,
    userId,
  });

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.EXPERIENCES_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const result = await dynamodb.send(new QueryCommand(params));
    logger.info('Experiences retrieved successfully', {
      items: result.Items?.length || 0,
    });
    return ErrorHandler.createSuccessResponse(result.Items || []);
  } catch (error: any) {
    logger.error('Failed to retrieve experiences', {}, error);
    return ErrorHandler.createErrorResponse(error, {
      component: 'getExperiences',
      requestId: event?.requestContext?.requestId,
      userId,
    });
  }
};
