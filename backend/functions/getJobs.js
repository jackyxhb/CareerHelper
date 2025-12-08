const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const Logger = require('../utils/logger');

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
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    logger.error('Failed to retrieve jobs', {}, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
