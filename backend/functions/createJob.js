const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');

exports.handler = async event => {
  const { title, company, location, description, salary } = JSON.parse(
    event.body
  );

  const logger = new Logger({
    component: 'createJob',
    requestId: event?.requestContext?.requestId,
  });

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const jobId = uuidv4();
  const params = {
    TableName: process.env.JOBS_TABLE,
    Item: {
      jobId,
      title,
      company,
      location,
      description,
      salary,
      postedAt: new Date().toISOString(),
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    logger.info('Job created successfully', {
      jobId,
      company,
      location,
    });
    return ErrorHandler.createSuccessResponse(
      { jobId, message: 'Job created successfully' },
      201
    );
  } catch (error) {
    logger.error(
      'Failed to create job',
      { company, location, hasSalary: salary !== undefined },
      error
    );
    return ErrorHandler.createErrorResponse(error, {
      component: 'createJob',
      requestId: event?.requestContext?.requestId,
    });
  }
};
