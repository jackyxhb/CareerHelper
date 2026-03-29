import DynamoDBUtil from '../utils/dynamodb';
import { ErrorHandler, NotFoundError } from '../utils/errorHandler';
import { RequestHandler } from '../utils/requestHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

const applicationsTable = process.env.APPLICATIONS_TABLE || 'Applications';
const dynamodb = new DynamoDBUtil(applicationsTable);
const requestHandler = new RequestHandler('deleteApplication');

export const handler = requestHandler.createResponse(
  async (event: APIGatewayProxyEvent) => {
    const { userId, applicationId } = requestHandler.parsePathParameters(
      event,
      ['userId', 'applicationId']
    );

    // Verify the application exists before deleting
    const existing = await dynamodb.getItem({ userId, applicationId });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }

    // Delete the application
    await dynamodb.deleteItem({ userId, applicationId });

    return ErrorHandler.createSuccessResponse({
      statusCode: 204,
      message: 'Application deleted',
      userId,
      applicationId,
    });
  }
);
