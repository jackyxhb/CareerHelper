const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { title, company, location, description, salary } = JSON.parse(event.body);

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
    await dynamodb.put(params).promise();
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