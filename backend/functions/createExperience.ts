import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const { userId, title, company, startDate, endDate, description } = body;

  const logger = new Logger({
    component: 'createExperience',
    requestId: event?.requestContext?.requestId,
    userId,
  });

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const experienceId = uuidv4();
  const params = {
    TableName: process.env.EXPERIENCES_TABLE,
    Item: {
      userId,
      experienceId,
      title,
      company,
      startDate,
      endDate,
      description,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    logger.info('Experience created successfully', {
      experienceId,
      company,
      title,
    });
    return ErrorHandler.createSuccessResponse(
      {
        experienceId,
        message: 'Experience created successfully',
      },
      201
    );
  } catch (error: any) {
    logger.error(
      'Failed to create experience',
      { company, title, hasEndDate: Boolean(endDate) },
      error
    );
    return ErrorHandler.createErrorResponse(error, {
      component: 'createExperience',
      requestId: event?.requestContext?.requestId,
      userId,
    });
  }
};
