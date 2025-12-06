const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { title, company, location, description, salary } = JSON.parse(event.body);

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
    return {
      statusCode: 201,
      body: JSON.stringify({ jobId, message: 'Job created successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};