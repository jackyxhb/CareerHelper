const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const DynamoDBUtil = require('../utils/dynamodb');
const { RequestHandler } = require('../utils/requestHandler');
const {
  ErrorHandler,
  UnauthorizedError,
  NotFoundError,
} = require('../utils/errorHandler');
const Logger = require('../utils/logger');

const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({ region });
const resumesTable = new DynamoDBUtil(process.env.RESUMES_TABLE);
const usersTable = new DynamoDBUtil(process.env.USERS_TABLE);

const requestHandler = new RequestHandler('deleteResume');

function extractUserId(event) {
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

exports.handler = requestHandler.createResponse(async event => {
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
    });
  }

  logger.info('Deleted resume and metadata', {
    objectKey: resumeItem.objectKey,
  });

  return ErrorHandler.createSuccessResponse({ success: true });
});
