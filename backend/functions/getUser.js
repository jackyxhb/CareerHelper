const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { userId } = event.pathParameters;

  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { userId },
  };

  try {
    const result = await dynamodb.get(params).promise();
    if (result.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};