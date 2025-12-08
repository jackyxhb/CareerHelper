const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');

exports.handler = async event => {
  const { userId, title, company, startDate, endDate, description } =
    JSON.parse(event.body);

  const logger = new Logger({
    component: 'createExperience',
    requestId: event?.requestContext?.requestId,
    userId,
  });

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const experienceId = uuidv4();
  const params = {
    TableName: process.env.EXPERIENCES_TABLE,
    Item: {
      userId,
      experienceId,
      title,
      company,
      startDate,
      endDate,
      description,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    logger.info('Experience created successfully', {
      experienceId,
      company,
      title,
    });
    return ErrorHandler.createSuccessResponse(
      {
        experienceId,
        message: 'Experience created successfully',
      },
      201
    );
  } catch (error) {
    logger.error(
      'Failed to create experience',
      { company, title, hasEndDate: Boolean(endDate) },
      error
    );
    return ErrorHandler.createErrorResponse(error, {
      component: 'createExperience',
      requestId: event?.requestContext?.requestId,
      userId,
    });
  }
};
