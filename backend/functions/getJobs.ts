import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import Logger from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';

export const handler = async () => {
  const logger = new Logger({ component: 'getJobs' });
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.JOBS_TABLE,
  };

  try {
    const result = await dynamodb.send(new ScanCommand(params));
    logger.info('Jobs retrieved successfully', {
      items: result.Items?.length || 0,
    });
    return ErrorHandler.createSuccessResponse(result.Items || []);
  } catch (error: any) {
    logger.error('Failed to retrieve jobs', {}, error);
    return ErrorHandler.createErrorResponse(error, {
      component: 'getJobs',
    });
  }
};
