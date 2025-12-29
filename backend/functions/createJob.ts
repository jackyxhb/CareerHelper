import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from '../utils/errorHandler';
import {
  RequestHandler,
  ValidationSchemas,
} from '../utils/requestHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(dynamoClient);
const requestHandler = new RequestHandler('createJob');

export const handler = requestHandler.createResponse(async (event: APIGatewayProxyEvent) => {
  const payload = requestHandler.parseBody(event, ['title', 'company']);
  const jobId = uuidv4();
  const postedAt = new Date().toISOString();

  const jobRecord: Record<string, any> = {
    jobId,
    title: payload.title,
    company: payload.company,
    postedAt,
  };

  if (payload.location !== undefined && payload.location !== null) {
    jobRecord.location = payload.location;
  }
  if (payload.description !== undefined && payload.description !== null) {
    jobRecord.description = payload.description;
  }
  if (payload.salary !== undefined && payload.salary !== null) {
    jobRecord.salary = payload.salary;
  }

  requestHandler.validateInput(jobRecord, ValidationSchemas.job);

  try {
    await documentClient.send(
      new PutCommand({
        TableName: process.env.JOBS_TABLE,
        Item: jobRecord,
      })
    );
  } catch (error) {
    requestHandler.logger.error(
      'Failed to create job',
      {
        company: payload.company,
        location: payload.location,
        hasSalary: payload.salary !== undefined,
      },
      error as Error
    );
    throw error;
  }

  requestHandler.logger.info('Job created successfully', {
    jobId,
    company: payload.company,
    location: payload.location,
  });

  return ErrorHandler.createSuccessResponse(
    { jobId, message: 'Job created successfully' },
    201
  );
});
