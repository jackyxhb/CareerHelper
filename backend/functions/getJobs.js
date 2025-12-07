const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

exports.handler = async () => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  const params = {
    TableName: process.env.JOBS_TABLE,
  };

  try {
    const result = await dynamodb.send(new ScanCommand(params));
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
