const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { userId, jobId, status, notes } = JSON.parse(event.body);

  const applicationId = uuidv4();
  const params = {
    TableName: process.env.APPLICATIONS_TABLE,
    Item: {
      userId,
      applicationId,
      jobId,
      status,
      appliedAt: new Date().toISOString(),
      notes,
    },
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ applicationId, message: 'Application created successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};