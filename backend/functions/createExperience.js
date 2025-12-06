const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { userId, title, company, startDate, endDate, description } = JSON.parse(event.body);

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
    await dynamodb.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ experienceId, message: 'Experience created successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};