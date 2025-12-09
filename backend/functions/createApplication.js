const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const {
  ErrorHandler,
  UnauthorizedError,
} = require('../utils/errorHandler');
const {
  RequestHandler,
  ValidationSchemas,
} = require('../utils/requestHandler');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(dynamoClient);
const requestHandler = new RequestHandler('createApplication');

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
    throw new UnauthorizedError('Authentication required to create application');
  }

  const payload = requestHandler.parseBody(event, ['jobId', 'status']);
  const applicationId = uuidv4();
  const appliedAt = new Date().toISOString();
  const normalizedStatus =
    typeof payload.status === 'string'
      ? payload.status.toUpperCase()
      : payload.status;

  const applicationRecord = {
    userId,
    applicationId,
    jobId: payload.jobId,
    status: normalizedStatus,
    appliedAt,
  };

  if (payload.notes !== undefined && payload.notes !== null) {
    applicationRecord.notes = payload.notes;
  }
  if (payload.jobTitle !== undefined && payload.jobTitle !== null) {
    applicationRecord.jobTitle = payload.jobTitle;
  }
  if (payload.jobCompany !== undefined && payload.jobCompany !== null) {
    applicationRecord.jobCompany = payload.jobCompany;
  }
  if (payload.jobLocation !== undefined && payload.jobLocation !== null) {
    applicationRecord.jobLocation = payload.jobLocation;
  }
  if (payload.jobSource !== undefined && payload.jobSource !== null) {
    applicationRecord.jobSource = payload.jobSource;
  }

  requestHandler.validateInput(applicationRecord, ValidationSchemas.application);

  try {
    await documentClient.send(
      new PutCommand({
        TableName: process.env.APPLICATIONS_TABLE,
        Item: applicationRecord,
      })
    );
  } catch (error) {
    requestHandler.logger.error(
      'Failed to create application',
      {
        jobId: payload.jobId,
        status: normalizedStatus,
      },
      error
    );
    throw error;
  }

  requestHandler.logger.info('Application created successfully', {
    applicationId,
    jobId: payload.jobId,
    status: normalizedStatus,
  });

  return ErrorHandler.createSuccessResponse(
    {
      applicationId,
      message: 'Application created successfully',
    },
    201
  );
});
