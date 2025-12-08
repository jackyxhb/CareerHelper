const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const Logger = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');

exports.handler = async event => {
  const { userId } = event.pathParameters;
  const logger = new Logger({
    component: 'getApplications',
    requestId: event?.requestContext?.requestId,
    userId,
  });

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.APPLICATIONS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const result = await dynamodb.send(new QueryCommand(params));
    logger.info('Applications retrieved successfully', {
      items: result.Items?.length || 0,
    });
    return ErrorHandler.createSuccessResponse(result.Items || []);
  } catch (error) {
    logger.error('Failed to retrieve applications', {}, error);
    return ErrorHandler.createErrorResponse(error, {
      component: 'getApplications',
      requestId: event?.requestContext?.requestId,
      userId,
    });
  }
};
