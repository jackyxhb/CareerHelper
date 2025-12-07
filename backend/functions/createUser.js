const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

exports.handler = async event => {
  const { userId, email, name } = JSON.parse(event.body);

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.USERS_TABLE,
    Item: {
      userId,
      email,
      name,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'User created successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
