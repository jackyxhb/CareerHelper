const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

exports.handler = async event => {
  const { userId } = event.pathParameters;

  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.APPLICATIONS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  };

  try {
    const result = await dynamodb.send(new QueryCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
