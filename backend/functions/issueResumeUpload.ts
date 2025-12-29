import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import DynamoDBUtil from '../utils/dynamodb';
import {
  RequestHandler,
  ValidationSchemas,
} from '../utils/requestHandler';
import {
  ErrorHandler,
  UnauthorizedError,
  ValidationError,
} from '../utils/errorHandler';
import Logger from '../utils/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';

const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({ region });
const resumesTable = new DynamoDBUtil(process.env.RESUMES_TABLE || 'Resumes');
const usersTable = new DynamoDBUtil(process.env.USERS_TABLE || 'Users');

const requestHandler = new RequestHandler('issueResumeUpload');

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB limit for resumes

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

function sanitizeFileName(fileName: string): string {
  const baseName = path.basename(fileName || '').trim();
  if (!baseName) {
    throw new ValidationError('File name could not be determined');
  }

  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const handler = requestHandler.createResponse(async (event: APIGatewayProxyEvent) => {
  const userId = extractUserId(event);

  if (!userId) {
    throw new UnauthorizedError('Authentication required to upload a resume');
  }

  const payload = requestHandler.parseBody(event, ['fileName', 'contentType']);
  requestHandler.validateInput(payload, ValidationSchemas.resumeUpload);

  const { fileName, contentType, fileSize } = payload;

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new ValidationError('Unsupported file type for resume upload');
  }

  if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError('Resume file exceeds the 15 MB limit');
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const resumeId = uuidv4();
  const objectKey = `resumes/${userId}/${resumeId}-${sanitizedFileName}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const timestamp = new Date().toISOString();

  const existingUser = await usersTable.getItem({ userId });
  if (!existingUser) {
    throw new ValidationError('Unable to locate user profile for upload');
  }

  const logger = new Logger({
    component: 'issueResumeUpload',
    userId,
    resumeId,
  });

  const putCommand = new PutObjectCommand({
    Bucket: uploadsBucket,
    Key: objectKey,
    ContentType: contentType,
    Metadata: {
      userId,
      fileName: sanitizedFileName,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 300,
  });

  await resumesTable.putItem({
    userId,
    resumeId,
    objectKey,
    fileName: sanitizedFileName,
    contentType,
    status: 'PENDING_UPLOAD',
    createdAt: timestamp,
    updatedAt: timestamp,
    uploadExpiresAt: expiresAt,
  });

  await usersTable.updateItem({
    Key: { userId },
    UpdateExpression: 'SET resumeKey = :resumeKey, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':resumeKey': objectKey,
      ':updatedAt': timestamp,
    },
  } as any);

  logger.info('Issued pre-signed resume upload URL', {
    objectKey,
    contentType,
  });

  return ErrorHandler.createSuccessResponse({
    resumeId,
    uploadUrl,
    objectKey,
    expiresAt,
    contentType,
  });
});
