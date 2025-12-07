const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

exports.handler = async event => {
  const { userId } = event.pathParameters;

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { userId },
  };

  try {
    const result = await dynamodb.send(new GetCommand(params));
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
