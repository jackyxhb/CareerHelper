import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import DynamoDBUtil from '../utils/dynamodb';
import { RequestHandler } from '../utils/requestHandler';
import {
  ErrorHandler,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errorHandler';
import Logger from '../utils/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';

const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({ region });
const resumesTable = new DynamoDBUtil(process.env.RESUMES_TABLE || 'Resumes');
const usersTable = new DynamoDBUtil(process.env.USERS_TABLE || 'Users');

const requestHandler = new RequestHandler('deleteResume');

function extractUserId(event: APIGatewayProxyEvent | any): string | null {
  const jwtClaims =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims ||
    {};

  return (
    jwtClaims['cognito:username'] ||
    jwtClaims.sub ||
    event?.requestContext?.authorizer?.principalId ||
    event?.requestContext?.authorizer?.iam?.cognitoIdentity?.identityId ||
    null
  );
}

export const handler = requestHandler.createResponse(async (event: APIGatewayProxyEvent) => {
  const userId = extractUserId(event);

  if (!userId) {
    throw new UnauthorizedError('Authentication required to delete resumes');
  }

  const { resumeId } = requestHandler.parsePathParameters(event, ['resumeId']);

  const logger = new Logger({ component: 'deleteResume', userId, resumeId });

  const resumeItem = await resumesTable.getItem({ userId, resumeId });
  if (!resumeItem) {
    throw new NotFoundError('Resume not found for the current user');
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: uploadsBucket,
      Key: resumeItem.objectKey,
    })
  );

  await resumesTable.deleteItem({ userId, resumeId });

  const userProfile = await usersTable.getItem({ userId });
  if (userProfile?.resumeKey === resumeItem.objectKey) {
    await usersTable.updateItem({
      Key: { userId },
      UpdateExpression: 'REMOVE resumeKey SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':updatedAt': new Date().toISOString(),
      },
    } as any);
  }

  logger.info('Deleted resume and metadata', {
    objectKey: resumeItem.objectKey,
  });

  return ErrorHandler.createSuccessResponse({ success: true });
});
