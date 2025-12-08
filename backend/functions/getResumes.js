const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const DynamoDBUtil = require('../utils/dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { RequestHandler } = require('../utils/requestHandler');
const {
  ErrorHandler,
  UnauthorizedError,
} = require('../utils/errorHandler');
const Logger = require('../utils/logger');

const uploadsBucket = process.env.UPLOADS_BUCKET;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({ region });
const resumesTable = new DynamoDBUtil(process.env.RESUMES_TABLE);

const requestHandler = new RequestHandler('getResumes');

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
    throw new UnauthorizedError('Authentication required to view resumes');
  }

  const logger = new Logger({ component: 'getResumes', userId });

  const items = await resumesTable.queryItems({
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });

  const responseItems = await Promise.all(
    items.map(async item => {
      const downloadUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: uploadsBucket,
          Key: item.objectKey,
        }),
        { expiresIn: 300 }
      );

      return {
        resumeId: item.resumeId,
        fileName: item.fileName,
        contentType: item.contentType,
        objectKey: item.objectKey,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        downloadUrl,
      };
    })
  );

  logger.info('Fetched resume metadata', {
    count: responseItems.length,
  });

  return ErrorHandler.createSuccessResponse({ resumes: responseItems });
});
