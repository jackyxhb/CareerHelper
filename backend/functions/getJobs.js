const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const Logger = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');

exports.handler = async () => {
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
  } catch (error) {
    logger.error('Failed to retrieve jobs', {}, error);
    return ErrorHandler.createErrorResponse(error, {
      component: 'getJobs',
    });
  }
};
