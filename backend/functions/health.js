const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

exports.handler = async () => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamodb = DynamoDBDocumentClient.from(client);

  try {
    // Check DynamoDB connectivity by scanning users table
    const params = {
      TableName: process.env.USERS_TABLE,
      Limit: 1, // Just check if we can access the table
    };

    await dynamodb.send(new ScanCommand(params));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'CareerHelper API',
        version: '0.0.1',
        checks: {
          dynamodb: 'ok',
        },
      }),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'CareerHelper API',
        error: error.message,
        checks: {
          dynamodb: 'failed',
        },
      }),
    };
  }
};
