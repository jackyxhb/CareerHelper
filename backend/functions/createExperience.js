const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

exports.handler = async event => {
  const { userId, title, company, startDate, endDate, description } =
    JSON.parse(event.body);

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
    return {
      statusCode: 201,
      body: JSON.stringify({
        experienceId,
        message: 'Experience created successfully',
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
