import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import DynamoDBUtil from '../utils/dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RequestHandler } from '../utils/requestHandler';
import {
  ErrorHandler,
  UnauthorizedError,
} from '../utils/errorHandler';
import Logger from '../utils/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';

const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({ region });
const resumesTable = new DynamoDBUtil(process.env.RESUMES_TABLE || 'Resumes');

const requestHandler = new RequestHandler('getResumes');

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
    throw new UnauthorizedError('Authentication required to view resumes');
  }

  const logger = new Logger({ component: 'getResumes', userId });

  const items = await resumesTable.queryItems({
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });

  const responseItems = [];

  for (const item of items) {
    try {
      const downloadUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: uploadsBucket,
          Key: item.objectKey,
        }),
        { expiresIn: 300 }
      );

      responseItems.push({
        resumeId: item.resumeId,
        fileName: item.fileName,
        contentType: item.contentType,
        objectKey: item.objectKey,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        downloadUrl,
      });
    } catch (error: any) {
      logger.warn(
        'Failed to generate resume download URL',
        {
          resumeId: item.resumeId,
          objectKey: item.objectKey,
        },
        error
      );

      responseItems.push({
        resumeId: item.resumeId,
        fileName: item.fileName,
        contentType: item.contentType,
        objectKey: item.objectKey,
        status: 'MISSING_ASSET',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        downloadUrl: null,
      });
    }
  }

  logger.info('Fetched resume metadata', {
    count: responseItems.length,
  });

  return ErrorHandler.createSuccessResponse({ resumes: responseItems });
});
