const { expect } = require('chai');
const { mockClient } = require('aws-sdk-client-mock');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const updateUser = require('../functions/updateUser');

const dynamoMock = mockClient(DynamoDBDocumentClient);

const existingUser = {
  userId: '123',
  email: 'test@example.com',
  name: 'Test User',
};

describe('updateUser', () => {
  before(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.USERS_TABLE = 'test-users-table';
  });

  beforeEach(() => {
    dynamoMock.reset();
  });

  after(() => {
    delete process.env.AWS_REGION;
    delete process.env.USERS_TABLE;
  });

  it('should update profile fields successfully', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: existingUser });
    dynamoMock.on(UpdateCommand).resolves({});

    const event = {
      pathParameters: { userId: '123' },
      body: JSON.stringify({
        preferredName: 'TJ',
        city: 'Auckland',
        country: 'New Zealand',
        jobPreferences: ['Software Engineer', 'Full Stack Engineer'],
      }),
    };
    const result = await updateUser.handler(event);

    expect(result.statusCode).to.equal(200);
    const body = JSON.parse(result.body);
    expect(body.message).to.equal('Profile updated');
    expect(body.userId).to.equal('123');

    const call = dynamoMock.commandCalls(UpdateCommand)[0];
    expect(call).to.not.be.undefined;
    const input = call.args[0].input;
    expect(input.Key.userId).to.equal('123');
    expect(input.ExpressionAttributeValues[':preferredName']).to.equal('TJ');
    expect(input.ExpressionAttributeValues[':city']).to.equal('Auckland');
    expect(input.ExpressionAttributeValues[':country']).to.equal('New Zealand');
    expect(input.ExpressionAttributeValues[':jobPreferences']).to.deep.equal([
      'Software Engineer',
      'Full Stack Engineer',
    ]);
  });

  it('should allow partial updates (only some fields)', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: existingUser });
    dynamoMock.on(UpdateCommand).resolves({});

    const event = {
      pathParameters: { userId: '123' },
      body: JSON.stringify({ city: 'Sydney' }),
    };
    const result = await updateUser.handler(event);

    expect(result.statusCode).to.equal(200);
    const call = dynamoMock.commandCalls(UpdateCommand)[0];
    const values = call.args[0].input.ExpressionAttributeValues;
    expect(values[':city']).to.equal('Sydney');
    expect(values[':preferredName']).to.be.undefined;
  });

  it('should return 404 when user does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: undefined });

    const event = {
      pathParameters: { userId: 'nonexistent' },
      body: JSON.stringify({ city: 'London' }),
    };
    const result = await updateUser.handler(event);

    expect(result.statusCode).to.equal(404);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.equal('NotFoundError');
  });

  it('should return 400 when jobPreferences is not an array', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: existingUser });

    const event = {
      pathParameters: { userId: '123' },
      body: JSON.stringify({ jobPreferences: 'Software Engineer' }),
    };
    const result = await updateUser.handler(event);

    expect(result.statusCode).to.equal(400);
    const body = JSON.parse(result.body);
    expect(body.error.type).to.equal('ValidationError');
  });

  it('should return 400 when body is missing', async () => {
    const event = {
      pathParameters: { userId: '123' },
    };
    const result = await updateUser.handler(event);

    expect(result.statusCode).to.equal(400);
  });
});
